const poolLabelMap: Record<number, string> = {
  1: '角色活动唤取',
  2: '武器活动唤取',
  3: '常驻角色',
  4: '常驻武器'
}

export const getPoolLabel = (poolType: number) => poolLabelMap[poolType] ?? `卡池 ${poolType}`
