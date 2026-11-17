<template>
  <section class="detail-panel">
    <div class="detail-art" aria-hidden="true"></div>

    <div class="detail-content">
      <header class="detail-header">
        <h3>{{ poolLabel }}</h3>
        <p class="detail-note">共记录 {{ pool.data.pityList.length }} 次五星</p>
      </header>

      <dl class="metric-row">
        <div v-for="metric in metrics" :key="metric.label" class="metric" :class="metric.tone">
          <dt>{{ metric.label }}</dt>
          <dd>{{ metric.value }}</dd>
        </div>
      </dl>

      <div class="chart-grid" :class="{ 'with-ring': isPoolOne }">
        <article v-if="isPoolOne" class="chart-box chart-box-sticky">
          <header class="chart-box-head">
            <h4>五星 UP / 歪</h4>
          </header>
          <VChart
            class="detail-chart detail-chart-ring"
            :init-options="chartInitOptions"
            :option="ringOption"
            autoresize
          />
          <ul class="up-breakdown">
            <li v-for="item in upBreakdown" :key="item.label">
              <span><i :style="{ background: item.color }"></i>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </li>
          </ul>
        </article>

        <article class="chart-box">
          <header class="chart-box-head">
            <h4>出金抽数分布<small>单位：抽</small></h4>
            <ul class="legend">
              <li><i :style="{ background: PITY_EARLY }"></i>≤ 40</li>
              <li><i :style="{ background: PITY_MID }"></i>41 – 65</li>
              <li><i :style="{ background: PITY_LATE }"></i>&gt; 65</li>
              <li><i class="legend-dashed"></i>当前已垫</li>
            </ul>
          </header>
          <VChart
            class="detail-chart"
            :style="{ height: `${barChartHeight}px` }"
            :init-options="chartInitOptions"
            :option="option"
            autoresize
          />
        </article>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TitleComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { PoolAnalyzeItem } from '../api/records'
import { getPoolFiveStarCount } from '../utils/poolStats'
import {
  CHART_AXIS_LINE,
  CHART_CYAN,
  CHART_GOLD,
  CHART_INK,
  CHART_INK_SOFT,
  CHART_PANEL,
  CHART_PINK,
  CHART_RED,
  CHART_UNKNOWN,
  chartAxisLabel,
  chartSplitLine,
  chartTextStyle,
  chartTooltipStyle,
  linearGradient
} from '../utils/chartTheme'

use([SVGRenderer, BarChart, PieChart, GridComponent, TitleComponent, TooltipComponent])

const props = defineProps<{
  pool: PoolAnalyzeItem
  poolLabel: string
}>()

const chartInitOptions = { renderer: 'svg' as const }

const isPoolOne = computed(() => props.pool.poolType === 1)

// 出金越早越好：青 = 早出，金 = 中段，红 = 接近保底
const PITY_EARLY = CHART_CYAN
const PITY_MID = CHART_GOLD
const PITY_LATE = CHART_RED

const PITY_GRADIENT_START: Record<string, string> = {
  [PITY_EARLY]: 'rgba(134, 219, 233, 0.3)',
  [PITY_MID]: 'rgba(237, 200, 114, 0.3)',
  [PITY_LATE]: 'rgba(240, 96, 110, 0.3)'
}

const metrics = computed(() => {
  const { data } = props.pool
  const list = [
    { label: '总抽数', value: String(data.total), tone: '' },
    { label: '五星', value: String(getPoolFiveStarCount(props.pool)), tone: '' },
    { label: '平均出金', value: data.avgPity, tone: '' }
  ]

  if (isPoolOne.value) {
    list.push({ label: '平均 UP 抽数', value: data.avgUp, tone: '' })
  }

  list.push(
    { label: 'UP 率', value: data.upRate, tone: '' },
    { label: '当前已垫', value: String(data.已垫), tone: 'tone-current' }
  )
  return list
})

// is_up 为三态，null 单独计为未知，不并入“歪”
const upBreakdown = computed(() => {
  const list = props.pool.data.pityList
  return [
    { label: '限定', color: PITY_EARLY, count: list.filter((item) => item.isUp === true).length },
    { label: '歪', color: PITY_LATE, count: list.filter((item) => item.isUp === false).length },
    { label: '未知', color: CHART_UNKNOWN, count: list.filter((item) => item.isUp === null).length }
  ]
})

