import { useState, useEffect, useSyncExternalStore } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PaperDetail from './PaperDetail'
import ReadStatusTag from '../components/ReadStatusTag'
import { isLoggedIn, getToken } from '../lib/auth'
import { subscribeReadStatus, getReadStatusSnapshot } from '../lib/readStatus'
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from '../lib/bookmarks'

const tags = ['SML', 'ML', 'CV', 'NLP', 'Robotics', 'Retrieval AI', 'SAP', 'HCI', 'Multimodal', 'Code AI']
const MAX_TAGS = 3 // 분야는 최대 3개까지 선택

// 논문 데이터 타입 정의 (백엔드 응답 형식과 일치해야 함)
export type Paper = {
  arxivId: string
  doi: string | null
  title: string
  authors: { id: number; name: string; authorId: string }[]
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
  abstract?: string
  publishedYear?: string
  pdfUrl?: string
}

function toPaper(hai: HaiPaper): Paper {
  return {
    arxivId: `hai-${hai.id}`,          // 카드 key 용 (북마크 API는 지원 안 함)
    doi: hai.doi ?? null,
    title: hai.title,
    authors: (hai.authors ?? []).map((name, i) => ({ id: i, name, authorId: String(i) })),
    abstract: hai.abstract ?? '',
    researchFields: hai.department ? [hai.department] : [],
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

export default function Papers() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [importance, setImportance] = useState<number | null>(null)          // 중요도: 1개만 (미선택 가능)
  const [period, setPeriod] = useState<'1y' | '3y' | '5y' | 'custom' | null>(null) // 연도: 1개만 (미선택 가능)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
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
     일반 논문과 응답 형태가 달라서(publishedYear, authors: string[], researchFields 없음)
     화면에서 쓰는 Paper 모양으로 변환해서 사용한다. */
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
    fetchPapers()  // 커서 없이 → 첫 페이지부터 현재 필터로 다시 조회
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
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
      boxSizing: 'border-box',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      <div style={{
        maxWidth: '1080px',
        margin: '0 auto',
        padding: '56px 40px 60px',
        boxSizing: 'border-box',
      }}>
        {/* Hero 섹션 */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.2 }}>
            내 분야 논문, 한 번에.
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
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
        <div style={{ display: 'flex', gap: '32px', marginBottom: '44px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>중요도</span>
              {importanceOptions.map(opt => {
                const active = importance === opt
                const dim = importance !== null && !active   // 다른 걸 고르면 연하게
                return (
                  <button key={opt} onClick={() => selectImportance(opt)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '3px',
                      padding: '5px 11px', borderRadius: '20px',
                      border: active ? '1.5px solid #00178E' : '1.5px solid #D7DCE5',
                      background: 'transparent', cursor: 'pointer',
                      opacity: dim ? 0.4 : 1,
                      transition: 'all 0.15s',
                    }}>
                    {Array.from({ length: opt }).map((_, i) => (
                      <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={active ? '#FBBF24' : '#cbd5e1'}>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>연도</span>
              {([['1y','최근 1년'],['3y','최근 3년'],['5y','최근 5년'],['custom','기간 설정']] as const).map(([key, label]) => {
                const active = period === key
                const dim = period !== null && !active   // 다른 걸 고르면 연하게
                return (
                  <button key={key} onClick={() => selectPeriod(key)} style={{
                    padding: '6px 14px', fontSize: '12px',
                    fontWeight: active ? 600 : 500,
                    borderRadius: '20px',
                    border: active ? '1.5px solid #00178E' : '1.5px solid #D7DCE5',
                    background: 'transparent',
                    color: active ? '#00178E' : '#6b7280', cursor: 'pointer',
                    opacity: dim ? 0.4 : 1,
                    transition: 'all 0.15s',
                  }}>{label}</button>
                )
              })}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0, paddingTop: '6px' }}>
              분야 <span style={{ fontSize: '11px', color: '#9ca3af' }}>(최대 3개)</span>
            </span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tags.map(tag => {
                const selected = selectedTags.includes(tag)
                const disabled = !selected && selectedTags.length >= MAX_TAGS  // 3개 꽉 차면 나머지 비활성
                return (
                  <button key={tag} onClick={() => toggleTag(tag)} disabled={disabled} style={{
                    padding: '6px 14px', fontSize: '12px',
                    fontWeight: selected ? 600 : 500,
                    borderRadius: '20px',
                    border: selected ? '1.5px solid #00178E' : '1.5px solid #D7DCE5',
                    background: 'transparent',
                    color: selected ? '#00178E' : '#6b7280',
                    opacity: disabled ? 0.4 : 1,
                    cursor: disabled ? 'default' : 'pointer', transition: 'all 0.15s',
                  }}>{tag}</button>
                )
              })}
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
        {/* 논문 목록 렌더링 */}
        {!loading && !error && (
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
              bookmarkable={false}
            />
            {/* hasNext가 true일 때만 더보기 버튼 표시 */}
            {hasNext && (
              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <button
                  onClick={() => nextCursor && fetchPapers(nextCursor)}
                  style={{
                    padding: '10px 28px', fontSize: '14px', fontWeight: 500,
                    background: '#3B6FE8', color: '#fff', border: 'none',
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
  title, subtitle, papers, bookmarks, onBookmark, onCardClick, bookmarkable = true,
}: {
  title: string
  subtitle?: string
  papers: Paper[]
  bookmarks: Record<string, unknown>   // lib/bookmarks 스냅샷 — 키가 있으면 북마크됨
  onBookmark: (paper: Paper) => void
  onCardClick: (paper: Paper) => void
  bookmarkable?: boolean               // false면 북마크 버튼을 숨김(휴먼AI 논문)
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {visiblePapers.map(paper => (
            <PaperCard
              key={paper.arxivId}
              paper={paper}
              bookmarked={!!bookmarks[paper.arxivId]}
              onBookmark={() => onBookmark(paper)}
              bookmarkable={bookmarkable}
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
              background: i === pageIndex ? '#3B6FE8' : '#d1d5db',
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
  paper, bookmarked, onBookmark, onClick, bookmarkable = true,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
  bookmarkable?: boolean
}) {
  const year = paper.publishedDate?.slice(0, 4) ?? '' // 출판연도 (앞 4자리)
  const chips = paper.researchFields ?? [] // 분야 칩 전체

  // 상세 페이지에서 지정한 읽음 상태 (localStorage 공유)
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot)
  const readStatus = readMap[paper.arxivId]?.status ?? null
  const authorsText = paper.authors?.slice(0, 3).map(a => a.name).join(', ') ?? '' // 저자 최대 3명

  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: '14px', padding: '18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '8px',
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
        {/* 읽음 상태 뱃지 — 상세 페이지에서 설정한 값. 없으면 빈 자리 */}
        <ReadStatusTag status={readStatus} />
        {/* 북마크 버튼 (카드 클릭 이벤트 전파 방지) — 휴먼AI 논문은 API 미지원이라 숨김 */}
        {bookmarkable && (
          <button
            onClick={e => { e.stopPropagation(); onBookmark() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24"
              fill={bookmarked ? '#3B6FE8' : 'none'}
              stroke={bookmarked ? '#3B6FE8' : '#9ca3af'}
              strokeWidth="2" strokeLinecap="round"
            >
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
        )}
      </div>

      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{year}</span>

      {/* 논문 제목 (최대 3줄) */}
      <p style={{
        fontSize: '13px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.title}
      </p>

      {/* 저자 (최대 1줄) */}
      <p style={{
        fontSize: '11px', color: '#9ca3af', margin: 0,
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {authorsText}
      </p>

      {/* 초록 (최대 3줄) */}
      <p style={{
        fontSize: '12px', color: '#6b7280', lineHeight: 1.6, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.abstract}
      </p>

      {/* 분야 칩 목록 */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
        {chips.map(chip => (
          <span key={chip} style={{
            fontSize: '11px', fontWeight: 500, color: '#00178E',
            background: 'transparent', border: '1.2px solid rgba(0,23,142,0.4)',
            borderRadius: '20px', padding: '3px 9px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}