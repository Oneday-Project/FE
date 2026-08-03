// 논문 북마크 관리 — 서버와 연동됨
//
//   GET  /papers/library?type=bookmark      → 북마크 목록 조회
//   POST /papers/bookmark/{arxivId}         → 일반 논문 토글
//   POST /papers/hai-papers/{id}/bookmark   → 휴먼AI 논문 토글
//
// 논문 목록 · 메인 · 마이페이지가 같은 상태를 구독하도록 여기서 모아 관리한다.

import { getToken } from './auth'

export type BookmarkedPaper = {
  arxivId: string
  title: string
  publishedDate?: string
  abstract?: string
  fields: string[]
}

type BookmarkMap = Record<string, BookmarkedPaper>

let cache: BookmarkMap = {}
let loaded = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

function emit(next: BookmarkMap): void {
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

/* GET /papers/library?type=bookmark 항목
   { type: "paper"|"hai", id, title, publishedDate, tags[], isBookmark, readingStatus } */
type LibraryItem = {
  type?: string
  id?: string | number
  title?: string
  publishedDate?: string
  tags?: string[]
}

function toBookmarkedPaper(item: LibraryItem): BookmarkedPaper | null {
  if (item.id == null) return null
  // 일반 논문은 arxivId, 휴먼AI는 "hai-{id}" 로 키 통일
  const arxivId = item.type === 'hai' ? `hai-${item.id}` : String(item.id)
  return {
    arxivId,
    title: item.title ?? '',
    publishedDate: item.publishedDate,
    abstract: undefined, // library 응답엔 초록 없음
    fields: item.tags ?? [],
  }
}

// 최초 구독 시 한 번 서버에서 불러옴 (비로그인이면 건너뜀)
function ensureLoaded(): void {
  if (loaded || loading || !getToken()) return

  loading = (async () => {
    try {
      const next: BookmarkMap = {}
      let page = 1
      for (; page <= 20; page++) {
        const res = await fetch(`/api/papers/library?type=bookmark&take=100&page=${page}`, { headers: authHeaders() })
        if (!res.ok) break
        const json = await res.json()
        for (const item of (json.data ?? []) as LibraryItem[]) {
          const paper = toBookmarkedPaper(item)
          if (paper) next[paper.arxivId] = paper
        }
        if (page >= (json.totalPages ?? 1)) break
      }

      loaded = true
      emit(next)
    } catch {
      // 네트워크 실패 시 다음 구독에서 다시 시도
    } finally {
      loading = null
    }
  })()
}

export function isBookmarked(arxivId: string): boolean {
  return !!cache[arxivId]
}

/* 낙관적 업데이트 — 화면을 먼저 바꾸고 서버에 반영, 실패하면 되돌림 */
export async function toggleBookmark(paper: BookmarkedPaper): Promise<void> {
  const token = getToken()
  if (!token) return

  const before = cache
  const next = { ...cache }

  if (next[paper.arxivId]) delete next[paper.arxivId]
  else next[paper.arxivId] = paper

  emit(next)

  // 휴먼AI 논문은 별도 엔드포인트
  //   일반   → POST /papers/bookmark/{arxivId}
  //   휴먼AI → POST /papers/hai-papers/{id}/bookmark
  const isHai = paper.arxivId.startsWith('hai-')
  const url = isHai
    ? `/api/papers/hai-papers/${encodeURIComponent(paper.arxivId.slice(4))}/bookmark`
    : `/api/papers/bookmark/${encodeURIComponent(paper.arxivId)}`

  try {
    const res = await fetch(url, { method: 'POST', headers: authHeaders() })
    if (!res.ok) throw new Error(String(res.status))
  } catch {
    emit(before) // 서버 반영 실패 → 원래대로
  }
}

// 마이페이지 '북마크한 논문' 탭용
export function listBookmarks(): BookmarkedPaper[] {
  return Object.values(cache)
}

/* useSyncExternalStore 용 */
export function subscribeBookmarks(onChange: () => void): () => void {
  listeners.add(onChange)
  ensureLoaded()
  return () => listeners.delete(onChange)
}

export function getBookmarksSnapshot(): BookmarkMap {
  return cache
}
