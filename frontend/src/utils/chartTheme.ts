export const CHART_FONT =
  '"Chakra Petch", "HarmonyOS Sans SC", "MiSans", "PingFang SC", "Noto Sans SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif'

// 与 style.css 中的配色保持一致（ECharts 无法直接读取 CSS 变量）
export const CHART_INK = '#f1e9f4'
export const CHART_INK_SOFT = '#b7a8c4'
export const CHART_INK_FAINT = '#8a7b95'
export const CHART_PANEL = '#1e1728'
export const CHART_GRID_LINE = 'rgba(214, 190, 235, 0.1)'
export const CHART_AXIS_LINE = 'rgba(214, 190, 235, 0.3)'

export const CHART_PINK = '#f4a6c8'
export const CHART_CYAN = '#86dbe9'
export const CHART_GOLD = '#edc872'
export const CHART_RED = '#f0606e'
export const CHART_UNKNOWN = '#6f6379'

export const PINK_GRADIENT = ['rgba(244, 166, 200, 0.35)', CHART_PINK] as const
export const CYAN_GRADIENT = ['rgba(134, 219, 233, 0.35)', CHART_CYAN] as const

export function linearGradient(from: string, to: string, horizontal = false) {
  return {
    type: 'linear' as const,
    x: 0,
    y: horizontal ? 0 : 1,
    x2: horizontal ? 1 : 0,
    y2: 0,
    colorStops: [
      { offset: 0, color: from },
      { offset: 1, color: to }
    ]
  }
}

export const chartTextStyle = {
  fontFamily: CHART_FONT,
  fontSize: 12,
  fontWeight: 500,
  color: CHART_INK
}

export const chartTooltipStyle = {
  backgroundColor: '#2c2239',
  borderColor: CHART_AXIS_LINE,
  borderWidth: 1,
  padding: [10, 14],
  textStyle: {
    fontFamily: CHART_FONT,
    fontSize: 13,
    color: CHART_INK
  },
  extraCssText: 'border-radius: 4px; box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);'
}

export const chartAxisLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: CHART_INK_FAINT
}

export const chartSplitLine = {
  lineStyle: {
    color: CHART_GRID_LINE,
    type: 'solid' as const
  }
}
