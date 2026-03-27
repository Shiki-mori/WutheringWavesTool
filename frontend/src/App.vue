<template>
  <div>
    <h3>Analyze Tool</h3>
    <!-- <input v-model="inputNumbers"
      placeholder="请输入整数，数字之间使用英文逗号隔开">v-model:Vue的双向绑定，将输入框input的内容与变量inputNumbers绑定 -->
    <!-- <button @click="calculate" :disabled="loading">{{ loading ? "分析中..." : "开始分析"
      }}</button>点击按钮时，调用testBackend函数 -->
    <!-- <p>{{ avresult }}</p>在页面显示avresult变量的值 -->

    <input v-model="inputUrl" placeholder="输入链接">
    <button @click="gachaAnalyze">开始分析</button>
    <p>{{ urlresult }}</p>
  </div>
</template>


<script setup lang="ts">//lang="ts"表示language使用TypeScript
import { ref } from 'vue'//ref是Vue的响应式变量
import { getGachaData } from './api/gacha'

//const loading = ref(false)//定义一个响应式变量loading，初始值为false，用于表示是否正在加载数据
const inputUrl = ref("")
const urlresult = ref<any>()//定义一个响应式变量urlresult，用于存储后端返回的结果或错误信息

const gachaAnalyze = async () => {

  try {
    const res = await getGachaData(inputUrl.value);
    urlresult.value = res.data;
  } catch (error) {
    console.error('Error:', error);
  }
}

</script>
