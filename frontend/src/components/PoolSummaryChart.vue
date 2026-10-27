<template>
  <section class="chart-card">
    <header class="chart-head">
      <div>
        <p class="chart-kicker">Overview</p>
        <h3>卡池抽卡总览</h3>
      </div>
      <ul class="chart-legend">
        <li><i class="dot dot-pink"></i>总抽数</li>
        <li><i class="dot dot-lilac"></i>五星数</li>
      </ul>
    </header>
    <VChart class="chart" :init-options="chartInitOptions" :option="option" autoresize />
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import type { PoolAnalyzeItem } from '../api/records'
import { getPoolLabel } from '../utils/poolLabels'
import { getPoolFiveStarCount } from '../utils/poolStats'
import {
  CHART_AXIS_LINE,
  CHART_INK_SOFT,
  LILAC_GRADIENT,
  PINK_GRADIENT,
  chartAxisLabel,
  chartSplitLine,
  chartTextStyle,
  chartTooltipStyle,
  linearGradient
} from '../utils/chartTheme'

use([SVGRenderer, BarChart, GridComponent, TooltipComponent])

const props = defineProps<{
  pools: PoolAnalyzeItem[]
}>()

const chartInitOptions = { renderer: 'svg' as const }

const narrowQuery = window.matchMedia('(max-width: 720px)')
const isNarrow = ref(narrowQuery.matches)
const onNarrowChange = (event: MediaQueryListEvent) => {
  isNarrow.value = event.matches
}

onMounted(() => narrowQuery.addEventListener('change', onNarrowChange))
onBeforeUnmount(() => narrowQuery.removeEventListener('change', onNarrowChange))

const axisName = {
  color: CHART_INK_SOFT,
  fontSize: 12,
  fontWeight: 600,
  padding: [0, 0, 6, 0]
}

const option = computed(() => ({
  textStyle: chartTextStyle,
  tooltip: {
    ...chartTooltipStyle,
    trigger: 'axis',
    axisPointer: {
      type: 'shadow',
      shadowStyle: { color: 'rgba(253, 208, 224, 0.32)' }
    }
  },
  grid: {
    left: 12,
    right: 12,
    top: 36,
    bottom: 8,
    containLabel: true
  },
  xAxis: {
    type: 'category',
    axisTick: { show: false },
    axisLine: { lineStyle: { color: CHART_AXIS_LINE } },
    axisLabel: {
      ...chartAxisLabel,
      color: '#5e4452',
      fontWeight: 600,
      margin: 14,
      interval: 0,
      lineHeight: 16,
      formatter: (label: string) =>
        isNarrow.value ? label.replace(/^(.{2}活动|常驻)/, '$1\n') : label
    },
    data: props.pools.map((item) => getPoolLabel(item.poolType))
  },
  yAxis: [
    {
      type: 'value',
      name: '总抽数',
      nameTextStyle: axisName,
      position: 'left',
      min: 0,
      minInterval: 1,
      axisLabel: chartAxisLabel,
      splitLine: chartSplitLine
    },
    {
      type: 'value',
      name: '五星数',
      nameTextStyle: axisName,
      position: 'right',
      min: 0,
      minInterval: 1,
      splitLine: { show: false },
      axisLabel: chartAxisLabel
    }
  ],
  series: [
    {
      name: '总抽数',
      type: 'bar',
      yAxisIndex: 0,
      barMaxWidth: 34,
      barGap: '30%',
      itemStyle: {
        color: linearGradient(PINK_GRADIENT[0], PINK_GRADIENT[1]),
        borderRadius: [10, 10, 4, 4]
      },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(226, 98, 143, 0.35)' } },
      label: { show: true, position: 'top', color: '#c94a77', fontWeight: 700, fontSize: 12 },
      data: props.pools.map((item) => item.data.total)
    },
    {
      name: '五星数',
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 34,
      itemStyle: {
        color: linearGradient(LILAC_GRADIENT[0], LILAC_GRADIENT[1]),
        borderRadius: [10, 10, 4, 4]
      },
      emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(166, 139, 212, 0.35)' } },
      label: { show: true, position: 'top', color: '#8a6dbd', fontWeight: 700, fontSize: 12 },
      data: props.pools.map((item) => getPoolFiveStarCount(item))
    }
  ]
}))
</script>

<style scoped>
.chart-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 22px 22px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
}

.chart-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}

.chart-kicker {
  color: var(--pink-500);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

h3 {
  margin-top: 2px;
  color: var(--ink-900);
  font-size: 18px;
  font-weight: 700;
}

.chart-legend {
  display: flex;
  gap: 14px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--ink-500);
  font-size: 13px;
  font-weight: 600;
}

.chart-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 4px;
}

.dot-pink {
  background: linear-gradient(180deg, #f8aac6, #e2628f);
}

.dot-lilac {
  background: linear-gradient(180deg, #dccbf3, #a68bd4);
}

.chart {
  flex: 1;
  width: 100%;
  min-height: 340px;
}
</style>
