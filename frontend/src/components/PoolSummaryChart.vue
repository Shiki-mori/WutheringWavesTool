<template>
  <section class="chart-panel">
    <VChart class="chart" :option="option" autoresize />
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { PoolAnalyzeItem } from '../api/records'

use([CanvasRenderer, BarChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent])

const props = defineProps<{
  pools: PoolAnalyzeItem[]
}>()

const option = computed(() => ({
  title: {
    text: '卡池抽卡总览'
  },
  tooltip: {
    trigger: 'axis'
  },
  legend: {
    bottom: 0
  },
  grid: {
    left: 48,
    right: 24,
    top: 64,
    bottom: 64
  },
  xAxis: {
    type: 'category',
    axisTick: {
      alignWithLabel: true
    },
    data: props.pools.map((item) => `卡池 ${item.poolType}`)
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '总抽数',
      type: 'bar',
      barMaxWidth: 42,
      data: props.pools.map((item) => item.data.total)
    },
    {
      name: '五星数',
      type: 'bar',
      barMaxWidth: 42,
      data: props.pools.map((item) => item.data.fiveStar)
    },
    {
      name: '已垫',
      type: 'bar',
      barMaxWidth: 42,
      data: props.pools.map((item) => item.data.已垫)
    }
  ]
}))
</script>

<style scoped>
.chart-panel {
  min-height: 420px;
  border-radius: 24px;
  background: #fff;
}

.chart {
  width: 100%;
  min-height: 420px;
}
</style>
