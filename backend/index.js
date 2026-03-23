const express = require('express')  // 从node_modules/express/中加载express框架
const axios = require('axios')        // 从node_modules/axios/中加载axios库，用于发送HTTP请求
const cors = require('cors')        // 允许跨域访问

const app = express()  // 创建一个Web服务器实例
// const { parseGachaUrl } = require("./utils/parseUrl")//引入解析URL的工具函数
const { fetchAll } = require("./utils/fetchAll")
const { analyzePool } = require("./utils/analyzePool")

app.use(
  cors())  // 注册一个中间件（在请求到达路由之前执行的处理函数），cors允许跨域访问
app.use(express.json())  // 自动把JSON请求体解析成JavaScript对象
// app.post('/analyze', (req, res)
// => {//定义一个post接口，路径是/analyze。当收到post请求，并且路径是/analyze时执行此函数。该函数有两个参数req(请求)和res(响应)
//     const data = req.body //读取前端发来的JSON

//     res.json({//返回JSON数据给客户端
//         message: 'backend works',
//         received: data
//     })
// })

// app.post(`/average`, (req, res) => {
//   const numbers = req.body.numbers

//   // 验证是否为数组
//   if (!Array.isArray(numbers)) {
//     return res.status(400).json({error: 'Numbers must be an array.'})
//   }

//   // 验证数组是否为空
//   if (numbers.length === 0) {
//     return res.status(400).json({error: 'Numbers array can\'t be empty.'})
//   }

//   //验证是否都为整数
//   for (let n of numbers) {
//     if (!Number.isInteger(n)) {
//       return res.status(400).json({
//         error:"All elements must be integers."
//       })
//     }
//   }

//   const sum = numbers.reduce(
//       (acc, cur) => acc + cur, 0)  // 求和。reduce：将数组压缩为一个值。
//   const average = sum / numbers.length

//   res.json({average: average})
// })

// app.get("/api/gacha", (req, res) => {
//   const url = req.query.url;

//   //console.log("收到URL:",url);
//   // const mockData={
//   //   total:90,
//   //   fiveStar:1,
//   //   fourStar:12,
//   //   avgPity:70,
//   //   uid:"12345678"
//   // };

//   const parsed = parseGachaUrl(url);

//   if (!parsed) {
//     return res.json({
//       code: -1,
//       message: "invalid URL",
//       data: null
//     })
//   }

//   res.json({
//     code: 0,
//     message: "success",
//     //data:mockData
//     data: parsed
//   })
// })

app.post('/api/gacha/proxy', async (req, res) => {
  try {
    //检查请求体是否存在，并且是否包含URL字段。如果缺失，返回400错误和错误信息。
    // if (!req.body || !req.body.url) {
    //   console.log('请求体缺失URL:', req.body);
    //   return res.status(400).json({ error: 'Missing URL in request body' });
    // }

    const url = req.body.url;//从请求体中获取URL
    const payloads = fetchAll(url);

    // if (!payloads || payloads.length === 0) {
    //   return res.status(400).json({ error: 'URL 解析失败' });
    // }

    console.log('正在转发请求，Payload:', payloads);

    const results = [];

    // 转发请求到目标服务器-游戏官方接口
    for (const payload of payloads) {
      const response = await axios({
        url: 'https://gmserver-api.aki-game2.com/gacha/record/query',
        method: 'POST',
        data: payload,
        headers: {
          // 伪造头部，模仿游戏内嵌浏览器的行为
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/plain, */*',
          'Origin': 'https://aki-gm-resources.aki-game.com',
          'Referer': 'https://aki-gm-resources.aki-game.com/',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      })

      console.log('官方接口响应成功：', response.data.message);

      const analyzedData = analyzePool(response.data);

      results.push({
        poolType: payload.cardPoolType,
        data: analyzedData
      })
    }

    res.json(results);

  } catch (error) {
    console.error('转发失败:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Backend Proxy Error',
      details: error.response?.data || error.message
    })
  }
})

// 临时get测试接口，验证服务器是否工作
// app.get('/', (req, res) => {res.send('This is test. Server is working')})
// 让服务器监听3000端口，等待请求

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`代理后端已启动:Server running on port ${PORT}`);
});