const express = require('express')  // 从node_modules/express/中加载express模块
const cors = require('cors')

const app = express()  // 创建一个Web服务器实例
app.use(
    cors())  // 注册一个中间件（在请求到达路由之前执行的处理函数），cors允许跨域访问
app.use(express.json())             // 自动把JSON请求体解析成JavaScript对象
app.post('/analyze', (req, res) => {//当收到post请求，并且路径是/analyze时执行此函数。该函数有两个参数req(请求)和res(响应)
    const data = req.body

    res.json({//返回JSON数据给客户端
        message: 'backend works',
        received:data
    })
})

    // 临时get测试接口，验证服务器是否工作
    app.get('/', (req, res) => {res.send('This is test. Server is working')})
    // 让服务器监听3000端口，等待请求
    app.listen(3000, () => {console.log('Server running on port 3000')})