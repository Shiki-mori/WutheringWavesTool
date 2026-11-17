<template>
  <main class="page-shell">
    <header class="hero">
      <div class="hero-art" aria-hidden="true"></div>
      <div class="hero-body">
        <h1>鸣潮抽卡分析</h1>
        <p class="hero-copy">
          粘贴游戏内的唤取记录链接，记录会保存到本地数据库，再按卡池统计出金、UP 与保底。
        </p>

        <form class="link-form" @submit.prevent="gachaAnalyze">
          <label class="input-wrap">
            <span class="sr-only">唤取记录链接</span>
            <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"
              />
            </svg>
            <input v-model="inputUrl" class="text-input" placeholder="粘贴唤取记录链接" />
          </label>
          <button type="submit" class="btn btn-primary" :disabled="gachaLoading">
            <span v-if="gachaLoading" class="spinner"></span>
            {{ gachaLoading ? '获取中…' : '获取记录' }}
          </button>
        </form>
        <pre v-if="urlresult" class="link-result" :class="`is-${urlStatus}`" role="status">{{
          urlresult
        }}</pre>
      </div>
    </header>

    <section class="db-bar" aria-label="本地数据库">
      <div class="db-action">
        <button class="btn btn-ghost" :disabled="recordsLoading" @click="readRecords">
          <span v-if="recordsLoading" class="spinner"></span>
          {{ recordsLoading ? '查询中…' : '查询记录' }}
        </button>
        <p class="db-status" :class="recordsMessage ? `is-${recordsStatus}` : ''" role="status">
          {{ recordsMessage || '查看已保存的记录数量和建议更新时间。' }}
        </p>
        <pre v-if="recordsResult" class="result-box">{{ JSON.stringify(recordsResult, null, 2) }}</pre>
      </div>

      <div class="db-action">
        <button class="btn btn-primary" :disabled="analyzeLoading" @click="analyzeRecords">
          <span v-if="analyzeLoading" class="spinner"></span>
          {{ analyzeLoading ? '统计中…' : '开始统计' }}
        </button>
        <p class="db-status" :class="analyzeMessage ? `is-${analyzeStatus}` : ''" role="status">
          {{ analyzeMessage || '按卡池汇总出金抽数、UP 率和当前已垫。' }}
        </p>
      </div>
    </section>

    <section v-if="analyzeResult.length" class="results">
      <h2 class="sr-only">统计总览</h2>
      <dl class="summary">
        <div v-for="item in summaryCards" :key="item.label" class="summary-item">
          <dt>{{ item.label }}</dt>
          <dd>{{ item.value }}</dd>
        </div>
      </dl>

      <PoolSummaryChart :pools="analyzeResult" />

      <section v-if="detailPools.length" class="detail-section">
        <h2 class="sr-only">单个卡池</h2>
        <div class="tab-row" role="tablist">
          <button
            v-for="pool in detailPools"
            :key="pool.poolType"
            class="tab-button"
            :class="{ active: pool.poolType === activePool?.poolType }"
            role="tab"
            :aria-selected="pool.poolType === activePool?.poolType"
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
    </section>

    <section v-else class="empty-state">
      <div class="empty-rings" :class="{ loading: analyzeLoading }" aria-hidden="true"></div>
      <p class="empty-title">{{ analyzeLoading ? '正在统计数据库记录…' : '还没有统计结果' }}</p>
      <p class="empty-copy">点击“开始统计”，这里会按卡池显示出金与 UP 情况。</p>
    </section>

    <footer class="page-footer">记录只保存在本地数据库</footer>
  </main>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import PoolSummaryChart from './components/PoolSummaryChart.vue'
import PoolDetailChart from './components/PoolDetailChart.vue'
import type { PoolAnalyzeItem } from './api/records'
import { getAnalyzedRecordsData, getRecordsData } from './api/records'
import { getGachaData } from './api/gacha'
import { getPoolLabel } from './utils/poolLabels'
import { getSummaryFiveStarCount } from './utils/poolStats'
import { getLatestRecordDate } from './utils/recordDates'

type StatusKind = 'success' | 'error'

const inputUrl = ref('')
const urlresult = ref('')
const urlStatus = ref<StatusKind>('success')
const gachaLoading = ref(false)

const recordsLoading = ref(false)
const recordsMessage = ref('')
const recordsStatus = ref<StatusKind>('success')
const recordsResult = ref<unknown | null>(null)

const analyzeLoading = ref(false)
const analyzeMessage = ref('')
const analyzeStatus = ref<StatusKind>('success')
const analyzeResult = ref<PoolAnalyzeItem[]>([])
const activePoolType = ref<number | null>(null)

