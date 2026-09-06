import { useState, useEffect, useMemo, useRef, useSyncExternalStore } from 'react'
import { pageContainer, PAGE_TOP, pageTitle, pageSubtitle, HERO_GAP, INK, INK_80, MAIN, MUTED, FONT } from '../styles/pageTheme'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PaperDetail from './PaperDetail'
import PaperCard from '../components/PaperCard'
import { isLoggedIn, getToken } from '../lib/auth'
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from '../lib/bookmarks'

/* 분야 태그 — 피그마와 같은 줄 구성으로 고정한다.
   폭에 맡겨 자동 줄바꿈시키면 컨테이너가 1000px(피그마 1440 대비 좁음)이라
   Retrieval AI 가 첫 줄에 붙어버려서, 줄 묶음을 코드에서 직접 정한다. */
const TAG_ROWS = [
  ['SML', 'ML', 'CV', 'NLP', 'Robotics'],
  ['Retrieval AI', 'SAP', 'HCI', 'Multimodal'],
  ['Code AI'],
] as const

/* 분야 약자 설명 — '분야 ⓘ' 에 마우스를 올리면 뜨는 말풍선 내용 */
const FIELD_INFO: { name: string; full: string; desc: string }[] = [
  { name: 'SML', full: 'Statistical Machine Learning', desc: '통계와 확률을 기반으로 데이터의 패턴을 학습하고 예측하는 분야' },
  { name: 'ML', full: 'Machine Learning', desc: '데이터를 학습해 분류, 예측, 의사결정을 수행하는 AI 분야' },
  { name: 'CV', full: 'Computer Vision', desc: '이미지와 영상을 이해하고 분석하는 AI 분야' },
  { name: 'NLP', full: 'Natural Language Processing', desc: '텍스트와 언어를 이해하고 분석·생성하는 AI 분야' },
  { name: 'Robotics', full: 'Robotics', desc: '로봇이 환경을 인식하고 판단하며 행동하도록 연구하는 분야' },
  { name: 'Retrieval AI', full: 'Retrieval Artificial Intelligence', desc: '대규모 데이터에서 필요한 정보를 검색하고 활용하는 AI 분야' },
  { name: 'SAP', full: 'Speech and Audio Processing', desc: '음성과 소리 데이터를 인식하고 분석·처리하는 AI 분야' },
  { name: 'HCI', full: 'Human–Computer Interaction', desc: '사람과 컴퓨터·AI 사이의 상호작용과 사용자 경험을 연구하는 분야' },
  { name: 'Multimodal', full: 'Multimodal Artificial Intelligence', desc: '텍스트, 이미지, 음성 등 여러 형태의 데이터를 함께 이해하는 AI 분야' },
  { name: 'Code AI', full: 'AI for Code / Code Intelligence', desc: '코드를 이해하고 생성·분석하며 개발을 지원하는 AI 분야' },
]
const MAX_TAGS = 3 // 분야는 최대 3개까지 선택

// 논문 데이터 타입 정의 (백엔드 응답 형식과 일치해야 함)
export type Paper = {
  arxivId: string
  doi: string | null
  title: string
  authors: string[]          // 백엔드가 ["Maya Murad","Ece Kamar"] 형태의 문자열 배열로 내려줌
  abstract: string
  researchFields: string[]   // 백엔드가 ["AI","HCI"] 형태의 문자열 배열로 내려줌
  publishedDate: string
  citationCount: number
  influenceScore: number
  journal: string
  pdfUrl: string
  bookmarkCount: number
  starTier: number
}

// vite.config.ts의 proxy 설정 덕분에 '/api'로 시작하면 ngrok 주소로 자동 연결됨
const API_PREFIX = '/api'

// GET /papers, /papers/hai-papers 모두 토큰이 필요함
function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true', // ngrok 경고 페이지 스킵
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

/* 휴먼AI공학전공 논문 (GET /papers/hai-papers)
   일반 논문(Paper)과 필드가 달라서 별도 타입으로 받고 변환해서 쓴다. */
type HaiPaper = {
  id: number
  doi?: string
  title: string
  authors?: string[]
  academic_advisor?: string
  department?: string
  researchFields?: string[]
  abstract?: string
  publishedYear?: string
  pdfUrl?: string
}

function toPaper(hai: HaiPaper): Paper {
  return {
    arxivId: `hai-${hai.id}`,          // 카드 key 용 ("hai-" 접두사로 일반 논문과 구분)
    doi: hai.doi ?? null,
    title: hai.title,
    authors: hai.authors ?? [],
    abstract: hai.abstract ?? '',
    // 휴먼AI 응답도 researchFields(["ML","CV"])를 내려준다. 없을 때만 학과명으로 대체
    researchFields: hai.researchFields ?? (hai.department ? [hai.department] : []),
    publishedDate: hai.publishedYear ? `${hai.publishedYear}-01-01` : '',
    citationCount: 0,
    influenceScore: 0,
    journal: '',
    pdfUrl: hai.pdfUrl ?? '',
    bookmarkCount: 0,
    starTier: 0,
  }
}

