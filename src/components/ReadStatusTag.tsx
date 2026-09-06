import type { ReadStatus } from '../lib/readStatus'
import { READ_STATUS_STYLE } from '../styles/pageTheme'
import bookCloseIcon from './akar-icons_book-close.png'
import bookOpenIcon from './akar-icons_book.png'


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

  const style = READ_STATUS_STYLE[status ?? 'none']

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
        : <img
            src={status === 'reading' ? bookOpenIcon : bookCloseIcon}
            alt="" width={13} height={13}
            style={{ display: 'block', objectFit: 'contain' }}
          />}
      {style.label}
    </span>
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
