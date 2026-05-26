import { useState } from 'react'
import PaperDetail from './PaperDetail'

const tags = ['SML', 'ML', 'CV', 'NLP', 'Robotics', 'Retrieval AI', 'SAP', 'HCI', 'Multimodal', 'Code AI']

export type Paper = {
  id: number
  year: number
  tag: string
  title: string
  summary: string
  chips: string[]
  bookmarked: boolean
}

const mockPapers: Paper[] = [
  {
    id: 1,
    year: 2025,
    tag: '논문태그',
    title: 'Attention Is All You Need: Transformer 기반 자연어처리의 새로운 패러다임',
    summary: '기존 RNN, CNN 기반 모델의 한계를 극복하고 Self-Attention 메커니즘만으로 구성된 Transformer 아키텍처를 제안합니다. 번역 태스크에서 SOTA를 달성하였으며, 이후 BERT, GPT 계열 모델의 기반이 됩니다.',
    chips: ['CV', 'LLM', 'UI/UX'],
    bookmarked: false,
  },
  {
    id: 2,
    year: 2025,
    tag: '논문태그',
    title: 'CLIP: Connecting Text and Images via Contrastive Language-Image Pre-training',
    summary: '대규모 이미지-텍스트 쌍으로 학습한 CLIP 모델은 zero-shot 분류에서 뛰어난 성능을 보이며, 다양한 다운스트림 태스크에 범용적으로 활용 가능한 멀티모달 표현 학습의 새 지평을 열었습니다.',
    chips: ['CV', 'LLM', 'UI/UX'],
    bookmarked: true,
  },
  {
    id: 3,
    year: 2025,
    tag: '논문태그',
    title: 'LoRA: Low-Rank Adaptation of Large Language Models for Efficient Fine-tuning',
    summary: '대형 언어 모델의 파라미터를 직접 수정하지 않고, 저랭크 행렬 분해를 통해 적은 파라미터만 추가 학습하는 효율적인 파인튜닝 기법을 제시하며 자원 절약과 성능을 동시에 달성합니다.',
    chips: ['CV', 'LLM', 'UI/UX'],
    bookmarked: false,
  },
]

const importanceLevels = [1, 2, 3, 4, 5]

export default function Papers() {
  const [selectedTags, setSelectedTags] = useState<string[]>(['SML'])
  const [importance, setImportance] = useState(2)
  const [period, setPeriod] = useState<'1y' | '3y' | '5y' | 'custom'>('1y')
  const [searchValue, setSearchValue] = useState('')
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>(
    Object.fromEntries(mockPapers.map(p => [p.id, p.bookmarked]))
  )
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  const toggleBookmark = (id: number) => {
    setBookmarks(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // 논문 카드 클릭 시 상세 페이지로 전환
  if (selectedPaper) {
    return (
      <PaperDetail
        paper={selectedPaper}
        allPapers={mockPapers}
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          marginBottom: '18px',
          position: 'relative',
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            background: '#fff',
            borderRadius: '14px',
            border: '1.5px solid #e5e7eb',
            padding: '12px 18px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
          }}>
            <input
              value={searchValue}
              onChange={e => setSearchValue(e.target.value)}
              placeholder="제목/저자/키워드를 입력하세요."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#374151',
                background: 'transparent',
              }}
            />
            <button style={{
              width: '36px', height: '36px',
              background: '#3B6FE8',
              border: 'none', borderRadius: '9px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
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
          }}>
            W
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '32px', marginBottom: '44px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* 중요도 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>중요도</span>
              {importanceLevels.map(level => (
                <button
                  key={level}
                  onClick={() => setImportance(level)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', display: 'flex', alignItems: 'center' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill={level <= importance ? '#3B6FE8' : '#d1d5db'}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                </button>
              ))}
            </div>

            {/* 연도 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '13px', color: '#6b7280', width: '42px', flexShrink: 0 }}>연도</span>
              {([['1y','최근 1년'],['3y','최근 3년'],['5y','최근 5년'],['custom','기간 설정']] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  style={{
                    padding: '5px 13px', fontSize: '12px', fontWeight: 500,
                    borderRadius: '20px', border: '1.5px solid',
                    borderColor: period === key ? '#3B6FE8' : '#d1d5db',
                    background: period === key ? '#EEF3FF' : 'transparent',
                    color: period === key ? '#3B6FE8' : '#6b7280',
                    cursor: 'pointer',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 분야 태그 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', flexWrap: 'wrap', flex: 1 }}>
            <span style={{ fontSize: '13px', color: '#6b7280', flexShrink: 0, paddingTop: '6px' }}>분야</span>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  style={{
                    padding: '5px 13px', fontSize: '12px', fontWeight: 500,
                    borderRadius: '20px', border: '1.5px solid',
                    borderColor: selectedTags.includes(tag) ? '#3B6FE8' : '#d1d5db',
                    background: selectedTags.includes(tag) ? '#3B6FE8' : 'transparent',
                    color: selectedTags.includes(tag) ? '#fff' : '#6b7280',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Section: 최근 동향 논문 */}
        <PaperSection
          title="최근 동향 논문"
          papers={mockPapers}
          bookmarks={bookmarks}
          onBookmark={toggleBookmark}
          onCardClick={setSelectedPaper}
        />

        <div style={{ height: '48px' }} />

        {/* Section: 휴먼AI공학전공 논문 */}
        <PaperSection
          title="휴먼AI공학전공 논문"
          subtitle="최신 동향 반영을 위해 최근 3년 이내 논문을 중심으로 제공합니다."
          papers={mockPapers}
          bookmarks={bookmarks}
          onBookmark={toggleBookmark}
          onCardClick={setSelectedPaper}
        />
      </div>
    </div>
  )
}

