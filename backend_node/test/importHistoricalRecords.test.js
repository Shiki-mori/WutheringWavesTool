const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { executeHistoricalImport, inspectSchema } = require('../service/importHistoricalRecords');
const { RECORD_FIELDS, fingerprintRecords } = require('../utils/historicalRecords');

const history = [{ poolType: 1, entries: [
    { name: '样例旧五星', count: 3, isUp: false },
    { name: '样例重叠五星', count: 4, isUp: true }
] }];
function initialRecords() {
    return [1, 2, 3].map(id => ({
        id, uid: 'sample-user', pool_type: 1, resource_id: String(id),
        resource_name: id === 2 ? '样例重叠五星' : '样例普通物品',
        quality_level: id === 2 ? 5 : 3, is_up: id === 2 ? 1 : null,
        draw_order: id, time: '2025-01-01 00:00:00', in_second_seq: id - 1,
        created_at: '2025-02-01 00:00:00'
    }));
}

class FakeConnection {
    constructor({ migrated = false, failInsert = false, beforeBegin, corruptExisting = false } = {}) {
        this.records = initialRecords();
        this.migrated = migrated;
        this.failInsert = failInsert;
        this.beforeBegin = beforeBegin;
        this.corruptExisting = corruptExisting;
        this.events = [];
        if (migrated) this.addMetadata();
    }
    addMetadata() {
        this.records = this.records.map(row => ({ data_source: 'official', import_batch_id: null, ...row }));
    }
    async query(sql) {
        if (sql.startsWith('SHOW CREATE')) return [[{ 'Create Table': 'CREATE TABLE analyzer_records (...) ENGINE=InnoDB' }]];
        if (sql.startsWith('SHOW COLUMNS')) {
            const columns = ['resource_id', 'resource_name', 'quality_level', 'time', 'in_second_seq', 'is_up']
                .map(Field => ({ Field, Null: 'YES' }));
            columns.push({ Field: 'draw_order', Type: 'bigint(20)', Null: 'YES' });
            if (this.migrated) columns.push(
                { Field: 'data_source', Type: "enum('official','manual','placeholder')", Null: 'NO', Default: "'official'" },
                { Field: 'import_batch_id', Type: 'varchar(64)', Null: 'YES' });
            return [columns];
        }
        if (sql.startsWith('SHOW INDEX')) {
            const indexes = ['uid', 'pool_type', 'time', 'in_second_seq'].map((Column_name, i) => ({
                Key_name: 'uniq_record', Non_unique: 0, Column_name, Seq_in_index: i + 1, Sub_part: null
            }));
            if (this.migrated) indexes.push(...['uid', 'pool_type', 'import_batch_id', 'draw_order'].map((Column_name, i) => ({
                Key_name: 'uniq_manual_record', Non_unique: 0, Column_name, Seq_in_index: i + 1, Sub_part: null
            })));
            return [indexes];
        }
        if (sql.startsWith('START TRANSACTION READ ONLY')) { this.events.push('read-only'); return []; }
        if (sql.startsWith('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ')) { this.events.push('isolation'); return []; }
        if (sql.startsWith('ALTER TABLE')) {
            assert.equal(this.transactionRecords, undefined, 'DDL 必须在数据事务之外执行');
            this.events.push('migrate'); this.migrated = true; this.addMetadata(); return [];
        }
        throw new Error('测试中出现意外 SQL');
    }
    async execute(sql, params = []) {
        if (sql.includes('GET_LOCK')) { this.events.push('lock'); return [[{ acquired: 1 }]]; }
        if (sql.includes('RELEASE_LOCK')) { this.events.push('unlock'); return [[{ released: 1 }]]; }
        if (sql.includes('FROM analyzer_records') && sql.trim().startsWith('SELECT')) {
            if (sql.includes('FOR UPDATE')) this.events.push('row-lock');
            return [structuredClone(params.length ? this.records.filter(row => row.uid === params[0]) : this.records)];
        }
        if (sql.startsWith('INSERT INTO')) {
            this.events.push('insert');
            for (let index = 0; index < params.length; index += RECORD_FIELDS.length) {
                const row = Object.fromEntries(RECORD_FIELDS.map((field, offset) => [field, params[index + offset]]));
                this.records.push({ ...row, id: Math.max(...this.records.map(item => item.id)) + 1, created_at: '2025-03-01 00:00:00' });
            }
            if (this.corruptExisting) this.records[0].resource_name = '被意外修改的样例';
            if (this.failInsert) throw Object.assign(new Error('mock SQL failure'), { sqlState: '23000', code: 'ER_DUP_ENTRY' });
            return [{ affectedRows: params.length / RECORD_FIELDS.length }];
        }
        if (sql.trim().startsWith('DELETE')) {
            this.events.push('delete');
            const originalLength = this.records.length;
            this.records = this.records.filter(row => !(row.uid === params[0] && row.import_batch_id === params[1] &&
                ['manual', 'placeholder'].includes(row.data_source) && row.draw_order < 0));
            return [{ affectedRows: originalLength - this.records.length }];
        }
        throw new Error('测试中出现意外 SQL');
    }
    async beginTransaction() {
        if (this.beforeBegin) this.beforeBegin(this);
        this.events.push('begin'); this.transactionRecords = structuredClone(this.records);
    }
    async commit() { this.events.push('commit'); this.transactionRecords = undefined; }
    async rollback() {
        if (this.transactionRecords) {
            this.events.push('rollback-data'); this.records = this.transactionRecords; this.transactionRecords = undefined;
        } else this.events.push('rollback-read');
    }
}

