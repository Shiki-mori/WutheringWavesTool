const { getRecords } = require('./getRecords')
const { analyzePool } = require('./analyzePool')

function groupByPoolType(records) {
    const grouped = new Map();

    for (const record of records) {
        if (record.pool_type === undefined || record.pool_type === null || record.pool_type === '') {
            continue;
        }

        const poolType = Number(record.pool_type);
        if (!Number.isFinite(poolType)) {
            continue;
        }

        if (!grouped.has(poolType)) {
            grouped.set(poolType, []);
        }

        grouped.get(poolType).push(record);
    }

    return grouped;
}

async function analyzeRecordsFromDb() {
    const records = await getRecords();
    const groupedRecords = groupByPoolType(records);

    return Array.from(groupedRecords.entries())
        .sort((a, b) => a[0] - b[0])//升序排列
        .map(([poolType, poolRecords]) => ({//数组解构：数组第一个元素赋给poolType，第二个元素赋给poolRecords
            poolType,
            totalRecords: poolRecords.length,
            data: analyzePool(poolRecords)
        }));
}

module.exports = {
    analyzeRecordsFromDb
}
