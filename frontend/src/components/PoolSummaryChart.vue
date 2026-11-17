<template>
  <section class="overview">
    <header class="overview-head">
      <h3>各卡池抽数与五星</h3>
      <ul class="overview-legend">
        <li><i class="swatch swatch-pink"></i>总抽数</li>
        <li><i class="swatch swatch-cyan"></i>五星数</li>
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
  CHART_CYAN,
  CHART_INK_SOFT,
  CHART_PINK,
  CYAN_GRADIENT,
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
      shadowStyle: { color: 'rgba(214, 190, 235, 0.07)' }
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
      color: CHART_INK_SOFT,
      fontWeight: 500,
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
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: CHART_PINK, fontWeight: 600, fontSize: 13 },
      data: props.pools.map((item) => item.data.total)
    },
    {
      name: '五星数',
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 34,
      itemStyle: {
        color: linearGradient(CYAN_GRADIENT[0], CYAN_GRADIENT[1]),
        borderRadius: [3, 3, 0, 0]
      },
      label: { show: true, position: 'top', color: CHART_CYAN, fontWeight: 600, fontSize: 13 },
      data: props.pools.map((item) => getPoolFiveStarCount(item))
    }
  ]
}))
</script>

<style scoped>
.overview {
  min-width: 0;
  padding: 22px 24px 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--panel);
}

.overview-head {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px 16px;
}

h3 {
  color: var(--text);
  font-size: 16px;
  font-weight: 600;
}

.overview-legend {
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  color: var(--text-soft);
  font-size: 13px;
}

.overview-legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.swatch-pink {
  background: var(--pink);
}

.swatch-cyan {
  background: var(--cyan);
}

.chart {
  width: 100%;
  height: 340px;
}
</style>
