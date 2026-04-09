<template>
  <main class="page-shell">
    <section class="panel">
      <div class="panel-header">
        <div class="panel-heading">
          <p class="eyebrow">Wuthering Waves Tool</p>
          <h1>抽卡分析</h1>
          <p class="panel-copy">把原始抽卡记录整理成总览图和单卡池详情，桌面端阅读更清晰。</p>
        </div>
        <div class="panel-badge">Desktop Dashboard</div>
      </div>

      <div class="action-grid">
        <section class="action-section action-card">
          <div class="section-head">
            <div>
              <p class="section-kicker">Step 1</p>
              <h2>链接分析</h2>
            </div>
          </div>
          <div class="control-row">
            <input v-model="inputUrl" class="text-input" placeholder="输入链接" />
            <button class="primary-button" @click="gachaAnalyze">开始分析</button>
          </div>
          <p v-if="urlresult" class="status-text status-pre">{{ urlresult }}</p>
        </section>

        <section class="action-section action-card">
          <div class="section-head">
            <div>
              <p class="section-kicker">Step 2</p>
              <h2>数据库查询</h2>
            </div>
          </div>
          <div class="control-row">
            <button class="secondary-button" @click="readRecords" :disabled="recordsLoading">
              {{ recordsLoading ? '查询中...' : '查询数据库' }}
            </button>
          </div>
          <p v-if="recordsMessage" class="status-text">{{ recordsMessage }}</p>
          <pre v-if="recordsResult" class="result-box">{{ JSON.stringify(recordsResult, null, 2) }}</pre>
        </section>
      </div>

      <section class="action-section analysis-card">
        <div class="section-head">
          <div>
            <p class="section-kicker">Step 3</p>
            <h2>数据库分析</h2>
          </div>
        </div>
        <div class="control-row">
          <button class="primary-button" @click="analyzeRecords" :disabled="analyzeLoading">
            {{ analyzeLoading ? '分析中...' : '分析数据库结果' }}
          </button>
        </div>
        <p v-if="analyzeMessage" class="status-text">{{ analyzeMessage }}</p>

        <div v-if="summaryCards.length" class="summary-grid">
          <article v-for="card in summaryCards" :key="card.label" class="summary-card">
            <span class="summary-label">{{ card.label }}</span>
            <strong class="summary-value">{{ card.value }}</strong>
          </article>
        </div>

        <PoolSummaryChart v-if="analyzeResult.length" :pools="analyzeResult" />

        <section v-if="detailPools.length" class="detail-section">
          <div class="detail-title-row">
            <div>
              <p class="detail-kicker">二级页面</p>
              <h3 class="detail-title">单个卡池信息</h3>
            </div>
          </div>

          <div class="tab-row">
            <button
              v-for="pool in detailPools"
              :key="pool.poolType"
              class="tab-button"
              :class="{ active: pool.poolType === activePoolType }"
              @click="activePoolType = pool.poolType"
            >
              {{ getPoolLabel(pool.poolType) }}
            </button>
          </div>

          <PoolDetailChart
            v-if="activePool"
            :pool="activePool"
            :pool-label="getPoolLabel(activePool.poolType)"
          />
        </section>

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
import PoolDetailChart from './components/PoolDetailChart.vue'
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
const activePoolType = ref<number | null>(null)

const poolLabelMap: Record<number, string> = {
  1: '卡池一',
  2: '卡池二',
  3: '卡池三',
  4: '卡池四'
}

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

const detailPools = computed(() => analyzeResult.value.slice(0, 4))

const activePool = computed(() => {
  if (!detailPools.value.length) {
    return null
  }

  return (
    detailPools.value.find((item) => item.poolType === activePoolType.value) ??
    detailPools.value[0]
  )
})

const getPoolLabel = (poolType: number) => poolLabelMap[poolType] ?? `卡池 ${poolType}`

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
    activePoolType.value = analyzeResult.value[0]?.poolType ?? null
    analyzeMessage.value = `分析成功，共返回 ${analyzeResult.value.length} 个卡池结果`
  } catch (error) {
    console.error('分析数据库结果失败:', error)
    analyzeResult.value = []
    activePoolType.value = null
    analyzeMessage.value = String(error)
  } finally {
    analyzeLoading.value = false
  }
}
</script>

<style scoped>
.page-shell {
  width: 100%;
  max-width: 1440px;
  margin: 0 auto;
  padding: 40px 28px 56px;
}

.panel {
  position: relative;
  padding: 40px;
  border: 1px solid rgba(184, 150, 93, 0.18);
  border-radius: 32px;
  background:
    radial-gradient(circle at top right, rgba(233, 194, 125, 0.18), transparent 26%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 249, 241, 0.98) 100%);
  box-shadow:
    0 24px 60px rgba(69, 47, 17, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.9);
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 28px;
}

.panel-heading {
  max-width: 760px;
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
  color: #21170d;
  font-size: 48px;
  line-height: 1;
}

