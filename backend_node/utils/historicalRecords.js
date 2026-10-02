const { createHash } = require('node:crypto');
const { analyzePool } = require('./analyzePool');

const POOL_LABELS = new Map([
    ['角色活动唤取', 1],
    ['武器活动唤取', 2],
    ['常驻武器', 4]
]);
const MANUAL_SOURCES = new Set(['manual', 'placeholder']);
const RECORD_FIELDS = [
    'uid', 'resource_id', 'resource_name', 'quality_level', 'pool_type',
    'time', 'in_second_seq', 'draw_order', 'is_up', 'data_source', 'import_batch_id'
];

function parseHistoricalRecords(markdown) {
    const history = [];
    let group;
    for (const [index, rawLine] of markdown.replace(/^\uFEFF/, '').split(/\r?\n/).entries()) {
        const line = rawLine.trim();
        if (!line) continue;
        if (line.startsWith('## ')) {
            const poolType = POOL_LABELS.get(line.slice(3).trim());
            if (!poolType || history.some(item => item.poolType === poolType)) {
                throw new Error(`第 ${index + 1} 行卡池标题未知或重复`);
            }
            group = { poolType, entries: [] };
            history.push(group);
            continue;
        }
        if (!group) continue;
        if (/^(人物|武器名称)\s+抽数/.test(line)) continue;
        const parts = line.split(/\s+/);
        const expectedColumns = group.poolType === 1 ? 3 : 2;
        const count = Number(parts[1]);
        if (parts.length !== expectedColumns || !/^\d+$/.test(parts[1] ?? '') ||
            !Number.isSafeInteger(count) || count <= 0 ||
            (group.poolType === 1 && !['0', '1'].includes(parts[2]))) {
            throw new Error(`第 ${index + 1} 行记录格式或抽数无效`);
        }
        group.entries.push({
            name: parts[0], count,
            // 文档 0 表示 UP；武器沿用当前数据库的五星 UP 编码。
            isUp: group.poolType === 1 ? parts[2] === '0' : true
        });
    }
    if (!history.length || history.some(item => !item.entries.length)) {
        throw new Error('历史文档必须包含非空的受支持卡池');
    }
    return history;
}

function createBatchId(history) {
    const canonical = history.slice().sort((a, b) => a.poolType - b.poolType);
    return `expired-${createHash('sha256').update(JSON.stringify(canonical)).digest('hex').slice(0, 24)}`;
}

function validateBatchId(batchId) {
    if (typeof batchId !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(batchId)) {
        throw new Error('批次标识需为 1–64 位字母、数字、下划线或连字符');
    }
}

function selectUid(records, requestedUid) {
    const users = [...new Set(records.map(row => row.uid)
        .filter(value => value !== null && value !== undefined).map(String))];
    if (requestedUid !== undefined) {
        if (!users.includes(String(requestedUid))) throw new Error('指定用户没有现有记录');
        return String(requestedUid);
    }
    if (users.length !== 1) throw new Error('需有且仅有一个现有用户，否则请显式指定 --uid');
    return users[0];
}

function getSource(row) {
    return row.data_source ?? 'official';
}

function getUp(row) {
    if (row.is_up === null || row.is_up === undefined) return null;
    if ([true, 1, '1'].includes(row.is_up)) return true;
    if ([false, 0, '0'].includes(row.is_up)) return false;
    throw new Error('现有记录的 UP 标记无效');
}

