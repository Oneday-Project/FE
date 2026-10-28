import type { CSSProperties } from 'react'
import { MAIN, MUTED, INK, INK_80 } from './pageTheme'
import type { BoardTab } from '../lib/communityData'

/* 커뮤니티 목록·상세 공통 색/박스/유틸 */

export const NAVY = MAIN
export { INK, INK_80, MUTED }
export const INK_40 = 'rgba(60,60,67,0.4)'
export const GRAY = '#737885'
export const TAG_BG = '#F0F5FF'
export const CARD_BORDER = '#E0E5F0'
export const LINE = '#E5EBF2'
/* 커뮤니티 상단 여백 — 피그마 커뮤니티_1021수정 기준.
   제목은 네비 바에 더 붙고, 제목 블록과 탭 사이는 넓게 띄운다.
   다른 페이지와 간격이 달라서 공통 PAGE_TOP/HERO_GAP 대신 이 값을 쓴다. */
export const COMMUNITY_TOP = '64px'
export const COMMUNITY_HERO_GAP = '144px'
/* 탭 아래 ~ 게시판 제목(목록) / 경로(상세) */
export const COMMUNITY_TAB_GAP = '48px'

export const HEART_RED = '#F0445B'
export const HEART_GRAY = '#B8BCC6'

export const BOARD_LABEL: Record<BoardTab, string> = {
  free: '자유 게시판',
  seniors: '선배들의 발자취',
}

/* 흰 카드 박스 — 게시글 목록·상세 본문·댓글 영역 공통 */
export const cardBox: CSSProperties = {
  background: '#fff',
  border: `1px solid ${TAG_BG}`,
  borderRadius: '20px',
}

export const pageWrapper: CSSProperties = {
  width: '100%',
  minHeight: '100vh',
  fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
  boxSizing: 'border-box',
  paddingBottom: '100px',
}

/* ───────── 유틸 ───────── */

export function formatAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  if (minutes < 60 * 48) return '어제'
  return `${Math.floor(minutes / (60 * 24))}일 전`
}
