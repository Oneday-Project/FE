// 논문 읽음 상태(읽는 중 / 읽기 완료) 관리 — 서버 연동
//
//   GET  /papers/library?type=reading|completed             → 읽는 중 / 다 읽은 목록
//   POST /papers/paper/{arxivId}/reading-status/reading     → 일반 논문 읽는중 토글
//   POST /papers/paper/{arxivId}/reading-status/complete    → 일반 논문 읽기 완료
//   POST /papers/hai-papers/{id}/reading-status/reading     → 휴먼AI 논문 읽는중 토글
//   POST /papers/hai-papers/{id}/reading-status/complete    → 휴먼AI 논문 읽기 완료
//
// 논문 상세·목록·메인·마이페이지가 같은 상태를 구독하도록 여기서 모아 관리한다.

import { getToken } from './auth'

// 서버 status 값과 동일하게 맞춤 (reading / completed)
export type ReadStatus = 'reading' | 'completed'

export type SavedPaper = {
  arxivId: string
  title: string
  publishedDate?: string
  abstract?: string
  fields: string[]
}

export type ReadEntry = {
  status: ReadStatus
  savedAt: string
  paper: SavedPaper
}

export type ReadStatusMap = Record<string, ReadEntry>

let cache: ReadStatusMap = {}
let loaded = false
let loading: Promise<void> | null = null
/* 계정이 바뀔 때마다 올린다. 이전 계정으로 띄운 요청이 늦게 도착해도
   generation 이 달라서 캐시를 덮어쓰지 못한다. */
let generation = 0
const listeners = new Set<() => void>()

function emit(next: ReadStatusMap): void {
  cache = next
  listeners.forEach(listener => listener())
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/* GET /papers/library?type=reading|completed 항목
   { type: "paper"|"hai", id, title, publishedDate, tags[], isBookmark, readingStatus } */
type LibraryItem = {
  type?: string
  id?: string | number
  title?: string
  publishedDate?: string
  tags?: string[]
  readingStatus?: string
}

// 일반 논문은 arxivId(문자열), 휴먼AI는 "hai-{id}" 로 키를 통일 (목록 카드와 동일 규칙)
function keyOf(item: LibraryItem): string | null {
  if (item.id == null) return null
  return item.type === 'hai' ? `hai-${item.id}` : String(item.id)
}

function toEntry(item: LibraryItem): ReadEntry | null {
  const arxivId = keyOf(item)
  if (!arxivId) return null
  const status: ReadStatus = item.readingStatus === 'completed' ? 'completed' : 'reading'
  return {
    status,
    savedAt: new Date().toISOString(),
    paper: {
      arxivId,
      title: item.title ?? '',
      publishedDate: item.publishedDate,
      abstract: undefined, // library 응답엔 초록 없음
      fields: item.tags ?? [],
    },
  }
}

// 한 종류(reading/completed)를 페이지 끝까지 모아옴
async function fetchLibrary(type: 'reading' | 'completed'): Promise<LibraryItem[]> {
  const all: LibraryItem[] = []
  let page = 1
  // 안전장치: 최대 20페이지까지만
  for (; page <= 20; page++) {
    const res = await fetch(`/api/papers/library?type=${type}&take=100&page=${page}`, { headers: authHeaders() })
    if (!res.ok) break
    const json = await res.json()
    const items: LibraryItem[] = json.data ?? []
    all.push(...items)
    if (page >= (json.totalPages ?? 1)) break
  }
  return all
}

// 최초 구독 시 한 번 서버에서 불러옴 (비로그인이면 건너뜀)
function ensureLoaded(): void {
  if (loaded || loading || !getToken()) return

  const gen = generation
  loading = (async () => {
    try {
      // 읽는 중 + 다 읽은 논문을 모두 불러와 하나의 map 으로
      const [reading, completed] = await Promise.all([
        fetchLibrary('reading'),
        fetchLibrary('completed'),
      ])

      if (gen !== generation) return   // 그 사이 계정이 바뀜 → 버린다

      const next: ReadStatusMap = {}
      for (const item of [...reading, ...completed]) {
        const entry = toEntry(item)
        if (entry) next[entry.paper.arxivId] = entry
      }

      loaded = true
      emit(next)
    } catch {
      // 실패 시 다음 구독에서 다시 시도
    } finally {
      if (gen === generation) loading = null
    }
  })()
}

/* 로그인/로그아웃/계정 전환 시 이전 사용자의 읽음 기록이 화면에 남지 않게 비운다.
   loaded 를 되돌려서 새 계정 기준으로 다시 받아오게 하는 게 핵심 —
   이걸 안 해서 "가입했는데 다 읽은 논문이 이미 차 있고, 새로고침하면 사라지는" 문제가 있었다. */
export function resetReadStatus(): void {
  generation += 1
  loaded = false
  loading = null
  emit({})
  ensureLoaded()   // 새 계정 토큰이 있으면 바로 다시 받아온다
}

if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', resetReadStatus)
}

export function getReadStatus(arxivId: string): ReadStatus | null {
  return cache[arxivId]?.status ?? null
}

/* 상세 페이지 토글용 — 낙관적 업데이트 후 서버 반영, 실패하면 되돌림
   next 규칙:
     'reading'   → POST reading-status (시작/취소 토글)
     'completed' → POST reading-status/complete
     null        → 현재 상태 해제 (reading이면 토글 취소) */
export async function setReadStatus(paper: SavedPaper, next: ReadStatus | null): Promise<void> {
  if (!getToken()) return

  const before = cache
  const current = cache[paper.arxivId]?.status ?? null
  const optimistic = { ...cache }

  /* 휴먼AI 논문은 arxivId가 "hai-{id}" 로 인코딩돼 있어 base 경로가 다르다.
     suffix 는 둘 다 같음 — 읽는중 /reading, 완료 /complete.
     (이전엔 휴먼AI만 suffix 없이 호출해서 404 → 낙관적 업데이트가 매번 롤백됐다) */
  const isHai = paper.arxivId.startsWith('hai-')
  const base = isHai
    ? `/api/papers/hai-papers/${encodeURIComponent(paper.arxivId.slice(4))}/reading-status`
    : `/api/papers/paper/${encodeURIComponent(paper.arxivId)}/reading-status`
  const readingUrl = `${base}/reading`

  let url: string

  if (next === null) {
    // 해제: 읽는중 토글 엔드포인트로 취소
    delete optimistic[paper.arxivId]
    url = readingUrl
  } else if (next === 'completed') {
    optimistic[paper.arxivId] = { status: 'completed', savedAt: new Date().toISOString(), paper }
    url = `${base}/complete`
  } else {
    // 'reading' — 이미 reading이면 토글로 꺼짐
    if (current === 'reading') delete optimistic[paper.arxivId]
    else optimistic[paper.arxivId] = { status: 'reading', savedAt: new Date().toISOString(), paper }
    url = readingUrl
  }

  const gen = generation
  emit(optimistic)

  try {
    const res = await fetch(url, { method: 'POST', headers: authHeaders() })
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    // 그 사이 계정이 바뀌었으면 이전 계정 데이터를 되살리면 안 된다
    if (gen === generation) emit(before)
  }
}

// 마이페이지 탭용 — 최근 순
export function listByStatus(status: ReadStatus): ReadEntry[] {
  return Object.values(cache)
    .filter(entry => entry.status === status)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

/* useSyncExternalStore 용 */
export function subscribeReadStatus(onChange: () => void): () => void {
  listeners.add(onChange)
  ensureLoaded()
  return () => listeners.delete(onChange)
}

export function getReadStatusSnapshot(): ReadStatusMap {
  return cache
}
