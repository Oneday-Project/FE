// 논문 카드에 보여줄 한글 초록 — AI 요약(abstractKor)만 따로 불러온다
//
//   GET /ai-services/papers/{arxivId}     → 일반 논문
//   GET /ai-services/hai-papers/{id}      → 휴먼AI 논문 (arxivId 가 "hai-{id}" 형태)
//
// 목록 API(GET /papers, /papers/hai-papers)에는 한글 초록이 없어서 카드마다 이걸 한 번씩 부른다.
// 같은 논문은 목록·상세 추천·마이페이지에서 여러 번 그려지므로 요청(Promise)째로 캐시해 한 번만 보낸다.
// 토큰이 있어야 조회되므로 비로그인이면 요청하지 않고 null — 카드는 원문 초록을 대신 보여준다.

import { isLoggedIn, apiFetch } from './auth'

const cache = new Map<string, Promise<string | null>>()

export function fetchKoreanAbstract(arxivId: string): Promise<string | null> {
  if (!isLoggedIn()) return Promise.resolve(null)

  const cached = cache.get(arxivId)
  if (cached) return cached

  const url = arxivId.startsWith('hai-')
    ? `/api/ai-services/hai-papers/${encodeURIComponent(arxivId.slice(4))}`
    : `/api/ai-services/papers/${encodeURIComponent(arxivId)}`

  const request = (async () => {
    try {
      const res = await apiFetch(url)
      if (!res.ok) return null
      const json = await res.json()
      // 휴먼AI 라우트는 { data: ... } 로 감싸서 올 때가 있어 둘 다 받는다 (PaperDetail 과 동일)
      const text: unknown = (json?.data ?? json)?.abstractKor
      return typeof text === 'string' && text.trim() ? text.trim() : null
    } catch {
      return null
    }
  })()

  // 실패는 캐시하지 않는다 — 로그인 직후나 네트워크 복구 뒤 다시 그릴 때 재시도되도록
  cache.set(arxivId, request)
  request.then(text => { if (text === null) cache.delete(arxivId) })
  return request
}
