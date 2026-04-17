<template>
  <section class="detail-panel">
    <div class="detail-content">
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

      <VChart
        v-if="isPoolOne"
        class="detail-chart detail-chart-ring"
        :init-options="chartInitOptions"
        :option="ringOption"
        autoresize
      />
      <VChart class="detail-chart" :init-options="chartInitOptions" :option="option" autoresize />
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { SVGRenderer } from 'echarts/renderers'
import { BarChart, PieChart } from 'echarts/charts'
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import type { PoolAnalyzeItem } from '../api/records'

use([
  SVGRenderer,
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
])

const props = defineProps<{
  pool: PoolAnalyzeItem
  poolLabel: string
}>()

const chartInitOptions = { renderer: 'svg' as const }

const isPoolOne = computed(() => props.pool.poolType === 1)

const LIGHT_GREEN = '#8fd9a8'
const LEMON_YELLOW = '#f6e96b'
const ROSE_RED = '#f08aa1'
const UNKNOWN_GRAY = '#c7ccd6'

const ringOption = computed(() => {
  const list = props.pool.data.pityList
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
    // 文本字体
    textStyle: {
      fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: 13,
      fontWeight: 500,
      color: '#231a11'
    },
    title: {
      text: '五星 UP / 歪',
      textStyle: {
        fontSize: 18,
        fontWeight: 700,
        color: '#231a11'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: {
        name: string
        data: { pity: number; isUp: boolean | null }
      }) => {
        const tag =
          params.data.isUp === true ? '限定' : params.data.isUp === false ? '歪' : '未知'
        return `${params.name}<br/>出金抽数：${params.data.pity}<br/>${tag}`
      }
    },
    series: [
      {
        name: '五星',
        type: 'pie',
        radius: ['42%', '68%'],
        clockwise: true,
        startAngle: 90,
        avoidLabelOverlap: true,
        label: {
          show: list.length <= 16,
          formatter: '{b}',
          fontSize: 12,
          fontWeight: 600,
          color: '#231a11'
        },
        labelLine: {
          show: list.length <= 16
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

const detailBarItems = computed(() => {
  const currentPityItem = {
    value: props.pool.data.已垫,
    name: '?',
    isUp: null as boolean | null,
    isCurrentPity: true,
    itemStyle: {
      color: getPityColor(props.pool.data.已垫)
    }
  }

  const historyItems = props.pool.data.pityList.map((item, index) => ({
    value: item.count,
    name: item.name || `未命名五星 ${index + 1}`,
    isUp: item.isUp,
    isCurrentPity: false,
    itemStyle: {
      color: getPityColor(item.count)
    }
  }))

  return [currentPityItem, ...historyItems]
})

const option = computed(() => {
  const items = detailBarItems.value

  return {
    textStyle: {
      fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
      fontSize: 13,
      fontWeight: 500,
      color: '#231a11'
    },
    title: {
      text: '出金抽数分布',
      textStyle: {
        fontSize: 18,
        fontWeight: 700,
        color: '#231a11'
      }
    },
    tooltip: {
      trigger: 'item',
      formatter: (params: {
        name: string
        data: { value: number; isUp: boolean | null; isCurrentPity: boolean }
      }) => {
        if (params.data.isCurrentPity) {
          return `当前已垫<br/>抽数：${params.data.value}`
        }

        const tag =
          params.data.isUp === true ? '限定' : params.data.isUp === false ? '歪' : '未知'
        return `${params.name}<br/>出金抽数：${params.data.value}<br/>${tag}`
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
      name: '抽数',
      nameTextStyle: {
        fontSize: 13,
        fontWeight: 600,
        color: '#231a11'
      },
      axisLabel: {
        fontSize: 12,
        fontWeight: 600,
        color: '#231a11'
      }
    },
    yAxis: {
      type: 'category',
      inverse: true,
      axisLabel: {
        interval: 0,
        fontSize: 12,
        fontWeight: 600,
        color: '#231a11'
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
          fontSize: 12,
          fontWeight: 700,
          color: '#231a11',
          formatter: ({
            data
          }: {
            data: { value: number; isUp: boolean | null; isCurrentPity: boolean }
          }) => {
            if (data.isCurrentPity) {
              return `${data.value}`
            }

            return data.isUp === false ? `${data.value} 歪` : `${data.value}`
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
  overflow: hidden;
  margin-top: 20px;
  padding: 24px;
  border-radius: 26px;
  background:
    radial-gradient(circle at top right, rgba(224, 161, 6, 0.12), transparent 24%),
    linear-gradient(180deg, #fffdfa 0%, #fff7ea 100%);
  border: 1px solid #efe1c7;
  box-shadow: 0 18px 30px rgba(52, 35, 12, 0.06);
}

/* 背景图处理逻辑 */
.detail-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    /* linear-gradient(180deg, rgba(255, 252, 246, 0.4) 0%, rgba(255, 247, 234, 0.3) 100%), */
    linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.5) 100%),
    url('/images/pool-detail-bg.jpg');
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  /* background-blend-mode: screen; */
  background-blend-mode: normal;
  filter: saturate(1.2) brightness(1.15) contrast(1.00);
  /* 不透明度 */
  opacity: 0.70;
  pointer-events: none;
}

.detail-content {
  position: relative;
  z-index: 1;
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

.detail-chart-ring {
  min-height: 340px;
  margin-bottom: 12px;
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
