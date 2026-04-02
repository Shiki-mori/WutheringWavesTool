//从数据库读取数据，返回给前端统一格式的数据
const express = require('express');
const router = express.Router();//创建一个新的路由对象，允许定义路由处理函数

const { pool, query } = require('../utils/db')

router.get('/records', async (req, res) => {
    try {
        res.json({
            code: 0,
            message: 'success',
            data: await query(`
                SELECT * FROM analyzer_records
                ORDER BY
                    time ASC,
                    in_second_seq ASC
            `)
        })
    } catch (error) {
        console.error('读取记录失败:', error);
        res.status(500).json({
            code: 500,
            message: 'error'
        })
    }
})

module.exports = router;//导出路由对象，使其可以在其他文件中被引入和使用
