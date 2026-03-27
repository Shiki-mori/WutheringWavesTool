// 数据入库
const { pool, query } = require('./db')
async function saveRecords(records, uid) {
    try {
        for (let r of records) {
            await query(
                'INSERT IGNORE INTO analyzer_records (uid, resource_id, resource_name, quality_level,pool_type,time,gacha_index,is_up) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [
                    uid,
                    r.resourceId,
                    r.name,
                    r.qualityLevel,
                    r.cardPoolId,
                    r.time,
                    r.gacha_index,
                    r.is_up
                ]
            );
        }
    } finally {
        conn.release();
    }
}

module.exports = {
    saveRecords
};
