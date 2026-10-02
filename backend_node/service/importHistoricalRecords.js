const fs = require('node:fs/promises');
const path = require('node:path');
const { randomUUID } = require('node:crypto');
const { analyzePool } = require('../utils/analyzePool');
const {
    RECORD_FIELDS, buildHistoricalImportPlan, buildRollbackPlan,
    fingerprintRecords, verifyImportRows
} = require('../utils/historicalRecords');

const LOCK_NAME = 'wuthering-historical-records';
const MIGRATION_PATH = path.join(__dirname, '../database/001_historical_records.sql');
const DEFAULT_BACKUP_DIR = path.join(__dirname, '../backups');

async function readRecords(connection, uid, forUpdate = false) {
    const [rows] = await connection.execute(`
        SELECT *,
            DATE_FORMAT(time, '%Y-%m-%d %H:%i:%s') AS time,
            DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
        FROM analyzer_records
        ${uid === undefined ? '' : 'WHERE uid = ?'}
        ORDER BY uid, pool_type, draw_order
        ${forUpdate ? 'FOR UPDATE' : ''}
    `, uid === undefined ? [] : [uid]);
    return rows;
}

async function inspectSchema(connection) {
    const [tableRows] = await connection.query('SHOW CREATE TABLE analyzer_records');
    const [columns] = await connection.query('SHOW COLUMNS FROM analyzer_records');
    const [indexes] = await connection.query('SHOW INDEX FROM analyzer_records');
    const createTable = tableRows[0]?.['Create Table'];
    if (!createTable || !/ENGINE=InnoDB\b/i.test(createTable)) {
        throw new Error('补录要求 analyzer_records 使用 InnoDB');
    }
    const byName = new Map(columns.map(column => [column.Field, column]));
    for (const name of ['resource_id', 'resource_name', 'quality_level', 'time', 'in_second_seq', 'is_up']) {
        if (byName.get(name)?.Null !== 'YES') throw new Error(`字段 ${name} 必须允许 NULL`);
    }
    const order = byName.get('draw_order');
    if (!order || !/^(bigint|int)\b/i.test(order.Type) || /unsigned/i.test(order.Type)) {
        throw new Error('draw_order 必须支持负数整数');
    }
    const hasSource = byName.has('data_source');
    const hasBatch = byName.has('import_batch_id');
    const manualIndex = indexes.filter(index => index.Key_name === 'uniq_manual_record')
        .sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index));
    if (hasSource || hasBatch || manualIndex.length) {
        const source = byName.get('data_source');
        const batch = byName.get('import_batch_id');
        const expectedIndex = ['uid', 'pool_type', 'import_batch_id', 'draw_order'];
        if (!hasSource || !hasBatch || source.Null !== 'NO' ||
            source.Type !== "enum('official','manual','placeholder')" ||
            String(source.Default).replace(/^'|'$/g, '') !== 'official' ||
            batch.Type !== 'varchar(64)' || batch.Null !== 'YES' ||
            manualIndex.length !== expectedIndex.length ||
            manualIndex.some((index, i) => Number(index.Non_unique) !== 0 || index.Column_name !== expectedIndex[i] || index.Sub_part != null)) {
            throw new Error('来源、批次字段或唯一索引只迁移了一部分或定义不兼容，请核对表结构');
        }
    }
    const groupedIndexes = new Map();
    for (const index of indexes.filter(item => Number(item.Non_unique) === 0)) {
        if (!groupedIndexes.has(index.Key_name)) groupedIndexes.set(index.Key_name, []);
        groupedIndexes.get(index.Key_name).push(index);
    }
    const officialIndex = [...groupedIndexes.values()].some(items => {
        const fields = items.sort((a, b) => Number(a.Seq_in_index) - Number(b.Seq_in_index)).map(item => item.Column_name);
        return fields.join(',') === 'uid,pool_type,time,in_second_seq' && items.every(item => item.Sub_part == null);
    });
    if (!officialIndex) throw new Error('缺少官方记录的用户、卡池、时间、同秒序号唯一索引');
    return { createTable, needsMigration: !hasSource };
}

async function readSnapshot(connection) {
    await connection.query('START TRANSACTION READ ONLY');
    try {
        const schema = await inspectSchema(connection);
        const records = await readRecords(connection);
        await connection.rollback();
        return { schema, records };
    } catch (error) {
        await connection.rollback();
        throw error;
    }
}

async function writeBackup(snapshot, backupDir = DEFAULT_BACKUP_DIR) {
    backupDir = path.resolve(backupDir);
    await fs.mkdir(backupDir, { recursive: true, mode: 0o700 });
    const filename = `analyzer-records-${Date.now()}-${randomUUID()}.json`;
    const backupPath = path.join(backupDir, filename);
    const handle = await fs.open(backupPath, 'wx', 0o600);
    try {
        await handle.writeFile(JSON.stringify({
            formatVersion: 1, createdAt: new Date().toISOString(),
            createTable: snapshot.schema.createTable, records: snapshot.records
        }, null, 2));
        await handle.sync();
    } finally {
        await handle.close();
    }
    return backupPath;
}

function checkUnchanged(snapshotRows, currentRows, uid) {
    const original = snapshotRows.filter(row => String(row.uid) === uid);
    if (fingerprintRecords(original) !== fingerprintRecords(currentRows)) {
        throw new Error('目标用户记录在备份后发生变化，请重新预演；本次数据写入已取消');
    }
}

