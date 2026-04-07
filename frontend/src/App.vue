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

    <div>
      <button @click="readRecords" :disabled="recordsLoading">
        {{ recordsLoading ? '查询中...' : '查询数据库' }}
      </button>
      <p>{{ recordsMessage }}</p>
      <pre v-if="recordsResult">{{ JSON.stringify(recordsResult, null, 2) }}</pre>
    </div>

    <div>
      <button @click="analyzeRecords" :disabled="analyzeLoading">
        {{ analyzeLoading ? '分析中...' : '分析数据库结果' }}
      </button>
      <p>{{ analyzeMessage }}</p>
      <pre v-if="analyzeResult">{{ JSON.stringify(analyzeResult, null, 2) }}</pre>
    </div>
  </div>
</template>


<script setup lang="ts">//lang="ts"表示language使用TypeScript
import { ref } from 'vue'//ref是Vue的响应式变量
import { getGachaData } from './api/gacha'
import { getAnalyzedRecordsData, getRecordsData } from './api/records'

//const loading = ref(false)//定义一个响应式变量loading，初始值为false，用于表示是否正在加载数据
const inputUrl = ref("")
const urlresult = ref<any>()//定义一个响应式变量urlresult，用于存储后端返回的结果或错误信息
const recordsLoading = ref(false)
const recordsMessage = ref('')
const recordsResult = ref<any>(null)
const analyzeLoading = ref(false)
const analyzeMessage = ref('')
const analyzeResult = ref<any>(null)

const gachaAnalyze = async () => {

  try {
    const res = await getGachaData(inputUrl.value);
    urlresult.value = res.data;
  } catch (error) {
    console.error('Error:', error);
  }
}

const readRecords = async () => {
  recordsLoading.value = true
  recordsMessage.value = ''

  try {
    const res = await getRecordsData()
    recordsResult.value = res.data
    const count = Array.isArray(res.data?.data) ? res.data.data.length : 0
    recordsMessage.value = `查询成功，共返回 ${count} 条记录`
  } catch (error) {
    console.error('读取数据库失败:', error)
    recordsResult.value = null
    recordsMessage.value = String(error)
  } finally {
    recordsLoading.value = false
  }
}

const analyzeRecords = async () => {
  analyzeLoading.value = true
  analyzeMessage.value = ''

  try {
    const res = await getAnalyzedRecordsData()
    analyzeResult.value = res.data.data;
    const count = Array.isArray(res.data?.data) ? res.data.data.length : 0
    analyzeMessage.value = `分析成功，共返回 ${count} 个卡池结果`
  } catch (error) {
    console.error('分析数据库结果失败:', error)
    analyzeResult.value = null
    analyzeMessage.value = String(error)
  } finally {
    analyzeLoading.value = false
  }
}

</script>
