<template>
  <section class="detail-panel">
    <div class="detail-art" aria-hidden="true"></div>

    <div class="detail-content">
      <header class="detail-header">
        <div>
          <p class="detail-eyebrow">单卡池详情</p>
          <h3>{{ poolLabel }}</h3>
        </div>
        <p class="detail-note">共记录 {{ pool.data.pityList.length }} 次五星</p>
      </header>

      <dl class="metric-grid">
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
              <i :style="{ background: item.color }"></i>
              <span>{{ item.label }}</span>
              <strong>{{ item.count }}</strong>
            </li>
          </ul>
        </article>

        <article class="chart-box">
          <header class="chart-box-head">
            <h4>出金抽数分布<small>单位：抽</small></h4>
            <ul class="legend">
              <li><i :style="{ background: LIGHT_GREEN }"></i>≤ 40</li>
              <li><i :style="{ background: LEMON_YELLOW }"></i>41 – 65</li>
              <li><i :style="{ background: ROSE_RED }"></i>&gt; 65</li>
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
  CHART_INK,
  CHART_INK_SOFT,
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

const LIGHT_GREEN = '#7fd3a6'
const LEMON_YELLOW = '#f5d56a'
const ROSE_RED = '#f07d9c'
const UNKNOWN_GRAY = '#c9ccd8'

const PITY_GRADIENT_START: Record<string, string> = {
  [LIGHT_GREEN]: '#c9f0da',
  [LEMON_YELLOW]: '#fbedb3',
  [ROSE_RED]: '#fcc6d5'
}

const metrics = computed(() => {
  const { data } = props.pool
  const list = [
    { label: '总抽数', value: String(data.total), tone: 'tone-pink' },
    { label: '五星', value: String(getPoolFiveStarCount(props.pool)), tone: 'tone-lilac' },
    { label: '平均出金', value: data.avgPity, tone: '' }
  ]

  if (isPoolOne.value) {
    list.push({ label: '平均 UP 抽数', value: data.avgUp, tone: '' })
  }

  list.push(
    { label: 'UP 率', value: data.upRate, tone: '' },
    { label: '当前已垫', value: String(data.已垫), tone: 'tone-outline' }
  )
  return list
})

// is_up 为三态，null 单独计为未知，不并入“歪”
const upBreakdown = computed(() => {
  const list = props.pool.data.pityList
  return [
    { label: '限定', color: LIGHT_GREEN, count: list.filter((item) => item.isUp === true).length },
    { label: '歪', color: ROSE_RED, count: list.filter((item) => item.isUp === false).length },
    { label: '未知', color: UNKNOWN_GRAY, count: list.filter((item) => item.isUp === null).length }
  ]
})

