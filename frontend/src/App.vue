<template>
  <div><!--一个容器元素，用于包含其中的元素。template中只能有一个根元素，去掉后将出现多个根元素。div用于解决这个问题。-->
    <h1>Analyze Tool</h1>
    <input v-model="inputNumbers"
      placeholder="请输入整数，数字之间使用英文逗号隔开"><!-- v-model:Vue的双向绑定，将输入框input的内容与变量inputNumbers绑定-->
    <button @click="calculate" :disabled="loading">{{ loading ? "分析中..." : "开始分析" }}</button><!--点击按钮时，调用testBackend函数-->
    <p>{{ result }}</p><!--在页面显示result变量的值-->
  </div>
</template>


<script setup lang="ts">//lang="ts"表示这里用TypeScript
import { calculateAverage } from './api/average'
import { ref } from 'vue'//ref是Vue的响应式变量

const loading=ref(false)//定义一个响应式变量loading，初始值为false，用于表示是否正在加载数据
const inputNumbers = ref("")//定义一个响应式变量inputNumbers，初始值为一个空字符串，用于存储用户输入的数字字符串
const result = ref("")//定义一个响应式变量result，初始值为一个空字符串，用于存储后端返回的结果或错误信息

const calculate = async () => {//定义testBackend函数，async表示异步函数，可以配合await等待请求结果
  if (!inputNumbers.value.trim()) {
    result.value = "Input a number."
    return
  }

  const numbers = inputNumbers.value.split(',').map(n => parseFloat(n.trim()))//map转换为浮点数,trim去掉空格,split分割字符串为数组

  try {

    loading.value=true//设置loading为true，表示正在加载数据

    const response = await calculateAverage(numbers)//向链接发送post请求，await等待后端返回结果后再继续（只能在异步函数中使用），并将返回结果保存到response变量
    //字段名:"控制台返回文字信息"//发送给后端的请求体（JSON数据）中的一个字段，test的值为hello backend
    //console.log("准备请求",numbers)//将后端返回的数据打印到控制台
    
    result.value = "平均值： " + response.data.average

  } catch (error: any) {//当try中的代码出错时选择该路径
    //console.error(error)//将错误信息打印到控制台

    result.value=error
  }
  finally{
    loading.value=false//无论成功还是失败，最后都将loading设置为false，表示加载结束
  }
}
</script>
