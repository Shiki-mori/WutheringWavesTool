import assert from 'node:assert/strict'
import test from 'node:test'
import type { PoolAnalyzeItem } from '../src/api/records.ts'
import { getPoolFiveStarCount, getSummaryFiveStarCount } from '../src/utils/poolStats.ts'

function makePool(poolType: number, states: Array<boolean | null>): PoolAnalyzeItem {
  return {
    poolType,
    totalRecords: states.length * 10,
    data: {
      total: states.length * 10,
      fiveStar: states.length,
      avgPity: '10.00',
      avgUp: '0.00',
      upRate: '0%',
      pityList: states.map((isUp) => ({ count: 10, name: '测试五星', isUp })),
      已垫: 0,
      upSeries: 0,
      notupSeries: 0
    }
  }
}

test('角色活动池只计 UP，非 UP 和未知状态不计入', () => {
  const pool = makePool(1, [true, false, null, true])
  assert.equal(getPoolFiveStarCount(pool), 2)
  assert.equal(pool.data.fiveStar, 4)
  assert.deepEqual(pool.data.pityList.map((item) => item.isUp), [true, false, null, true])
  assert.equal(getPoolFiveStarCount(makePool(1, [false, null])), 0)
})

test('单池图表的两个武器池仍计全部五星，不依赖 UP 标记', () => {
  for (const poolType of [2, 4]) {
    assert.equal(getPoolFiveStarCount(makePool(poolType, [true, false, null])), 3)
  }
})

test('总览只累加活动角色 UP 和活动武器五星，排除两个常驻池与未知卡池', () => {
  const pools = [
    makePool(1, [true, false, null, true]),
    makePool(2, [null, null]),
    makePool(3, [true, true, false]),
    makePool(4, [null]),
    makePool(99, [true])
  ]
  assert.equal(getSummaryFiveStarCount(pools), 4)
  assert.equal(getPoolFiveStarCount(pools[2]!), 3)
})

test('常驻武器五星不会增加五星总数', () => {
  const eventPools = [makePool(1, [true, false]), makePool(2, [null])]
  assert.equal(getSummaryFiveStarCount([...eventPools, makePool(4, [null, true, false])]), 2)
  assert.equal(getSummaryFiveStarCount([makePool(4, [null, null])]), 0)
})

test('空记录与零 UP 正确返回零', () => {
  assert.equal(getSummaryFiveStarCount([]), 0)
  assert.equal(getPoolFiveStarCount(makePool(1, [])), 0)
  assert.equal(getSummaryFiveStarCount([makePool(1, [false]), makePool(2, []), makePool(4, [])]), 0)
})
