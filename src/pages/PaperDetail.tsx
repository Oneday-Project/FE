import { useState, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import type { Paper } from './Papers'

export default function PaperDetail({
  paper,
  allPapers,
  onBack,
}: {
  paper: Paper
  allPapers: Paper[]
  onBack: () => void
}) {
  const [bookmarked, setBookmarked] = useState(paper.bookmarkCount > 0)
  const [readStatus, setReadStatus] = useState<'reading' | 'done' | null>(null) // 읽는 중 / 읽기 완료 (하나만, 미선택 가능)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [abstractKo, setAbstractKo] = useState<string | null>(null)
  const [takeaways, setTakeaways] = useState<{ what: string; how: string; soWhat: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const year = getYear(paper.publishedDate)
  const chips = getFieldNames(paper)
  const authorsText = getAuthorsText(paper)
  const doiText = paper.doi || paper.arxivId || '-'
  const importance = clampStarTier(paper.starTier)

  const relatedPapers = useMemo(() => {
    return allPapers
      .filter(p => p.arxivId !== paper.arxivId)
      .slice(0, 3)
  }, [allPapers, paper.arxivId])

  useEffect(() => {
    setBookmarked(paper.bookmarkCount > 0)
  }, [paper.arxivId, paper.bookmarkCount])

  useEffect(() => {
    setLoading(true)

    /*
      지금 Papers.tsx의 API 응답에는 aiSummary, abstractKo, takeaways가 없어서
      화면이 깨지지 않도록 abstract 기반 fallback을 넣어둔 상태야.

      나중에 백엔드에서 요약 API가 생기면 여기만 fetch로 교체하면 됨.
      예:
      const res = await fetch(`${BASE_URL}/papers/${paper.arxivId}/summary`)
    */

    const fallback = buildFallbackAIContent(paper)

    setAiSummary(fallback.aiSummary)
    setAbstractKo(fallback.abstractKo)
    setTakeaways(fallback.takeaways)
    setLoading(false)
  }, [paper.arxivId, paper.title, paper.abstract])

  const baseStyle: CSSProperties = {
    fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  }

  return (
    <div style={{
      ...baseStyle,
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
      boxSizing: 'border-box',
    }}>
      {/* Back button */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '20px 48px 0' }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '13px',
            color: '#6b7280',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '0',
            marginBottom: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          논문 목록으로
        </button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '12px 48px 64px' }}>

        {/* Title(왼쪽) + Meta 알약(오른쪽) */}
        <div style={{ display: 'flex', gap: '28px', marginBottom: '36px', alignItems: 'flex-start' }}>

          {/* Left: 제목 · 저자 · 액션 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: '22px', fontWeight: 800, color: '#1a1a1a',
              lineHeight: 1.4, marginBottom: '14px',
            }}>
              {paper.title}
            </h1>

            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '4px' }}>
              발행연도 &nbsp;<strong style={{ color: '#6b7280', fontWeight: 600 }}>{year}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginBottom: '14px' }}>
              저자 &nbsp;<strong style={{ color: '#6b7280', fontWeight: 600 }}>{authorsText}</strong>
            </p>

            {/* 북마크 / 링크 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <IconBtn onClick={() => setBookmarked(b => !b)} active={bookmarked}>
                <svg width="15" height="15" viewBox="0 0 24 24"
                  fill={bookmarked ? '#3B6FE8' : 'none'}
                  stroke={bookmarked ? '#3B6FE8' : '#9ca3af'}
                  strokeWidth="2" strokeLinecap="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </IconBtn>

              <IconBtn onClick={() => { if (paper.pdfUrl) window.open(paper.pdfUrl, '_blank') }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                  <circle cx="18" cy="5" r="3" />
                  <circle cx="6" cy="12" r="3" />
                  <circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
              </IconBtn>
            </div>

            {/* 읽는 중 / 읽기 완료 — 하나만 선택 (다시 누르면 해제) */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <ReadStatusBtn
                active={readStatus === 'reading'}
                onClick={() => setReadStatus(s => (s === 'reading' ? null : 'reading'))}
                activeColor="#15803D" activeBg="#E7F6EC" activeBorder="#22C55E"
                icon={
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" />
                  </svg>
                }
              >
                읽는 중
              </ReadStatusBtn>
              <ReadStatusBtn
                active={readStatus === 'done'}
                onClick={() => setReadStatus(s => (s === 'done' ? null : 'done'))}
                activeColor="#B45309" activeBg="#FEF3C7" activeBorder="#FBBF24"
              >
                읽기 완료
              </ReadStatusBtn>
            </div>
          </div>

          {/* Right: 메타 알약 (중요도 · 태그 · DOI) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '236px', flexShrink: 0 }}>
            {/* 중요도 */}
            <MetaPill label="중요도" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            }>
              <div style={{ display: 'flex', gap: '2px' }}>
                {Array.from({ length: importance }).map((_, i) => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill="#FBBF24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
            </MetaPill>

            {/* 태그 */}
            <MetaPill label="태그" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                <line x1="7" y1="7" x2="7.01" y2="7" />
              </svg>
            }>
              {chips.length > 0 ? (
                chips.map(chip => (
                  <span key={chip} style={{
                    fontSize: '10px', padding: '2px 8px', background: '#fff',
                    color: '#3B6FE8', borderRadius: '20px', border: '1px solid #c7d7fb',
                  }}>{chip}</span>
                ))
              ) : (
                <span style={{ fontSize: '11px', color: '#9ca3af' }}>태그 없음</span>
              )}
            </MetaPill>

            {/* DOI */}
            <MetaPill label="DOI" icon={
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            }>
              <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all', textAlign: 'right' }}>
                {doiText}
              </span>
            </MetaPill>
          </div>
        </div>

        {/* 이 논문을 왜 읽어야 할까요? */}
        <Section title="이 논문을 왜 읽어야 할까요?" subtitle="관심 분야 기준으로 핵심 내용을 요약했어요.">
          <p style={{ fontSize: '14px', color: '#374151', lineHeight: 1.75, margin: 0 }}>
            {loading ? <Skeleton /> : aiSummary}
          </p>
        </Section>

        {/* Abstract */}
        <Section title="Abstract">
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B6FE8', marginBottom: '8px' }}>EN</div>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, margin: 0 }}>
              {paper.abstract || 'Abstract 정보가 없습니다.'}
            </p>

            <hr style={{ border: 'none', borderTop: '1px solid #E3E8F5', margin: '18px 0' }} />

            <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B6FE8', marginBottom: '8px' }}>KO</div>
            <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, margin: 0, minHeight: '40px' }}>
              {loading ? <Skeleton /> : abstractKo}
            </p>
          </div>
        </Section>

        {/* Key Takeaways */}
        <Section title="Key Takeaways">
          <div>
            {(['what', 'how', 'soWhat'] as const).map((key, idx) => {
              const labels = { what: 'WHAT', how: 'HOW', soWhat: 'IMPACT' }
              return (
                <div key={key}>
                  {idx > 0 && <hr style={{ border: 'none', borderTop: '1px solid #E3E8F5', margin: '18px 0' }} />}
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B6FE8', marginBottom: '8px' }}>
                    {labels[key]}
                  </div>
                  <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.75, margin: 0, minHeight: '24px' }}>
                    {loading ? <Skeleton /> : takeaways?.[key]}
                  </p>
                </div>
              )
            })}
          </div>
        </Section>

        {/* 구분선 */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

        {/* 최근 동향 논문 */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px' }}>
            함께 보면 좋은 논문
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {relatedPapers.map(rp => (
              <RelatedCard key={rp.arxivId} paper={rp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaPill({ label, icon, children }: { label: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      background: '#EDF1FB',
      borderRadius: '999px',
      padding: '6px 14px 6px 6px',
      minHeight: '38px',
    }}>
      {/* 파란 원형 아이콘 */}
      <span style={{
        width: '26px', height: '26px', borderRadius: '50%',
        background: '#3B6FE8', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 600, flexShrink: 0 }}>
        {label}
      </span>
      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center',
        gap: '4px', flexWrap: 'wrap', justifyContent: 'flex-end',
      }}>
        {children}
      </div>
    </div>
  )
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div style={{
      background: '#F4F6FD',
      borderRadius: '16px',
      padding: '22px 26px',
      marginBottom: '16px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: subtitle ? '4px' : '16px' }}>
        {/* 파란 스파클 아이콘 */}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#3B6FE8">
          <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
        </svg>
        <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#3B6FE8', margin: 0 }}>
          {title}
        </h3>
      </div>
      {subtitle && (
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 14px', paddingLeft: '20px' }}>
          {subtitle}
        </p>
      )}
      {children}
    </div>
  )
}

function IconBtn({
  onClick,
  children,
  active,
}: {
  onClick: () => void
  children: ReactNode
  active?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '32px',
        height: '32px',
        borderRadius: '8px',
        border: `1px solid ${active ? '#c7d7fb' : '#e5e7eb'}`,
        background: active ? '#EEF3FF' : '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

function ReadStatusBtn({
  active,
  onClick,
  children,
  icon,
  activeColor,
  activeBg,
  activeBorder,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon?: ReactNode
  activeColor: string
  activeBg: string
  activeBorder: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
        padding: '7px 16px',
        fontSize: '12px',
        fontWeight: active ? 700 : 600,
        borderRadius: '20px',
        border: `1.5px solid ${active ? activeBorder : '#D7DCE5'}`,
        background: active ? activeBg : '#fff',
        color: active ? activeColor : '#9ca3af',
        cursor: 'pointer',
        transition: 'all 0.15s',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function Skeleton() {
  return (
    <div style={{
      height: '16px',
      background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
      backgroundSize: '200% 100%',
      borderRadius: '6px',
      animation: 'shimmer 1.5s infinite',
    }}>
      <style>
        {`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}
      </style>
    </div>
  )
}

function RelatedCard({ paper }: { paper: Paper }) {
  const year = getYear(paper.publishedDate)
  const chips = getFieldNames(paper)
  const tag = chips[0] ?? '분야 없음'

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '14px',
        border: '1px solid #e5e7eb',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(59,111,232,0.1)'
      }}
      onMouseLeave={e => {
        ;(e.currentTarget as HTMLDivElement).style.boxShadow = 'none'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{
          fontSize: '11px',
          padding: '2px 8px',
          background: '#f3f4f6',
          color: '#6b7280',
          borderRadius: '6px',
        }}>
          {tag}
        </span>

        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>

      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>
        {year}
      </div>

      <p style={{
        fontSize: '12px',
        fontWeight: 600,
        color: '#1a1a1a',
        lineHeight: 1.5,
        margin: '0 0 8px',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as CSSProperties}>
        {paper.title}
      </p>

      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {chips.map(chip => (
          <span
            key={chip}
            style={{
              fontSize: '10px',
              padding: '2px 6px',
              background: '#EEF3FF',
              color: '#3B6FE8',
              borderRadius: '20px',
            }}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function getYear(date?: string) {
  if (!date) return '연도 정보 없음'
  return date.slice(0, 4)
}

function getFieldNames(paper: Paper) {
  return paper.researchFields?.map(field => field.name).filter(Boolean) ?? []
}

function getAuthorsText(paper: Paper) {
  const authors = paper.authors?.map(author => author.name).filter(Boolean) ?? []

  if (authors.length === 0) return '저자 정보 없음'
  if (authors.length <= 3) return authors.join(', ')

  return `${authors.slice(0, 3).join(', ')} 외 ${authors.length - 3}명`
}

function clampStarTier(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 3
  return Math.max(1, Math.min(5, Math.round(value)))
}

function buildFallbackAIContent(paper: Paper) {
  const abstract = paper.abstract?.trim()
  const title = paper.title?.trim()

  const firstSentence = abstract
    ? abstract.split(/(?<=[.!?])\s+/)[0]
    : ''

  return {
    aiSummary: firstSentence
      ? truncate(firstSentence, 140)
      : `${title}에 대한 핵심 내용을 확인할 수 있는 논문입니다.`,

    abstractKo: abstract
      ? '번역 API 연결 전이므로 현재는 원문 Abstract를 기준으로 내용을 확인하세요.'
      : 'Abstract 정보가 없습니다.',

    takeaways: {
      what: title
        ? `"${truncate(title, 80)}" 주제를 중심으로 한 연구입니다.`
        : '이 논문이 다루는 주제 정보를 불러오지 못했습니다.',

      how: abstract
        ? '논문의 Abstract를 기반으로 문제 정의, 접근 방식, 실험 또는 분석 내용을 확인할 수 있습니다.'
        : '방법론 정보가 아직 제공되지 않았습니다.',

      soWhat: paper.citationCount || paper.influenceScore
        ? `인용수 ${paper.citationCount ?? 0}, 영향도 ${paper.influenceScore ?? 0} 정보를 함께 참고해 중요도를 판단할 수 있습니다.`
        : '관련 분야의 흐름을 파악하는 데 참고할 수 있는 논문입니다.',
    },
  }
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}