function orderOfficialRecords(records) {
    const orders = new Set();
    const keys = new Set();
    for (const row of records) {
        const order = Number(row.draw_order);
        if (!Number.isSafeInteger(order) || order <= 0 || orders.has(order)) {
            throw new Error('现有官方业务序号必须为不重复的正整数');
        }
        if (row.time === null || row.time === undefined ||
            !Number.isFinite(new Date(row.time).getTime()) ||
            !Number.isSafeInteger(Number(row.in_second_seq)) || row.in_second_seq === null ||
            Number(row.in_second_seq) < 0) {
            throw new Error('现有官方记录缺少有效的时间或同秒序号');
        }
        const key = JSON.stringify([String(row.time), Number(row.in_second_seq)]);
        if (keys.has(key)) throw new Error('现有官方记录的时间和同秒序号重复');
        keys.add(key);
        orders.add(order);
    }
    const ordered = records.slice().sort((a, b) => Number(a.draw_order) - Number(b.draw_order));
    const chronological = records.slice().sort((a, b) => {
        const timeDiff = new Date(a.time).getTime() - new Date(b.time).getTime();
        return timeDiff || Number(a.in_second_seq) - Number(b.in_second_seq);
    });
    if (ordered.some((row, index) => row !== chronological[index])) {
        throw new Error('现有业务序号与时间、同秒顺序不一致');
    }
    return ordered;
}

function getGoldHistory(records) {
    const gold = [];
    let count = 0;
    for (const row of records) {
        count++;
        if (Number(row.quality_level) === 5) {
            gold.push({ name: row.resource_name, count, isUp: getUp(row) });
            count = 0;
        }
    }
    return gold;
}

function findOverlap(group, officialGold) {
    const candidates = [];
    for (let start = 0; start < group.entries.length; start++) {
        const suffix = group.entries.slice(start);
        if (suffix.length > officialGold.length) continue;
        const matches = suffix.every((item, index) => {
            const existing = officialGold[index];
            return item.name === existing.name &&
                (index === 0 ? item.count >= existing.count : item.count === existing.count) &&
                (group.poolType !== 1 || item.isUp === existing.isUp);
        });
        if (matches) candidates.push(start);
    }
    if (candidates.length !== 1) {
        throw new Error(`卡池 ${group.poolType} 的重叠段${candidates.length ? '不唯一' : '无法匹配'}，停止补录`);
    }
    return candidates[0];
}

function buildPrefix(group, official, uid, batchId, overlapStart, boundaryMissingDraws) {
    const idsByName = new Map();
    for (const row of official) {
        if (Number(row.quality_level) !== 5 || row.resource_id === null || row.resource_id === undefined) continue;
        if (!idsByName.has(row.resource_name)) idsByName.set(row.resource_name, new Set());
        idsByName.get(row.resource_name).add(String(row.resource_id));
    }
    const rows = [];
    function addUnknown(count) {
        for (let i = 0; i < count; i++) {
            rows.push({
                uid, pool_type: group.poolType, resource_id: null, resource_name: null,
                quality_level: null, is_up: null, time: null, in_second_seq: null,
                data_source: 'placeholder', import_batch_id: batchId
            });
        }
    }
    const total = group.entries.slice(0, overlapStart).reduce((sum, item) => sum + item.count, 0) + boundaryMissingDraws;
    if (!Number.isSafeInteger(total) || total > 100000) throw new Error('单池补录超过 100,000 抽，停止自动补录');
    for (const item of group.entries.slice(0, overlapStart)) {
        addUnknown(item.count - 1);
        const ids = idsByName.get(item.name);
        rows.push({
            uid, pool_type: group.poolType,
            resource_id: ids?.size === 1 ? [...ids][0] : null,
            resource_name: item.name, quality_level: 5, is_up: item.isUp ? 1 : 0,
            time: null, in_second_seq: null, data_source: 'manual', import_batch_id: batchId
        });
    }
    // 补齐首个官方五星之前已过期的抽数，不重复创建该五星。
    addUnknown(boundaryMissingDraws);
    return rows.map((row, index) => ({ ...row, draw_order: index - rows.length }));
}

function sameImportRecord(expected, actual) {
    return RECORD_FIELDS.every(field => {
        // NULL 物品 ID 可以一直保留未知；后续官方导入可能才提供对应 ID。
        if (field === 'resource_id' && actual[field] === null) return true;
        const a = expected[field];
        const b = actual[field];
        if (a === null || a === undefined || b === null || b === undefined) return a === b;
        return String(a) === String(b);
    });
}