const importanceOptions = [1, 2, 3]

/* 검색 결과 화면 (피그마: 논문 페이지 - 0624 › 1026:5604~5646)
   결과 문구 → 구분선 → 정렬 탭 → 3열 카드 그리드(4줄) → 숫자 페이지네이션 */
/* 태그 (피그마: Tag / Tag important — 논문 페이지 0624 › 1026:5576, 1026:5582)
   default  : 흰 배경, stroke 없음, Pretendard Medium 16 / #3C3C43
   selected : 흰 배경 + main color stroke 1.2px, Pretendard SemiBold 16 / #00178E
   테두리는 미선택일 때도 transparent 로 잡아둬야 선택 시 크기가 안 튄다. */
const TAG_BASE = {
  padding: '8px 12px',
  borderRadius: '100px',
  background: '#fff',
  fontFamily: 'inherit',
  fontSize: '16px',
  lineHeight: 'normal',
  cursor: 'pointer',
  transition: 'all 0.15s',
} as const

const tagStyle = (selected: boolean) => ({
  ...TAG_BASE,
  border: `1.2px solid ${selected ? MAIN : 'transparent'}`,
  fontWeight: selected ? 600 : 500,
  color: selected ? MAIN : INK,
})

// 필터 줄 라벨 (중요도 / 연도 / 분야) — Pretendard Medium 16 / #3C3C43
const filterLabel = { fontSize: '16px', fontWeight: 500, color: INK, flexShrink: 0 } as const

const STAR_ON = '#FFF188'   // 선택된 중요도 별
const STAR_OFF = INK_80     // 미선택 별 (#3C3C43 80%)



/* 한 번에 받아올 논문 수.
   검색은 전체를 훑어야 해서 백엔드 상한인 100으로 받는다(take=540 은 400 에러).
   기본값 12로 두면 540편에 46번 요청해야 하는데 100이면 6번이면 된다.
   검색 전 캐러셀 화면은 12편이면 충분하다(100편이면 페이지 도트가 34개가 된다). */
const SEARCH_TAKE = 100
const BROWSE_TAKE = 12

/* 커서를 따라갈 최대 페이지 수 (100편 × 20 = 2000편까지). 현재 DB 는 540편 = 6페이지 */
const MAX_FETCH_PAGES = 20

const RESULTS_PER_PAGE = 12
const RESULT_PAGE_WINDOW = 5   // 페이지 번호는 한 번에 5개까지 노출
const sortOptions = [
  ['all', '전체'],
  ['recent', '최신 순'],
  ['cited', '인용 많은 순'],
] as const
type SortKey = (typeof sortOptions)[number][0]