async function temporaryBackup(t) {
    const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'gacha-test-backup-'));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    return directory;
}

test('默认预演不迁移、不写数据、不创建备份', async () => {
    const connection = new FakeConnection();
    const before = fingerprintRecords(connection.records);
    const result = await executeHistoricalImport(connection, { history });
    assert.equal(result.applied, false);
    assert.equal(result.needsMigration, true);
    assert.equal(result.plan.rows.length, 5);
    assert.equal(result.backupPath, undefined);
    assert.equal(fingerprintRecords(connection.records), before);
    assert.deepEqual(connection.events, ['read-only', 'rollback-read']);
});

test('写入前备份，单独迁移，事务内锁定、插入、核验后提交，重复执行跳过', async t => {
    const connection = new FakeConnection();
    const backupDir = await temporaryBackup(t);
    const original = fingerprintRecords(connection.records);
    const result = await executeHistoricalImport(connection, { history, apply: true, backupDir });
    const backup = JSON.parse(await fs.readFile(result.backupPath, 'utf8'));
    assert.equal(fingerprintRecords(backup.records), original);
    assert.equal((await fs.stat(result.backupPath)).mode & 0o777, 0o600);
    assert.equal(result.applied, true);
    assert.equal(connection.records.length, 8);
    assert.equal(result.plan.pools[0].analysis.已垫, 1);
    assert.ok(connection.events.indexOf('migrate') < connection.events.indexOf('begin'));
    assert.ok(connection.events.indexOf('isolation') < connection.events.indexOf('begin'));
    assert.ok(connection.events.indexOf('row-lock') < connection.events.indexOf('insert'));
    assert.equal(connection.events.at(-2), 'commit');
    assert.equal(connection.events.at(-1), 'unlock');
    const beforeEvents = connection.events.length;
    const again = await executeHistoricalImport(connection, { history, apply: true, backupDir });
    assert.equal(again.plan.status, 'already_imported');
    assert.equal(again.applied, false);
    assert.equal((await fs.readdir(backupDir)).length, 1);
    assert.ok(!connection.events.slice(beforeEvents).includes('insert'));
});

test('插入或原始记录核验失败时回滚全部数据，保留备份与已完成的 DDL', async t => {
    const backupDir = await temporaryBackup(t);
    for (const options of [{ failInsert: true }, { corruptExisting: true }]) {
        const connection = new FakeConnection(options);
        const original = fingerprintRecords(connection.records);
        await assert.rejects(executeHistoricalImport(connection, { history, apply: true, backupDir }), error => {
            assert.equal(error.migrated, true);
            assert.ok(error.backupPath);
            return true;
        });
        assert.equal(fingerprintRecords(connection.records), original);
        assert.ok(connection.events.includes('rollback-data'));
        assert.equal(connection.migrated, true);
        assert.equal(connection.events.at(-1), 'unlock');
    }
});

