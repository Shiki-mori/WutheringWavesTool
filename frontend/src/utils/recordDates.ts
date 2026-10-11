import type { RecordItem } from '../api/records'

const recordDateFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
})

export function getLatestRecordDate(
  records: readonly Pick<RecordItem, 'time'>[],
  monthsToAdd = 0
): string | null {
  let latestTime = -Infinity

  for (const record of records) {
    if (!record.time) {
      continue
    }

    const time = record.time.trim().replace(' ', 'T')
    // 无时区的数据库时间按北京时间解释，ISO 时间保留自带的时区。
    const zonedTime = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(time) ? time : `${time}+08:00`
    const timestamp = Date.parse(zonedTime)
    if (Number.isFinite(timestamp) && timestamp > latestTime) {
      latestTime = timestamp
    }
  }

  if (!Number.isFinite(latestTime)) {
    return null
  }

  const parts = recordDateFormatter.formatToParts(new Date(latestTime))
  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = parts.find((part) => part.type === 'day')?.value
  // 只调整月份和跨年的年份，保留原日期，不按目标月份的天数修正。
  const shiftedMonth = month - 1 + monthsToAdd
  const shiftedYear = year + Math.floor(shiftedMonth / 12)
  const displayMonth = String((shiftedMonth % 12) + 1).padStart(2, '0')
  return `${shiftedYear}年${displayMonth}月${day}日`
}
