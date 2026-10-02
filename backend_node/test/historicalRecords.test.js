const test = require('node:test');
const assert = require('node:assert/strict');
const {
    parseHistoricalRecords, createBatchId, buildHistoricalImportPlan,
    buildRollbackPlan, fingerprintRecords
} = require('../utils/historicalRecords');
const { analyzePool } = require('../utils/analyzePool');
const { parseArguments } = require('../scripts/importExpiredRecords');

function officialRows(poolType, entries, tail = 0, uid = 'sample-user') {
    const rows = [];
    for (const [index, item] of entries.entries()) {
        for (let draw = 1; draw <= item.count; draw++) {
            const gold = draw === item.count;
            rows.push({
                id: rows.length + 1, uid, pool_type: poolType,
                resource_id: gold ? String(900000 + index) : '800000',
                resource_name: gold ? item.name : '样例普通物品', quality_level: gold ? 5 : 3,
                is_up: gold ? Number(item.isUp) : null,
                time: '2025-01-01 00:00:00', in_second_seq: rows.length,
                draw_order: rows.length + 1, created_at: '2025-02-01 00:00:00'
            });
        }
    }
    for (let index = 0; index < tail; index++) {
        rows.push({ ...rows[0], id: rows.length + 1, quality_level: 4,
            resource_id: '700000', resource_name: '样例四星物品', is_up: null,
            in_second_seq: rows.length, draw_order: rows.length + 1 });
    }
    return rows;
}

const fixtureHistory = [{ poolType: 1, entries: [
    { name: '样例常驻甲', count: 4, isUp: false },
    { name: '样例限定乙', count: 5, isUp: true },
    { name: '样例限定丙', count: 2, isUp: true }
] }];
function fixtureRecords() {
    return officialRows(1, [
        { name: '样例限定乙', count: 3, isUp: true },
        { name: '样例限定丙', count: 2, isUp: true }
    ], 1);
}

test('解析中文标题、空白和 UP 反向编码，批次不受换行格式影响', () => {
    const input = '时间顺序：最旧到最新\n\n## 角色活动唤取\n人物 抽数 是否为up\n样例甲\t4\t1\n样例乙 5 0\n\n## 常驻武器\n武器名称 抽数\n样例武器 3\n';
    const history = parseHistoricalRecords(input);
    assert.equal(history[0].entries[0].isUp, false);
    assert.equal(history[0].entries[1].isUp, true);
    assert.equal(history[1].entries[0].isUp, true);
    assert.equal(createBatchId(history), createBatchId(parseHistoricalRecords('\uFEFF' + input.replaceAll('\n', '\r\n'))));
    for (const value of ['', '## 角色活动唤取\n', '## 未知卡池\n样例 2\n',
        '## 角色活动唤取\n样例 0 0\n', '## 角色活动唤取\n样例 2 2\n',
        '## 常驻武器\n样例 -1\n', '## 常驻武器\n样例 2.5\n',
        '## 常驻武器\n样例 2\n## 常驻武器\n样例 3\n']) {
        assert.throws(() => parseHistoricalRecords(value));
    }
});

test('补齐首金之前缺失抽数，并保留同秒官方顺序、尾部未出金与大保底口径', () => {
    const records = fixtureRecords();
    // 官方序号允许有缺号；抽数以实际记录数计算。
    records.forEach((row, index) => { row.draw_order = index * 7 + 1; });
    const before = fingerprintRecords(records);
    const plan = buildHistoricalImportPlan({ history: fixtureHistory, records });
    assert.equal(plan.rows.length, 6);
    assert.equal(plan.rows.filter(row => row.data_source === 'manual').length, 1);
    assert.equal(plan.pools[0].boundaryMissingDraws, 2);
    assert.deepEqual(plan.rows.map(row => row.draw_order), [-6, -5, -4, -3, -2, -1]);
    for (const row of plan.rows.filter(row => row.data_source === 'placeholder')) {
        for (const field of ['resource_id', 'resource_name', 'quality_level', 'time', 'in_second_seq', 'is_up']) {
            assert.equal(row[field], null);
        }
    }
    assert.deepEqual(plan.pools[0].analysis.pityList.map(item => item.count), [4, 5, 2]);
    assert.equal(plan.pools[0].analysis.total, 12);
    assert.equal(plan.pools[0].analysis.已垫, 1);
    assert.equal(plan.pools[0].analysis.upSeries, 1, '大保底 UP 不计为一次赢 50/50');
    assert.equal(fingerprintRecords(records), before, '计划不得改动原始记录');
});

test('物品 ID 只使用同池可靠映射，无法确认的 ID 保持 NULL', () => {
    const history = [{ poolType: 4, entries: [
        { name: '样例武器', count: 4, isUp: true },
        { name: '样例武器', count: 2, isUp: true }
    ] }];
    const records = officialRows(4, [{ name: '样例武器', count: 2, isUp: true }]);
    const plan = buildHistoricalImportPlan({ history, records });
    assert.equal(plan.rows.find(row => row.data_source === 'manual').resource_id, records[1].resource_id);
    assert.equal(plan.rows.find(row => row.data_source === 'manual').is_up, 1);
    const unknownPlan = buildHistoricalImportPlan({ history: fixtureHistory, records: fixtureRecords() });
    assert.equal(unknownPlan.rows.find(row => row.data_source === 'manual').resource_id, null);
});

