const { pool, query } = require('./db')

async function getRecords() {
    return await query('SELECT * FROM analyzer_records')
}

module.exports = {
    getRecords
}