.panel-copy {
  margin: 14px 0 0;
  max-width: 620px;
  color: #6f6457;
  font-size: 16px;
}

.panel-badge {
  flex: 0 0 auto;
  padding: 10px 14px;
  border: 1px solid rgba(183, 122, 31, 0.18);
  border-radius: 999px;
  background: rgba(255, 248, 236, 0.9);
  color: #8a6329;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.action-section + .action-section {
  margin-top: 28px;
}

.action-card,
.analysis-card {
  padding: 24px;
  border: 1px solid rgba(223, 207, 178, 0.75);
  border-radius: 24px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 249, 239, 0.92) 100%);
  box-shadow: 0 16px 30px rgba(52, 35, 12, 0.05);
}

.analysis-card {
  margin-top: 20px;
  padding: 28px;
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.section-kicker {
  margin: 0 0 6px;
  color: #9b6a24;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h2 {
  margin: 0;
  color: #2a2118;
  font-size: 24px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
  align-items: center;
}

.text-input {
  flex: 1 1 320px;
  min-width: 280px;
  padding: 14px 16px;
  border: 1px solid #ddcfb9;
  border-radius: 14px;
  font: inherit;
  color: #2a2118;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: inset 0 1px 2px rgba(35, 23, 8, 0.04);
}

.text-input:focus {
  outline: none;
  border-color: #c2892f;
  box-shadow: 0 0 0 4px rgba(194, 137, 47, 0.14);
}

.primary-button,
.secondary-button {
  min-height: 48px;
  padding: 0 18px;
  border-radius: 14px;
  font-weight: 700;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.primary-button {
  border: 1px solid #b7771b;
  background: linear-gradient(180deg, #d89531 0%, #b7771b 100%);
  box-shadow: 0 12px 24px rgba(183, 119, 27, 0.22);
  color: #fff;
}

.secondary-button {
  border: 1px solid #dcccae;
  background: linear-gradient(180deg, #fffdfa 0%, #f7f1e6 100%);
  color: #5f513e;
}

.primary-button:hover,
.secondary-button:hover,
.tab-button:hover {
  transform: translateY(-1px);
}

.primary-button:disabled,
.secondary-button:disabled {
  opacity: 0.72;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.status-text {
  margin: 0 0 18px;
  color: #5a6270;
}

.status-pre {
  white-space: pre-wrap;
  word-break: break-word;
  padding: 14px 16px;
  border: 1px solid rgba(211, 196, 171, 0.8);
  border-radius: 16px;
  background: rgba(255, 252, 245, 0.92);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 18px;
  margin-bottom: 26px;
}

.summary-card {
  padding: 20px 22px;
  border: 1px solid rgba(239, 228, 207, 0.92);
  border-radius: 20px;
  background:
    linear-gradient(180deg, rgba(255, 252, 246, 0.98) 0%, rgba(255, 245, 230, 0.94) 100%);
  text-align: left;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.summary-label {
  display: block;
  margin-bottom: 12px;
  color: #8d7b63;
  font-size: 14px;
}

.summary-value {
  color: #241c15;
  font-size: 30px;
  line-height: 1;
}

.result-box {
  margin: 0 0 20px;
  padding: 18px;
  overflow: auto;
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(32, 27, 23, 0.96) 0%, rgba(42, 35, 30, 0.98) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.04);
  color: #f8f0e5;
  text-align: left;
}

.empty-state {
  margin: 0;
  padding: 56px 24px;
  border: 1px dashed #d9cdbb;
  border-radius: 24px;
  color: #7b6f63;
  background: linear-gradient(180deg, rgba(255, 251, 244, 0.92) 0%, rgba(255, 246, 232, 0.92) 100%);
}

.detail-section {
  margin-top: 32px;
  padding-top: 28px;
  border-top: 1px solid rgba(223, 207, 178, 0.75);
}

.detail-title-row {
  margin-bottom: 14px;
}

.detail-kicker {
  margin: 0 0 6px;
  color: #9b6a24;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.detail-title {
  margin: 0;
  color: #2a2118;
  font-size: 30px;
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 8px;
}

.tab-button {
  min-height: 46px;
  padding: 0 18px;
  border: 1px solid #dfcfb2;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #6b6257;
  font-weight: 700;
}

.tab-button.active {
  border-color: #b77a1f;
  background: linear-gradient(180deg, #d89531 0%, #b7771b 100%);
  box-shadow: 0 10px 20px rgba(183, 119, 27, 0.22);
  color: #fff;
}

@media (max-width: 980px) {
  .action-grid {
    grid-template-columns: 1fr;
  }

  .panel-header {
    flex-direction: column;
  }
}

@media (max-width: 720px) {
  .page-shell {
    padding: 20px 14px 32px;
  }

  .panel {
    padding: 20px;
  }

  h1 {
    font-size: 28px;
  }

  h2 {
    font-size: 22px;
  }

  .detail-title {
    font-size: 24px;
  }

  .action-card,
  .analysis-card {
    padding: 18px;
  }
}
</style>
