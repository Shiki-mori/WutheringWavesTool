<template>
  <section class="detail-panel">
    <header class="detail-header">
      <div>
        <p class="detail-eyebrow">单卡池详情</p>
        <h3>{{ poolLabel }}</h3>
      </div>
      <div class="detail-metrics">
        <span>总抽数 {{ pool.data.total }}</span>
        <span>五星 {{ pool.data.fiveStar }}</span>
        <span>平均出金 {{ pool.data.avgPity }}</span>
        <span>UP率 {{ pool.data.upRate }}</span>
      </div>
    </header>

    <VChart class="detail-chart" :option="option" autoresize />
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
  pool: PoolAnalyzeItem
  poolLabel: string
}>()

function getPityColor(count: number) {
  if (count <= 40) {
    return '#2f9e44'
  }

  if (count <= 65) {
    return '#e0a106'
  }

  return '#d94841'
}

const option = computed(() => {
  const items = props.pool.data.pityList.map((item, index) => ({
    value: item.count,
    name: item.name || `未命名五星 ${index + 1}`,
    isUp: item.isUp,
    itemStyle: {
      color: getPityColor(item.count)
    }
  }))

  return {
    title: {
      text: '出金抽数分布'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: 140,
      right: 36,
      top: 64,
      bottom: 32
    },
    xAxis: {
      type: 'value',
      name: '抽数'
    },
    yAxis: {
      type: 'category',
      axisLabel: {
        interval: 0
      },
      data: items.map((item) => item.name)
    },
    series: [
      {
        name: '出金抽数',
        type: 'bar',
        barMaxWidth: 28,
        label: {
          show: true,
          position: 'right',
          formatter: ({ data }: { data: { value: number; isUp: boolean | null } }) =>
            data.isUp === false ? `${data.value} 歪` : `${data.value}`
        },
        data: items
      }
    ]
  }
})
</script>

<style scoped>
.detail-panel {
  margin-top: 20px;
  padding: 24px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top right, rgba(224, 161, 6, 0.12), transparent 24%),
    linear-gradient(180deg, #fffdfa 0%, #fff7ea 100%);
  border: 1px solid #efe1c7;
  box-shadow: 0 18px 30px rgba(52, 35, 12, 0.06);
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 16px;
}

.detail-eyebrow {
  margin: 0 0 6px;
  color: #9b6a24;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h3 {
  margin: 0;
  color: #2a2118;
  font-size: 24px;
}

.detail-metrics {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
  color: #6b6257;
  font-size: 14px;
}

.detail-metrics span {
  padding: 10px 12px;
  border: 1px solid rgba(223, 207, 178, 0.8);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
}

.detail-chart {
  width: 100%;
  min-height: 420px;
}

@media (max-width: 860px) {
  .detail-header {
    flex-direction: column;
  }

  .detail-metrics {
    justify-content: flex-start;
  }
}
</style>
