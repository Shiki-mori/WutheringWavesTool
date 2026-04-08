<template>
  <main class="page-shell">
    <section class="panel">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Wuthering Waves Tool</p>
          <h1>抽卡分析</h1>
        </div>
      </div>

      <section class="action-section">
        <h2>链接分析</h2>
        <div class="control-row">
          <input v-model="inputUrl" class="text-input" placeholder="输入链接" />
          <button @click="gachaAnalyze">开始分析</button>
        </div>
        <p v-if="urlresult" class="status-text status-pre">{{ urlresult }}</p>
      </section>

      <section class="action-section">
        <h2>数据库查询</h2>
        <div class="control-row">
          <button @click="readRecords" :disabled="recordsLoading">
            {{ recordsLoading ? '查询中...' : '查询数据库' }}
          </button>
        </div>
        <p v-if="recordsMessage" class="status-text">{{ recordsMessage }}</p>
        <pre v-if="recordsResult" class="result-box">{{ JSON.stringify(recordsResult, null, 2) }}</pre>
      </section>

      <section class="action-section">
        <h2>数据库分析</h2>
        <div class="control-row">
          <button @click="analyzeRecords" :disabled="analyzeLoading">
            {{ analyzeLoading ? '分析中...' : '分析数据库结果' }}
          </button>
        </div>
        <!-- <p v-if="analyzeMessage" class="status-text">{{ analyzeMessage }}</p>
        <pre v-if="analyzeResult.length" class="result-box">{{ JSON.stringify(analyzeResult, null, 2) }}</pre> -->

        <div v-if="summaryCards.length" class="summary-grid">
          <article v-for="card in summaryCards" :key="card.label" class="summary-card">
            <span class="summary-label">{{ card.label }}</span>
            <strong class="summary-value">{{ card.value }}</strong>
          </article>
        </div>

        <PoolSummaryChart v-if="analyzeResult.length" :pools="analyzeResult" />

        <p v-else-if="!analyzeLoading" class="empty-state">
          点击“分析数据库结果”后，这里会显示卡池统计图。
        </p>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PoolSummaryChart from './components/PoolSummaryChart.vue'
import type { PoolAnalyzeItem } from './api/records'
import { getAnalyzedRecordsData, getRecordsData } from './api/records'
import { getGachaData } from './api/gacha'

const inputUrl = ref('')
const urlresult = ref('')
const recordsLoading = ref(false)
const recordsMessage = ref('')
const recordsResult = ref<unknown | null>(null)

const analyzeLoading = ref(false)
const analyzeMessage = ref('')
const analyzeResult = ref<PoolAnalyzeItem[]>([])

const summaryCards = computed(() => {
  if (!analyzeResult.value.length) {
    return []
  }

  const totalPulls = analyzeResult.value.reduce((sum, item) => sum + item.data.total, 0)
  const totalFiveStar = analyzeResult.value.reduce((sum, item) => sum + item.data.fiveStar, 0)
  const currentPity = analyzeResult.value.reduce((sum, item) => sum + item.data.已垫, 0)
  const avgPity = totalFiveStar ? (totalPulls / totalFiveStar).toFixed(2) : '0.00'

  return [
    { label: '卡池数量', value: String(analyzeResult.value.length) },
    { label: '总抽数', value: String(totalPulls) },
    { label: '五星总数', value: String(totalFiveStar) },
    { label: '综合平均出金', value: avgPity },
    { label: '当前总已垫', value: String(currentPity) }
  ]
})

const gachaAnalyze = async () => {
  try {
    const res = await getGachaData(inputUrl.value)
    urlresult.value = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)
  } catch (error) {
    console.error('Error:', error)
    urlresult.value = String(error)
  }
}

const readRecords = async () => {
  recordsLoading.value = true
  recordsMessage.value = ''

  try {
    const res = await getRecordsData()
    //recordsResult.value = res.data
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
    analyzeResult.value = Array.isArray(res.data?.data) ? res.data.data : []
    analyzeMessage.value = `分析成功，共返回 ${analyzeResult.value.length} 个卡池结果`
  } catch (error) {
    console.error('分析数据库结果失败:', error)
    analyzeResult.value = []
    analyzeMessage.value = String(error)
  } finally {
    analyzeLoading.value = false
  }
}
</script>

<style scoped>
.page-shell {
  width: 100%;
}

.panel {
  padding: 32px;
  border-radius: 28px;
  background: linear-gradient(180deg, #ffffff 0%, #fff 100%);
  box-shadow: 0 24px 60px rgba(32, 24, 16, 0.08);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #8f6b32;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #2a2118;
  font-size: 36px;
}

.panel-copy {
  margin: 10px 0 0;
  max-width: 640px;
  color: #6b6257;
}

.action-section + .action-section {
  margin-top: 28px;
}

h2 {
  margin: 0 0 12px;
  color: #2a2118;
  font-size: 20px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.text-input {
  min-width: 280px;
  padding: 12px 14px;
  border: 1px solid #d9cdbb;
  border-radius: 12px;
  font: inherit;
  color: #2a2118;
  background: #fff;
}

.status-text {
  margin: 0 0 20px;
  color: #4c5b6b;
}

.status-pre {
  white-space: pre-wrap;
  word-break: break-word;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  padding: 18px 20px;
  border: 1px solid #efe4cf;
  border-radius: 18px;
  background: #fffaf0;
  text-align: left;
}

.summary-label {
  display: block;
  margin-bottom: 10px;
  color: #8d7b63;
  font-size: 14px;
}

.summary-value {
  color: #241c15;
  font-size: 28px;
}

.result-box {
  margin: 0 0 20px;
  padding: 16px;
  overflow: auto;
  border-radius: 16px;
  background: #201b17;
  color: #f7efe5;
  text-align: left;
}

.empty-state {
  margin: 0;
  padding: 48px 24px;
  border: 1px dashed #d9cdbb;
  border-radius: 20px;
  color: #7b6f63;
  background: #fffaf3;
}

@media (max-width: 720px) {
  .panel {
    padding: 20px;
  }

  .panel-header {
    flex-direction: column;
  }

  h1 {
    font-size: 28px;
  }
}
</style>
