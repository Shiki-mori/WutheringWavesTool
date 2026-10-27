export const CHART_FONT =
  '"HarmonyOS Sans SC", "MiSans", "PingFang SC", "Noto Sans SC", "Microsoft YaHei", sans-serif'

export const CHART_INK = '#3b2532'
export const CHART_INK_SOFT = '#8b6f7d'
export const CHART_GRID_LINE = 'rgba(226, 98, 143, 0.14)'
export const CHART_AXIS_LINE = 'rgba(201, 74, 119, 0.28)'

export const PINK_GRADIENT = ['#f8aac6', '#e2628f'] as const
export const LILAC_GRADIENT = ['#dccbf3', '#a68bd4'] as const

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
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  borderColor: 'rgba(226, 98, 143, 0.3)',
  borderWidth: 1,
  padding: [10, 14],
  textStyle: {
    fontFamily: CHART_FONT,
    fontSize: 13,
    color: CHART_INK
  },
  extraCssText: 'border-radius: 12px; box-shadow: 0 10px 28px rgba(163, 55, 94, 0.16);'
}

export const chartAxisLabel = {
  fontSize: 12,
  fontWeight: 500,
  color: CHART_INK_SOFT
}

export const chartSplitLine = {
  lineStyle: {
    color: CHART_GRID_LINE,
    type: 'dashed' as const
  }
}
