import { useState, useEffect } from 'react'

// Papers.tsx의 mockPapers와 동일한 타입
export type Paper = {
  id: number
  year: number
  tag: string
  title: string
  summary: string
  chips: string[]
  bookmarked: boolean
}

// Papers.tsx에서 navigate 대신 이 컴포넌트를 사용하는 경우
// props로 paper와 onBack을 받습니다
export default function PaperDetail({
  paper,
  allPapers,
  onBack,
}: {
  paper: Paper
  allPapers: Paper[]
  onBack: () => void
}) {
  const [bookmarked, setBookmarked] = useState(paper.bookmarked)
  const [aiSummary, setAiSummary] = useState<string | null>(null)
  const [abstractKo, setAbstractKo] = useState<string | null>(null)
  const [takeaways, setTakeaways] = useState<{ what: string; how: string; soWhat: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // 랜덤 3개 논문 (현재 논문 제외)
  const relatedPapers = allPapers
    .filter(p => p.id !== paper.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)

  // 중요도: 임시로 title 길이 기반 1~5 (실제로는 paper.importance 같은 필드 사용)
  const importance = 3

  // AI 연동 - AI 요약 + Abstract KO + Key Takeaways
  useEffect(() => {
    const fetchAI = async () => {
      setLoading(true)
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: `다음 논문 정보를 기반으로 JSON만 반환해. 다른 텍스트나 마크다운 없이 순수 JSON만.

논문 제목: ${paper.title}
논문 요약: ${paper.summary}

반환 형식:
{
  "aiSummary": "한 문장 핵심 요약 (40자 내외)",
  "abstractKo": "한국어 abstract (100자 내외)",
  "takeaways": {
    "what": "이 논문이 무엇을 다루는지 (공백 포함 119자)",
    "how": "어떤 방법으로 해결했는지 (공백 포함 119자)",
    "soWhat": "왜 중요한지 시사점 (공백 포함 119자)"
  }
}`,
              },
            ],
          }),
        })
        const data = await res.json()
        const text = data.content?.map((c: { type: string; text?: string }) => c.text || '').join('')
        const clean = text.replace(/```json|```/g, '').trim()
        const parsed = JSON.parse(clean)
        setAiSummary(parsed.aiSummary)
        setAbstractKo(parsed.abstractKo)
        setTakeaways(parsed.takeaways)
      } catch (e) {
        setAiSummary('AI 요약을 불러오는 중 오류가 발생했습니다.')
        setAbstractKo('Abstract 번역을 불러오는 중 오류가 발생했습니다.')
        setTakeaways({
          what: '내용을 불러오지 못했습니다.',
          how: '내용을 불러오지 못했습니다.',
          soWhat: '내용을 불러오지 못했습니다.',
        })
      } finally {
        setLoading(false)
      }
    }
    fetchAI()
  }, [paper.id])

  const baseStyle: React.CSSProperties = {
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
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          논문 목록으로
        </button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '860px', margin: '0 auto', padding: '12px 48px 64px' }}>

        {/* Meta + Title row */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '20px', marginBottom: '28px', alignItems: 'start' }}>

          {/* Left meta */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 중요도 */}
            <MetaCard label="중요도">
              <div style={{ display: 'flex', gap: '3px' }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="16" height="16" viewBox="0 0 24 24"
                    fill={i <= importance ? '#3B6FE8' : '#e5e7eb'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
            </MetaCard>

            {/* DOI */}
            <MetaCard label="DOI #">
              <span style={{ fontSize: '11px', color: '#6b7280', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                10.1038/s41592-019-0648-2
              </span>
            </MetaCard>

            {/* 태그 */}
            <MetaCard label="태그">
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {paper.chips.map(chip => (
                  <span key={chip} style={{
                    fontSize: '11px', padding: '2px 8px',
                    background: '#EEF3FF', color: '#3B6FE8',
                    borderRadius: '20px', border: '1px solid #c7d7fb',
                  }}>
                    {chip}
                  </span>
                ))}
              </div>
            </MetaCard>
          </div>

          {/* Right: title + author */}
          <div>
            <h1 style={{
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              lineHeight: 1.45,
              marginBottom: '10px',
            }}>
              {paper.title}
            </h1>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '4px' }}>
              발행연도 &nbsp;<strong style={{ color: '#374151' }}>{paper.year}</strong>
            </p>
            <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
              저자 &nbsp;<strong style={{ color: '#374151' }}>저자명 외</strong>
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <IconBtn onClick={() => setBookmarked(b => !b)} active={bookmarked}>
                <svg width="15" height="15" viewBox="0 0 24 24"
                  fill={bookmarked ? '#3B6FE8' : 'none'}
                  stroke={bookmarked ? '#3B6FE8' : '#9ca3af'}
                  strokeWidth="2" strokeLinecap="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                </svg>
              </IconBtn>
              <IconBtn onClick={() => {}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round">
                  <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                </svg>
              </IconBtn>
            </div>
          </div>
        </div>

        {/* AI 요약 */}
        <Section title="AI 요약 ✨">
          <div style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '14px',
            color: '#374151',
            lineHeight: 1.7,
            border: '1px solid #e5e7eb',
            minHeight: '52px',
          }}>
            {loading ? <Skeleton /> : aiSummary}
          </div>
        </Section>

        {/* Abstract */}
        <Section title="Abstract">
          <div style={{ borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', background: '#fff' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>EN</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0 }}>
                {paper.summary}
              </p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px' }}>KO</div>
              <p style={{ fontSize: '13px', color: '#374151', lineHeight: 1.7, margin: 0, minHeight: '40px' }}>
                {loading ? <Skeleton /> : abstractKo}
              </p>
            </div>
          </div>
        </Section>

        {/* Key Takeaways */}
        <Section title="Key Takeaways">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(['what', 'how', 'soWhat'] as const).map((key) => {
              const labels = { what: 'What', how: 'How', soWhat: 'So What' }
              return (
                <div key={key} style={{
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  padding: '14px 18px',
                  background: '#fff',
                }}>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#9ca3af', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {labels[key]}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: '#374151',
                    lineHeight: 1.65,
                    background: '#f9fafb',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    minHeight: '40px',
                  }}>
                    {loading ? <Skeleton /> : takeaways?.[key]}
                  </div>
                </div>
              )
            })}
          </div>
        </Section>

        {/* 구분선 */}
        <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />

        {/* 최근 동향 논문 */}
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '16px' }}>최근 동향 논문</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {relatedPapers.map(rp => (
              <RelatedCard key={rp.id} paper={rp} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetaCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '10px',
      padding: '10px 12px',
      border: '1px solid #e5e7eb',
    }}>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '6px' }}>{label}</div>
      {children}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#1a1a1a', marginBottom: '10px' }}>{title}</h3>
      {children}
    </div>
  )
}

