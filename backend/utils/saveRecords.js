// 数据入库
const { getConnection } = require('./db')
const { isUpItem } = require('./isUpItem')

async function saveRecords(recordGroups) {

    const connection = await getConnection();
    try {
        for (const group of recordGroups) {
            const playerId = group.playerId ?? null;
            const records = group.records ?? [];

            for (const record of records) {
                const resourceId = record.resourceId ?? null;

                await connection.execute(
                    'INSERT IGNORE INTO analyzer_records (uid, resource_id, resource_name, quality_level,pool_type,time,gacha_index,is_up) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        playerId,
                        resourceId,
                        record.name ?? null,
                        record.qualityLevel ?? null,
                        record.cardPoolId ?? null,
                        record.time ?? null,
                        record.gachaIndex ?? record.gacha_index ?? null,
                        resourceId === null ? null : isUpItem(record)
                    ]
                );
            }
        }
    } finally {
        connection.release();
    }
}

module.exports = {
    saveRecords
};