const summaryCards = computed(() => {
  if (!analyzeResult.value.length) {
    return []
  }

  const totalPulls = analyzeResult.value.reduce((sum, item) => sum + item.data.total, 0)
  const totalFiveStar = getSummaryFiveStarCount(analyzeResult.value)
  // 平均出金仍以全部五星为分母，与只计 UP 和武器的展示计数区分。
  const allFiveStar = analyzeResult.value.reduce((sum, item) => sum + item.data.fiveStar, 0)
  const currentPity = analyzeResult.value.reduce((sum, item) => sum + item.data.已垫, 0)
  const avgPity = allFiveStar ? (totalPulls / allFiveStar).toFixed(2) : '0.00'

  return [
    { label: '总抽数', value: String(totalPulls) },
    { label: '五星总数', value: String(totalFiveStar) },
    { label: '综合平均出金', value: avgPity },
    { label: '当前总已垫', value: String(currentPity) },
    { label: '卡池数量', value: String(analyzeResult.value.length) }
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

const gachaAnalyze = async () => {
  if (gachaLoading.value) {
    return
  }

  gachaLoading.value = true
  try {
    const res = await getGachaData(inputUrl.value)
    urlresult.value = typeof res.data === 'string' ? res.data : JSON.stringify(res.data, null, 2)
    urlStatus.value = 'success'
  } catch (error) {
    console.error('Error:', error)
    urlresult.value = String(error)
    urlStatus.value = 'error'
  } finally {
    gachaLoading.value = false
  }
}

const readRecords = async () => {
  recordsLoading.value = true
  recordsMessage.value = ''

  try {
    const res = await getRecordsData()
    //recordsResult.value = res.data
    const records = Array.isArray(res.data?.data) ? res.data.data : []
    const latestDate = getLatestRecordDate(records) ?? (records.length ? '未知' : '暂无记录')
    const suggestedDate = getLatestRecordDate(records, 6) ?? (records.length ? '未知' : '暂无记录')
    recordsMessage.value = `查询成功，共返回 ${records.length} 条记录。最新记录时间：${latestDate}。建议最晚更新时间：${suggestedDate}`
    recordsStatus.value = 'success'
  } catch (error) {
    console.error('读取数据库失败:', error)
    recordsResult.value = null
    recordsMessage.value = String(error)
    recordsStatus.value = 'error'
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
    analyzeMessage.value = `统计完成，共 ${analyzeResult.value.length} 个卡池`
    analyzeStatus.value = 'success'
  } catch (error) {
    console.error('分析数据库结果失败:', error)
    analyzeResult.value = []
    activePoolType.value = null
    analyzeMessage.value = String(error)
    analyzeStatus.value = 'error'
  } finally {
    analyzeLoading.value = false
  }
}
</script>

<style scoped>
.page-shell {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
  padding: 28px 28px 40px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* ---------- 首屏：原画 + 链接输入 ---------- */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 380px;
  padding: 56px 48px 48px;
  border: 1px solid var(--line);
  border-radius: var(--radius) var(--radius) 0 0;
  background: #120d18;
}

/* 原画保持本来的夜紫色调，粉发角色落在右侧，向左淡入底色让出文字区 */
.hero-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: 72%;
  background: url('/images/pool-detail-bg.jpg') 30% 24% / cover no-repeat;
  mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.5) 26%, #000 52%);
}

.hero-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(0deg, rgba(18, 13, 24, 0.7) 0%, transparent 38%);
}

.hero-body {
  position: relative;
  max-width: 540px;
}

h1 {
  color: var(--text);
  font-size: clamp(36px, 5.2vw, 60px);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.06em;
  text-shadow: 0 2px 24px rgba(18, 13, 24, 0.8);
}

.hero-copy {
  max-width: 30em;
  margin-top: 16px;
  color: var(--text-soft);
  font-size: 15px;
  line-height: 1.75;
}

.link-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 32px;
}

.input-wrap {
  position: relative;
  flex: 1 1 260px;
  min-width: 0;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--text-faint);
  stroke-width: 2;
  stroke-linecap: round;
  /* 输入框的 backdrop-filter 会形成新的层叠上下文，图标需要显式置顶 */
  z-index: 1;
  transform: translateY(-50%);
  pointer-events: none;
}

.text-input {
  width: 100%;
  height: 48px;
  padding: 0 16px 0 42px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius);
  background: rgba(21, 16, 28, 0.78);
  color: var(--text);
  font: inherit;
  backdrop-filter: blur(8px);
  transition: border-color 0.15s ease;
}

.text-input::placeholder {
  color: var(--text-faint);
}

.text-input:hover,
.text-input:focus {
  border-color: var(--pink);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  min-width: 112px;
  padding: 0 22px;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.04em;
  white-space: nowrap;
  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease;
}

.btn-primary {
  background: var(--pink);
  color: var(--pink-ink);
}

.btn-primary:hover:not(:disabled) {
  background: var(--pink-strong);
}

.btn-ghost {
  border-color: var(--line-strong);
  background: transparent;
  color: var(--text);
}

