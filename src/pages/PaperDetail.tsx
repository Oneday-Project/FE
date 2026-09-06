import { useState, useEffect, useMemo, useSyncExternalStore, type ReactNode } from 'react'
import { pageContainer, READ_STATUS_STYLE, MAIN } from '../styles/pageTheme'
import { useNavigate } from 'react-router-dom'
import type { Paper } from './Papers'
import { getToken } from '../lib/auth'
import PaperCard from '../components/PaperCard'
import bookCloseIcon from '../components/akar-icons_book-close.png'
import bookOpenIcon from '../components/akar-icons_book.png'
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from '../lib/bookmarks'
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

const NAVY_60 = 'rgba(0,23,142,0.6)'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'
const INK_40 = 'rgba(60,60,67,0.4)'
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
  /* 북마크는 lib/bookmarks 한 곳에서 관리 — 목록 카드·마이페이지와 같은 상태를 본다.
     (예전엔 화면 안에서만 바뀌는 로컬 state 라 새로고침하면 풀렸다) */
  const bookmarks = useSyncExternalStore(subscribeBookmarks, getBookmarksSnapshot)
  const bookmarked = !!bookmarks[paper.arxivId]
  const toggleBookmarkFor = (target: Paper) => {
    void toggleBookmark({
      arxivId: target.arxivId,
      title: target.title,
      publishedDate: target.publishedDate,
      abstract: target.abstract,
      fields: getFieldNames(target),
    })
  }
  /* 읽는 중 / 읽기 완료 — 하나만, 다시 누르면 해제.
     localStorage에 저장돼서 논문 목록 카드 뱃지·마이페이지 탭에 함께 반영됨. */
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot)
  const readStatus = readMap[paper.arxivId]?.status ?? null

  /* 읽기 전 / 읽는 중 / 읽기 완료 중 하나를 직접 고른다.
     '읽기 전' 은 상태 없음(null) — 예전처럼 같은 걸 다시 눌러 해제하는 방식이 아니다. */
  const setReadStatusTo = (next: ReadStatus | null) => {
    if (readStatus === next) return
    setReadStatus(
      {
        arxivId: paper.arxivId,
        title: paper.title,
        publishedDate: paper.publishedDate,
        abstract: paper.abstract,
        fields: getFieldNames(paper),
      },
      next,
    )
  }
  // 읽기 완료는 서버에서 되돌릴 수 없어서 누르기 전에 한 번 확인받는다
  const [confirmComplete, setConfirmComplete] = useState(false)
  const isCompleted = readStatus === 'completed'
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

  /* 함께 보면 좋은 논문 — 같은 분야를 먼저 보여준다.
     추천 API(/similar)는 title·pdfUrl 정도만 내려줘서 카드에 필요한 초록·분야·연도가 없다.
     그래서 추천 결과는 '순서 힌트'로만 쓰고, 카드에 채울 내용은 목록(allPapers)에서 가져온다. */
  const related = useMemo(() => {
    const others = allPapers.filter(p => p.arxivId !== paper.arxivId)
    const byId = new Map(others.map(p => [p.arxivId, p]))
    const myFields = new Set(getFieldNames(paper))
    const overlap = (p: Paper) => getFieldNames(p).filter(f => myFields.has(f)).length

    // 추천 API 결과 중 목록에 있는 것 (내용이 채워지는 것만)
    const recommended = similar
      .map(sp => byId.get(sp.arxivId))
      .filter((p): p is Paper => !!p)

    // 분야가 겹치는 논문 — 많이 겹치는 순
    const sameField = others
      .filter(p => overlap(p) > 0)
      .sort((a, b) => overlap(b) - overlap(a))

    // 추천 → 같은 분야 → 나머지 순으로 중복 없이 이어붙인다
    const seen = new Set<string>()
    const ordered: Paper[] = []
    for (const p of [...recommended, ...sameField, ...others]) {
      if (seen.has(p.arxivId)) continue
      seen.add(p.arxivId)
      ordered.push(p)
    }
    return ordered
  }, [similar, allPapers, paper])
  const relatedPageCount = Math.max(1, Math.ceil(related.length / 3))
  const relatedPapers = related.slice(relatedPage * 3, relatedPage * 3 + 3)

  useEffect(() => {
    setRelatedPage(0)
  }, [paper.arxivId])

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

        {/* ── 상단 메타 배지 — 중요도 / 태그 / DOI 를 가로 한 줄로 ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '28px',
          flexWrap: 'wrap', marginBottom: '26px',
        }}>
          <MetaBadge icon={<StarIcon size={12} color="#fff" />} label="중요도">
            <div style={{ display: 'flex', gap: '2px' }}>
              {Array.from({ length: importance }).map((_, i) => (
                <StarIcon key={i} size={14} color={STAR_ON} />
              ))}
            </div>
          </MetaBadge>

          <MetaBadge icon={<TagIcon size={12} color="#fff" />} label="태그">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {chips.length > 0
                ? chips.map(chip => <TagPill key={chip}>{chip}</TagPill>)
                : <span style={{ fontSize: '11px', color: INK_40 }}>태그 없음</span>}
            </div>
          </MetaBadge>

          <MetaBadge icon={<HashIcon size={12} color="#fff" />} label="DOI">
            <span style={{ fontSize: '11px', fontWeight: 500, color: INK, wordBreak: 'break-all' }}>
              {doiText}
            </span>
          </MetaBadge>
        </div>

        {/* ── 제목(왼쪽) + 발행연도·저자(오른쪽) ── */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '22px' }}>
          <h1 style={{
            flex: 1, minWidth: 0,
            fontSize: '20px', fontWeight: 600, color: INK,
            lineHeight: 1.45, margin: 0,
          }}>
            {paper.title}
          </h1>

          <div style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '6px',
            fontSize: '12px', fontWeight: 500, textAlign: 'right',
          }}>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <span style={{ color: INK }}>발행연도</span>
              <span style={{ color: INK_80 }}>{year}</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <span style={{ color: INK, flexShrink: 0 }}>저자</span>
              <span style={{ color: INK_80 }}>
                {authors.length > 0 ? authors.join(' ') : '저자 정보 없음'}
              </span>
            </div>
          </div>
        </div>

        {/* ── 읽음 상태 3분할(왼쪽) + 북마크·원문(오른쪽) ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '16px', marginBottom: '30px',
        }}>
          {/* 읽기 전 / 읽는 중 / 읽기 완료 — '읽기 전' 이 상태 없음(null) */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '2px',
            background: '#fff', borderRadius: '10px', padding: '5px',
            height: '48px', boxSizing: 'border-box',   // 피그마 기준 세로 48
          }}>
            {/* 읽기 완료가 되면 서버가 되돌리기를 막아서(409) 나머지 둘은 잠근다 */}
            <ReadStatusBtn
              active={readStatus === null}
              tone={READ_STATUS_STYLE.none}
              disabled={isCompleted}
              onClick={() => setReadStatusTo(null)}
              icon={<StatusIcon src={bookCloseIcon} active={readStatus === null} />}
            >
              읽기 전
            </ReadStatusBtn>
            <ReadStatusBtn
              active={readStatus === 'reading'}
              tone={READ_STATUS_STYLE.reading}
              disabled={isCompleted}
              onClick={() => setReadStatusTo('reading')}
              icon={<StatusIcon src={bookOpenIcon} active={readStatus === 'reading'} />}
            >
              읽는 중
            </ReadStatusBtn>
            <ReadStatusBtn
              active={isCompleted}
              tone={READ_STATUS_STYLE.completed}
              onClick={() => { if (!isCompleted) setConfirmComplete(true) }}
              icon={<CheckCircleIcon size={15} color={isCompleted ? READ_STATUS_STYLE.completed.color : INK_40} />}
            >
              읽기 완료
            </ReadStatusBtn>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
            <button
              onClick={() => toggleBookmarkFor(paper)}
              aria-label={bookmarked ? '북마크 해제' : '북마크'}
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

        {/* ── 본문 카드 3종 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* 이 논문을 왜 읽어야 할까요? — 탭 안에 AI 안내 알약을 함께 둔다 */}
          <TabbedCard
            label={<TabLabel>이 논문을 왜 읽어야 할까요?</TabLabel>}
            note={
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '5px',
                background: 'rgba(0,23,142,0.06)', borderRadius: '100px',
                padding: '5px 10px',
              }}>
                <AiIcon size={11} color={NAVY_60} />
                <span style={{ fontSize: '10px', fontWeight: 500, color: NAVY_60, whiteSpace: 'nowrap' }}>
                  관심 분야를 바탕으로 AI가 추천 이유를 정리했어요.
                </span>
              </span>
            }
          >
            <Body>{loading ? <Skeleton /> : ai?.whyRead}</Body>
            {aiFailed !== 'none' && (
              <p style={{ fontSize: '11px', color: INK_40, margin: '12px 0 0' }}>
                {aiFailed === 'unauthorized'
                  ? '로그인하면 AI가 정리한 요약을 볼 수 있어요. (현재는 원문 기반 임시 문구)'
                  : '아직 AI 요약이 생성되지 않은 논문이에요. (현재는 원문 기반 임시 문구)'}
              </p>
            )}
          </TabbedCard>

          {/* Abstract */}
          <TabbedCard label={<TabLabel>Abstract</TabLabel>}>
            <LabeledBlock label="EN">
              {paper.abstract || 'Abstract 정보가 없습니다.'}
            </LabeledBlock>
            <Divider />
            <LabeledBlock label="KO">
              {loading ? <Skeleton /> : ai?.abstractKor}
            </LabeledBlock>
          </TabbedCard>

          {/* Key Takeaways */}
          <TabbedCard
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <AiIcon size={12} color={MAIN} />
                <TabLabel>Key Takeaways</TabLabel>
              </span>
            }
          >
            {(['what', 'how', 'impact'] as const).map((key, idx) => (
              <div key={key}>
                {idx > 0 && <Divider />}
                <LabeledBlock label={key.toUpperCase()}>
                  {loading ? <Skeleton /> : ai?.[key]}
                </LabeledBlock>
              </div>
            ))}
          </TabbedCard>
        </div>

        {/* 읽기 완료 확인 — 되돌릴 수 없는 동작이라 한 번 물어본다 */}
        {confirmComplete && (
          <ConfirmCompleteModal
            onClose={() => setConfirmComplete(false)}
            onConfirm={() => {
              setConfirmComplete(false)
              setReadStatusTo('completed')
            }}
          />
        )}

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
            <div style={{ flex: 1, minWidth: 0, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '20px' }}>
              {relatedPapers.map(rp => (
                <PaperCard
                  key={rp.arxivId}
                  paper={rp}
                  bookmarked={!!bookmarks[rp.arxivId]}
                  onBookmark={() => toggleBookmarkFor(rp)}
                  onClick={() => openPaper(rp.arxivId)}
                />
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
      <div style={{ fontSize: '12px', fontWeight: 600, color: MAIN, marginBottom: '8px' }}>{label}</div>
      <Body>{children}</Body>
    </div>
  )
}

function Divider() {
  return <div style={{ height: '1px', background: '#E3E8F5', margin: '18px 0' }} />
}

/* 상단 메타 배지 — 원형 아이콘 + 라벨 + 내용을 한 줄로. 배경 없이 페이지 위에 얹힌다. */
function MetaBadge({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
      <span style={{
        width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(90deg, #4C96FF 0%, #A8B4FF 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: INK_80, flexShrink: 0 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}

/* 카드 위에 얹히는 탭 형태 라벨 + 흰 카드 */
function TabbedCard({ label, note, children }: { label: ReactNode; note?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'inline-flex', alignItems: 'center', gap: '10px',
        marginLeft: '22px', padding: '11px 20px 12px',
        background: '#fff', borderRadius: '14px 14px 0 0',
      }}>
        {label}
        {note}
      </div>
      {/* -1px 로 탭과 카드 사이 헤어라인을 없앤다 */}
      <div style={{ marginTop: '-1px' }}>
        <Card>{children}</Card>
      </div>
    </div>
  )
}

// 탭 라벨 텍스트 (Abstract / Key Takeaways / 왜 읽어야 할까요)
function TabLabel({ children }: { children: ReactNode }) {
  return (
    <span style={{ fontSize: '14px', fontWeight: 600, color: MAIN, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  )
}

function TagPill({ children }: { children: ReactNode }) {
  return (
    <span style={{
      border: `1px solid ${MAIN}`,
      borderRadius: '100px',
      padding: '6px 8px',
      fontSize: '10px',
      lineHeight: '12px',
      fontWeight: 600,
      color: MAIN,
      whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

function ReadStatusBtn({
  active, onClick, children, icon, tone, disabled = false,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
  icon: ReactNode
  tone: { color: string; background: string }   // 상태별 색 (목록 카드 뱃지와 동일)
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={disabled ? '읽기 완료한 논문은 이전 상태로 되돌릴 수 없어요.' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        height: '38px', padding: '0 14px',   // 바깥 48 - 패딩 10
        borderRadius: '8px', border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        background: active ? tone.background : 'transparent',
        color: active ? tone.color : INK_40,
        fontSize: '12px', fontWeight: 500, fontFamily: 'inherit',
        transition: 'background 0.15s, color 0.15s, opacity 0.15s',
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

/* 읽기 완료 확인 모달 — 서버에 완료 해제 API 가 없어서 되돌릴 수 없다.
   스타일은 논문 목록의 로그인 안내 모달과 같은 톤. */
function ConfirmCompleteModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
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
        role="dialog"
        aria-modal="true"
        style={{
          position: 'relative',
          width: '380px', maxWidth: '90%',
          background: '#fff', borderRadius: '16px',
          padding: '44px 40px 34px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
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
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        <span style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: READ_STATUS_STYLE.completed.background,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: '20px',
        }}>
          <CheckCircleIcon size={26} color={READ_STATUS_STYLE.completed.color} />
        </span>

        <p style={{
          fontSize: '16px', fontWeight: 600, color: INK,
          margin: '0 0 10px', textAlign: 'center',
        }}>
          읽기 완료로 표시할까요?
        </p>
        <p style={{
          fontSize: '13px', fontWeight: 400, color: INK_80,
          margin: '0 0 26px', textAlign: 'center', lineHeight: 1.6,
        }}>
          한 번 완료로 표시하면<br />
          <b style={{ fontWeight: 600, color: INK }}>읽는 중·읽기 전으로 되돌릴 수 없어요.</b>
        </p>

        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, height: '44px',
              background: '#fff', color: INK_80,
              border: `1.2px solid ${INK_40}`, borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, height: '44px',
              background: MAIN, color: '#fff',
              border: 'none', borderRadius: '8px',
              fontSize: '14px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            읽기 완료
          </button>
        </div>
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

/* 읽기 전 / 읽는 중 아이콘 — 디자인에서 내보낸 PNG 를 그대로 쓴다.
   PNG 는 색이 고정(파랑/초록)이라, 선택되지 않은 상태에서는 회색으로 죽여서 보여준다. */
function StatusIcon({ src, active }: { src: string; active: boolean }) {
  return (
    <img
      src={src}
      alt=""
      width={15}
      height={15}
      style={{
        display: 'block', objectFit: 'contain',
        filter: active ? 'none' : 'grayscale(1) opacity(0.45)',
      }}
    />
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
