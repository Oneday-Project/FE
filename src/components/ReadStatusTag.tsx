import type { ReadStatus } from '../lib/readStatus'

/* 논문 카드 좌측 상단 뱃지.
   showDefault=true 면 읽음 상태가 없을 때 '읽기 전' 기본 뱃지를 보여준다(논문 목록 카드).
   기본값 false — 메인·마이페이지는 지금처럼 자리만 비워둔다. */
export default function ReadStatusTag({
  status, showDefault = false,
}: {
  status: ReadStatus | null
  showDefault?: boolean
}) {
  if (!status && !showDefault) return <span style={{ height: '24px' }} />

  const style = status === 'reading'
    ? { color: '#00B454', background: 'rgba(0,202,94,0.12)', label: '읽는 중' }
    : status === 'completed'
      ? { color: '#F59E0B', background: 'rgba(245,158,11,0.12)', label: '읽기 완료' }
      : { color: '#3B82F6', background: 'rgba(59,130,246,0.1)', label: '읽기 전' }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      height: '24px', padding: '0 9px',
      borderRadius: '7px',
      background: style.background, color: style.color,
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {status === 'completed'
        ? <CheckIcon color={style.color} />
        : <BookIcon color={style.color} />}
      {style.label}
    </span>
  )
}

function BookIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v5H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </svg>
  )
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.4l2.7 2.7L16 9.8" />
    </svg>
  )
}
