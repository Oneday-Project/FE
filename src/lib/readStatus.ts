// 논문 읽음 상태(읽는 중 / 읽기 완료) 관리
//
// ⚠️ 백엔드에 읽음 상태 API가 아직 없어서(스웨거에 북마크만 있음) localStorage에 저장함.
//    나중에 BE에 엔드포인트가 생기면 이 파일의 read/save만 fetch로 바꾸면 됨.
//
// 상세 페이지에서 토글 → 논문 목록 카드 뱃지 / 마이페이지 탭에 함께 반영됨.

export type ReadStatus = 'reading' | 'done'

// 마이페이지에서 목록을 그리려면 논문 정보가 필요해서 최소 필드를 같이 저장해둠
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

const KEY = 'paperReadStatus'
const EVENT = 'read-status-change'

let cache: ReadStatusMap | null = null

function load(): ReadStatusMap {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    cache = raw ? (JSON.parse(raw) as ReadStatusMap) : {}
  } catch {
    cache = {}
  }
  return cache
}

function save(next: ReadStatusMap): void {
  cache = next
  localStorage.setItem(KEY, JSON.stringify(next))
  window.dispatchEvent(new Event(EVENT))
}

export function getReadStatus(arxivId: string): ReadStatus | null {
  return load()[arxivId]?.status ?? null
}

// status가 null이면 해제
export function setReadStatus(paper: SavedPaper, status: ReadStatus | null): void {
  const next = { ...load() }

  if (status === null) {
    delete next[paper.arxivId]
  } else {
    next[paper.arxivId] = { status, savedAt: new Date().toISOString(), paper }
  }

  save(next)
}

// 마이페이지 탭용 — 최근 저장 순
export function listByStatus(status: ReadStatus): ReadEntry[] {
  return Object.values(load())
    .filter(entry => entry.status === status)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

/* useSyncExternalStore 용 — 같은 탭(커스텀 이벤트)과 다른 탭(storage) 변경을 모두 구독 */
export function subscribeReadStatus(onChange: () => void): () => void {
  const handleLocal = () => onChange()
  const handleStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null // 다른 탭에서 바뀌었으면 다시 읽기
      onChange()
    }
  }

  window.addEventListener(EVENT, handleLocal)
  window.addEventListener('storage', handleStorage)

  return () => {
    window.removeEventListener(EVENT, handleLocal)
    window.removeEventListener('storage', handleStorage)
  }
}

export function getReadStatusSnapshot(): ReadStatusMap {
  return load()
}