const ringOption = computed(() => {
  const list = props.pool.data.pityList
  const upCount = list.filter((item) => item.isUp === true).length
  const data = list.map((item, index) => {
    const color =
      item.isUp === true ? PITY_EARLY : item.isUp === false ? PITY_LATE : CHART_UNKNOWN
    return {
      value: 1,
      name: item.name || `五星 ${index + 1}`,
      itemStyle: { color },
      pity: item.count,
      isUp: item.isUp
    }
  })

  return {
    textStyle: chartTextStyle,
    title: {
      text: String(upCount),
      subtext: `限定 / 共 ${list.length}`,
      left: 'center',
      top: 'middle',
      itemGap: 4,
      textStyle: {
        fontSize: 34,
        fontWeight: 600,
        color: CHART_INK
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 500,
        color: CHART_INK_SOFT
      }
    },
    tooltip: {
      ...chartTooltipStyle,
      trigger: 'item',
      formatter: (params: {
        name: string
        data: { pity: number; isUp: boolean | null }
      }) => {
        const tag =
          params.data.isUp === true ? '限定' : params.data.isUp === false ? '歪' : '未知'
        return `<b>${params.name}</b><br/>出金抽数：${params.data.pity}<br/>${tag}`
      }
    },
    series: [
      {
        name: '五星',
        type: 'pie',
        radius: ['44%', '64%'],
        clockwise: true,
        startAngle: 90,
        padAngle: 1.5,
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 2,
          borderColor: CHART_PANEL,
          borderWidth: 2
        },
        emphasis: {
          scale: true,
          scaleSize: 6
        },
        label: {
          show: list.length <= 16,
          formatter: '{b}',
          fontSize: 11,
          fontWeight: 500,
          color: CHART_INK_SOFT
        },
        labelLine: {
          show: list.length <= 16,
          length: 8,
          length2: 8,
          lineStyle: { color: CHART_AXIS_LINE }
        },
        data
      }
    ]
  }
})

function getPityColor(count: number) {
  if (count <= 40) {
    return PITY_EARLY
  }

  if (count <= 65) {
    return PITY_MID
  }

  return PITY_LATE
}

function getBarColor(count: number) {
  const color = getPityColor(count)
  return linearGradient(PITY_GRADIENT_START[color] ?? color, color, true)
}

const detailBarItems = computed(() => {
  const currentPity = props.pool.data.已垫
  const currentPityItem = {
    value: currentPity,
    name: '?',
    isUp: null as boolean | null,
    isCurrentPity: true,
    itemStyle: {
      color: 'rgba(255, 255, 255, 0.03)',
      borderColor: getPityColor(currentPity),
      borderType: 'dashed' as const,
      borderWidth: 1.5,
      borderRadius: [0, 2, 2, 0]
    }
  }

  const historyItems = props.pool.data.pityList.map((item, index) => ({
    value: item.count,
    name: item.name || `未命名五星 ${index + 1}`,
    isUp: item.isUp,
    isCurrentPity: false,
    itemStyle: {
      color: getBarColor(item.count),
      borderRadius: [0, 2, 2, 0]
    }
  }))

  return [...historyItems, currentPityItem]
})

// 每根柱子约 30px，避免五星多时挤在固定高度里
const barChartHeight = computed(() => Math.max(320, detailBarItems.value.length * 30 + 60))

const option = computed(() => {
  const items = detailBarItems.value

  return {
    textStyle: chartTextStyle,
    tooltip: {
      ...chartTooltipStyle,
      trigger: 'item',
      formatter: (params: {
        name: string
        data: { value: number; isUp: boolean | null; isCurrentPity: boolean }
      }) => {
        if (params.data.isCurrentPity) {
          return `<b>当前已垫</b><br/>抽数：${params.data.value}`
        }

        const tag =
          params.data.isUp === true ? '限定' : params.data.isUp === false ? '歪' : '未知'
        return `<b>${params.name}</b><br/>出金抽数：${params.data.value}<br/>${tag}`
      }
    },
    grid: {
      left: 8,
      right: 64,
      top: 24,
      bottom: 8,
      containLabel: true
    },
    xAxis: {
      type: 'value',
      position: 'top',
      axisLabel: chartAxisLabel,
      splitLine: chartSplitLine
    },
    yAxis: {
      type: 'category',
      axisTick: { show: false },
      axisLine: { lineStyle: { color: CHART_AXIS_LINE } },
      axisLabel: {
        interval: 0,
        fontSize: 12,
        fontWeight: 500,
        color: CHART_INK_SOFT
      },
      data: items.map((item) => item.name)
    },
    series: [
      {
        name: '出金抽数',
        type: 'bar',
        barMaxWidth: 14,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(214, 190, 235, 0.05)',
          borderRadius: [0, 2, 2, 0]
        },
        label: {
          show: true,
          position: 'right',
          distance: 8,
          formatter: ({
            data
          }: {
            data: { value: number; isUp: boolean | null; isCurrentPity: boolean }
          }) => {
            if (data.isCurrentPity) {
              return `{v|${data.value}} {cur|已垫}`
            }

            return data.isUp === false ? `{v|${data.value}} {miss|歪}` : `{v|${data.value}}`
          },
          rich: {
            v: { fontSize: 13, fontWeight: 600, color: CHART_INK },
            miss: {
              fontSize: 11,
              fontWeight: 600,
              color: CHART_RED,
              backgroundColor: 'rgba(240, 96, 110, 0.16)',
              borderRadius: 2,
              padding: [2, 5]
            },
            cur: {
              fontSize: 11,
              fontWeight: 600,
              color: CHART_PINK,
              backgroundColor: 'rgba(244, 166, 200, 0.14)',
              borderRadius: 2,
              padding: [2, 5]
            }
          }
        },
        data: items
      }
    ]
  }
})
</script>

