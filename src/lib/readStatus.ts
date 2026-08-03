// 논문 읽음 상태(읽는 중 / 읽기 완료) 관리 — 서버 연동
//
//   GET  /papers/library?type=reading|completed             → 읽는 중 / 다 읽은 목록
//   POST /papers/paper/{arxivId}/reading-status/reading     → 일반 논문 읽는중 토글
//   POST /papers/paper/{arxivId}/reading-status/complete    → 일반 논문 읽기 완료
//   POST /papers/hai-papers/{id}/reading-status(/complete)  → 휴먼AI 논문
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

  loading = (async () => {
    try {
      // 읽는 중 + 다 읽은 논문을 모두 불러와 하나의 map 으로
      const [reading, completed] = await Promise.all([
        fetchLibrary('reading'),
        fetchLibrary('completed'),
      ])

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
      loading = null
    }
  })()
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

  /* 휴먼AI 논문은 arxivId가 "hai-{id}" 로 인코딩돼 있어 엔드포인트가 다름.
     읽는중 토글 경로도 종류마다 다름:
       일반   → /papers/paper/{arxivId}/reading-status/reading
       휴먼AI → /papers/hai-papers/{id}/reading-status   (suffix 없음)
     완료는 둘 다 base + /complete */
  const isHai = paper.arxivId.startsWith('hai-')
  const base = isHai
    ? `/api/papers/hai-papers/${encodeURIComponent(paper.arxivId.slice(4))}/reading-status`
    : `/api/papers/paper/${encodeURIComponent(paper.arxivId)}/reading-status`
  const readingUrl = isHai ? base : `${base}/reading`

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

  emit(optimistic)

  try {
    const res = await fetch(url, { method: 'POST', headers: authHeaders() })
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    emit(before) // 서버 반영 실패 → 원래대로
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
