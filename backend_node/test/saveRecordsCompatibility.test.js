const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { buildHistoricalImportPlan, fingerprintRecords } = require('../utils/historicalRecords');
const { analyzePool } = require('../utils/analyzePool');

function loadSaver(connection) {
    const context = {
        module: { exports: {} },
        require(name) {
            assert.equal(name, './db');
            return { getConnection: async () => connection };
        },
        console: { log() {}, error() {} }
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../utils/saveRecords.js'), 'utf8'), context);
    return context.module.exports.saveRecords;
}

for (const datesAsObjects of [false, true]) test(`补录后官方重复、增量和同秒多抽兼容 ${datesAsObjects ? 'Date' : '字符串'} 时间`, async () => {
    const official = [
        { id: 1, uid: 'sample-user', resource_id: '100', resource_name: '样例普通物品', quality_level: 3,
            pool_type: 1, time: '2025-01-01 00:00:00', in_second_seq: 0, draw_order: 1, is_up: null },
        { id: 2, uid: 'sample-user', resource_id: '101', resource_name: '样例重叠五星', quality_level: 5,
            pool_type: 1, time: '2025-01-01 00:00:00', in_second_seq: 1, draw_order: 9, is_up: 1 }
    ];
    const history = [{ poolType: 1, entries: [
        { name: '样例历史五星', count: 3, isUp: false },
        { name: '样例重叠五星', count: 4, isUp: true }
    ] }];
    const plan = buildHistoricalImportPlan({ history, records: official });
    const prefix = plan.rows.map((row, index) => ({ ...row, id: index + 100 }));
    const originalPrefix = fingerprintRecords(prefix);
    const originalOfficial = fingerprintRecords(official);
    const rows = [...prefix, ...official.map(row => ({ ...row, data_source: 'official', import_batch_id: null }))];
    const connection = {
        async execute(sql, params) {
            if (sql.trim().startsWith('SELECT')) {
                return [rows.filter(row => row.uid === params[0] && Number(row.pool_type) === Number(params[1]))
                    .map(row => ({ ...row, time: datesAsObjects && row.time ? new Date(row.time.replace(' ', 'T') + '+08:00') : row.time }))];
            }
            const [uid, resource_id, resource_name, quality_level, pool_type, time, in_second_seq, draw_order, is_up] = params;
            const duplicate = rows.some(row => row.uid === uid && Number(row.pool_type) === Number(pool_type) && row.time === time && row.in_second_seq === in_second_seq);
            if (duplicate) return [{ affectedRows: 0 }];
            rows.push({ id: 1000 + rows.length, uid, resource_id, resource_name, quality_level, pool_type: Number(pool_type), time,
                in_second_seq, draw_order, is_up, data_source: 'official', import_batch_id: null });
            return [{ affectedRows: 1 }];
        },
        async query() { return [[{ count: rows.length }]]; },
        release() {}
    };
    const saveRecords = loadSaver(connection);
    const raw = official.slice().reverse().map(row => ({
        resourceId: row.resource_id, name: row.resource_name, qualityLevel: row.quality_level,
        time: row.time, inSecondSeq: row.in_second_seq, isUp: row.is_up
    }));
    await saveRecords([{ playerId: 'sample-user', cardPoolType: '1', records: raw }]);
    assert.equal(rows.length, prefix.length + 2);
    const latest = [
        { resourceId: '103', name: '样例新增五星', qualityLevel: 5, time: '2025-01-02 00:00:00', inSecondSeq: 1, isUp: true },
        { resourceId: '102', name: '样例新增普通物品', qualityLevel: 4, time: '2025-01-02 00:00:00', inSecondSeq: 0, isUp: null }
    ];
    await saveRecords([{ playerId: 'sample-user', cardPoolType: '1', records: [...latest, ...raw] }]);
    assert.equal(rows.length, prefix.length + 4);
    const incremental = rows.filter(row => row.time === '2025-01-02 00:00:00');
    assert.deepEqual(incremental.map(row => row.in_second_seq), [0, 1]);
    assert.ok(incremental[0].draw_order > 9);
    assert.ok(incremental[1].draw_order > incremental[0].draw_order);
    assert.ok(incremental.every(row => row.data_source === 'official' && row.import_batch_id === null));
    assert.equal(fingerprintRecords(rows.filter(row => row.import_batch_id === plan.batchId)), originalPrefix);
    assert.equal(fingerprintRecords(rows.filter(row => [1, 2].includes(row.id))), originalOfficial);
    const analysis = analyzePool(rows);
    assert.deepEqual(analysis.pityList.map(item => item.count), [3, 4, 2]);
    await saveRecords([{ playerId: 'sample-user', cardPoolType: '1', records: [...latest, ...raw] }]);
    assert.equal(rows.length, prefix.length + 4);
});
