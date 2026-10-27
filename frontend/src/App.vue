<template>
  <main class="page-shell">
    <header class="hero">
      <div class="hero-art" aria-hidden="true"></div>
      <div class="hero-content">
        <p class="eyebrow"><span class="eyebrow-dot"></span>Wuthering Waves Tool</p>
        <h1>抽卡<span>分析</span></h1>
        <p class="hero-copy">
          解析唤取记录链接、同步到本地数据库，并按卡池统计出金、UP 与保底情况。
        </p>
        <ol class="hero-steps">
          <li v-for="step in heroSteps" :key="step.index" :class="{ done: step.done }">
            <span class="hero-step-index">{{ step.done ? '✓' : step.index }}</span>
            {{ step.label }}
          </li>
        </ol>
      </div>
    </header>

    <section class="workflow">
      <article class="step-card step-card-wide">
        <header class="step-head">
          <span class="step-index">01</span>
          <div>
            <h2>链接分析</h2>
            <p class="step-desc">粘贴游戏内唤取记录链接，获取并保存最新记录。</p>
          </div>
        </header>
        <div class="control-row">
          <label class="input-wrap">
            <svg class="input-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"
              />
            </svg>
            <input
              v-model="inputUrl"
              class="text-input"
              placeholder="输入链接"
              @keydown.enter="gachaAnalyze"
            />
          </label>
          <button class="btn btn-primary" :disabled="gachaLoading" @click="gachaAnalyze">
            <span v-if="gachaLoading" class="spinner"></span>
            {{ gachaLoading ? '分析中...' : '开始分析' }}
          </button>
        </div>
        <pre v-if="urlresult" class="status-box" :class="`is-${urlStatus}`">{{ urlresult }}</pre>
      </article>

      <article class="step-card">
        <header class="step-head">
          <span class="step-index">02</span>
          <div>
            <h2>数据库查询</h2>
            <p class="step-desc">查看已入库记录数量与建议更新时间。</p>
          </div>
        </header>
        <div class="control-row">
          <button class="btn btn-secondary" @click="readRecords" :disabled="recordsLoading">
            <span v-if="recordsLoading" class="spinner spinner-pink"></span>
            {{ recordsLoading ? '查询中...' : '查询数据库' }}
          </button>
        </div>
        <p v-if="recordsMessage" class="status" :class="`is-${recordsStatus}`">
          {{ recordsMessage }}
        </p>
        <pre v-if="recordsResult" class="result-box">{{ JSON.stringify(recordsResult, null, 2) }}</pre>
      </article>

      <article class="step-card">
        <header class="step-head">
          <span class="step-index">03</span>
          <div>
            <h2>数据库分析</h2>
            <p class="step-desc">按卡池汇总出金抽数、UP 率与当前已垫。</p>
          </div>
        </header>
        <div class="control-row">
          <button class="btn btn-primary" @click="analyzeRecords" :disabled="analyzeLoading">
            <span v-if="analyzeLoading" class="spinner"></span>
            {{ analyzeLoading ? '分析中...' : '分析数据库结果' }}
          </button>
        </div>
        <p v-if="analyzeMessage" class="status" :class="`is-${analyzeStatus}`">
          {{ analyzeMessage }}
        </p>
      </article>
    </section>

    <section v-if="analyzeResult.length" class="results">
      <header class="section-title">
        <div>
          <p class="section-kicker">Analysis</p>
          <h2>分析总览</h2>
        </div>
      </header>

      <div class="summary-grid">
        <article
          v-for="card in summaryCards"
          :key="card.label"
          class="summary-card"
          :class="{ featured: card.featured }"
        >
          <span class="summary-icon" aria-hidden="true">{{ card.icon }}</span>
          <span class="summary-label">{{ card.label }}</span>
          <strong class="summary-value">{{ card.value }}</strong>
        </article>
      </div>

      <PoolSummaryChart :pools="analyzeResult" />

      <section v-if="detailPools.length" class="detail-section">
        <header class="section-title">
          <div>
            <p class="section-kicker">Pools</p>
            <h2 class="detail-title">单个卡池信息</h2>
          </div>
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
        </header>

        <PoolDetailChart
          v-if="activePool"
          :pool="activePool"
          :pool-label="getPoolLabel(activePool.poolType)"
        />
      </section>
    </section>

    <section v-else class="empty-state">
      <div class="empty-orb" aria-hidden="true">
        <span v-if="analyzeLoading" class="empty-spinner"></span>
        <span v-else class="empty-glyph">✦</span>
      </div>
      <p class="empty-title">{{ analyzeLoading ? '正在分析数据库记录…' : '还没有分析结果' }}</p>
      <p class="empty-copy">点击“分析数据库结果”后，这里会显示卡池统计图。</p>
    </section>

    <footer class="page-footer">Wuthering Waves Tool · 数据仅保存在本地数据库</footer>
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

