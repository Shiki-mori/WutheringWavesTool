<template>
  <div><!--一个容器元素，用于包含其中的元素。template中只能有一个根元素，去掉后将出现多个根元素。-->
    <h1>Wuthering Waves Tool</h1>
    <button @click="testBackend">开始分析(这是按钮文字)</button><!--点击按钮时，调用testBackend函数-->
  </div>
</template>


<script setup lang="ts">//lang="ts"表示这里用TypeScript
import axios from 'axios'//从 axios 库导入 axios

const testBackend = async() => {//定义testBackend函数，async表示异步函数，可以配合await等待请求结果
  try {
    const response = await axios.post('http://localhost:3000/analyze', {//向链接发送post请求，await等待后端返回结果后再继续（只能在异步函数中使用），并将返回结果保存到response变量
      字段名:"控制台返回文字信息"//发送给后端的请求体（JSON数据）中的一个字段，test的值为hello backend
    })
    console.log(response.data)//将后端返回的数据打印到控制台
  } catch (error) {//当try中的代码出错时选择该路径
    console.error(error)//将错误信息打印到控制台
  }
}
</script>