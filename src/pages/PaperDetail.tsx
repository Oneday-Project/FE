import { useState, useEffect, useMemo, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import { pageContainer } from '../styles/pageTheme'
import { useNavigate } from 'react-router-dom'
import type { Paper } from './Papers'
import { getToken } from '../lib/auth'
import {
  setReadStatus,
  subscribeReadStatus,
  getReadStatusSnapshot,
  type ReadStatus,
} from '../lib/readStatus'

/* GET /ai-services/papers/{arxivId} 응답 (스웨거 PaperAiSummary)
   — 토큰이 있어야 조회됨(bearer). 없으면 401. */
type PaperAiSummary = {
  id: number
  whyRead: string
  abstractKor: string
  what: string
  how: string
  impact: string
  model: string
  updatedAt: string
  createdAt: string
}

type AiContent = {
  whyRead: string
  abstractKor: string
  what: string
  how: string
  impact: string
}

/* 피그마 논문_상세페이지(1076:8375)의 "구성"을 따라감.
   단, 피그마는 1440px 고정 기준이라 수치를 그대로 쓰면 화면에서 과하게 커 보여서
   타이포/여백은 기존 프로젝트 스케일(컨테이너 860, 본문 14px)을 유지함. */

const NAVY = '#00178E'
const NAVY_60 = 'rgba(0,23,142,0.6)'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'
const INK_40 = 'rgba(60,60,67,0.4)'
const GREEN = '#00CA5E'
const BOOKMARK_ON = 'rgba(59,130,246,0.7)'   // #3B82F6 70%
const STAR_ON = '#FFF188'                    // 피그마 색상 스타일 'important star'

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
  /* 읽는 중 / 읽기 완료 — 하나만, 다시 누르면 해제.
     localStorage에 저장돼서 논문 목록 카드 뱃지·마이페이지 탭에 함께 반영됨. */
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot)
  const readStatus = readMap[paper.arxivId]?.status ?? null

  const toggleReadStatus = (next: ReadStatus) => {
    setReadStatus(
      {
        arxivId: paper.arxivId,
        title: paper.title,
        publishedDate: paper.publishedDate,
        abstract: paper.abstract,
        fields: getFieldNames(paper),
      },
      readStatus === next ? null : next,
    )
  }
  const [ai, setAi] = useState<AiContent | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiFailed, setAiFailed] = useState<'none' | 'unauthorized' | 'missing'>('none')
  const [relatedPage, setRelatedPage] = useState(0)
  const [similar, setSimilar] = useState<Paper[]>([])

  const navigate = useNavigate()
  const openPaper = (arxivId: string) => navigate(`/papers?paper=${encodeURIComponent(arxivId)}`)

  const year = getYear(paper.publishedDate)
  const chips = getFieldNames(paper)
  const authors = getAuthorNames(paper)
  const doiText = paper.doi || paper.arxivId || '-'
  const importance = clampStarTier(paper.starTier)

  /* 함께 보면 좋은 논문 — GET /papers/paper/{arxivId}/similar (추천).
     실패하거나 비었으면 목록(allPapers)에서 같은 분야 위주로 대체. */
  const related = useMemo(() => {
    if (similar.length > 0) return similar
    return allPapers.filter(p => p.arxivId !== paper.arxivId)
  }, [similar, allPapers, paper.arxivId])
  const relatedPageCount = Math.max(1, Math.ceil(related.length / 3))
  const relatedPapers = related.slice(relatedPage * 3, relatedPage * 3 + 3)

  useEffect(() => {
    setBookmarked(paper.bookmarkCount > 0)
    setRelatedPage(0)
  }, [paper.arxivId, paper.bookmarkCount])

  // 함께 보면 좋은 논문 — 유사 논문 추천 API
  useEffect(() => {
    const isHai = paper.arxivId.startsWith('hai-')
    const url = isHai
      ? `/api/papers/hai-papers/${encodeURIComponent(paper.arxivId.slice(4))}/similar?limit=9`
      : `/api/papers/paper/${encodeURIComponent(paper.arxivId)}/similar?limit=9`

    let cancelled = false
    setSimilar([])

    ;(async () => {
      try {
        const token = getToken()
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })
        if (!res.ok || cancelled) return

        const json = await res.json()
        const list: unknown[] = Array.isArray(json) ? json : json.data ?? []
        setSimilar(list.map(toRelatedPaper).filter((p): p is Paper => p !== null))
      } catch {
        // 실패 시 목록 기반 대체가 자동으로 쓰임
      }
    })()

    return () => { cancelled = true }
  }, [paper.arxivId])

  /*
    AI 요약: GET /ai-services/papers/{arxivId}
      whyRead → "이 논문을 왜 읽어야 할까요?"
      abstractKor → Abstract KO
      what / how / impact → Key Takeaways

    토큰이 필요한 API라 비로그인 상태면 401이 뜸.
    그 경우(그리고 아직 요약이 생성되지 않은 404)에는
    화면이 비지 않도록 abstract 기반 fallback을 대신 보여줌.
  */
  useEffect(() => {
    const arxivId = paper.arxivId
    let cancelled = false

    setLoading(true)
    setAiFailed('none')

    ;(async () => {
      try {
        const token = getToken()
        const res = await fetch(`/api/ai-services/papers/${encodeURIComponent(arxivId)}`, {
          headers: {
            Accept: 'application/json',
            'ngrok-skip-browser-warning': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        })

        if (cancelled) return

        if (!res.ok) {
          setAi(buildFallbackAIContent(paper))
          setAiFailed(res.status === 401 || res.status === 403 ? 'unauthorized' : 'missing')
          return
        }

        const data: PaperAiSummary = await res.json()
        if (cancelled) return

        const fallback = buildFallbackAIContent(paper)
        setAi({
          whyRead: data.whyRead || fallback.whyRead,
          abstractKor: data.abstractKor || fallback.abstractKor,
          what: data.what || fallback.what,
          how: data.how || fallback.how,
          impact: data.impact || fallback.impact,
        })
      } catch {
        if (cancelled) return
        setAi(buildFallbackAIContent(paper))
        setAiFailed('missing')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => { cancelled = true }
  }, [paper])

  return (
    <div style={{
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      width: '100%',
      minHeight: '100vh',
      boxSizing: 'border-box',
    }}>
      {/* Back button */}
      <div style={{ ...pageContainer, paddingTop: '20px', paddingBottom: 0 }}>
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '13px', color: INK_80,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, marginBottom: '8px',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
          논문 목록으로
        </button>
      </div>

      <div style={{ ...pageContainer, paddingTop: '12px', paddingBottom: '64px' }}>

        {/* ── 헤더: 제목·저자(왼쪽) + 상세 카드 3개(오른쪽) ── */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '18px' }}>

          {/* Left */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{
              fontSize: '22px', fontWeight: 600, color: INK,
              lineHeight: 1.4, margin: '0 0 18px',
            }}>
              {paper.title}
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontWeight: 500, marginBottom: '18px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ color: INK }}>발행연도</span>
                <span style={{ color: INK_80 }}>{year}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: INK, flexShrink: 0 }}>저자</span>
                {authors.length > 0
                  ? authors.map((name, i) => <span key={`${name}-${i}`} style={{ color: INK_80 }}>{name}</span>)
                  : <span style={{ color: INK_80 }}>저자 정보 없음</span>}
              </div>
            </div>

            {/* 북마크 / 원문 링크 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setBookmarked(b => !b)}
                aria-label="북마크"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
              >
                <BookmarkIcon filled={bookmarked} />
              </button>
              <button
                onClick={() => { if (paper.pdfUrl) window.open(paper.pdfUrl, '_blank') }}
                aria-label="원문 링크"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0 }}
              >
                <LinkIcon />
              </button>
            </div>
          </div>

          {/* Right: 중요도 / 태그 / DOI */}
          <div style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <DetailCard icon={<StarIcon size={13} color="#fff" />} label="중요도">
              <div style={{ display: 'flex', gap: '1px' }}>
                {Array.from({ length: importance }).map((_, i) => (
                  <StarIcon key={i} size={15} color={STAR_ON} />
                ))}
              </div>
            </DetailCard>

            <DetailCard icon={<TagIcon size={13} color="#fff" />} label="태그">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                {chips.length > 0
                  ? chips.map(chip => <TagPill key={chip}>{chip}</TagPill>)
                  : <span style={{ fontSize: '11px', color: INK_40 }}>태그 없음</span>}
              </div>
            </DetailCard>

            <DetailCard icon={<HashIcon size={13} color="#fff" />} label="DOI">
              <span style={{ fontSize: '10px', fontWeight: 500, color: INK, wordBreak: 'break-all', textAlign: 'right' }}>
                {doiText}
              </span>
            </DetailCard>
          </div>
        </div>

        {/* 읽는 중 / 읽기 완료 — 하나만 선택 (다시 누르면 해제) */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '2px',
          background: '#fff', borderRadius: '10px', padding: '5px',
          height: '48px', boxSizing: 'border-box',   // 피그마 기준 세로 48
          marginBottom: '28px',
        }}>
          <ReadStatusBtn
            active={readStatus === 'reading'}
            onClick={() => toggleReadStatus('reading')}
            icon={<BookIcon size={15} color={readStatus === 'reading' ? GREEN : INK_40} />}
          >
            읽는 중
          </ReadStatusBtn>
          <ReadStatusBtn
            active={readStatus === 'completed'}
            onClick={() => toggleReadStatus('completed')}
            icon={<CheckCircleIcon size={15} color={readStatus === 'completed' ? GREEN : INK_40} />}
          >
            읽기 완료
          </ReadStatusBtn>
        </div>

        {/* ── 본문 카드 3종 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* 이 논문을 왜 읽어야 할까요? */}
          <Card>
            <div style={{ marginBottom: '16px' }}>
              <p style={{ fontSize: '15px', fontWeight: 600, color: NAVY, margin: '0 0 6px' }}>
                이 논문을 왜 읽어야 할까요?
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AiIcon size={13} color={NAVY_60} />
                <p style={{ fontSize: '11px', fontWeight: 500, color: NAVY_60, margin: 0 }}>
                  관심 분야를 바탕으로 AI가 추천 이유를 정리했어요.
                </p>
              </div>
            </div>
            <Body>{loading ? <Skeleton /> : ai?.whyRead}</Body>
            {aiFailed !== 'none' && (
              <p style={{ fontSize: '11px', color: INK_40, margin: '12px 0 0' }}>
                {aiFailed === 'unauthorized'
                  ? '로그인하면 AI가 정리한 요약을 볼 수 있어요. (현재는 원문 기반 임시 문구)'
                  : '아직 AI 요약이 생성되지 않은 논문이에요. (현재는 원문 기반 임시 문구)'}
              </p>
            )}
          </Card>

          {/* Abstract */}
          <Card>
            <p style={{ fontSize: '15px', fontWeight: 600, color: NAVY_60, margin: '0 0 18px' }}>Abstract</p>
            <LabeledBlock label="EN">
              {paper.abstract || 'Abstract 정보가 없습니다.'}
            </LabeledBlock>
            <Divider />
            <LabeledBlock label="KO">
              {loading ? <Skeleton /> : ai?.abstractKor}
            </LabeledBlock>
          </Card>

          {/* Key Takeaways */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '18px' }}>
              <AiIcon size={13} color={NAVY_60} />
              <p style={{ fontSize: '15px', fontWeight: 600, color: NAVY_60, margin: 0 }}>Key Takeaways</p>
            </div>
            {(['what', 'how', 'impact'] as const).map((key, idx) => (
              <div key={key}>
                {idx > 0 && <Divider />}
                <LabeledBlock label={key.toUpperCase()}>
                  {loading ? <Skeleton /> : ai?.[key]}
                </LabeledBlock>
              </div>
            ))}
          </Card>
        </div>

        {/* ── 함께 보면 좋은 논문 ── */}
        <div style={{ marginTop: '48px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600, color: INK, margin: 0 }}>
            함께 보면 좋은 논문
          </h2>
          <div style={{ height: '1px', background: INK_40, opacity: 0.35, margin: '16px 0 18px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CarouselArrow
              direction="left"
              disabled={relatedPage === 0}
              onClick={() => setRelatedPage(p => Math.max(0, p - 1))}
            />
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {relatedPapers.map(rp => (
                <RelatedCard key={rp.arxivId} paper={rp} onOpen={() => openPaper(rp.arxivId)} />
              ))}
            </div>
            <CarouselArrow
              direction="right"
              disabled={relatedPage >= relatedPageCount - 1}
              onClick={() => setRelatedPage(p => Math.min(relatedPageCount - 1, p + 1))}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

/* ───────── 레이아웃 조각 ───────── */

function Card({ children }: { children: ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      padding: '22px 26px',
    }}>
      {children}
    </div>
  )
}

function Body({ children }: { children: ReactNode }) {
  return (
    <p style={{ fontSize: '14px', fontWeight: 400, color: INK, lineHeight: 1.75, margin: 0 }}>
      {children}
    </p>
  )
}

function LabeledBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: NAVY, marginBottom: '8px' }}>{label}</div>
      <Body>{children}</Body>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#E3E8F5', margin: '18px 0' }} />
}