test('完整批次重复预演跳过，增量官方记录仍保留新尾部', () => {
    const official = fixtureRecords();
    const first = buildHistoricalImportPlan({ history: fixtureHistory, records: official });
    const imported = first.rows.map((row, index) => ({ ...row, id: 100 + index, created_at: '2025-03-01 00:00:00' }));
    const extra = { ...official[0], id: 200, draw_order: 99, in_second_seq: 99 };
    const again = buildHistoricalImportPlan({ history: fixtureHistory, records: [...official, ...imported, extra] });
    assert.equal(again.status, 'already_imported');
    assert.equal(again.batchId, first.batchId);
    assert.equal(again.pools[0].analysis.已垫, 2);
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: [...official, ...imported.slice(1)] }), /不完整/);
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory,
        records: [...official, ...imported.map((row, index) => index === 0 ? { ...row, quality_level: 5 } : row)] }), /不一致/);
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory,
        records: [...official, ...imported], batchId: 'different-batch' }), /其他补录/);
});

test('空记录、重叠不匹配、重复业务序号与不明确用户均拒绝自动补录', () => {
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: [] }), /现有用户/);
    assert.throws(() => buildHistoricalImportPlan({ history: [], records: fixtureRecords() }), /历史记录/);
    const mismatch = fixtureRecords().map(row => row.quality_level === 5 ? { ...row, resource_name: '另一个样例' } : row);
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: mismatch }), /无法匹配/);
    const duplicate = fixtureRecords(); duplicate[1].draw_order = duplicate[0].draw_order;
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: duplicate }), /不重复/);
    const repeatedKey = fixtureRecords(); repeatedKey[1].in_second_seq = repeatedKey[0].in_second_seq;
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: repeatedKey }), /同秒序号重复/);
    const wrongOrder = fixtureRecords(); [wrongOrder[0].draw_order, wrongOrder[1].draw_order] = [wrongOrder[1].draw_order, wrongOrder[0].draw_order];
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: wrongOrder }), /顺序不一致/);
    const tooLong = officialRows(1, [
        { name: '样例限定乙', count: 6, isUp: true }, { name: '样例限定丙', count: 2, isUp: true }
    ]);
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: tooLong }), /无法匹配/);
    const another = fixtureRecords().map(row => ({ ...row, uid: 'another-sample-user', id: row.id + 100 }));
    assert.throws(() => buildHistoricalImportPlan({ history: fixtureHistory, records: [...fixtureRecords(), ...another] }), /--uid/);
    const chosen = buildHistoricalImportPlan({ history: fixtureHistory, records: [...fixtureRecords(), ...another], uid: 'sample-user' });
    assert.ok(chosen.rows.every(row => row.uid === 'sample-user'));
});

test('重复名称导致多个可能重叠位置时拒绝猜测', () => {
    const history = [{ poolType: 4, entries: [
        { name: '重复样例武器', count: 2, isUp: true },
        { name: '重复样例武器', count: 2, isUp: true }
    ] }];
    const records = officialRows(4, history[0].entries);
    assert.throws(() => buildHistoricalImportPlan({ history, records }), /不唯一/);
});

test('按批次撤销仅选择指定用户的负数补录，不接受官方记录混入', () => {
    const records = fixtureRecords();
    const plan = buildHistoricalImportPlan({ history: fixtureHistory, records });
    const imported = plan.rows.map((row, index) => ({ ...row, id: 100 + index }));
    const rollback = buildRollbackPlan([...records, ...imported], undefined, plan.batchId);
    assert.equal(rollback.rows.length, 6);
    assert.throws(() => buildRollbackPlan([...records, { ...records[0], import_batch_id: plan.batchId }], undefined, plan.batchId), /拒绝/);
});

test('未知 UP 保持三态值，不把 NULL 当成歪', () => {
    const result = analyzePool([{ draw_order: -1, quality_level: 5, resource_name: '样例未知五星', is_up: null }]);
    assert.equal(result.pityList[0].isUp, null);
    assert.equal(result.notupSeries, 0);
});

test('CLI 默认为只读，显式写入与撤销选项必须完整', () => {
    assert.equal(parseArguments([]).apply, false);
    assert.equal(parseArguments(['--apply']).apply, true);
    assert.throws(() => parseArguments(['--apply', '--dry-run']));
    assert.throws(() => parseArguments(['--rollback']));
    assert.throws(() => parseArguments(['--uid']));
    assert.throws(() => parseArguments(['--unknown']));
    assert.equal(parseArguments(['--rollback', '--batch-id', 'sample-batch']).apply, false);
});