function verifyImportRows(expectedRows, actualRows) {
    if (expectedRows.length !== actualRows.length) throw new Error('已有批次不完整或记录数不一致，停止补录');
    const expected = expectedRows.slice().sort((a, b) => a.pool_type - b.pool_type || a.draw_order - b.draw_order);
    const actual = actualRows.slice().sort((a, b) => Number(a.pool_type) - Number(b.pool_type) || Number(a.draw_order) - Number(b.draw_order));
    if (expected.some((row, index) => !sameImportRecord(row, actual[index]))) {
        throw new Error('已有批次的字段或业务顺序与预期不一致，停止补录');
    }
}

function fingerprintRecords(records) {
    // 缺少来源列的旧表视为 official；结构迁移补默认值后仍能核对所有玩家字段。
    const fields = ['id', ...RECORD_FIELDS, 'created_at'];
    const canonical = records.slice().sort((a, b) => Number(a.id) - Number(b.id))
        .map(row => fields.map(field => {
            const value = field === 'data_source' ? getSource(row) : row[field];
            return value === null || value === undefined ? null : value instanceof Date ? value.toISOString() : String(value);
        }));
    return createHash('sha256').update(JSON.stringify(canonical)).digest('hex');
}

function buildHistoricalImportPlan({ history, records, uid: requestedUid, batchId = createBatchId(history) }) {
    validateBatchId(batchId);
    if (!history.length) throw new Error('没有可补录的历史记录');
    const uid = selectUid(records, requestedUid);
    const target = records.filter(row => String(row.uid) === uid);
    const existingBatch = target.filter(row => row.import_batch_id === batchId);
    if (target.some(row => row.import_batch_id !== batchId &&
        (getSource(row) !== 'official' || row.import_batch_id != null || Number(row.draw_order) <= 0))) {
        throw new Error('目标用户已有其他补录或非官方前缀，请先确认拼接位置');
    }
    if (existingBatch.some(row => !MANUAL_SOURCES.has(getSource(row)))) {
        throw new Error('批次包含非手动来源记录，停止补录');
    }
    const rows = [];
    const pools = [];
    for (const group of history) {
        const official = orderOfficialRecords(target.filter(row =>
            Number(row.pool_type) === group.poolType && getSource(row) === 'official' && row.import_batch_id == null));
        const gold = getGoldHistory(official);
        const overlapStart = findOverlap(group, gold);
        const boundaryMissingDraws = group.entries[overlapStart].count - gold[0].count;
        const prefix = buildPrefix(group, official, uid, batchId, overlapStart, boundaryMissingDraws);
        rows.push(...prefix);
        pools.push({
            poolType: group.poolType, existingDraws: official.length,
            addedDraws: prefix.length, addedFiveStars: overlapStart,
            overlapFiveStars: group.entries.length - overlapStart, boundaryMissingDraws,
            analysis: analyzePool([...prefix, ...official])
        });
    }
    if (existingBatch.length) verifyImportRows(rows, existingBatch);
    return {
        uid, batchId, status: existingBatch.length ? 'already_imported' : 'ready',
        rows, pools, baselineFingerprint: fingerprintRecords(target)
    };
}

function buildRollbackPlan(records, requestedUid, batchId) {
    validateBatchId(batchId);
    const uid = selectUid(records, requestedUid);
    const rows = records.filter(row => String(row.uid) === uid && row.import_batch_id === batchId);
    if (rows.some(row => !MANUAL_SOURCES.has(getSource(row)) || Number(row.draw_order) >= 0 ||
        row.time !== null || row.in_second_seq !== null)) {
        throw new Error('批次包含不符合补录边界的记录，拒绝自动撤销');
    }
    return { uid, batchId, rows, baselineFingerprint: fingerprintRecords(records.filter(row => String(row.uid) === uid)) };
}

module.exports = {
    RECORD_FIELDS, parseHistoricalRecords, createBatchId, selectUid,
    buildHistoricalImportPlan, buildRollbackPlan, fingerprintRecords, verifyImportRows
};
