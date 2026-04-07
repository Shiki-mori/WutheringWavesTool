// 查数据库并返回按卡池分析后的结果
const express = require('express');
const router = express.Router();

const { analyzeRecordsFromDb } = require('../utils/analyzeRecords')

async function handleAnalyzeRecords(req, res) {
    try {
        const data = await analyzeRecordsFromDb();

        res.json({
            code: 0,
            message: 'success',
            data
        });
    } catch (error) {
        console.error('分析数据库记录失败:', error);
        res.status(500).json({
            code: 500,
            message: 'error'
        });
    }
}

router.get('/', handleAnalyzeRecords);
router.get('/records', handleAnalyzeRecords);

module.exports = router;
