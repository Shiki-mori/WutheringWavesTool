const fs = require('node:fs/promises');
const path = require('node:path');
const { parseHistoricalRecords } = require('../utils/historicalRecords');
const { executeHistoricalImport } = require('../service/importHistoricalRecords');

const DEFAULT_FILE = path.join(__dirname, '../../expiredGachaRecords/records.md');

function parseArguments(args) {
    const options = { file: DEFAULT_FILE, apply: false, rollback: false };
    const names = new Map([
        ['--file', 'file'], ['--uid', 'uid'], ['--batch-id', 'batchId'], ['--backup-dir', 'backupDir']
    ]);
    for (let index = 0; index < args.length; index++) {
        const argument = args[index];
        if (argument === '--apply') options.apply = true;
        else if (argument === '--dry-run') options.dryRun = true;
        else if (argument === '--rollback') options.rollback = true;
        else if (argument === '--help') options.help = true;
        else if (names.has(argument)) {
            const value = args[++index];
            if (!value || value.startsWith('--')) throw new Error(`${argument} 缺少参数`);
            options[names.get(argument)] = value;
        } else throw new Error('存在未知命令参数，请使用 --help');
    }
    if (options.apply && options.dryRun) throw new Error('--apply 与 --dry-run 不能同时使用');
    if (options.rollback && !options.batchId && !options.help) throw new Error('--rollback 必须显式提供 --batch-id');
    return options;
}

function summarize(result) {
    const { plan } = result;
    return {
        mode: result.applied ? '已执行' : '未写库',
        operation: result.operation === 'rollback' ? '撤销批次' : '历史补录',
        batchId: plan.batchId,
        status: plan.status ?? (plan.rows.length ? 'ready' : 'nothing_to_rollback'),
        needsMigration: result.needsMigration,
        plannedRows: plan.rows.length,
        newRows: result.operation === 'import' && plan.status !== 'already_imported' ? plan.rows.length : 0,
        manualFiveStars: plan.rows.filter(row => row.data_source === 'manual').length,
        unknownDraws: plan.rows.filter(row => row.data_source === 'placeholder').length,
        pools: plan.pools?.map(pool => ({
            poolType: pool.poolType, existingDraws: pool.existingDraws, addedDraws: pool.addedDraws,
            addedFiveStars: pool.addedFiveStars, overlapFiveStars: pool.overlapFiveStars,
            boundaryMissingDraws: pool.boundaryMissingDraws,
            totalDraws: pool.analysis.total, fiveStars: pool.analysis.fiveStar, pity: pool.analysis.已垫,
            avgPity: pool.analysis.avgPity, avgUp: pool.analysis.avgUp,
            upRate: pool.analysis.upRate, upSeries: pool.analysis.upSeries, notupSeries: pool.analysis.notupSeries
        })),
        backupPath: result.backupPath
    };
}

async function main(args = process.argv.slice(2)) {
    let pool;
    let connection;
    try {
        const options = parseArguments(args);
        if (options.help) {
            console.log(`历史记录补录（默认只读预演）
  npm run records:import -- [--file 路径] [--uid 用户] [--batch-id 批次]
  npm run records:import -- --apply [--backup-dir 目录]
  npm run records:import -- --rollback --batch-id 批次 [--apply]

--apply 才会备份、迁移来源字段并写入；--rollback 默认也只预演。
执行期间请暂停抓取入库。备份默认保存到 backend_node/backups/。`);
            return;
        }
        if (!options.rollback) options.history = parseHistoricalRecords(await fs.readFile(path.resolve(options.file), 'utf8'));
        ({ pool } = require('../utils/db'));
        connection = await pool.getConnection();
        const result = await executeHistoricalImport(connection, options);
        console.log(JSON.stringify(summarize(result), null, 2));
    } catch (error) {
        console.error(error.sqlState ? `数据库连接失败：${error.code ?? error.errno}` : error.message);
        if (error.reason) console.error(error.reason);
        if (error.backupPath) console.error(`备份位置：${error.backupPath}`);
        if (error.migrated) console.error('来源字段迁移已完成，DDL 不随数据事务回滚。');
        process.exitCode = 1;
    } finally {
        if (connection) connection.release();
        if (pool) await pool.end();
    }
}

if (require.main === module) main();

module.exports = { main, parseArguments, summarize };
