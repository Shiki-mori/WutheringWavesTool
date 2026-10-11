import type { PoolAnalyzeItem } from '../api/records'

export function getPoolFiveStarCount(pool: PoolAnalyzeItem): number {
  if (pool.poolType === 1) {
    // 角色活动池只计明确标记为 UP 的五星，未知状态不计入。
    return pool.data.pityList.filter((item) => item.isUp === true).length
  }

  return pool.data.fiveStar
}

export function getSummaryFiveStarCount(pools: readonly PoolAnalyzeItem[]): number {
  return pools.reduce((sum, pool) => {
    // 总览只统计活动角色 UP 与活动武器五星，排除两个常驻池。
    if (pool.poolType === 1 || pool.poolType === 2) {
      return sum + getPoolFiveStarCount(pool)
    }

    return sum
  }, 0)
}
