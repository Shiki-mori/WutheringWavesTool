<template>
  <section class="chart-panel">
    <VChart class="chart" :init-options="chartInitOptions" :option="option" autoresize />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { PoolAnalyzeItem } from '../api/records'
import { getPoolLabel } from '../utils/poolLabels'
import { getPoolFiveStarCount } from '../utils/poolStats'

use([SVGRenderer, BarChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

const props = defineProps<{
  pools: PoolAnalyzeItem[]
}>()

const chartInitOptions = { renderer: 'svg' as const }

const option = computed(() => ({
  color: ['#d7799f', '#a58bbd'],
  textStyle: {
    fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
    fontSize: 13,
    fontWeight: 500,
    color: '#49343f'
  },
  title: {
    text: '卡池抽卡总览',
    textStyle: {
      fontSize: 18,
      fontWeight: 700,
      color: '#49343f'
    }
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    bottom: 0
  },
  grid: {
    left: 64,
    right: 64,
    containLabel: true,
    top: 64,
    bottom: 64
  },
  xAxis: {
    type: 'category',
    axisTick: {
      alignWithLabel: true
    },
    axisLabel: {
      fontSize: 12,
      fontWeight: 600,
      color: '#49343f'
    },
    data: props.pools.map((item) => getPoolLabel(item.poolType))
  },
  yAxis: [
    {
      type: 'value',
      name: '总抽数',
      position: 'left',
      min: 0,
      minInterval: 1,
      axisLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#49343f'
      }
    },
    {
      type: 'value',
      name: '五星数',
      position: 'right',
      min: 0,
      minInterval: 1,
      splitLine: { show: false },
      axisLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#49343f'
      }
    }
  ],
  series: [
    {
      name: '总抽数',
      type: 'bar',
      yAxisIndex: 0,
      barMaxWidth: 42,
      data: props.pools.map((item) => item.data.total)
    },
    {
      name: '五星数',
      type: 'bar',
      yAxisIndex: 1,
      barMaxWidth: 42,
      data: props.pools.map((item) => getPoolFiveStarCount(item))
    }
  ]
}))
</script>

<style scoped>
.chart-panel {
  display: flex;
  min-width: 0;
  padding: 18px 18px 10px;
  min-height: 420px;
  border: 1px solid rgba(235, 199, 216, 0.75);
  border-radius: 24px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 244, 249, 0.92) 100%);
  box-shadow: 0 18px 30px rgba(100, 47, 71, 0.05);
}

.chart {
  flex: 1;
  width: 100%;
  height: auto;
  min-height: 420px;
}
</style>
