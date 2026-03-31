//该函数以查询参数为输入，转发请求，返回响应数据
const axios = require('axios') 
async function fetchRecords(payloads) {
    const results = [];

    for (const payload of payloads) {
        const response = await axios({
            url: 'https://gmserver-api.aki-game2.com/gacha/record/query',
            method: 'POST',
            data: payload,
            headers: {
                // 伪造headers，模仿游戏内嵌浏览器的行为
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/plain, */*',
                'Origin': 'https://aki-gm-resources.aki-game.com',
                'Referer': 'https://aki-gm-resources.aki-game.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        })

        console.log('官方接口响应成功：', response.data.message, ' ', '卡池编号：', payload.cardPoolType);

        results.push({
            records: response.data.data,
            playerId: payload.playerId,
        })
    }
    return results;
}

module.exports = {
    fetchRecords
};