import { useState, useEffect } from 'react'
import PaperDetail from './PaperDetail'

const tags = ['SML', 'ML', 'CV', 'NLP', 'Robotics', 'Retrieval AI', 'SAP', 'HCI', 'Multimodal', 'Code AI']
const MAX_TAGS = 3 // 분야는 최대 3개까지 선택

// 논문 데이터 타입 정의 (백엔드 응답 형식과 일치해야 함)
export type Paper = {
  arxivId: string
  doi: string | null
  title: string
  authors: { id: number; name: string; authorId: string }[]
  abstract: string
  researchFields: { id: number; name: string }[]
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

const importanceOptions = [1, 2, 3]

export default function Papers() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [importance, setImportance] = useState<number | null>(null)          // 중요도: 1개만 (미선택 가능)
  const [period, setPeriod] = useState<'1y' | '3y' | '5y' | 'custom' | null>(null) // 연도: 1개만 (미선택 가능)
  const [searchValue, setSearchValue] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null) // 다음 페이지 커서
  const [hasNext, setHasNext] = useState(false) // 더보기 버튼 표시 여부

  // 컴포넌트 처음 마운트될 때 논문 자동 불러오기
  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async (cursor?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor) // 더보기 클릭 시 커서 파라미터 추가

      // 키워드 검색: 백엔드에서 동작 확인됨 (keyword=Qwen → 결과 좁혀짐)
      if (searchValue.trim()) params.set('keyword', searchValue.trim())

      // ⚠️ 분야/중요도/연도: 백엔드 파라미터명이 아직 미확정이라 전송 보류.
      //   - 분야: 백엔드는 arXiv 코드(cs.AI, cs.CV …)를 쓰므로 UI 태그(SML/CV…)와 매핑 필요
      //   - 중요도: starTier(1~3) 로 추정되나 필터 파라미터명 미확인
      //   - 연도: publishedDate 기준, 파라미터 형식 미확인
      //   → Swagger의 GET /papers "Parameters"에서 실제 이름 확인되면 아래처럼 연결:
      // if (selectedTags.length) params.set('<분야파라미터>', selectedTags.map(uiTagToArxiv).join(','))
      // if (importance != null) params.set('<중요도파라미터>', String(importance))
      // if (period) params.set('<연도파라미터>', period)

      const query = params.toString()
      // 실제 요청 URL: /api/papers → vite proxy → ngrok → 백엔드
      const url = `${API_PREFIX}/papers${query ? `?${query}` : ''}`

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true', // ngrok 경고 페이지 스킵
        },
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

      // 북마크 초기화 (bookmarkCount > 0이면 북마크된 것으로 표시)
      setBookmarks(prev => ({
        ...prev,
        ...Object.fromEntries(
          fetched.map((p: Paper) => [p.arxivId, p.bookmarkCount > 0])
        ),
      }))
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

  // 북마크 토글 (현재는 로컬 상태만 변경, 백엔드 연동 필요하면 API 호출 추가)
  const toggleBookmark = (arxivId: string) => {
    setBookmarks(prev => ({ ...prev, [arxivId]: !prev[arxivId] }))
  }

  // 논문 카드 클릭 시 상세 페이지로 전환
  if (selectedPaper) {
    return (
      <PaperDetail
        paper={selectedPaper}
        allPapers={papers}
        onBack={() => setSelectedPaper(null)}
      />
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
              onBookmark={toggleBookmark}
              onCardClick={setSelectedPaper}
            />
            <div style={{ height: '48px' }} />
            <PaperSection
              title="휴먼AI공학전공 논문"
              subtitle="최신 동향 반영을 위해 최근 3년 이내 논문을 중심으로 제공합니다."
              papers={papers}
              bookmarks={bookmarks}
              onBookmark={toggleBookmark}
              onCardClick={setSelectedPaper}
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
  bookmarks: Record<string, boolean>
  onBookmark: (id: string) => void
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {visiblePapers.map(paper => (
            <PaperCard
              key={paper.arxivId}
              paper={paper}
              bookmarked={bookmarks[paper.arxivId] ?? false}
              onBookmark={() => onBookmark(paper.arxivId)}
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
  paper, bookmarked, onBookmark, onClick,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
}) {
  const year = paper.publishedDate?.slice(0, 4) ?? '' // 출판연도 (앞 4자리)
  const tag = paper.researchFields?.[0]?.name ?? '' // 첫 번째 분야 태그
  const chips = paper.researchFields?.map(f => f.name) ?? [] // 분야 칩 전체
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
        {/* 분야 태그 뱃지 */}
        <span style={{
          fontSize: '11px', fontWeight: 600, color: '#3DA35D',
          background: '#E6F6EC', border: '1px solid #BFE7CC',
          borderRadius: '7px', padding: '3px 9px',
        }}>
          {tag || '논문태그'}
        </span>
        {/* 북마크 버튼 (카드 클릭 이벤트 전파 방지) */}
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