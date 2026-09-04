import { useState, useEffect, useMemo, useSyncExternalStore } from 'react'
import { pageContainer, PAGE_TOP, pageTitle, pageSubtitle, HERO_GAP, INK, INK_80 } from '../styles/pageTheme'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PaperDetail from './PaperDetail'
import ReadStatusTag from '../components/ReadStatusTag'
import { isLoggedIn, getToken } from '../lib/auth'
import { subscribeReadStatus, getReadStatusSnapshot } from '../lib/readStatus'
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from '../lib/bookmarks'

/* 분야 태그 — 피그마와 같은 줄 구성으로 고정한다.
   폭에 맡겨 자동 줄바꿈시키면 컨테이너가 1000px(피그마 1440 대비 좁음)이라
   Retrieval AI 가 첫 줄에 붙어버려서, 줄 묶음을 코드에서 직접 정한다. */
const TAG_ROWS = [
  ['SML', 'ML', 'CV', 'NLP', 'Robotics'],
  ['Retrieval AI', 'SAP', 'HCI', 'Multimodal'],
  ['Code AI'],
] as const
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
  border: `1.2px solid ${selected ? '#00178E' : 'transparent'}`,
  fontWeight: selected ? 600 : 500,
  color: selected ? '#00178E' : INK,
})

// 필터 줄 라벨 (중요도 / 연도 / 분야) — Pretendard Medium 16 / #3C3C43
const filterLabel = { fontSize: '16px', fontWeight: 500, color: INK, flexShrink: 0 } as const

const STAR_ON = '#FFF188'   // 선택된 중요도 별
const STAR_OFF = INK_80     // 미선택 별 (#3C3C43 80%)

/* 논문 카드 (피그마 기준) — 높이 255 / 내부 항목 간격 12
   제목 Pretendard Medium 16 · 행간 19, 본문 Regular 12 · 행간 16
   분야 태그 좌우패딩 8 · 상하패딩 6, 태그 간 간격 10 */