const heroSteps = computed(() => [
  { index: 1, label: '解析链接', done: Boolean(urlresult.value) && urlStatus.value === 'success' },
  {
    index: 2,
    label: '查询数据库',
    done: Boolean(recordsMessage.value) && recordsStatus.value === 'success'
  },
  { index: 3, label: '统计分析', done: analyzeResult.value.length > 0 }
])

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
    { label: '卡池数量', value: String(analyzeResult.value.length), icon: '◈', featured: false },
    { label: '总抽数', value: String(totalPulls), icon: '✦', featured: true },
    { label: '五星总数', value: String(totalFiveStar), icon: '★', featured: false },
    { label: '综合平均出金', value: avgPity, icon: '◎', featured: false },
    { label: '当前总已垫', value: String(currentPity), icon: '⧗', featured: false }
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
    analyzeMessage.value = `分析成功，共返回 ${analyzeResult.value.length} 个卡池结果`
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
  max-width: 1320px;
  margin: 0 auto;
  padding: 32px 28px 40px;
}

/* ---------- Hero ---------- */
.hero {
  position: relative;
  overflow: hidden;
  min-height: 280px;
  padding: 40px 44px;
  border: 1px solid rgba(255, 255, 255, 0.7);
  border-radius: 32px;
  background: linear-gradient(120deg, #fff7fa 0%, #ffe6ef 46%, #f7c9dc 100%);
  box-shadow: var(--shadow-md);
}

/* 角色图放在右侧并向左淡出，文字区保持干净 */
.hero-art {
  position: absolute;
  inset: 0 0 0 auto;
  width: 64%;
  background: url('/images/pool-detail-bg.jpg') 42% 22% / cover no-repeat;
  mask-image: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.55) 30%, #000 62%);
}

/* 原图偏暗紫，叠一层粉紫提亮，与主色调统一 */
.hero-art::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(248, 170, 198, 0.55) 0%, rgba(205, 184, 234, 0.4) 100%);
  mix-blend-mode: screen;
}

.hero::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(255, 243, 248, 0.92) 0%, rgba(255, 236, 244, 0.5) 46%, transparent 72%),
    linear-gradient(0deg, rgba(226, 98, 143, 0.22) 0%, transparent 40%);
  pointer-events: none;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 520px;
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: 1px solid rgba(226, 98, 143, 0.25);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: var(--pink-600);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  backdrop-filter: blur(6px);
}

.eyebrow-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--pink-500);
  box-shadow: 0 0 0 4px rgba(226, 98, 143, 0.18);
}

h1 {
  margin-top: 18px;
  color: var(--ink-900);
  font-size: 54px;
  font-weight: 900;
  line-height: 1.05;
  letter-spacing: 0.04em;
}

h1 span {
  background: linear-gradient(100deg, #e2628f 0%, #b45bc4 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hero-copy {
  margin-top: 14px;
  color: var(--ink-700);
  font-size: 15px;
}

.hero-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.hero-steps li {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 6px 6px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.66);
  color: var(--ink-700);
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(6px);
  transition: background-color 0.2s ease;
}

.hero-step-index {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--pink-100);
  color: var(--pink-600);
  font-size: 12px;
  font-weight: 800;
}

.hero-steps li.done {
  background: rgba(255, 255, 255, 0.92);
  color: var(--pink-700);
}

