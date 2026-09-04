// 읽음 활동 캘린더 — GET /papers/reading-status/calendar?year=&month=
//
// 메인 페이지의 미니 캘린더 + "월간 기록 요약"이 쓰는 내 읽음 기록.
// 예전에는 Main.tsx 안에 mockActivity 상수와 "5편 / 5편 / 6일" 이 하드코딩돼 있어서
// 갓 가입한 계정에도 남의 기록처럼 보이는 값이 떠 있었다.
//
// 실제 응답 형태:
//   { year: 2026, month: 9, days: [...], readingCount: 0, completedCount: 0, streak: 0 }
// days 안쪽 항목 형태는 아직 기록이 없어(빈 배열) 확인 못 했으므로
// { date, status } / { date, readingCount, completedCount } 양쪽 다 받아들이게 해뒀다.

import { getToken } from './auth'

export type DayActivity = 'reading' | 'done'

// 'YYYY-MM-DD' → 그 날의 활동. 완료가 있으면 완료가 우선한다.
export type CalendarMap = Record<string, DayActivity>

export type ReadingCalendar = {
  days: CalendarMap
  readingCount: number      // 이 달 읽는 중 편수
  completedCount: number    // 이 달 완독 편수
  streak: number            // 연속 기록 일수
}

export const EMPTY_CALENDAR: ReadingCalendar = {
  days: {}, readingCount: 0, completedCount: 0, streak: 0,
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

export function dateKey(year: number, month0: number, day: number): string {
  return `${year}-${String(month0 + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/* 비로그인이거나 실패하면 빈 값. 목데이터로 채우지 않는다. */
export async function fetchReadingCalendar(year: number, month0: number): Promise<ReadingCalendar> {
  if (!getToken()) return EMPTY_CALENDAR

  try {
    const res = await fetch(
      `/api/papers/reading-status/calendar?year=${year}&month=${month0 + 1}`,
      { headers: authHeaders() },
    )
    if (!res.ok) {
      console.error('읽음 캘린더 불러오기 실패:', res.status, await res.text())
      return EMPTY_CALENDAR
    }
    return parseCalendar(await res.json(), year, month0)
  } catch (e) {
    console.error('읽음 캘린더 요청 오류:', e)
    return EMPTY_CALENDAR
  }
}

/* ───────── 파싱 ───────── */

// 'completed' | 'complete' | 'done' | 'end' → done, 'reading' | 'ing' → reading
function toActivity(value: unknown): DayActivity | null {
  if (typeof value !== 'string') return null
  const v = value.toLowerCase()
  if (v.includes('complet') || v.includes('done') || v.includes('end')) return 'done'
  if (v.includes('read') || v.includes('ing')) return 'reading'
  return null
}

/* 날짜 값을 'YYYY-MM-DD' 로 정규화.
   ISO 문자열('2026-09-03T…')은 앞 10자리를, 일자 숫자(3)는 조회한 연·월과 합쳐서 쓴다. */
function toDateKey(value: unknown, year: number, month0: number): string | null {
  if (typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 31) {
    return dateKey(year, month0, value)
  }
  if (typeof value === 'string') {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
    const day = Number(value)
    if (Number.isInteger(day) && day >= 1 && day <= 31) return dateKey(year, month0, day)
  }
  return null
}

const DATE_FIELDS = ['date', 'day', 'readAt', 'readDate', 'readingDate', 'completedAt', 'createdAt', 'updatedAt']
const STATUS_FIELDS = ['status', 'readingStatus', 'type', 'state', 'activity']

// 완료가 읽는 중을 덮어쓴다(같은 날 둘 다 있으면 완료로 표시)
function put(map: CalendarMap, key: string, activity: DayActivity): void {
  if (activity === 'done' || !map[key]) map[key] = activity
}

function num(source: Record<string, unknown>, ...names: string[]): number {
  for (const name of names) {
    const value = source[name]
    if (typeof value === 'number' && !Number.isNaN(value)) return value
  }
  return 0
}

function parseEntry(raw: unknown, year: number, month0: number, map: CalendarMap): void {
  if (!raw || typeof raw !== 'object') return
  const r = raw as Record<string, unknown>

  const key = DATE_FIELDS.map(f => toDateKey(r[f], year, month0)).find(Boolean)
  if (!key) return

  // 1) 상태 문자열이 있는 형태 — { date, readingStatus: 'completed' }
  for (const field of STATUS_FIELDS) {
    const activity = toActivity(r[field])
    if (activity) {
      put(map, key, activity)
      return
    }
  }

  // 2) 건수로 오는 형태 — { date, readingCount: 2, completedCount: 1 }
  if (num(r, 'completedCount', 'completed', 'complete', 'done') > 0) put(map, key, 'done')
  else if (num(r, 'readingCount', 'reading') > 0) put(map, key, 'reading')
}

export function parseCalendar(json: unknown, year: number, month0: number): ReadingCalendar {
  if (!json || typeof json !== 'object') return EMPTY_CALENDAR
  const root = json as Record<string, unknown>

  const days: CalendarMap = {}
  // 실제 응답은 days. 나머지는 형태가 바뀌었을 때를 대비한 대안.
  const container = root.days ?? root.data ?? root.calendar ?? root.items ?? (Array.isArray(json) ? json : null)

  if (Array.isArray(container)) {
    container.forEach(entry => parseEntry(entry, year, month0, days))
  } else if (container && typeof container === 'object') {
    // { '2026-09-03': 'completed', ... } 처럼 날짜를 키로 주는 형태
    for (const [rawKey, rawValue] of Object.entries(container as Record<string, unknown>)) {
      const key = toDateKey(rawKey, year, month0)
      if (!key) continue
      const activity = toActivity(rawValue)
      if (activity) put(days, key, activity)
      else if (rawValue && typeof rawValue === 'object') {
        parseEntry({ date: key, ...(rawValue as Record<string, unknown>) }, year, month0, days)
      }
    }
  }

  return {
    days,
    readingCount: num(root, 'readingCount', 'reading'),
    completedCount: num(root, 'completedCount', 'completed'),
    streak: num(root, 'streak', 'streakDays'),
  }
}
