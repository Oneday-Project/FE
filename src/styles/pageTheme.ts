import type { CSSProperties } from 'react'

/* 전 페이지 공통 배경 / 히어로 타이포 기준값
   피그마: 커뮤니티_자유게시판_Final › haeder (1546:9909), 소개페이지 0724 (1330:9578)
   - 바탕 #F5F9FF 위에 상단 420px 화이트 그라데이션 1겹
   - 피그마는 1440 고정 기준이라 색·구성만 가져오고 크기는 프로젝트 스케일(28/15) 유지 */

/* 메인 컬러 — 피그마 색상 스타일 'main' (#00178E 100%).
   버튼·선택된 필터·페이지네이션 등 강조는 전부 이 값을 쓴다. */
export const MAIN = '#00178E'

/* 보조 설명 텍스트 — 피그마 색상 스타일 '9797A9' */
export const MUTED = '#9797A9'

/* 전 페이지 공통 글꼴 */
export const FONT = "'Pretendard', 'Apple SD Gothic Neo', sans-serif"

export const PAGE_BG = '#F5F9FF'
export const INK = '#3C3C43'
export const INK_80 = 'rgba(60,60,67,0.8)'

/* 네비게이션 바 아래 화이트 그라데이션. App 루트에서 한 번만 깔고
   각 페이지는 배경을 지정하지 않는다(페이지별 차이 방지). */
export const PAGE_BACKGROUND =
  `linear-gradient(180deg, #FFFFFF 0%, rgba(255,255,255,0) 420px), ${PAGE_BG}`

/* 좌우 여백 기준 = 소개 페이지 (본문 1000, 좌우 안쪽 여백 40)
   세로 여백은 페이지마다 달라서 paddingTop/paddingBottom 으로 따로 준다. */
export const PAGE_MAX_W = '1000px'
export const PAGE_PAD_X = '40px'

/* 네비게이션 바 아래 ~ 페이지 제목까지의 간격.
   전 페이지가 이 값을 쓰므로 여기 한 줄만 고치면 다 같이 움직인다.
   (논문 상세는 뒤로가기 버튼이 있는 별도 구조라 이 값을 쓰지 않는다) */
export const PAGE_TOP = '96px'

export const pageContainer: CSSProperties = {
  maxWidth: PAGE_MAX_W,
  margin: '0 auto',
  paddingLeft: PAGE_PAD_X,
  paddingRight: PAGE_PAD_X,
  boxSizing: 'border-box',
}

/* 페이지 제목(히어로 멘트) */
export const pageTitle: CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: INK,
  margin: '0 0 12px',
}

/* 페이지 설명(부제) */
export const pageSubtitle: CSSProperties = {
  fontSize: '15px',
  color: INK_80,
  margin: 0,
  lineHeight: 1.6,
}

/* 제목 블록 아래 간격 */
export const HERO_GAP = '40px'

/* 읽음 상태 색 — 논문 목록 카드 뱃지(ReadStatusTag)와 논문 상세 토글이 같은 값을 쓴다.
   피그마 색상 스타일: 읽기 전 bookmark 계열 / 읽는 중 read-end / 읽기 완료 read-ing */
export const READ_STATUS_STYLE = {
  none:      { color: '#3B82F6', background: 'rgba(59,130,246,0.10)', label: '읽기 전' },
  reading:   { color: '#00B454', background: 'rgba(0,202,94,0.12)',   label: '읽는 중' },
  completed: { color: '#F59E0B', background: 'rgba(245,158,11,0.12)', label: '읽기 완료' },
} as const