.btn-ghost:hover:not(:disabled) {
  border-color: var(--pink);
  color: var(--pink);
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.link-result {
  max-height: 180px;
  margin: 12px 0 0;
  padding: 12px 14px;
  overflow: auto;
  border-left: 2px solid var(--cyan);
  border-radius: 0 var(--radius) var(--radius) 0;
  background: rgba(21, 16, 28, 0.82);
  color: var(--text-soft);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  backdrop-filter: blur(8px);
}

.link-result.is-error {
  border-left-color: var(--red);
  color: var(--red);
  font-family: inherit;
  font-size: 14px;
}

/* ---------- 本地数据库操作条，与首屏连成一块 ---------- */
.db-bar {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  border: 1px solid var(--line);
  border-top: 0;
  border-radius: 0 0 var(--radius) var(--radius);
  background: var(--panel);
}

.db-action {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 18px;
  min-width: 0;
  padding: 20px 24px;
}

.db-action + .db-action {
  border-left: 1px solid var(--line);
}

.db-status {
  flex: 1 1 220px;
  min-width: 0;
  color: var(--text-soft);
  font-size: 14px;
  overflow-wrap: anywhere;
}

.db-status.is-success,
.db-status.is-error {
  padding-left: 12px;
  border-left: 2px solid var(--cyan);
  color: var(--text);
}

.db-status.is-error {
  border-left-color: var(--red);
  color: var(--red);
}

.result-box {
  flex: 1 1 100%;
  max-height: 280px;
  margin: 0;
  padding: 14px;
  overflow: auto;
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text-soft);
  font-family: var(--font-mono);
  font-size: 12px;
}

/* ---------- 统计结果 ---------- */
.results {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin-top: 44px;
}

/* 总览是一行台账：总抽数领头，其余指标以竖线分隔 */
.summary {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 20px 0;
  margin: 0;
}

.summary-item {
  padding: 0 36px;
  border-left: 1px solid var(--line);
}

.summary-item:first-child {
  padding-left: 0;
  border-left: 0;
}

.summary-item dt {
  color: var(--text-soft);
  font-size: 14px;
}

.summary-item dd {
  margin: 4px 0 0;
  color: var(--text);
  font-size: 40px;
  font-weight: 600;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.summary-item:first-child dd {
  color: var(--pink);
  font-size: 72px;
  line-height: 0.95;
}

.detail-section {
  margin-top: 12px;
}

.tab-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0 28px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--line);
}

.tab-button {
  position: relative;
  padding: 10px 0 12px;
  border: 0;
  background: transparent;
  color: var(--text-faint);
  font-size: 16px;
  font-weight: 600;
  transition: color 0.15s ease;
}

.tab-button::after {
  content: '';
  position: absolute;
  inset: auto 0 -1px;
  height: 2px;
  background: var(--pink);
  transform: scaleX(0);
  transition: transform 0.2s ease;
}

.tab-button:hover {
  color: var(--text);
}

.tab-button.active {
  color: var(--pink);
}

.tab-button.active::after {
  transform: scaleX(1);
}

/* ---------- 空状态：同心环呼应原画里的环形穹顶 ---------- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 44px;
  padding: 44px 24px 52px;
  text-align: center;
}

.empty-rings {
  width: 120px;
  height: 120px;
  margin-bottom: 22px;
  border-radius: 50%;
  background: repeating-radial-gradient(
    circle,
    transparent 0 11px,
    rgba(244, 166, 200, 0.5) 11px 12px
  );
  mask-image: radial-gradient(circle, #000 20%, transparent 72%);
}

.empty-rings.loading {
  animation: pulse 1.4s ease-in-out infinite;
}

@keyframes pulse {
  50% {
    opacity: 0.35;
    transform: scale(0.92);
  }
}

.empty-title {
  color: var(--text);
  font-size: 18px;
  font-weight: 600;
}

.empty-copy {
  margin-top: 6px;
  color: var(--text-soft);
  font-size: 14px;
}

.page-footer {
  margin-top: 48px;
  color: var(--text-faint);
  font-size: 12px;
  text-align: center;
}

/* ---------- 响应式 ---------- */
@media (max-width: 960px) {
  .summary-item {
    padding: 0 24px;
  }

  .summary-item:first-child {
    flex: 1 1 100%;
  }

  .summary-item:nth-child(2) {
    padding-left: 0;
    border-left: 0;
  }

  .summary-item dd {
    font-size: 32px;
  }
}

@media (max-width: 720px) {
  .page-shell {
    padding: 14px 14px 28px;
  }

  .hero {
    min-height: 0;
    padding: 36px 20px 28px;
  }

  .hero-art {
    width: 100%;
    opacity: 0.4;
    mask-image: linear-gradient(180deg, #000 0%, transparent 85%);
  }

  .db-bar {
    grid-template-columns: minmax(0, 1fr);
  }

  .db-action {
    padding: 16px 20px;
  }

  .db-action + .db-action {
    border-top: 1px solid var(--line);
    border-left: 0;
  }

  .btn {
    flex: 1 1 auto;
  }

  .summary {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-item,
  .summary-item:nth-child(2) {
    padding: 0 0 0 14px;
    border-left: 1px solid var(--line);
  }

  .summary-item:first-child {
    grid-column: 1 / -1;
    padding-left: 0;
    border-left: 0;
  }

  .summary-item:first-child dd {
    font-size: 56px;
  }

  .tab-row {
    gap: 0 20px;
  }

  .tab-button {
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .spinner,
  .empty-rings.loading {
    animation: none;
  }

  .btn,
  .text-input,
  .tab-button,
  .tab-button::after {
    transition: none;
  }
}
</style>
