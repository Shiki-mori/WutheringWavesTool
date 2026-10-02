//从数据库读取数据
const { query } = require('./db')

async function getRecords() {
    return query(`
        SELECT * FROM analyzer_records
        ORDER BY
            uid ASC,
            pool_type ASC,
            draw_order ASC,
            time ASC,
            in_second_seq ASC
    `)
}

module.exports = {
    getRecords
}