const CARD_HEIGHT = '255px'
const CARD_GAP = '12px'
const CARD_TITLE = { fontSize: '16px', fontWeight: 500, lineHeight: '19px' } as const
const CARD_BODY = { fontSize: '12px', fontWeight: 400, lineHeight: '16px' } as const
const CHIP_GAP = '10px'
const BOOKMARK_ON = 'rgba(59,130,246,0.7)'   // #3B82F6 70%
const MAIN_NAVY = '#00178E'                  // 페이지네이션 · 더보기 버튼 메인컬러

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

  const fetchPapers = async (cursor?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor) // 더보기 클릭 시 커서 파라미터 추가

      // 키워드 검색 (keyword=Qwen → 결과 좁혀짐, 백엔드는 최소 2글자 요구)
      if (searchValue.trim()) params.set('keyword', searchValue.trim())

      // 분야: UI 태그가 백엔드 코드와 동일(AI/CV/NLP…) → 그대로 반복 파라미터로 전송 (OR 필터)
      selectedTags.forEach(tag => params.append('tags', tag))

      // 중요도: starTier(1~3)
      if (importance != null) params.set('starTier', String(importance))

      // 연도: 최근 N년 (기간 직접 설정 'custom'은 날짜 입력 UI가 없어 아직 미연결)
      const yearRange = period === '1y' ? 1 : period === '3y' ? 3 : period === '5y' ? 5 : null
      if (yearRange) params.set('yearRange', String(yearRange))

      const query = params.toString()
      // 실제 요청 URL: /api/papers → vite proxy → ngrok → 백엔드
      const url = `${API_PREFIX}/papers${query ? `?${query}` : ''}`

      const res = await fetch(url, {
        method: 'GET',
        headers: authHeaders(), // /papers 는 토큰이 필요함 (없으면 401)
      })

      // ✅ Network 탭에서 Status 200이면 연결 성공
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const json = await res.json()
      // ✅ 데이터 확인하려면 아래 주석 해제 → F12 Console 탭에서 확인해라!!
       console.log('📦 받아온 데이터:', json)

      // 백엔드 응답이 배열이면 그대로, 아니면 data/papers 필드에서 추출
      const fetched: Paper[] = Array.isArray(json)
        ? json
        : json.data ?? json.papers ?? []

      // 더보기면 기존 목록에 추가, 첫 로드면 새로 세팅
      setPapers(prev => (cursor ? [...prev, ...fetched] : fetched))
      setNextCursor(Array.isArray(json) ? null : json.nextCursor ?? null)
      setHasNext(Array.isArray(json) ? false : json.hasNext ?? false)

      // 북마크 상태는 lib/bookmarks 에서 /users/me 기준으로 관리함
    } catch (e) {
      // ❌ 실패 시 여기서 에러 출력 → F12 Console 탭에서 확인
      console.error('논문 불러오기 실패:', e)
      setError('논문을 불러오는 데 실패했습니다. 콘솔에서 API 주소 또는 CORS 오류를 확인해주세요.')
    } finally {
      setLoading(false)
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

  // 돋보기 버튼(또는 Enter)을 눌러야 현재 선택된 필터로 검색 적용
  const handleSearch = () => {
    setSearched(true)   // 캐러셀 2개 → 검색 결과 그리드로 전환
    setSort('all')
    setResultPage(0)
    fetchPapers()  // 커서 없이 → 첫 페이지부터 현재 필터로 다시 조회
  }

  /* 검색 결과 정렬 — 백엔드에 정렬 파라미터가 없어서 받아온 목록에서 처리한다.
     '전체'는 백엔드가 준 순서 그대로. */
  const sortedResults = useMemo(() => {
    if (sort === 'all') return papers
    const list = [...papers]
    if (sort === 'recent') {
      list.sort((a, b) => (b.publishedDate ?? '').localeCompare(a.publishedDate ?? ''))
    } else {
      list.sort((a, b) => (b.citationCount ?? 0) - (a.citationCount ?? 0))
    }
    return list
  }, [papers, sort])

  const totalResultPages = Math.max(1, Math.ceil(sortedResults.length / RESULTS_PER_PAGE))
  const pageResults = sortedResults.slice(
    resultPage * RESULTS_PER_PAGE,
    resultPage * RESULTS_PER_PAGE + RESULTS_PER_PAGE,
  )

  /* 페이지 이동. 마지막 페이지까지 왔는데 서버에 더 있으면(hasNext) 커서로 이어서 받아온다. */
  const goResultPage = (next: number) => {
    const clamped = Math.max(0, Math.min(next, totalResultPages - 1))
    setResultPage(clamped)
    if (clamped >= totalResultPages - 1 && hasNext && nextCursor && !loading) {
      void fetchPapers(nextCursor)
    }
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
          border: searchFocused ? '2px solid #00178E' : '1.5px solid #e5e7eb',
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
            width: '44px', height: '44px', background: '#00178E',
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
              <button
                type="button"
                aria-label="분야는 최대 3개까지 선택할 수 있습니다"
                title="분야는 최대 3개까지 선택할 수 있습니다"
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', lineHeight: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                  stroke="rgba(60,60,67,0.4)" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="9.5" />
                  <path d="M12 10.5v6M12 7.4h.01" />
                </svg>
              </button>
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
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: INK, margin: '0 0 14px' }}>
              회원님이 선택한 조건에 맞는 검색 결과입니다.
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
                    color: active ? '#00178E' : 'rgba(60,60,67,0.4)',
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
                  onClick={() => nextCursor && fetchPapers(nextCursor)}
                  style={{
                    padding: '10px 28px', fontSize: '14px', fontWeight: 500,
                    background: MAIN_NAVY, color: '#fff', border: 'none',
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
              color: i === page ? MAIN_NAVY : INK_80,
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
            background: '#00178E', color: '#fff',
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

  const totalPages = Math.max(1, Math.ceil(papers.length / CARDS_PER_PAGE))

  // 현재 페이지에 보여줄 논문만 슬라이싱
  const visiblePapers = papers.slice(
    pageIndex * CARDS_PER_PAGE,
    pageIndex * CARDS_PER_PAGE + CARDS_PER_PAGE
  )

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
        {/* 새로고침 버튼 (현재는 UI만 있고 기능 미연결) */}
        <button style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#f3f4f6', border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round">
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
              background: i === pageIndex ? MAIN_NAVY : '#d1d5db',
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

// 개별 논문 카드 컴포넌트
function PaperCard({
  paper, bookmarked, onBookmark, onClick,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
}) {
  const year = paper.publishedDate?.slice(0, 4) ?? '' // 출판연도 (앞 4자리)
  const chips = paper.researchFields ?? [] // 분야 칩 전체

  // 상세 페이지에서 지정한 읽음 상태 (localStorage 공유)
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot)
  const readStatus = readMap[paper.arxivId]?.status ?? null

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: '14px', padding: '16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
        /* 피그마 기준 카드 높이 255. 그리드가 한 줄의 카드 높이를 맞춰주므로
           minHeight 로 두면 태그가 두 줄이 돼도 잘리지 않고 한 줄 전체가 함께 늘어난다.
           내부 항목 간격은 피그마와 동일하게 12px */
        minHeight: CARD_HEIGHT, boxSizing: 'border-box', minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: CARD_GAP,
        cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(59,111,232,0.13)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* 읽음 상태 뱃지 — 상세 페이지에서 설정한 값. 아직 없으면 '읽기 전' 기본 상태 */}
        <ReadStatusTag status={readStatus} showDefault />
        {/* 북마크 버튼 (카드 클릭 이벤트 전파 방지)
            휴먼AI 논문도 POST /papers/hai-papers/{id}/bookmark 로 토글된다 */}
        <button
          onClick={e => { e.stopPropagation(); onBookmark() }}
          aria-label={bookmarked ? '북마크 해제' : '북마크'}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', lineHeight: 0 }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24"
            fill={bookmarked ? BOOKMARK_ON : 'none'}
            stroke={bookmarked ? BOOKMARK_ON : 'rgba(60,60,67,0.4)'}
            strokeWidth="2" strokeLinecap="round"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
          </svg>
        </button>
      </div>

      <span style={{ fontSize: '11px', lineHeight: '13px', color: '#9ca3af' }}>{year}</span>

      {/* 논문 제목 (최대 2줄) — Pretendard Medium 16 / 행간 19 */}
      <p style={{
        ...CARD_TITLE, color: INK, margin: 0,
        // 긴 단어가 그리드 컬럼 폭을 밀어내지 않도록 (카드 폭 균일 유지)
        minWidth: 0, overflowWrap: 'anywhere',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.title}
      </p>

      {/* 제목과 초록 사이 구분선 (피그마 367:220 Divider) — 저자는 카드에 노출하지 않는다 */}
      <div style={{ height: '1.2px', background: 'rgba(60,60,67,0.4)', width: '100%', flexShrink: 0 }} />

      {/* 초록 (최대 3줄) — Pretendard Regular 12 / 행간 16 */}
      <p style={{
        ...CARD_BODY, color: INK_80, margin: 0,
        minWidth: 0, overflowWrap: 'anywhere',
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.abstract}
      </p>

      {/* 분야 칩 목록 — 카드 높이가 고정이라 marginTop:auto 로 아래에 붙인다 */}
      <div style={{ display: 'flex', gap: CHIP_GAP, flexWrap: 'wrap', marginTop: 'auto' }}>
        {chips.map(chip => (
          <span key={chip} style={{
            fontSize: '11px', fontWeight: 500, lineHeight: '13px', color: MAIN_NAVY,
            background: 'transparent', border: '1.2px solid rgba(0,23,142,0.4)',
            borderRadius: '20px', padding: '6px 8px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}