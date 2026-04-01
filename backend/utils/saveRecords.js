// 数据入库
const { getConnection } = require('./db')

async function saveRecords(recordGroups) {
    // console.log('入库前数据总数：', recordGroups.flatMap(group => group.records).length);
    let count = 0;// 记录入库数量
    const connection = await getConnection();

    try {
        for (const group of recordGroups) {

            // console.log('开始录入数据...');
            const playerId = group.playerId ?? null;
            const records = group.records ?? [];
            const cardPoolType = group.cardPoolType ?? null;

            for (const record of records) {
                count++;
                const resourceId = record.resourceId ?? null;
                await connection.execute(
                    'INSERT IGNORE INTO analyzer_records (uid, resource_id, resource_name, quality_level,pool_type,time,gacha_index,is_up) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [
                        playerId,
                        resourceId,
                        record.name ?? null,
                        record.qualityLevel ?? null,
                        cardPoolType,
                        record.time ?? null,
                        record.gachaIndex ?? record.gacha_index ?? null,
                        record.isUp ?? record.is_up ?? null
                    ]
                );
            }
        }
        const [result] = await connection.query('SELECT COUNT(*) as count FROM analyzer_records');
        console.log("实际插入行数:", result[0].count);
    }
    catch (error) {
        console.error('保存记录时发生错误:', error);
    } finally {
        console.log('数据录入完成');
        connection.release();
        console.log('数据库连接已释放');
        console.log('入库后数据总数count', count);
    }
}

module.exports = {
    saveRecords
};
