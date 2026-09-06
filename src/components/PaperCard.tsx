import { useSyncExternalStore } from 'react'
import { INK, INK_80, MAIN } from '../styles/pageTheme'
import ReadStatusTag from './ReadStatusTag'
import { subscribeReadStatus, getReadStatusSnapshot } from '../lib/readStatus'
import type { Paper } from '../pages/Papers'

/* 논문 카드 (피그마 기준) — 높이 255 / 내부 항목 간격 12
   제목 Pretendard Medium 16 · 행간 19, 본문 Regular 12 · 행간 16
   분야 태그 좌우패딩 8 · 상하패딩 6, 태그 간 간격 10

   논문 목록(Papers)과 논문 상세의 '함께 보면 좋은 논문'이 같은 카드를 쓴다. */
const CARD_HEIGHT = '255px'
const CARD_GAP = '12px'
const CARD_TITLE = { fontSize: '16px', fontWeight: 500, lineHeight: '19px' } as const
const CARD_BODY = { fontSize: '12px', fontWeight: 400, lineHeight: '16px' } as const
const CHIP_GAP = '10px'
export const BOOKMARK_ON = 'rgba(59,130,246,0.7)'   // #3B82F6 70%

export default function PaperCard({
  paper, bookmarked, onBookmark, onClick,
}: {
  paper: Paper
  bookmarked: boolean
  onBookmark: () => void
  onClick: () => void
}) {
  const year = paper.publishedDate?.slice(0, 4) ?? '' // 출판연도 (앞 4자리)
  const chips = paper.researchFields ?? [] // 분야 칩 전체

  // 상세 페이지에서 지정한 읽음 상태 (lib/readStatus 공유)
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
            fontSize: '11px', fontWeight: 500, lineHeight: '13px', color: MAIN,
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
