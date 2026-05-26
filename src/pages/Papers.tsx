import { useState, useEffect } from 'react'
import PaperDetail from './PaperDetail'

const tags = ['SML', 'ML', 'CV', 'NLP', 'Robotics', 'Retrieval AI', 'SAP', 'HCI', 'Multimodal', 'Code AI']

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

const API_PREFIX = '/api'

const importanceLevels = [1, 2, 3, 4, 5]

export default function Papers() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [importance, setImportance] = useState(0)
  const [period, setPeriod] = useState<'1y' | '3y' | '5y' | 'custom'>('1y')
  const [searchValue, setSearchValue] = useState('')
  const [bookmarks, setBookmarks] = useState<Record<string, boolean>>({})
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasNext, setHasNext] = useState(false)

  useEffect(() => {
    fetchPapers()
  }, [])

  const fetchPapers = async (cursor?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (cursor) params.set('cursor', cursor)

      const query = params.toString()
      const url = `${API_PREFIX}/papers${query ? `?${query}` : ''}`

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text}`)
      }

      const json = await res.json()

      const fetched: Paper[] = Array.isArray(json)
        ? json
        : json.data ?? json.papers ?? []

      setPapers(prev => (cursor ? [...prev, ...fetched] : fetched))
      setNextCursor(Array.isArray(json) ? null : json.nextCursor ?? null)
      setHasNext(Array.isArray(json) ? false : json.hasNext ?? false)

      // 북마크 초기화
      setBookmarks(prev => ({
        ...prev,
        ...Object.fromEntries(
          fetched.map((p: Paper) => [p.arxivId, p.bookmarkCount > 0])
        ),
      }))
    } catch (e) {
      console.error('논문 불러오기 실패:', e)
      setError('논문을 불러오는 데 실패했습니다. 콘솔에서 API 주소 또는 CORS 오류를 확인해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleBookmark = (arxivId: string) => {
    setBookmarks(prev => ({ ...prev, [arxivId]: !prev[arxivId] }))
  }

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
        maxWidth: '960px',
        margin: '0 auto',
        padding: '56px 48px 48px',
        boxSizing: 'border-box',
      }}>
        {/* Hero */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.2 }}>
            내 분야 논문, 한 번에.
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
            관심 분야를 고르면 최신 트렌드 논문을 정리해드려요.
          </p>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px' }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center',
            background: '#fff', borderRadius: '14px', border: '1.5px solid #e5e7eb',
            padding: '12px 18px', boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          }}>
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="제목/저자/키워드를 입력하세요."
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }}
            />
            <button style={{
              width: '36px', height: '36px', background: '#3B6FE8',
              border: 'none', borderRadius: '9px', display: 'flex',
              alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
            }}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.5">
                <circle cx="11" cy="11" r="7"/>
                <path d="M16.5 16.5L21 21" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <div style={{
            width: '46px', height: '46px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #a855f7, #ec4899)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: '17px', flexShrink: 0,
            boxShadow: '0 2px 10px rgba(168,85,247,0.35)',
          }}>W</div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '44px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>중요도</span>
              {importanceLevels.map(level => (
                <button key={level} onClick={() => setImportance(level)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={level <= importance ? '#3B6FE8' : '#d1d5db'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>연도</span>
              {([['1y','최근 1년'],['3y','최근 3년'],['5y','최근 5년'],['custom','기간 설정']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setPeriod(key)} style={{
                  padding: '5px 13px', fontSize: '12px', fontWeight: 500,
                  borderRadius: '20px', border: '1.5px solid',
                  borderColor: period === key ? '#3B6FE8' : '#d1d5db',
                  background: period === key ? '#EEF3FF' : 'transparent',
                  color: period === key ? '#3B6FE8' : '#6b7280', cursor: 'pointer',
                }}>{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0, paddingTop: '6px' }}>분야</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)} style={{
                  padding: '5px 13px', fontSize: '12px', fontWeight: 500,
                  borderRadius: '20px', border: '1.5px solid',
                  borderColor: selectedTags.includes(tag) ? '#3B6FE8' : '#d1d5db',
                  background: selectedTags.includes(tag) ? '#3B6FE8' : 'transparent',
                  color: selectedTags.includes(tag) ? '#fff' : '#6b7280',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{tag}</button>
              ))}
            </div>
          </div>
        </div>

        {/* 논문 목록 */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: '14px' }}>
            논문을 불러오는 중...
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#ef4444', fontSize: '14px' }}>
            {error}
          </div>
        )}
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
  const CARDS_PER_PAGE = 3
  const [pageIndex, setPageIndex] = useState(0)

  const totalPages = Math.max(1, Math.ceil(papers.length / CARDS_PER_PAGE))

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

      <div style={{ position: 'relative', padding: '0 32px' }}>
        <button
          onClick={goPrev}
          disabled={papers.length <= CARDS_PER_PAGE}
          style={{
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#fff', border: '1.5px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: papers.length <= CARDS_PER_PAGE ? 'default' : 'pointer',
            opacity: papers.length <= CARDS_PER_PAGE ? 0.35 : 1,
            zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

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

        <button
          onClick={goNext}
          disabled={papers.length <= CARDS_PER_PAGE}
          style={{
            position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)',
            width: '28px', height: '28px', borderRadius: '50%',
            background: '#fff', border: '1.5px solid #e5e7eb',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: papers.length <= CARDS_PER_PAGE ? 'default' : 'pointer',
            opacity: papers.length <= CARDS_PER_PAGE ? 0.35 : 1,
            zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
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
      </div>
    </div>
  )
}

function PaperCard({
  paper, bookmarked, onBookmark, onClick,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
}) {
  const year = paper.publishedDate?.slice(0, 4) ?? ''
  const tag = paper.researchFields?.[0]?.name ?? ''
  const chips = paper.researchFields?.map(f => f.name) ?? []
  const authorsText = paper.authors?.slice(0, 3).map(a => a.name).join(', ') ?? ''

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
        <span style={{
          fontSize: '11px', fontWeight: 600, color: '#6b7280',
          background: '#f3f4f6', borderRadius: '6px', padding: '3px 8px',
        }}>
          {tag}
        </span>
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

      <p style={{
        fontSize: '13px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.title}
      </p>

      <p style={{
        fontSize: '11px', color: '#9ca3af', margin: 0,
        display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {authorsText}
      </p>

      <p style={{
        fontSize: '12px', color: '#6b7280', lineHeight: 1.6, margin: 0,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.abstract}
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
        {chips.map(chip => (
          <span key={chip} style={{
            fontSize: '11px', fontWeight: 500, color: '#3B6FE8', background: '#EEF3FF',
            borderRadius: '20px', padding: '3px 9px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}
