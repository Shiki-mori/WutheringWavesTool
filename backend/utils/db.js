//只提供数据连接，不要让db.js和表名产生任何关系
const mysql = require('mysql2/promise');

const pool = mysql.createPool({ 
    host:'localhost',
    user: 'analyzer_user',
    password: 'Analyzer@123',
    database: 'analyzer',

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;