<style scoped>
.detail-panel {
  position: relative;
  /* clip 不创建滚动容器，保证环形图的 sticky 相对视口生效 */
  overflow: clip;
  padding: 28px 28px 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
}

/* 取原画左侧的黑发角色，只在右上角隐约露出，不干扰图表阅读 */
.detail-art {
  position: absolute;
  inset: 0 0 auto auto;
  width: min(46%, 560px);
  height: 300px;
  background: url('/images/pool-detail-bg.jpg') 0% 29% / 340% auto no-repeat;
  opacity: 0.3;
  mask-image: radial-gradient(ellipse at 70% 20%, #000 10%, transparent 68%);
  pointer-events: none;
}

.detail-content {
  position: relative;
}

.detail-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px 16px;
}

h3 {
  color: var(--text);
  font-size: 26px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.detail-note {
  color: var(--text-soft);
  font-size: 14px;
}

/* 指标排成一行台账，用竖线分隔，不再各自成卡片 */
.metric-row {
  display: flex;
  flex-wrap: wrap;
  gap: 18px 0;
  margin: 24px 0 0;
  padding: 0 0 24px;
  border-bottom: 1px solid var(--line);
}

.metric {
  min-width: 124px;
  padding: 0 28px;
  border-left: 1px solid var(--line);
}

.metric:first-child {
  padding-left: 0;
  border-left: 0;
}

.metric dt {
  color: var(--text-soft);
  font-size: 13px;
}

.metric dd {
  margin: 2px 0 0;
  color: var(--text);
  font-size: 30px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

/* 当前已垫尚未出金，与图表里的虚线柱保持同一种表达 */
.metric.tone-current dd {
  color: var(--pink);
  text-decoration: underline dashed 1.5px;
  text-underline-offset: 7px;
}

.chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 0 36px;
  align-items: start;
  margin-top: 24px;
}

.chart-grid.with-ring {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.chart-box {
  min-width: 0;
}

.chart-box-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 14px;
  margin-bottom: 4px;
}

.chart-box-sticky {
  position: sticky;
  top: 20px;
}

h4 {
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
}

h4 small {
  margin-left: 10px;
  color: var(--text-faint);
  font-size: 12px;
  font-weight: 400;
}

.up-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: 4px 0 10px;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.up-breakdown li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 0 0 16px;
  border-left: 1px solid var(--line);
  color: var(--text-soft);
  font-size: 13px;
}

.up-breakdown li:first-child {
  padding-left: 0;
  border-left: 0;
}

.up-breakdown span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.up-breakdown i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.up-breakdown strong {
  color: var(--text);
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
  font-variant-numeric: tabular-nums;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text-soft);
  font-size: 12px;
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.legend i.legend-dashed {
  border: 1.5px dashed var(--pink);
}

.detail-chart {
  width: 100%;
  min-height: 320px;
}

.detail-chart-ring {
  height: 340px;
}

@media (max-width: 960px) {
  .chart-grid.with-ring {
    grid-template-columns: minmax(0, 1fr);
    row-gap: 24px;
  }

  .chart-box-sticky {
    position: static;
  }
}

@media (max-width: 720px) {
  .detail-panel {
    padding: 20px 16px 14px;
  }

  h3 {
    font-size: 22px;
  }

  .detail-art {
    width: 80%;
    height: 220px;
    opacity: 0.28;
  }

  .metric-row {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 0;
  }

  .metric,
  .metric:first-child {
    min-width: 0;
    padding: 0 0 0 14px;
    border-left: 1px solid var(--line);
  }

  .metric dd {
    font-size: 24px;
  }

  .detail-chart-ring {
    min-height: 0;
    height: 280px;
  }
}
</style>
