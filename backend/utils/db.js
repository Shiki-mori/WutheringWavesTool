//只提供数据连接，不要让db.js和表名产生任何关系
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'analyzer_user',
    password: 'Analyzer@123',
    database: 'analyzer',

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    timezone: '+08:00'
});

//通用查询方法，接受SQL语句和参数，返回查询结果。使用连接池执行查询，确保连接被正确释放。
async function query(sql, params) {
    const [rows] = await pool.execute(sql, params);
    return rows;
}

async function getConnection() {
    return pool.getConnection();
}

//测试数据库连接
async function testConnection() {
    try {
        const connection = await pool.getConnection();//getConnection方法从连接池中获取一个连接对象，允许执行SQL查询。
        console.log('MySQL connected');
        connection.release();
    } catch (error) {
        console.error('MySQL connected failed:', error);
    }
}

testConnection();

module.exports = { pool, query, getConnection };
