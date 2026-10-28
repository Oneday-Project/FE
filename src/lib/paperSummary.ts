// 논문 카드 제목 아래에 보여줄 한 줄 요약 — AI 요약의 cardSummary 컬럼
//
//   GET /ai-services/papers       → 일반 논문 AI 요약 전체 [{ cardSummary, paper: { arxivId } }]
//   GET /ai-services/hai-papers   → 휴먼AI 논문 AI 요약 전체 [{ cardSummary, haiPaper: { id } }]
//
// 목록 API(GET /papers, /papers/hai-papers)에는 요약이 없어서 위 두 개를 한 번만 받아
// arxivId("hai-{id}" 포함) → cardSummary 표로 만들어 두고 모든 카드가 같이 쓴다.
// 토큰이 있어야 조회되므로 비로그인이면 요청하지 않고 null — 카드는 원문 초록을 대신 보여준다.

import { isLoggedIn, apiFetch } from './auth'

type SummaryRow = {
  cardSummary?: string | null
  paper?: { arxivId?: string }
  haiPaper?: { id?: number }
}

let table: Promise<Map<string, string>> | null = null

async function loadRows(url: string): Promise<SummaryRow[]> {
  const res = await apiFetch(url)
  if (!res.ok) throw new Error(`${url} ${res.status}`)
  const json = await res.json()
  const rows = Array.isArray(json) ? json : json?.data
  return Array.isArray(rows) ? rows : []
}

function loadTable(): Promise<Map<string, string>> {
  if (table) return table

  table = Promise.all([
    loadRows('/api/ai-services/papers'),
    loadRows('/api/ai-services/hai-papers'),
  ]).then(([papers, haiPapers]) => {
    const map = new Map<string, string>()
    const put = (key: string | undefined, text: string | null | undefined) => {
      if (key && text?.trim()) map.set(key, text.trim())
    }
    papers.forEach(r => put(r.paper?.arxivId, r.cardSummary))
    haiPapers.forEach(r => put(r.haiPaper?.id != null ? `hai-${r.haiPaper.id}` : undefined, r.cardSummary))
    return map
  })

  // 실패는 캐시하지 않는다 — 다음에 카드를 그릴 때 다시 시도되도록
  table.catch(() => { table = null })
  return table
}

/* 로그인/로그아웃하면 다시 받는다 (비로그인 때 실패한 상태가 남지 않게) */
if (typeof window !== 'undefined') {
  window.addEventListener('auth-change', () => { table = null })
}

export async function fetchCardSummary(arxivId: string): Promise<string | null> {
  if (!isLoggedIn()) return null
  try {
    return (await loadTable()).get(arxivId) ?? null
  } catch {
    return null
  }
}
