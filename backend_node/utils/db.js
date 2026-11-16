//只提供数据连接，不要让db.js和表名产生任何关系
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// 数据库凭据只从用户私有目录读取，仓库中不保存任何账户或密码。
// 优先使用 WWT_DB_CONFIG；否则 Windows 读 %LOCALAPPDATA%，其他系统读 ~/.config。
const defaultConfigDir = process.env.LOCALAPPDATA
    || process.env.XDG_CONFIG_HOME
    || path.join(require('os').homedir(), '.config');
const localConfigPath = process.env.WWT_DB_CONFIG
    || path.join(defaultConfigDir, 'WutheringWavesTool', 'db.local.json');
if (!fs.existsSync(localConfigPath)) {
    throw new Error(`本机数据库配置不存在：${localConfigPath}，请参照 README 创建，或通过 WWT_DB_CONFIG 指定路径`);
}
const localConfig = JSON.parse(fs.readFileSync(localConfigPath, 'utf8'));
for (const key of ['user', 'password']) {
    if (!localConfig[key]) {
        throw new Error(`本机数据库配置缺少字段 ${key}：${localConfigPath}`);
    }
}

const pool = mysql.createPool({
    host: 'localhost',
    database: 'analyzer',
    ...localConfig,

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
