// 数据入库
const { getConnection } = require('./db')

function buildRecordKey(record) {
    return `${record.time ?? ''}__${record.inSecondSeq ?? record.in_second_seq ?? ''}`;
}// 识别同一条记录

async function saveRecords(recordGroups) {
    let count = 0;// 新增入库数量
    const connection = await getConnection();

    try {
        for (const group of recordGroups) {
            const playerId = group.playerId ?? null;
            const cardPoolType = group.cardPoolType ?? null;
            // 接口返回通常是最新在前，这里反转后按最旧 -> 最新顺序处理
            const records = (group.records ?? []).slice().reverse();

            // existingRows是该uid+pool_type下已存在的所有记录
            const [existingRows] = await connection.execute(//execute是异步执行SQL查询的方法
                `SELECT time, in_second_seq, draw_order
                 FROM analyzer_records
                 WHERE uid = ? AND pool_type = ?`,
                [playerId, cardPoolType]
            );

            //计算当前uid+pool_type标识的下一个可用draw_order
            //保证新插入的记录在同一个uid+pool_type标识内，draw_order连续递增，不会覆盖已有顺序
            const existingKeySet = new Set(existingRows.map(buildRecordKey));
            let nextDrawOrder = existingRows.reduce(// 遍历existingRows, 找到最大的draw_order
                (maxOrder, row) => {
                    const drawOrder = Number(row.draw_order ?? 0);
                    return drawOrder > maxOrder ? drawOrder : maxOrder;
                }, 0) + 1;//reduce的初始最大值为0；设下一条新记录的业务序号为当前最大值加1

            for (const record of records) {
                const recordKey = buildRecordKey(record);
                if (existingKeySet.has(recordKey)) {
                    continue;
                }

                const resourceId = record.resourceId ?? null;
                await connection.execute(
                    `INSERT INTO analyzer_records
                    (uid, resource_id, resource_name, quality_level, pool_type, time, in_second_seq, draw_order, is_up)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        playerId,
                        resourceId,
                        record.name ?? null,
                        record.qualityLevel ?? null,
                        cardPoolType,
                        record.time ?? null,
                        record.inSecondSeq ?? null,
                        nextDrawOrder,
                        record.isUp ?? record.is_up ?? null
                    ]
                );
                existingKeySet.add(recordKey);// 将新记录的键添加到集合中
                nextDrawOrder++;
                count++;
            }
        }
        const [result] = await connection.query('SELECT COUNT(*) as count FROM analyzer_records');
        console.log("实际插入行数:", result[0].count);
    }
    catch (error) {
        console.error('保存记录时发生错误:', error);
    } finally {
        // console.log('数据录入完成');
        connection.release();
        console.log('数据库连接已释放');
        console.log('入库后数据总数count', count);
    }
}

module.exports = {
    saveRecords
};
