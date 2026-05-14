function toDate(value) {
  if (!value) return null
  if (value instanceof Date) return value
  if (typeof value === 'number' || typeof value === 'string') return new Date(value)
  if (value.$date) return new Date(value.$date)
  return null
}

function pad(number) {
  const text = String(number)
  return text[1] ? text : `0${text}`
}

function formatDateTime(value) {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hour = pad(date.getHours())
  const minute = pad(date.getMinutes())

  return `${year}-${month}-${day} ${hour}:${minute}`
}

function formatMonthDay(value) {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''

  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatFriendlyDate(value) {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`

  return formatMonthDay(date)
}

module.exports = {
  toDate,
  formatDateTime,
  formatMonthDay,
  formatFriendlyDate
}
