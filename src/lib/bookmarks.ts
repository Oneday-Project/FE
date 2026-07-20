// 논문 북마크 관리 — 서버와 연동됨
//
//   POST /papers/bookmark/{arxivId}  → 표시/해제 토글 (body 없음, 토큰 필요)
//   GET  /users/me                   → bookmarkPapers[] 로 북마크 목록 조회
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

// /users/me 응답의 bookmarkPapers[].paper 를 화면에서 쓸 형태로 변환
type RawPaper = {
  arxivId?: string
  title?: string
  publishedDate?: string
  abstract?: string
  researchFields?: { name?: string }[]
}

function toBookmarkedPaper(raw: RawPaper): BookmarkedPaper | null {
  if (!raw?.arxivId) return null
  return {
    arxivId: raw.arxivId,
    title: raw.title ?? '',
    publishedDate: raw.publishedDate,
    abstract: raw.abstract,
    fields: raw.researchFields?.map(f => f.name).filter((n): n is string => !!n) ?? [],
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
      const next: BookmarkMap = {}

      for (const item of me?.bookmarkPapers ?? []) {
        const paper = toBookmarkedPaper(item?.paper)
        if (paper) next[paper.arxivId] = paper
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

  try {
    const res = await fetch(`/api/papers/bookmark/${encodeURIComponent(paper.arxivId)}`, {
      method: 'POST',
      headers: authHeaders(),
    })
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