export default function Papers() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [importance, setImportance] = useState<number | null>(null)          // 중요도: 1개만 (미선택 가능)
  const [period, setPeriod] = useState<'1y' | '3y' | '5y' | 'custom' | null>(null) // 연도: 1개만 (미선택 가능)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  // 마지막으로 서버에 실제로 보낸 키워드 (입력 중인 값과 구분 — 정렬·안내 문구에 사용)
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [searched, setSearched] = useState(false)              // 검색 버튼을 눌렀는지 (누르면 결과 화면으로 전환)
  const [sort, setSort] = useState<SortKey>('all')
  const [resultPage, setResultPage] = useState(0)
  const bookmarks = useSyncExternalStore(subscribeBookmarks, getBookmarksSnapshot)
  const [showLoginGate, setShowLoginGate] = useState(false)   // 비로그인 상태로 카드를 눌렀을 때
  const navigate = useNavigate()

  /* 상세는 URL 쿼리(?paper=<arxivId>)로 연다.
     → 마이페이지·메인 카드에서도 navigate('/papers?paper=...') 로 바로 진입 가능,
       뒤로가기/새로고침도 자연스럽게 동작한다. */
  const [searchParams, setSearchParams] = useSearchParams()
  const paperParam = searchParams.get('paper')
  const [fetchedPaper, setFetchedPaper] = useState<Paper | null>(null)

  // 논문 상세는 회원 전용 — 비로그인이면 상세로 넘기지 않고 안내 모달을 띄움
  const handleCardClick = (paper: Paper) => {
    if (!isLoggedIn()) {
      setShowLoginGate(true)
      return
    }
    setSearchParams({ paper: paper.arxivId })
  }

  const [papers, setPapers] = useState<Paper[]>([])
  const [haiPapers, setHaiPapers] = useState<Paper[]>([])   // 휴먼AI공학전공 논문 (별도 API)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null) // 다음 페이지 커서
  const fetchIdRef = useRef(0)   // 진행 중인 조회 식별 (오래된 응답 무시용)
  const [hasNext, setHasNext] = useState(false) // 더보기 버튼 표시 여부

  // 컴포넌트 처음 마운트될 때 논문 자동 불러오기
  useEffect(() => {
    fetchPapers()
    fetchHaiPapers()
  }, [])

  /* 휴먼AI공학전공 논문 — GET /papers/hai-papers
     일반 논문과 응답 형태가 달라서(id, publishedYear 등) 화면에서 쓰는 Paper 모양으로 변환해서 쓴다. */
  const fetchHaiPapers = async () => {
    try {
      const res = await fetch(`${API_PREFIX}/papers/hai-papers`, { headers: authHeaders() })

      if (!res.ok) {
        console.error('휴먼AI 논문 불러오기 실패:', res.status, await res.text())
        return
      }

      const json = await res.json()
      console.log('📦 휴먼AI 논문 응답:', json)

      const list: HaiPaper[] = Array.isArray(json) ? json : json.data ?? json.haiPapers ?? []
      setHaiPapers(list.map(toPaper))
    } catch (e) {
      // 실패해도 일반 논문 목록은 보여야 하므로 화면은 그대로 두고 로그만 남김
      console.error('휴먼AI 논문 요청 오류:', e)
    }
  }

  /* 논문 조회.
     검색 결과는 DB 전체(540편 기준, 12편씩 46페이지)를 대상으로 해야 하므로
     loadAll=true 면 커서를 끝까지 따라가며 모든 페이지를 모은다.
     받는 대로 화면에 반영해서 첫 페이지는 바로 보이고 나머지는 뒤에서 채워진다. */
  const fetchPapers = async ({ loadAll = false }: { loadAll?: boolean } = {}) => {
    /* 전체 로드는 요청을 수십 번 순차로 보내는데, 그 사이 새 검색이 시작될 수 있다.
       요청마다 번호를 매겨서, 최신 요청이 아니면 중간에 멈추고 결과도 반영하지 않는다.
       (이전 검색 결과가 뒤늦게 도착해 화면을 덮어쓰는 것을 막는다) */
    const fetchId = ++fetchIdRef.current
    const isStale = () => fetchIdRef.current !== fetchId

    setLoading(true)
    setError(null)

    const keyword = searchValue.trim()

    // 현재 필터로 요청 URL 만들기 (커서만 페이지마다 바뀜)
    const buildUrl = (cursor: string | null) => {
      const params = new URLSearchParams()
      params.set('take', String(loadAll ? SEARCH_TAKE : BROWSE_TAKE))
      if (cursor) params.set('cursor', cursor)

      // 키워드 검색 (백엔드는 최소 2글자 요구)
      if (keyword) params.set('keyword', keyword)

      // 분야: UI 태그가 백엔드 코드와 동일(AI/CV/NLP…) → 반복 파라미터로 전송 (OR 필터)
      selectedTags.forEach(tag => params.append('tags', tag))

      // 중요도: starTier(1~3)
      if (importance != null) params.set('starTier', String(importance))

      // 연도: 최근 N년 (기간 직접 설정 'custom'은 날짜 입력 UI가 없어 아직 미연결)
      const yearRange = period === '1y' ? 1 : period === '3y' ? 3 : period === '5y' ? 5 : null
      if (yearRange) params.set('yearRange', String(yearRange))

      const query = params.toString()
      return `${API_PREFIX}/papers${query ? `?${query}` : ''}`
    }

    try {
      const collected: Paper[] = []
      let cursor: string | null = null

      for (let page = 0; page < MAX_FETCH_PAGES; page++) {
        const res = await fetch(buildUrl(cursor), { method: 'GET', headers: authHeaders() })
        if (isStale()) return
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`)

        const json = await res.json()
        const fetched: Paper[] = Array.isArray(json)
          ? json
          : json.data ?? json.papers ?? []

        collected.push(...fetched)
        cursor = Array.isArray(json) ? null : json.nextCursor ?? null
        const more = !Array.isArray(json) && Boolean(json.hasNext) && Boolean(cursor)

        // 첫 페이지가 도착하면 바로 화면에 보여주고, 나머지는 이어서 채운다
        setPapers([...collected])
        setAppliedKeyword(keyword)
        setNextCursor(cursor)
        setHasNext(more)
        setLoading(false)

        if (!loadAll || !more) break
      }
    } catch (e) {
      if (isStale()) return
      console.error('논문 불러오기 실패:', e)
      setError('논문을 불러오는 데 실패했습니다. 콘솔에서 API 주소 또는 CORS 오류를 확인해주세요.')
    } finally {
      if (!isStale()) setLoading(false)
    }
  }

  // '더 보기' — 다음 한 페이지만 이어붙인다 (검색 전 캐러셀 화면용)
  const loadMorePapers = async () => {
    if (!nextCursor) return
    try {
      const res = await fetch(`${API_PREFIX}/papers?take=${BROWSE_TAKE}&cursor=${encodeURIComponent(nextCursor)}`, {
        method: 'GET', headers: authHeaders(),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const fetched: Paper[] = Array.isArray(json) ? json : json.data ?? json.papers ?? []
      setPapers(prev => [...prev, ...fetched])
      setNextCursor(Array.isArray(json) ? null : json.nextCursor ?? null)
      setHasNext(Array.isArray(json) ? false : Boolean(json.hasNext))
    } catch (e) {
      console.error('논문 더 불러오기 실패:', e)
    }
  }

  // 분야 태그 토글 (선택/해제) — 최대 3개까지만
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) return prev.filter(t => t !== tag)  // 이미 선택 → 해제
      if (prev.length >= MAX_TAGS) return prev                    // 3개 꽉 참 → 무시
      return [...prev, tag]                                       // 새로 선택
    })
  }

  // 중요도/연도 단일 선택 (같은 걸 다시 누르면 해제)
  const selectImportance = (opt: number) =>
    setImportance(prev => (prev === opt ? null : opt))
  const selectPeriod = (key: '1y' | '3y' | '5y' | 'custom') =>
    setPeriod(prev => (prev === key ? null : key))

  // 돋보기 버튼(또는 Enter)을 누르면 즉시 검색
  const handleSearch = () => {
    setSearched(true)   // 캐러셀 2개 → 검색 결과 그리드로 전환
    setSort('all')
    setResultPage(0)
    void fetchPapers({ loadAll: true })   // 전체 논문에서 검색
  }

  /* 입력하는 대로 자동 검색 (마지막 타자 후 400ms).
     - 백엔드가 2글자 미만 키워드에 400을 주므로 그 전까지는 요청하지 않는다
     - 검색어를 다 지우면 원래 캐러셀 화면으로 돌아간다
     - 첫 렌더는 건너뛴다 (마운트 시 이미 한 번 불러옴) */
  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }

    const keyword = searchValue.trim()
    if (keyword.length === 1) return   // 2글자부터 검색

    const timer = setTimeout(() => {
      if (keyword === '') {
        setSearched(false)   // 검색어를 비우면 처음 화면으로
      } else {
        setSearched(true)
        setSort('all')
        setResultPage(0)
      }
      void fetchPapers({ loadAll: keyword !== '' })
    }, 400)

    return () => clearTimeout(timer)
  }, [searchValue])

  /* 검색 결과 정렬 — 백엔드에 정렬 파라미터가 없어서 받아온 목록에서 처리한다.
     '전체'는 백엔드가 준 순서 그대로. */
  const sortedResults = useMemo(() => {
    if (sort === 'recent') {
      return [...papers].sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''))
    }
    if (sort === 'cited') {
      return [...papers].sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))
    }

    /* '전체' — 백엔드가 초록 전문까지 검색해서 흔한 단어는 거의 다 걸린다.
       제목에 키워드가 있는 논문을 위로 올려 관련도 높은 것부터 보이게 한다.
       (sort 는 안정 정렬이라 같은 그룹 안에서는 서버가 준 순서가 유지된다) */
    if (!appliedKeyword) return papers
    const keyword = appliedKeyword.toLowerCase()
    const inTitle = (p: Paper) => (p.title ?? '').toLowerCase().includes(keyword)
    return [...papers].sort((a, b) => Number(inTitle(b)) - Number(inTitle(a)))
  }, [papers, sort, appliedKeyword])

  const totalResultPages = Math.max(1, Math.ceil(sortedResults.length / RESULTS_PER_PAGE))
  const pageResults = sortedResults.slice(
    resultPage * RESULTS_PER_PAGE,
    resultPage * RESULTS_PER_PAGE + RESULTS_PER_PAGE,
  )

  // 검색 시 전체를 이미 받아오므로 페이지 이동은 화면 전환만 하면 된다
  const goResultPage = (next: number) => {
    setResultPage(Math.max(0, Math.min(next, totalResultPages - 1)))
  }

  const changeSort = (key: SortKey) => {
    setSort(key)
    setResultPage(0)
  }

  // 북마크 토글 — POST /papers/bookmark/{arxivId} (낙관적 업데이트, 실패 시 되돌림)
  const handleBookmark = (paper: Paper) => {
    void toggleBookmark({
      arxivId: paper.arxivId,
      title: paper.title,
      publishedDate: paper.publishedDate,
      abstract: paper.abstract,
      fields: paper.researchFields ?? [],
    })
  }

  // URL 의 ?paper= 로 지정된 논문 (목록에 있으면 그걸 쓰고, 없으면 단일 API로 받아온 것)
  const selectedPaper: Paper | null = paperParam
    ? (papers.find(p => p.arxivId === paperParam)
        ?? haiPapers.find(p => p.arxivId === paperParam)
        ?? (fetchedPaper?.arxivId === paperParam ? fetchedPaper : null))
    : null

  // 목록에 없는 논문(마이페이지 등에서 직접 링크로 진입)이면 단일 API로 가져옴
  useEffect(() => {
    if (!paperParam || selectedPaper) return

    let cancelled = false
    ;(async () => {
      const isHai = paperParam.startsWith('hai-')
      const url = isHai
        ? `${API_PREFIX}/papers/hai-papers/${encodeURIComponent(paperParam.slice(4))}`
        : `${API_PREFIX}/papers/paper/${encodeURIComponent(paperParam)}`

      try {
        const res = await fetch(url, { headers: authHeaders() })
        if (!res.ok || cancelled) return
        const raw = await res.json()
        setFetchedPaper(isHai ? toPaper(raw) : raw)
      } catch {
        // 실패 시 상세가 안 열림 — 목록은 그대로 보임
      }
    })()

    return () => { cancelled = true }
  }, [paperParam, selectedPaper])

  // 논문 상세 (회원 전용)
  if (paperParam) {
    if (!isLoggedIn()) {
      return (
        <LoginGateModal
          onClose={() => setSearchParams({})}
          onLogin={() => navigate('/login')}
        />
      )
    }
    if (selectedPaper) {
      return (
        <PaperDetail
          paper={selectedPaper}
          allPapers={papers}
          onBack={() => setSearchParams({})}
        />
      )
    }
    // 아직 단일 논문 로딩 중
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: '#9ca3af' }}>불러오는 중…</div>
    )
  }

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      boxSizing: 'border-box',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      <div style={{ ...pageContainer, paddingTop: PAGE_TOP, paddingBottom: '60px' }}>
        {/* Hero 섹션 */}
        <div style={{ marginBottom: HERO_GAP }}>
          <h1 style={pageTitle}>
            내 분야 논문, 한 번에.
          </h1>
          <p style={pageSubtitle}>
            관심 분야를 고르면 최신 트렌드 논문을 정리해드려요.
          </p>
        </div>

        {/* 검색창 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#fff', borderRadius: '999px',
          border: searchFocused ? `2px solid ${MAIN}` : '1.5px solid #e5e7eb',
          padding: searchFocused ? '6px 6px 6px 25px' : '7px 7px 7px 26px',
          marginBottom: '18px',
          boxShadow: searchFocused ? '0 6px 22px rgba(0,23,142,0.18)' : '0 6px 22px rgba(0,0,0,0.07)',
          transition: 'border-color 0.15s, box-shadow 0.15s',
        }}>
          <input
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="제목/저자/키워드를 입력하세요."
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '15px', color: '#374151', background: 'transparent' }}
          />
          <button
            onClick={handleSearch}
            aria-label="검색"
            style={{
            width: '44px', height: '44px', background: MAIN,
            border: 'none', borderRadius: '50%', display: 'flex',
            alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7"/>
              <path d="M16.5 16.5L21 21" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* 필터 (중요도, 연도, 분야) */}
        <div style={{ display: 'flex', gap: '24px', marginBottom: '44px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={filterLabel}>중요도</span>
              {importanceOptions.map(opt => {
                const active = importance === opt
                return (
                  <button key={opt} onClick={() => selectImportance(opt)}
                    style={{
                      ...tagStyle(active),
                      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '10px',
                    }}>
                    {Array.from({ length: opt }).map((_, i) => (
                      <svg key={i} width="19" height="19" viewBox="0 0 24 24" fill={active ? STAR_ON : STAR_OFF}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={filterLabel}>연도</span>
              {([['1y','최근 1년'],['3y','최근 3년'],['5y','최근 5년'],['custom','기간 설정']] as const).map(([key, label]) => (
                <button key={key} onClick={() => selectPeriod(key)} style={tagStyle(period === key)}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
            {/* 라벨은 '분야 ⓘ' 로 짧게 — "(최대 3개)" 를 그대로 두면 태그 줄이 들어갈 폭이 안 남는다.
               ⓘ 는 자리만 잡아둔 임시 아이콘(말풍선 디자인 이미지로 교체 예정) */}
            <span style={{ ...filterLabel, paddingTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              분야
              <FieldInfoTip />
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {TAG_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {row.map(tag => {
                    const selected = selectedTags.includes(tag)
                    const disabled = !selected && selectedTags.length >= MAX_TAGS  // 3개 꽉 차면 나머지 비활성
                    return (
                      <button key={tag} onClick={() => toggleTag(tag)} disabled={disabled} style={{
                        ...tagStyle(selected),
                        // 3개를 다 고르면 나머지는 연하게 (선택 불가 표시)
                        opacity: disabled ? 0.4 : 1,
                        cursor: disabled ? 'default' : 'pointer',
                      }}>{tag}</button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
            논문을 불러오는 중...
          </div>
        )}
        {/* 에러 상태 → F12 Console에서 자세한 내용 확인 */}
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444', fontSize: '14px' }}>
            {error}
          </div>
        )}
        {/* 검색을 누른 뒤 — 선택한 조건에 맞는 검색 결과 (피그마 1026:5604~5646) */}
        {!loading && !error && searched && (
          <>
            <h2 style={{
              display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap',
              fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 14px',
            }}>
              회원님이 선택한 조건에 맞는 검색 결과입니다.
              {/* 필터가 실제로 적용됐는지 바로 보이도록 건수를 함께 표시 */}
              <span style={{ fontSize: '14px', fontWeight: 500, color: MAIN }}>
                {sortedResults.length}건
              </span>
            </h2>
            <div style={{ height: '1px', background: '#E3E8F5' }} />

            {/* 정렬 탭 — 전체 / 최신 순 / 인용 많은 순 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', margin: '16px 0 24px' }}>
              {sortOptions.map(([key, label]) => {
                const active = sort === key
                return (
                  <button key={key} onClick={() => changeSort(key)} style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '14px',
                    fontWeight: active ? 600 : 500,
                    color: active ? MAIN : 'rgba(60,60,67,0.4)',
                    transition: 'color 0.15s',
                  }}>{label}</button>
                )
              })}
            </div>

            {pageResults.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '80px 0', color: '#9ca3af', fontSize: '14px' }}>
                조건에 맞는 논문이 없습니다. 분야·중요도·연도를 조정해보세요.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '24px 20px' }}>
                {pageResults.map(paper => (
                  <PaperCard
                    key={paper.arxivId}
                    paper={paper}
                    bookmarked={!!bookmarks[paper.arxivId]}
                    onBookmark={() => handleBookmark(paper)}
                    onClick={() => handleCardClick(paper)}
                  />
                ))}
              </div>
            )}

            {totalResultPages > 1 && (
              <ResultPagination
                page={resultPage}
                totalPages={totalResultPages}
                onChange={goResultPage}
              />
            )}
          </>
        )}

        {/* 검색 전 기본 화면 — 캐러셀 2개 */}
        {!loading && !error && !searched && (
          <>
            <PaperSection
              title="최근 동향 논문"
              papers={papers}
              bookmarks={bookmarks}
              onBookmark={handleBookmark}
              onCardClick={handleCardClick}
            />
            <div style={{ height: '48px' }} />
            {/* 휴먼AI 논문은 arxivId가 없어서 북마크 API를 쓸 수 없음 → 북마크 버튼 숨김 */}
            <PaperSection
              title="휴먼AI공학전공 논문"
              subtitle="최신 동향 반영을 위해 최근 3년 이내 논문을 중심으로 제공합니다."
              papers={haiPapers}
              bookmarks={bookmarks}
              onBookmark={handleBookmark}
              onCardClick={handleCardClick}
            />
            {/* hasNext가 true일 때만 더보기 버튼 표시 */}
            {hasNext && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => void loadMorePapers()}
                  style={{
                    padding: '10px 28px', fontSize: '14px', fontWeight: 500,
                    background: MAIN, color: '#fff', border: 'none',
                    borderRadius: '10px', cursor: 'pointer',
                  }}
                >
                  더 보기
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 비로그인 상태로 논문 카드를 눌렀을 때 (피그마 Frame 622) */}
      {showLoginGate && (
        <LoginGateModal
          onClose={() => setShowLoginGate(false)}
          onLogin={() => navigate('/login')}
        />
      )}
    </div>
  )
}

/* 검색 결과 페이지네이션 — 피그마 1026:5631 (« ‹ 1 2 3 4 5 › »)
   숫자 20px/현재 #00178E·나머지 rgba(60,60,67,0.8), 항목 간격 16px */
function ResultPagination({
  page, totalPages, onChange,
}: {
  page: number
  totalPages: number
  onChange: (next: number) => void
}) {
  // 현재 페이지가 가운데 오도록 5칸 창을 잡되, 양끝에서는 창을 안쪽으로 밀어붙인다
  const start = Math.max(0, Math.min(page - 2, totalPages - RESULT_PAGE_WINDOW))
  const numbers = Array.from(
    { length: Math.min(RESULT_PAGE_WINDOW, totalPages) },
    (_, i) => start + i,
  )

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      marginTop: '48px',
    }}>
      {/* «  ‹ — 피그마에선 두 화살표가 5px 간격으로 붙어 있다 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <PageArrow kind="first" disabled={page === 0} onClick={() => onChange(0)} />
        <PageArrow kind="prev" disabled={page === 0} onClick={() => onChange(page - 1)} />
      </div>

      {/* 숫자 — Pretendard Medium 20 / 간격 16, 화살표 묶음과는 34px 떨어져 있다 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '0 34px' }}>
        {numbers.map(i => (
          <button
            key={i}
            onClick={() => onChange(i)}
            aria-current={i === page ? 'page' : undefined}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '20px', fontWeight: 500, lineHeight: 'normal',
              color: i === page ? MAIN : INK_80,
              transition: 'color 0.15s',
            }}
          >{i + 1}</button>
        ))}
      </div>

      {/* ›  » */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <PageArrow kind="next" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)} />
        <PageArrow kind="last" disabled={page >= totalPages - 1} onClick={() => onChange(totalPages - 1)} />
      </div>
    </div>
  )
}

// 페이지네이션 화살표 (« ‹ › ») — 목록 캐러셀과 같은 셰브론 모양을 쓴다
function PageArrow({
  kind, disabled, onClick,
}: {
  kind: 'first' | 'prev' | 'next' | 'last'
  disabled: boolean
  onClick: () => void
}) {
  const left = kind === 'first' || kind === 'prev'
  const double = kind === 'first' || kind === 'last'
  const label = { first: '첫 페이지', prev: '이전 페이지', next: '다음 페이지', last: '마지막 페이지' }[kind]

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        background: 'none', border: 'none', padding: 0, display: 'flex',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      <svg width="15" height="30" viewBox="0 0 24 24" fill="none"
        stroke={INK_80} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        {left ? (
          <>
            <path d="M14 18l-6-6 6-6" />
            {double && <path d="M19 18l-6-6 6-6" />}
          </>
        ) : (
          <>
            <path d="M10 18l6-6-6-6" />
            {double && <path d="M5 18l6-6-6-6" />}
          </>
        )}
      </svg>
    </button>
  )
}

// 회원 전용 안내 모달 — 논문 상세는 로그인해야 볼 수 있음
function LoginGateModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(71, 78, 94, 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: 'relative',
          width: '360px', maxWidth: '90%',
          background: '#fff', borderRadius: '16px',
          padding: '48px 50px 46px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '26px', height: '26px',
            border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* 아이콘 — public/personal-privacy.svg */}
        <img
          src="/personal-privacy.svg"
          alt=""
          style={{ width: '78px', height: '78px', marginBottom: '26px' }}
        />

        <p style={{
          fontSize: '16px', fontWeight: 500, color: '#3C3C43',
          margin: '0 0 24px', textAlign: 'center',
        }}>
          회원만 접근 가능한 페이지입니다.
        </p>

        <button
          onClick={onLogin}
          style={{
            width: '100%', height: '46px',
            background: MAIN, color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  )
}

// 논문 섹션 컴포넌트 (제목 + 카드 슬라이더)
function PaperSection({
  title, subtitle, papers, bookmarks, onBookmark, onCardClick,
}: {
  title: string
  subtitle?: string
  papers: Paper[]
  bookmarks: Record<string, unknown>   // lib/bookmarks 스냅샷 — 키가 있으면 북마크됨
  onBookmark: (paper: Paper) => void
  onCardClick: (paper: Paper) => void
}) {
  const CARDS_PER_PAGE = 3 // 한 번에 보여줄 카드 수
  const [pageIndex, setPageIndex] = useState(0)

  /* 새로고침 버튼 — 받아온 목록 안에서 순서를 섞어 다른 논문을 보여준다.
     난수는 클릭할 때 seed 로만 뽑고, 섞기 자체는 seed 로 결정되는 순수 계산이다.
     (useMemo 안에서 Math.random 을 쓰면 렌더마다 결과가 달라질 수 있어 피한다)
     seed 0 = 서버가 준 순서 그대로(첫 진입). spin 은 아이콘 회전 횟수. */
  const [seed, setSeed] = useState(0)
  const [spin, setSpin] = useState(0)

  const shuffled = useMemo(() => {
    if (seed === 0) return papers
    const list = [...papers]
    let state = seed
    const rand = () => {
      state = (state * 1103515245 + 12345) % 2147483648   // 선형 합동 생성기
      return state / 2147483648
    }
    for (let i = list.length - 1; i > 0; i--) {           // Fisher-Yates
      const j = Math.floor(rand() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [papers, seed])

  const totalPages = Math.max(1, Math.ceil(shuffled.length / CARDS_PER_PAGE))

  // 현재 페이지에 보여줄 논문만 슬라이싱
  const visiblePapers = shuffled.slice(
    pageIndex * CARDS_PER_PAGE,
    pageIndex * CARDS_PER_PAGE + CARDS_PER_PAGE
  )

  // 다시 섞고 첫 페이지로
  const reshuffle = () => {
    setSeed(Math.floor(Math.random() * 2147483646) + 1)
    setSpin(n => n + 1)
    setPageIndex(0)
  }

  const goPrev = () => {
    setPageIndex(prev => (prev === 0 ? totalPages - 1 : prev - 1))
  }

  const goNext = () => {
    setPageIndex(prev => (prev === totalPages - 1 ? 0 : prev + 1))
  }

  // 논문 수 변경 시 페이지 인덱스 초기화
  useEffect(() => {
    if (pageIndex > totalPages - 1) {
      setPageIndex(0)
    }
  }, [pageIndex, totalPages])

  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1.5px solid #e5e7eb', paddingBottom: '14px', marginBottom: '24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>{title}</h2>
          {subtitle && <span style={{ fontSize: '12px', color: '#9ca3af' }}>{subtitle}</span>}
        </div>
        {/* 새로고침 — 목록 안에서 무작위로 다시 섞는다 */}
        <button
          onClick={reshuffle}
          disabled={papers.length <= CARDS_PER_PAGE}
          aria-label={`${title} 다시 섞기`}
          title="다른 논문 보기"
          style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: '#f3f4f6', border: 'none',
            cursor: papers.length <= CARDS_PER_PAGE ? 'default' : 'pointer',
            opacity: papers.length <= CARDS_PER_PAGE ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* 누를 때마다 한 바퀴 돌아 눌린 게 보이도록 */}
          <svg
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="#6b7280" strokeWidth="2" strokeLinecap="round"
            style={{
              transform: `rotate(${spin * 360}deg)`,
              transition: 'transform 0.5s ease',
            }}
          >
            <path d="M23 4v6h-6M1 20v-6h6"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
      </div>

      <div style={{ position: 'relative', padding: '0 40px' }}>
        {/* 이전 버튼 */}
        <button
          onClick={goPrev}
          disabled={papers.length <= CARDS_PER_PAGE}
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: papers.length <= CARDS_PER_PAGE ? 'default' : 'pointer',
            opacity: papers.length <= CARDS_PER_PAGE ? 0.3 : 1,
            zIndex: 2, padding: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* 논문 카드 3개 그리드 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
          {visiblePapers.map(paper => (
            <PaperCard
              key={paper.arxivId}
              paper={paper}
              bookmarked={!!bookmarks[paper.arxivId]}
              onBookmark={() => onBookmark(paper)}
              onClick={() => onCardClick(paper)}
            />
          ))}
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={goNext}
          disabled={papers.length <= CARDS_PER_PAGE}
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'none', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: papers.length <= CARDS_PER_PAGE ? 'default' : 'pointer',
            opacity: papers.length <= CARDS_PER_PAGE ? 0.3 : 1,
            zIndex: 2, padding: 0,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      {/* 페이지 인디케이터 도트 */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px' }}>
        <button onClick={goPrev} aria-label="이전 페이지" style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPageIndex(i)}
            style={{
              width: i === pageIndex ? '20px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === pageIndex ? MAIN : '#d1d5db',
              transition: 'all 0.2s',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
            aria-label={`${i + 1}번째 논문 카드 페이지로 이동`}
          />
        ))}
        <button onClick={goNext} aria-label="다음 페이지" style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

/* '분야 ⓘ' — 마우스를 올리거나 키보드 포커스가 오면 분야 약자 설명 말풍선을 띄운다.
   말풍선은 ⓘ 위쪽에 뜨고 아래로 꼬리가 향한다. */
function FieldInfoTip() {
  const [open, setOpen] = useState(false)

  // 말풍선 왼쪽 끝에서 꼬리까지의 거리 — 꼬리가 ⓘ 가운데를 가리키게 맞춘 값
  const TAIL_LEFT = 60
  const ICON_HALF = 9

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="분야 약자 설명"
        aria-expanded={open}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          display: 'flex', alignItems: 'center', lineHeight: 0,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke={open ? MAIN : 'rgba(60,60,67,0.4)'} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="9.5" />
          <path d="M12 10.5v6M12 7.4h.01" />
        </svg>
      </button>

      {open && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 12px)',
            left: ICON_HALF - TAIL_LEFT,
            width: '540px',
            // 창이 좁아도 화면 밖으로 잘리지 않게
            maxWidth: 'calc(100vw - 40px)',
            background: '#fff', borderRadius: '16px', padding: '14px 18px',
            boxShadow: '0 12px 36px rgba(15,23,42,0.16)',
            display: 'flex', flexDirection: 'column', gap: '5px',
            fontFamily: FONT,
            textAlign: 'left', zIndex: 50, cursor: 'default',
          }}
        >
          {FIELD_INFO.map(item => (
            <p key={item.name} style={{
              margin: 0, fontSize: '10px', lineHeight: 1.5, color: MUTED, fontWeight: 400,
            }}>
              <b style={{ fontWeight: 700 }}>{item.name} ({item.full}):</b>{' '}
              {item.desc}
            </p>
          ))}

          {/* 아래로 향하는 꼬리 */}
          <span style={{
            position: 'absolute', top: '100%', left: `${TAIL_LEFT}px`,
            width: 0, height: 0,
            borderLeft: '7px solid transparent',
            borderRight: '7px solid transparent',
            borderTop: '9px solid #fff',
            filter: 'drop-shadow(0 5px 3px rgba(15,23,42,0.06))',
          }} />
        </div>
      )}
    </span>
  )
}
