import type { ReadStatus } from '../lib/readStatus'

// 논문 카드 좌측 상단 뱃지 — 읽음 상태가 없으면 자리만 차지하고 비워둠
export default function ReadStatusTag({ status }: { status: ReadStatus | null }) {
  if (!status) return <span style={{ height: '24px' }} />

  const reading = status === 'reading'
  const color = reading ? '#00B454' : '#F59E0B'
  const background = reading ? 'rgba(0,202,94,0.12)' : 'rgba(245,158,11,0.12)'

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      height: '24px', padding: '0 9px',
      borderRadius: '7px',
      background, color,
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap',
    }}>
      {reading ? <BookIcon color={color} /> : <CheckIcon color={color} />}
      {reading ? '읽는 중' : '읽기 완료'}
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
