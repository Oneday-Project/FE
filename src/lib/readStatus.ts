// 논문 읽음 상태(읽는 중 / 읽기 완료) 관리 — 서버 연동
//
//   GET  /users/me                                   → readingPapers[] (읽는 중·완료 모두)
//   POST /papers/paper/{arxivId}/reading-status      → 읽는 중 토글(시작/취소)
//   POST /papers/paper/{arxivId}/reading-status/complete → 읽기 완료로 전환
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

// /users/me 의 readingPapers[] 를 화면용 map 으로 변환
type RawReadingPaper = {
  paperId?: string
  status?: string
  startedAt?: string
  completedAt?: string
  paper?: {
    arxivId?: string
    title?: string
    publishedDate?: string
    abstract?: string
    researchFields?: { name?: string }[]
  }
}

function toEntry(raw: RawReadingPaper): ReadEntry | null {
  const arxivId = raw.paper?.arxivId ?? raw.paperId
  if (!arxivId) return null
  const status: ReadStatus = raw.status === 'completed' ? 'completed' : 'reading'
  return {
    status,
    savedAt: raw.completedAt ?? raw.startedAt ?? new Date().toISOString(),
    paper: {
      arxivId,
      title: raw.paper?.title ?? '',
      publishedDate: raw.paper?.publishedDate,
      abstract: raw.paper?.abstract,
      fields: raw.paper?.researchFields?.map(f => f.name).filter((n): n is string => !!n) ?? [],
    },
  }
}

// 휴먼AI 논문 읽음 항목 — 필드명이 확실치 않아 haiPaper / hai_paper / paper 를 모두 시도
type RawHaiReadingPaper = {
  status?: string
  startedAt?: string
  completedAt?: string
  haiPaper?: { id?: number; title?: string; publishedYear?: string; abstract?: string; department?: string }
  hai_paper?: { id?: number; title?: string; publishedYear?: string; abstract?: string; department?: string }
  haiPaperId?: number
}

function toHaiEntry(raw: RawHaiReadingPaper): ReadEntry | null {
  const hai = raw.haiPaper ?? raw.hai_paper
  const id = hai?.id ?? raw.haiPaperId
  if (id == null) return null
  const status: ReadStatus = raw.status === 'completed' ? 'completed' : 'reading'
  return {
    status,
    savedAt: raw.completedAt ?? raw.startedAt ?? new Date().toISOString(),
    paper: {
      arxivId: `hai-${id}`,
      title: hai?.title ?? '',
      publishedDate: hai?.publishedYear ? `${hai.publishedYear}-01-01` : undefined,
      abstract: hai?.abstract,
      fields: hai?.department ? [hai.department] : [],
    },
  }
}

// 최초 구독 시 한 번 서버에서 불러옴 (비로그인이면 건너뜀)
function ensureLoaded(): void {
  if (loaded || loading || !getToken()) return

  loading = (async () => {
    try {
      const res = await fetch('/api/users/me', { headers: authHeaders() })
      if (!res.ok) return

      const me = await res.json()
      const next: ReadStatusMap = {}

      // 일반 논문
      for (const item of me?.readingPapers ?? []) {
        const entry = toEntry(item)
        if (entry) next[entry.paper.arxivId] = entry
      }

      // 휴먼AI 논문 — arxivId 대신 "hai-{id}" 키로 저장 (목록 카드와 동일 규칙)
      for (const item of me?.readingHaiPapers ?? []) {
        const entry = toHaiEntry(item)
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

  // 휴먼AI 논문은 arxivId가 "hai-{id}" 로 인코딩돼 있어 엔드포인트가 다름
  //   일반: /papers/paper/{arxivId}/reading-status
  //   휴먼AI: /papers/hai-papers/{id}/reading-status
  const isHai = paper.arxivId.startsWith('hai-')
  const base = isHai
    ? `/api/papers/hai-papers/${encodeURIComponent(paper.arxivId.slice(4))}/reading-status`
    : `/api/papers/paper/${encodeURIComponent(paper.arxivId)}/reading-status`

  let url: string

  if (next === null) {
    // 해제: 서버는 reading 토글만 지원 → 그 엔드포인트로 취소
    delete optimistic[paper.arxivId]
    url = base
  } else if (next === 'completed') {
    optimistic[paper.arxivId] = { status: 'completed', savedAt: new Date().toISOString(), paper }
    url = `${base}/complete`
  } else {
    // 'reading' — 이미 reading이면 토글로 꺼짐
    if (current === 'reading') delete optimistic[paper.arxivId]
    else optimistic[paper.arxivId] = { status: 'reading', savedAt: new Date().toISOString(), paper }
    url = base
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