function PaperSection({
  title,
  subtitle,
  papers,
  bookmarks,
  onBookmark,
  onCardClick,
}: {
  title: string
  subtitle?: string
  papers: Paper[]
  bookmarks: Record<number, boolean>
  onBookmark: (id: number) => void
  onCardClick: (paper: Paper) => void
}) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1.5px solid #e5e7eb',
        paddingBottom: '14px',
        marginBottom: '24px',
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
        <button style={{
          position: 'absolute', left: '0px', top: '50%', transform: 'translateY(-50%)',
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#fff', border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {papers.map(paper => (
            <PaperCard
              key={paper.id}
              paper={paper}
              bookmarked={bookmarks[paper.id]}
              onBookmark={() => onBookmark(paper.id)}
              onClick={() => onCardClick(paper)}
            />
          ))}
        </div>

        <button style={{
          position: 'absolute', right: '0px', top: '50%', transform: 'translateY(-50%)',
          width: '28px', height: '28px', borderRadius: '50%',
          background: '#fff', border: '1.5px solid #e5e7eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', zIndex: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2.5" strokeLinecap="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '20px' }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} style={{
            width: i === 1 ? '20px' : '8px',
            height: '8px',
            borderRadius: '4px',
            background: i === 1 ? '#3B6FE8' : '#d1d5db',
            transition: 'all 0.2s',
          }} />
        ))}
      </div>
    </div>
  )
}

function PaperCard({
  paper,
  bookmarked,
  onBookmark,
  onClick,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        border: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
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
          {paper.tag}
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

      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{paper.year}</span>

      <p style={{
        fontSize: '13px', fontWeight: 700, color: '#1a1a1a',
        lineHeight: 1.5, margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.title}
      </p>

      <p style={{
        fontSize: '12px', color: '#6b7280', lineHeight: 1.6, margin: 0,
        display: '-webkit-box',
        WebkitLineClamp: 3,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      } as React.CSSProperties}>
        {paper.summary}
      </p>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
        {paper.chips.map(chip => (
          <span key={chip} style={{
            fontSize: '11px', fontWeight: 500,
            color: '#3B6FE8', background: '#EEF3FF',
            borderRadius: '20px', padding: '3px 9px',
          }}>
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}