.hero-steps li.done .hero-step-index {
  background: linear-gradient(135deg, #f592b5, #e2628f);
  color: #fff;
}

/* ---------- Workflow ---------- */
.workflow {
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
  margin-top: 22px;
}

.step-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  box-shadow: var(--shadow-sm);
  backdrop-filter: blur(14px);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.step-card:hover {
  border-color: var(--border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.step-head {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 18px;
}

.step-index {
  flex: 0 0 auto;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 14px;
  background: linear-gradient(135deg, #fde0ea 0%, #f8b7cf 100%);
  color: var(--pink-700);
  font-size: 14px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

h2 {
  color: var(--ink-900);
  font-size: 19px;
  font-weight: 800;
  line-height: 1.3;
}

.step-desc {
  margin-top: 4px;
  color: var(--ink-500);
  font-size: 13px;
}

.control-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.input-wrap {
  position: relative;
  flex: 1 1 240px;
  min-width: 0;
}

.input-icon {
  position: absolute;
  top: 50%;
  left: 14px;
  width: 18px;
  height: 18px;
  fill: none;
  stroke: var(--pink-400);
  stroke-width: 2;
  stroke-linecap: round;
  transform: translateY(-50%);
  pointer-events: none;
}

.text-input {
  width: 100%;
  height: 46px;
  padding: 0 16px 0 42px;
  border: 1px solid rgba(232, 150, 182, 0.45);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.92);
  color: var(--ink-900);
  font: inherit;
  transition:
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.text-input::placeholder {
  color: var(--ink-300);
}

.text-input:focus {
  outline: none;
  border-color: var(--pink-500);
  box-shadow: 0 0 0 4px rgba(226, 98, 143, 0.15);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 46px;
  padding: 0 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    filter 0.18s ease;
}

.btn-primary {
  border: 0;
  background: linear-gradient(135deg, #f592b5 0%, #e2628f 55%, #c94a77 100%);
  box-shadow: var(--shadow-pink);
  color: #fff;
}

.btn-secondary {
  border: 1px solid rgba(226, 98, 143, 0.35);
  background: rgba(255, 255, 255, 0.92);
  color: var(--pink-600);
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  filter: brightness(1.04);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--pink-50);
  box-shadow: var(--shadow-sm);
}

.btn:active:not(:disabled) {
  transform: translateY(0);
}

.btn:disabled {
  opacity: 0.7;
  cursor: progress;
  box-shadow: none;
}

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255, 255, 255, 0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-pink {
  border-color: rgba(226, 98, 143, 0.25);
  border-top-color: var(--pink-500);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.status,
.status-box {
  position: relative;
  margin-top: 14px;
  padding: 10px 14px 10px 32px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.6;
}

.status::before,
.status-box::before {
  content: '';
  position: absolute;
  top: 16px;
  left: 14px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: currentColor;
}

.status.is-success,
.status-box.is-success {
  background: var(--success-bg);
  color: #2f7d5b;
}

.status.is-error,
.status-box.is-error {
  background: var(--danger-bg);
  color: var(--danger);
}

.status-box {
  max-height: 220px;
  overflow: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.result-box {
  max-height: 280px;
  margin: 14px 0 0;
  padding: 16px;
  overflow: auto;
  border-radius: var(--radius-md);
  background: linear-gradient(180deg, #3b2532 0%, #4a2f3f 100%);
  color: #fde4ee;
  font-family: var(--font-mono);
  font-size: 12px;
}

/* ---------- Results ---------- */
.results {
  display: flex;
  flex-direction: column;
  gap: 18px;
  margin-top: 30px;
}

.section-title {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 14px;
}

.section-kicker {
  color: var(--pink-500);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.section-title h2 {
  margin-top: 2px;
  font-size: 24px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.summary-icon {
  position: absolute;
  top: 12px;
  right: 14px;
  color: var(--pink-200);
  font-size: 30px;
  line-height: 1;
}

.summary-label {
  color: var(--ink-500);
  font-size: 13px;
  font-weight: 600;
}

.summary-value {
  color: var(--ink-900);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.summary-card.featured {
  border-color: transparent;
  background: linear-gradient(135deg, #f592b5 0%, #e2628f 60%, #c94a77 100%);
  box-shadow: var(--shadow-pink);
}

.summary-card.featured .summary-label,
.summary-card.featured .summary-value {
  color: #fff;
}

.summary-card.featured .summary-icon {
  color: rgba(255, 255, 255, 0.35);
}

.detail-section {
  margin-top: 14px;
}

.tab-row {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
}

.tab-button {
  height: 38px;
  padding: 0 18px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: var(--ink-500);
  font-size: 14px;
  font-weight: 700;
  transition:
    background-color 0.18s ease,
    box-shadow 0.18s ease;
}

.tab-button:hover:not(.active) {
  background: var(--pink-50);
  color: var(--pink-600);
}

.tab-button.active {
  background: linear-gradient(135deg, #f592b5 0%, #e2628f 100%);
  box-shadow: 0 6px 16px rgba(226, 98, 143, 0.3);
  color: #fff;
}

/* ---------- Empty ---------- */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 30px;
  padding: 56px 24px;
  border: 1.5px dashed rgba(226, 98, 143, 0.35);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.55);
  text-align: center;
  backdrop-filter: blur(10px);
}

.empty-orb {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  margin-bottom: 16px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fff 0%, #fde0ea 45%, #f8aac6 100%);
  box-shadow: 0 12px 28px rgba(226, 98, 143, 0.25);
}

.empty-glyph {
  color: var(--pink-500);
  font-size: 30px;
  line-height: 1;
  text-shadow: 0 0 12px rgba(255, 255, 255, 0.9);
}

.empty-spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

.empty-title {
  color: var(--ink-900);
  font-size: 17px;
  font-weight: 700;
}

.empty-copy {
  margin-top: 6px;
  color: var(--ink-500);
  font-size: 14px;
}

.page-footer {
  margin-top: 36px;
  color: var(--ink-300);
  font-size: 12px;
  text-align: center;
  letter-spacing: 0.04em;
}

/* ---------- Responsive ---------- */
@media (max-width: 1100px) {
  .workflow {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .step-card-wide {
    grid-column: 1 / -1;
  }

  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .summary-card.featured {
    grid-column: span 2;
  }
}

@media (max-width: 720px) {
  .page-shell {
    padding: 16px 14px 28px;
  }

  .hero {
    min-height: 0;
    padding: 28px 22px;
    border-radius: 24px;
  }

  .hero-art {
    width: 100%;
    opacity: 0.45;
  }

  h1 {
    font-size: 36px;
  }

  .workflow {
    grid-template-columns: minmax(0, 1fr);
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .summary-card.featured {
    grid-column: 1 / -1;
    order: -1;
  }

  .summary-value {
    font-size: 24px;
  }

  .btn {
    flex: 1 1 auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-card,
  .btn,
  .spinner,
  .empty-spinner {
    animation: none;
    transition: none;
  }
}
</style>