const ringOption = computed(() => {
  const list = props.pool.data.pityList
  const upCount = list.filter((item) => item.isUp === true).length
  const data = list.map((item, index) => {
    const color =
      item.isUp === true ? LIGHT_GREEN : item.isUp === false ? ROSE_RED : UNKNOWN_GRAY
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
        fontSize: 30,
        fontWeight: 800,
        color: '#c94a77'
      },
      subtextStyle: {
        fontSize: 12,
        fontWeight: 600,
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
          borderRadius: 6,
          borderColor: '#fff',
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
          fontWeight: 600,
          color: CHART_INK
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
    return LIGHT_GREEN
  }

  if (count <= 65) {
    return LEMON_YELLOW
  }

  return ROSE_RED
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
      color: 'rgba(255, 255, 255, 0.6)',
      borderColor: getPityColor(currentPity),
      borderType: 'dashed' as const,
      borderWidth: 2,
      borderRadius: [0, 8, 8, 0]
    }
  }

  const historyItems = props.pool.data.pityList.map((item, index) => ({
    value: item.count,
    name: item.name || `未命名五星 ${index + 1}`,
    isUp: item.isUp,
    isCurrentPity: false,
    itemStyle: {
      color: getBarColor(item.count),
      borderRadius: [0, 8, 8, 0]
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
        fontWeight: 600,
        color: '#5e4452'
      },
      data: items.map((item) => item.name)
    },
    series: [
      {
        name: '出金抽数',
        type: 'bar',
        barMaxWidth: 18,
        showBackground: true,
        backgroundStyle: {
          color: 'rgba(253, 208, 224, 0.18)',
          borderRadius: [0, 8, 8, 0]
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
            v: { fontSize: 12, fontWeight: 700, color: CHART_INK },
            miss: {
              fontSize: 11,
              fontWeight: 700,
              color: '#d6456b',
              backgroundColor: 'rgba(240, 125, 156, 0.16)',
              borderRadius: 6,
              padding: [2, 5]
            },
            cur: {
              fontSize: 11,
              fontWeight: 700,
              color: '#a3375e',
              backgroundColor: 'rgba(253, 208, 224, 0.6)',
              borderRadius: 6,
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
  /* clip 不创建滚动容器，保证环形图卡片的 sticky 相对视口生效 */
  overflow: clip;
  margin-top: 18px;
  padding: 26px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 240, 246, 0.94) 100%);
  box-shadow: var(--shadow-md);
}

/* 背景图只铺在右上角并向左下淡出，避免干扰图表阅读 */
.detail-art {
  position: absolute;
  inset: 0 0 auto auto;
  width: min(62%, 760px);
  height: 360px;
  background: url('/images/pool-detail-bg.jpg') center 28% / cover no-repeat;
  opacity: 0.32;
  mask-image: radial-gradient(ellipse at 78% 18%, #000 18%, transparent 70%);
  pointer-events: none;
}

.detail-content {
  position: relative;
  z-index: 1;
}

.detail-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.detail-eyebrow {
  margin-bottom: 4px;
  color: var(--pink-500);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
}

h3 {
  color: var(--ink-900);
  font-size: 26px;
  font-weight: 800;
  letter-spacing: 0.02em;
}

.detail-note {
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid var(--border);
  color: var(--ink-500);
  font-size: 13px;
  font-weight: 600;
  backdrop-filter: blur(6px);
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  gap: 12px;
  margin: 0 0 18px;
}

.metric {
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
}

.metric dt {
  color: var(--ink-500);
  font-size: 12px;
  font-weight: 600;
}

.metric dd {
  margin: 4px 0 0;
  color: var(--ink-900);
  font-size: 24px;
  font-weight: 800;
  line-height: 1.15;
  font-variant-numeric: tabular-nums;
}

.metric.tone-pink {
  border-color: transparent;
  background: linear-gradient(135deg, #f592b5 0%, #e2628f 100%);
  box-shadow: var(--shadow-pink);
}

.metric.tone-pink dt,
.metric.tone-pink dd {
  color: #fff;
}

.metric.tone-lilac {
  background: linear-gradient(135deg, rgba(236, 226, 250, 0.95) 0%, rgba(220, 203, 243, 0.9) 100%);
  border-color: rgba(166, 139, 212, 0.35);
}

.metric.tone-lilac dd {
  color: #6f53a3;
}

.metric.tone-outline {
  border-style: dashed;
  border-color: var(--border-strong);
}

.metric.tone-outline dd {
  color: var(--pink-600);
}

.chart-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}

.chart-grid.with-ring {
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
}

.chart-box {
  min-width: 0;
  padding: 18px 18px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(10px);
}

.chart-box-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 14px;
  margin-bottom: 4px;
}

.chart-box-sticky {
  position: sticky;
  top: 20px;
}

h4 {
  margin: 0;
  color: var(--ink-900);
  font-size: 16px;
  font-weight: 700;
}

h4 small {
  margin-left: 8px;
  color: var(--ink-300);
  font-size: 12px;
  font-weight: 600;
}

.up-breakdown {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin: 4px 0 10px;
  padding: 0;
  list-style: none;
}

.up-breakdown li {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 6px;
  border-radius: var(--radius-sm);
  background: var(--pink-50);
  color: var(--ink-500);
  font-size: 12px;
  font-weight: 600;
}

.up-breakdown i {
  width: 22px;
  height: 4px;
  margin-bottom: 4px;
  border-radius: 999px;
}

.up-breakdown strong {
  color: var(--ink-900);
  font-size: 20px;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ink-500);
  font-size: 12px;
  font-weight: 600;
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend i.legend-dashed {
  border: 1.5px dashed var(--pink-500);
  background: #fff;
}

.detail-chart {
  width: 100%;
  min-height: 320px;
}

.detail-chart-ring {
  height: 360px;
}

@media (max-width: 960px) {
  .chart-grid.with-ring {
    grid-template-columns: minmax(0, 1fr);
  }

  .chart-box-sticky {
    position: static;
  }
}

@media (max-width: 720px) {
  .detail-panel {
    padding: 18px;
  }

  .detail-header {
    flex-direction: column;
    align-items: flex-start;
  }

  h3 {
    font-size: 22px;
  }

  .detail-art {
    width: 100%;
    height: 240px;
  }

  .detail-chart-ring {
    min-height: 0;
    height: 280px;
  }
}
</style>