test('备份之后出现新官方记录时停止写入，并保留并发新增的数据', async t => {
    const connection = new FakeConnection({ beforeBegin(db) {
        db.records.push({ ...db.records[0], id: 90, draw_order: 90, in_second_seq: 90 });
    } });
    const backupDir = await temporaryBackup(t);
    await assert.rejects(executeHistoricalImport(connection, { history, apply: true, backupDir }), error => /发生变化/.test(error.reason));
    assert.equal(connection.records.length, 4);
    assert.ok(connection.records.every(row => row.data_source === 'official'));
    assert.ok(!connection.events.includes('insert'));
});

test('批次撤销支持只读预演，实际删除保留官方增量和其他用户', async t => {
    const connection = new FakeConnection();
    const backupDir = await temporaryBackup(t);
    const imported = await executeHistoricalImport(connection, { history, apply: true, backupDir });
    connection.records.push({ ...connection.records[0], id: 90, draw_order: 90, in_second_seq: 90 });
    connection.records.push({ ...connection.records[0], id: 91, uid: 'another-sample-user' });
    const remaining = fingerprintRecords(connection.records.filter(row => row.import_batch_id !== imported.plan.batchId));
    const options = { rollback: true, batchId: imported.plan.batchId, uid: 'sample-user', backupDir };
    const preview = await executeHistoricalImport(connection, options);
    assert.equal(preview.plan.rows.length, 5);
    assert.equal(connection.records.length, 10);
    const deleted = await executeHistoricalImport(connection, { ...options, apply: true });
    assert.equal(deleted.applied, true);
    assert.equal(fingerprintRecords(connection.records), remaining);
    const again = await executeHistoricalImport(connection, { ...options, apply: true });
    assert.equal(again.plan.rows.length, 0);
    assert.equal(again.applied, false);
});

test('无备份写入权限时不执行任何结构或数据修改', async t => {
    const connection = new FakeConnection();
    const backupDir = await temporaryBackup(t);
    const blocked = path.join(backupDir, 'a-file');
    await fs.writeFile(blocked, 'sample');
    await assert.rejects(executeHistoricalImport(connection, { history, apply: true, backupDir: blocked }));
    assert.ok(!connection.events.includes('migrate'));
    assert.ok(!connection.events.includes('insert'));
});

test('提交确认丢失时不误报已回滚，可用同批次预演辨认已提交状态', async t => {
    const connection = new FakeConnection();
    const backupDir = await temporaryBackup(t);
    const commit = connection.commit.bind(connection);
    connection.commit = async () => {
        await commit();
        throw Object.assign(new Error('mock connection lost'), { sqlState: 'HY000', code: 'PROTOCOL_CONNECTION_LOST' });
    };
    await assert.rejects(executeHistoricalImport(connection, { history, apply: true, backupDir }), /提交或回滚阶段异常/);
    assert.equal(connection.records.length, 8);
    const preview = await executeHistoricalImport(connection, { history });
    assert.equal(preview.plan.status, 'already_imported');
    assert.equal(preview.applied, false);
});

test('unsigned 业务序号或不兼容迁移会在预演阶段拒绝', async () => {
    const connection = new FakeConnection();
    const query = connection.query.bind(connection);
    connection.query = async sql => {
        const result = await query(sql);
        if (sql.startsWith('SHOW COLUMNS')) result[0].find(column => column.Field === 'draw_order').Type = 'bigint unsigned';
        return result;
    };
    await assert.rejects(inspectSchema(connection), /负数/);
    const partial = new FakeConnection();
    const partialQuery = partial.query.bind(partial);
    partial.query = async sql => {
        const result = await partialQuery(sql);
        if (sql.startsWith('SHOW COLUMNS')) result[0].push({ Field: 'data_source', Type: 'varchar(20)', Null: 'YES' });
        return result;
    };
    await assert.rejects(inspectSchema(partial), /不兼容/);
});
