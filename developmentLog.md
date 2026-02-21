*2026年2月20日15:19:39*  
新建文件夹，尝试实现最基本的功能：让backend接收模拟数据，返回统计结果。  
## 初始化后端，完成最小后端
在backend下执行：  
```
npm init -y
npm install express cors
```
<br>

`npm init`创建一个package.json文件，包含一个Node项目的元信息，包括项目的依赖环境，启动配置等。具体文件内容如下：  
```JavaScript
//package.json
{
  "name": "backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "description": ""
}
```
`-y`表示在npm询问具体信息时默认选择yes。  
Node项目依赖管理基于package.json这个文件。后续的依赖与版本均会记录于此。  
### npm代理问题
`npm install express cors`可能遇到大段报错，其中包含：  
```
npm error FetchError: request to https://registry.npmjs.org/cors failed, reason: connect ECONNREFUSED 127.0.0.1:1080
```
其中`https://registry.npmjs.org`是npm的官方源，可通过指令`npm config set registry https://registry.npmmirror.com`修改为国内镜像源。  
```
npm error   address: '127.0.0.1',
npm error   port: 1080,
```
报错包含如上内容，说明npm尝试使用代理访问，但是失败了（原因未知）。  
使用`npm config delete proxy` `npm config delete https-proxy`删除代理设置，再次尝试安装。

```
npm error code EPERM
``` 
报错首行信息如上，说明文件权限出问题，通常是Node被安装在受限目录下。  
使用管理员身份运行终端，进入相应目录下，执行安装指令。  
<br>

`express`是一个封装好的Web服务器框架，将从npm官方仓库下载，放入node_modules文件夹中。该框架包含了路由系统、请求解析、中间件机制、响应封装等功能。而Node本身只是JS运行环境。   
`cors`：由于前后端分离，二者使用的端口不同，如前端localhost：5173，后端localhost：3000，浏览器认为这是跨域请求，默认阻止。使用cors来允许实现跨域访问。  
该指令执行后，package.json文件将自动更新相关的依赖信息：  
```JavaScript
"dependencies": {
  "cors": "^2.8.6",
  "express": "^5.2.1"
}
```

完成index.js文件的编写。执行`node index.js`，打开浏览器进入localhost:3000，页面显示`Cannot GET /`，说明一切正常。  
## 初始化前端
### 使用vite创建vue项目
在frontend目录下使用管理员身份运行终端，执行命令`npm create vite@latest .`。
注意命令末的“.”符号，这表示在当前目录创建项目。如果去掉.号，vite将在frontend目录下创建一个子文件夹，此时需要设置项目名称以及文件夹名称。    
本项目选择框架Vue，variant选择TypeScript，其余选项默认。创建完成后在frontend目录下生成相应的vue项目，并得到链接`Local:   http://localhost:5173/`，打开后显示vite+vue默认页面。  
在终止请求后，再次进入vue页面，需使用指令`npm run dev`（如果创建vue项目的命令没有使用.号，则需要定位至vue项目目录下，而不是直接在frontend目录下）。
### 编辑vite+vue默认页面内容
打开`frontend/src/App.vue`，将内容修改为最简版本:
```JavaScript
<template>
  <div>
    <h1>Wuthering Waves Tool</h1>
    <button @click="testBackend">Test Backend</button>
  </div>
</template>

<script setup lang="ts">
import axios from 'axios'

const testBackend = async () => {
  try {
    const response = await axios.post('http://localhost:3000/analyze', {
      test:"hello backend"
    })
    console.log(response.data)
  } catch (error) {
    console.error(error)
  }
}
</script>
```
在frontend目录下执行`npm install axios`。  
## 测试流程  
同时运行前后端。在浏览器打开前端页面，点击`Test Backend`按钮，F12打开控制台，若显示
```
message: "backend works"
received: 
  test: "hello backend"
```
说明实现了前后端通信闭环。