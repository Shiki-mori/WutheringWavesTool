//从数据库读取数据
const { pool, query } = require('./db')

async function getRecords() {
    return await query(`
        SELECT * FROM analyzer_records
        ORDER BY
            time ASC,
            in_second_seq ASC
    `)
}

module.exports = {
    getRecords
}