function IconBtn({ onClick, children, active }: { onClick: () => void; children: React.ReactNode; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '32px', height: '32px',
        borderRadius: '8px',
        border: `1px solid ${active ? '#c7d7fb' : '#e5e7eb'}`,
        background: active ? '#EEF3FF' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
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
      <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
    </div>
  )
}

function RelatedCard({ paper }: { paper: Paper }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '12px',
      padding: '14px',
      border: '1px solid #e5e7eb',
      cursor: 'pointer',
      transition: 'box-shadow 0.2s',
    }}
    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(59,111,232,0.1)' }}
    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{
          fontSize: '11px', padding: '2px 8px',
          background: '#f3f4f6', color: '#6b7280',
          borderRadius: '6px',
        }}>
          {paper.tag}
        </span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </div>
      <div style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '4px' }}>{paper.year}</div>
      <p style={{
        fontSize: '12px', fontWeight: 600, color: '#1a1a1a',
        lineHeight: 1.5, margin: '0 0 8px',
        display: '-webkit-box',
        WebkitLineClamp: 4,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.title}
      </p>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        {paper.chips.map(chip => (
          <span key={chip} style={{
            fontSize: '10px', padding: '2px 6px',
            background: '#EEF3FF', color: '#3B6FE8',
            borderRadius: '20px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}