async function insertRows(connection, rows) {
    // 普通 INSERT 遇到冲突即失败回滚，不用 INSERT IGNORE 掩盖部分导入。
    for (let offset = 0; offset < rows.length; offset += 250) {
        const chunk = rows.slice(offset, offset + 250);
        const placeholders = chunk.map(() => `(${RECORD_FIELDS.map(() => '?').join(', ')})`).join(', ');
        const [result] = await connection.execute(
            `INSERT INTO analyzer_records (${RECORD_FIELDS.join(', ')}) VALUES ${placeholders}`,
            chunk.flatMap(row => RECORD_FIELDS.map(field => row[field]))
        );
        if (result.affectedRows !== chunk.length) throw new Error('实际插入数量与计划不一致');
    }
}

function verifyAppliedImport(plan, original, current) {
    const originalIds = new Set(original.map(row => String(row.id)));
    const preserved = current.filter(row => originalIds.has(String(row.id)));
    if (fingerprintRecords(preserved) !== fingerprintRecords(original)) {
        throw new Error('已有记录的原始字段发生变化，回滚补录');
    }
    const batch = current.filter(row => row.import_batch_id === plan.batchId);
    verifyImportRows(plan.rows, batch);
    if (current.length !== original.length + plan.rows.length) throw new Error('写入后目标用户记录数不一致');
    for (const pool of plan.pools) {
        const actual = analyzePool(current.filter(row => Number(row.pool_type) === pool.poolType));
        if (JSON.stringify(actual) !== JSON.stringify(pool.analysis)) {
            throw new Error(`卡池 ${pool.poolType} 写入后的出金序列或统计不一致`);
        }
    }
}

async function executeHistoricalImport(connection, options) {
    const { history, uid, batchId, apply = false, rollback = false, backupDir } = options;
    let locked = false;
    let transaction = false;
    let commitStarted = false;
    let backupPath;
    let migrated = false;
    try {
        if (apply) {
            const [lockRows] = await connection.execute('SELECT GET_LOCK(?, 10) AS acquired', [LOCK_NAME]);
            if (Number(lockRows[0]?.acquired) !== 1) throw new Error('另一个补录操作正在进行，请稍后再试');
            locked = true;
        }
        const snapshot = await readSnapshot(connection);
        if (rollback && snapshot.schema.needsMigration) throw new Error('当前表没有补录批次字段，无法按批次撤销');
        const plan = rollback ? buildRollbackPlan(snapshot.records, uid, batchId) :
            buildHistoricalImportPlan({ history, records: snapshot.records, uid, batchId });
        if (!apply || plan.status === 'already_imported' || !plan.rows.length) {
            return { plan, applied: false, operation: rollback ? 'rollback' : 'import',
                needsMigration: snapshot.schema.needsMigration };
        }

        backupPath = await writeBackup(snapshot, backupDir);
        if (snapshot.schema.needsMigration) {
            // DDL 可能隐式提交，必须在备份后、数据事务前单独完成。
            const migration = (await fs.readFile(MIGRATION_PATH, 'utf8')).replace(/^--.*$/gm, '').trim().replace(/;$/, '');
            await connection.query(migration);
            migrated = true;
            await inspectSchema(connection);
        }

        await connection.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ');
        await connection.beginTransaction();
        transaction = true;
        // 锁住该用户索引范围，避免官方增量入库与本次数据事务交错。
        const original = await readRecords(connection, plan.uid, true);
        checkUnchanged(snapshot.records, original, plan.uid);
        if (rollback) {
            const [result] = await connection.execute(`
                DELETE FROM analyzer_records
                WHERE uid = ? AND import_batch_id = ?
                    AND data_source IN ('manual', 'placeholder') AND draw_order < 0
            `, [plan.uid, plan.batchId]);
            if (result.affectedRows !== plan.rows.length) throw new Error('撤销数量与计划不一致');
            const current = await readRecords(connection, plan.uid);
            const remaining = original.filter(row => row.import_batch_id !== plan.batchId);
            if (fingerprintRecords(current) !== fingerprintRecords(remaining)) {
                throw new Error('撤销影响了批次以外的记录');
            }
        } else {
            await insertRows(connection, plan.rows);
            verifyAppliedImport(plan, original, await readRecords(connection, plan.uid));
        }
        commitStarted = true;
        await connection.commit();
        commitStarted = false;
        transaction = false;
        return { plan, applied: true, operation: rollback ? 'rollback' : 'import', needsMigration: false,
            backupPath, migrated };
    } catch (error) {
        let rollbackFailed = false;
        if (transaction) {
            try { await connection.rollback(); } catch { rollbackFailed = true; }
        }
        // 只输出阶段和备份位置，数据库驱动原始错误可能包含连接信息或玩家字段。
        const failure = new Error(commitStarted || rollbackFailed ?
            '连接在提交或回滚阶段异常，请通过该批次的只读预演核对实际结果' :
            '补录操作失败，未完成的数据事务已回滚');
        failure.reason = error.sqlState ? `数据库错误 ${error.code ?? error.errno}` : error.message;
        failure.backupPath = backupPath;
        failure.migrated = migrated;
        throw failure;
    } finally {
        if (locked) {
            try { await connection.execute('SELECT RELEASE_LOCK(?)', [LOCK_NAME]); } catch {
                // 连接关闭也会释放会话锁，不能让解锁错误覆盖已提交或回滚的结果。
            }
        }
    }
}

module.exports = { executeHistoricalImport, inspectSchema, readSnapshot, verifyAppliedImport };