function DetailCard({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div style={{
      background: '#fff',
      borderRadius: '14px',
      padding: '10px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      minHeight: '44px',
    }}>
      <span style={{
        width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(90deg, #4C96FF 0%, #A8B4FF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: '11px', fontWeight: 600, color: INK_80, flexShrink: 0 }}>{label}</span>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

function TagPill({ children }: { children: ReactNode }) {
  return (
    <span style={{
      border: `1px solid ${NAVY}`,
      borderRadius: '100px',
      padding: '6px 8px',
      fontSize: '10px',
      lineHeight: '12px',
      fontWeight: 600,
      color: NAVY,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function ReadStatusBtn({
  active, onClick, children, icon,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon: ReactNode
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        height: '38px', padding: '0 14px',   // 바깥 48 - 패딩 10
        borderRadius: '8px', border: 'none', cursor: 'pointer',
        background: active ? 'rgba(0,202,94,0.1)' : 'transparent',
        color: active ? GREEN : INK_40,
        fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function CarouselArrow({
  direction, onClick, disabled,
}: {
  direction: 'left' | 'right'
  onClick: () => void
  disabled: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === 'left' ? '이전' : '다음'}
      style={{
        width: '20px', height: '40px', flexShrink: 0,
        background: 'none', border: 'none', padding: 0,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.25 : 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'opacity 0.15s',
      }}
    >
      <ChevronIcon direction={direction} size={18} color={INK_80} />
    </button>
  )
}

function Skeleton() {
  return (
    <span style={{
      display: 'inline-block', width: '100%', height: '16px', verticalAlign: 'middle',
      background: 'linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)',
      backgroundSize: '200% 100%',
      borderRadius: '6px',
      animation: 'shimmer 1.5s infinite',
    }}>
      <style>
        {`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}
      </style>
    </span>
  )
}

function RelatedCard({ paper, onOpen }: { paper: Paper; onOpen: () => void }) {
  const year = getYear(paper.publishedDate)
  const chips = getFieldNames(paper)

  return (
    <div
      onClick={onOpen}
      style={{
        background: '#fff',
        borderRadius: '14px',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,23,142,0.1)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: INK }}>{year}</span>
        <BookmarkIcon filled={paper.bookmarkCount > 0} small />
      </div>

      <p style={{
        fontSize: '12px', fontWeight: 500, color: INK, margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as CSSProperties}>
        {paper.title}
      </p>

      <div style={{ height: '1px', background: INK_40, opacity: 0.5 }} />

      <p style={{
        fontSize: '11px', color: INK_80, margin: 0, lineHeight: 1.5,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      } as CSSProperties}>
        {paper.abstract}
      </p>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        {chips.slice(0, 3).map(chip => <TagPill key={chip}>{chip}</TagPill>)}
      </div>
    </div>
  )
}

/* ───────── 아이콘 ───────── */

function BookmarkIcon({ filled, small }: { filled: boolean; small?: boolean }) {
  const w = small ? 14 : 18
  const h = small ? 19 : 25
  return (
    <svg width={w} height={h} viewBox="0 0 22 31" fill="none">
      <path
        d="M1 3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v26l-10-7-10 7V3z"
        fill={filled ? BOOKMARK_ON : 'none'}
        stroke={filled ? BOOKMARK_ON : INK_40}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LinkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  )
}

function StarIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 2.6l2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.4l-5.8 3.06 1.1-6.46-4.69-4.58 6.49-.94L12 2.6z" />
    </svg>
  )
}

function TagIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11.6 2H4a2 2 0 0 0-2 2v7.6c0 .53.21 1.04.59 1.41l8.4 8.4a2 2 0 0 0 2.82 0l7.6-7.6a2 2 0 0 0 0-2.82L13 2.59A2 2 0 0 0 11.6 2zM7 8.5A1.5 1.5 0 1 1 8.5 7 1.5 1.5 0 0 1 7 8.5z" />
    </svg>
  )
}

function HashIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
      <path d="M9 3L7 21M17 3l-2 18M3.5 8.5h17M3 15.5h17" />
    </svg>
  )
}

function BookIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v5H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </svg>
  )
}

function CheckCircleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.4l2.7 2.7L16 9.8" />
    </svg>
  )
}

function AiIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M11 2l1.7 4.9L17.6 8.6l-4.9 1.7L11 15.2 9.3 10.3 4.4 8.6l4.9-1.7L11 2z" />
      <path d="M18 14l.9 2.6 2.6.9-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9L18 14z" />
    </svg>
  )
}

function ChevronIcon({ direction, size, color }: { direction: 'left' | 'right'; size: number; color: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: direction === 'right' ? 'rotate(180deg)' : undefined }}
    >
      <path d="M15 5l-7 7 7 7" />
    </svg>
  )
}

/* ───────── 데이터 헬퍼 ───────── */

function getYear(date?: string) {
  if (!date) return '연도 정보 없음'
  return date.slice(0, 4)
}

function getFieldNames(paper: Paper) {
  return paper.researchFields?.filter(Boolean) ?? []
}

/* 유사 논문 추천 응답 항목 → RelatedCard 가 쓰는 최소 Paper 형태로 변환.
   응답 필드가 확실치 않아(일반/휴먼AI·library형 등) 여러 이름을 방어적으로 흡수한다. */
function toRelatedPaper(raw: unknown): Paper | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>

  const isHai = r.type === 'hai'
  const rawId = r.arxivId ?? r.id
  if (rawId == null) return null
  const arxivId = isHai ? `hai-${rawId}` : String(rawId)

  const fields = Array.isArray(r.researchFields)
    ? r.researchFields
    : Array.isArray(r.tags)
      ? r.tags
      : []

  return {
    arxivId,
    doi: (r.doi as string) ?? null,
    title: (r.title as string) ?? '',
    authors: [],
    abstract: (r.abstract as string) ?? '',
    researchFields: fields.filter((f): f is string => typeof f === 'string'),
    publishedDate: (r.publishedDate as string) ?? '',
    citationCount: 0,
    influenceScore: 0,
    journal: '',
    pdfUrl: (r.pdfUrl as string) ?? '',
    bookmarkCount: r.isBookmark || (r.bookmarkCount as number) > 0 ? 1 : 0,
    starTier: (r.starTier as number) ?? 0,
  }
}

/* 저자 목록 — 백엔드는 문자열 배열로 내려주지만, 예전 응답 형태({name})도 방어적으로 흡수한다.
   (문자열 배열을 .name 으로 읽어서 전부 undefined 가 되던 게 "저자 정보 없음"의 원인이었다) */
function getAuthorNames(paper: Paper) {
  const raw = (paper.authors ?? []) as unknown[]
  const authors = raw
    .map(author => (typeof author === 'string' ? author : (author as { name?: string })?.name))
    .filter((name): name is string => Boolean(name))
  if (authors.length <= 3) return authors
  return [...authors.slice(0, 3), `외 ${authors.length - 3}명`]
}

function clampStarTier(value?: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 3
  return Math.max(1, Math.min(5, Math.round(value)))
}

// AI 요약을 못 가져왔을 때(비로그인·미생성) 화면이 비지 않도록 쓰는 대체 문구
function buildFallbackAIContent(paper: Paper): AiContent {
  const abstract = paper.abstract?.trim()
  const title = paper.title?.trim()

  const firstSentence = abstract
    ? abstract.split(/(?<=[.!?])\s+/)[0]
    : ''

  return {
    whyRead: firstSentence
      ? truncate(firstSentence, 140)
      : `${title}에 대한 핵심 내용을 확인할 수 있는 논문입니다.`,

    abstractKor: abstract
      ? '번역 API 연결 전이므로 현재는 원문 Abstract를 기준으로 내용을 확인하세요.'
      : 'Abstract 정보가 없습니다.',

    what: title
      ? `"${truncate(title, 80)}" 주제를 중심으로 한 연구입니다.`
      : '이 논문이 다루는 주제 정보를 불러오지 못했습니다.',

    how: abstract
      ? '논문의 Abstract를 기반으로 문제 정의, 접근 방식, 실험 또는 분석 내용을 확인할 수 있습니다.'
      : '방법론 정보가 아직 제공되지 않았습니다.',

    impact: paper.citationCount || paper.influenceScore
      ? `인용수 ${paper.citationCount ?? 0}, 영향도 ${paper.influenceScore ?? 0} 정보를 함께 참고해 중요도를 판단할 수 있습니다.`
      : '관련 분야의 흐름을 파악하는 데 참고할 수 있는 논문입니다.',
  }
}

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}...`
}
