import type { ReactNode } from 'react'
import { pageTitle, pageSubtitle } from '../styles/pageTheme'
import { NAVY, INK, INK_80, GRAY, TAG_BG, LINE, BOARD_LABEL, HEART_RED, COMMUNITY_HERO_GAP, COMMUNITY_TAB_GAP } from '../styles/communityTheme'
import type { BoardTab } from '../lib/communityData'

/* 커뮤니티 목록(Community)과 상세(CommunityDetail)가 같이 쓰는 조각 */

/* 페이지 제목 + 상단 탭 */
export function CommunityHeader({ tab, onTabChange }: { tab: BoardTab; onTabChange: (tab: BoardTab) => void }) {
  return (
    <>
      <h1 style={pageTitle}>커뮤니티</h1>
      <p style={pageSubtitle}>대학원 진학과 연구에 대한 이야기를 자유롭게 나눠보세요.</p>

      <div style={{ display: 'flex', gap: '32px', marginTop: COMMUNITY_HERO_GAP, borderBottom: `1px solid ${LINE}` }}>
        {(['free', 'seniors'] as const).map(t => (
          <MainTab key={t} active={tab === t} onClick={() => onTabChange(t)}>{BOARD_LABEL[t]}</MainTab>
        ))}
      </div>
    </>
  )
}

function MainTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0 4px 12px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '16px', fontWeight: active ? 600 : 500, fontFamily: 'inherit',
        color: active ? INK : INK_80,
        borderBottom: active ? `3px solid ${NAVY}` : '3px solid transparent',
        marginBottom: '-1px',
        transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

/* 게시판 제목 + 설명 + 글쓰기 버튼 */
export function BoardHeading({ title, desc, onWrite }: { title: string; desc: string; onWrite: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '16px', margin: `${COMMUNITY_TAB_GAP} 0 52px`,
    }}>
      <div>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: INK, margin: '0 0 8px' }}>{title}</h2>
        <p style={{ fontSize: '12px', color: GRAY, margin: 0 }}>{desc}</p>
      </div>
      <button
        type="button"
        onClick={onWrite}
        style={{
          flexShrink: 0,
          background: NAVY, color: '#fff', border: 'none', borderRadius: '20px',
          padding: '11px 20px', fontSize: '14px', fontWeight: 600,
          fontFamily: 'inherit', cursor: 'pointer',
        }}
      >
        + 글쓰기
      </button>
    </div>
  )
}

export function CategoryTag({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: '100px', padding: '7px 14px',
        border: active ? `1.2px solid ${NAVY}` : '1.2px solid transparent',
        fontSize: '13px', fontWeight: active ? 600 : 500, fontFamily: 'inherit',
        color: active ? NAVY : INK,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

/* 채워진 라벨(분류·진로 유형) */
export function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{
      alignSelf: 'flex-start',
      background: TAG_BG, borderRadius: '100px', padding: '6px 12px',
      fontSize: '12px', fontWeight: 500, color: NAVY, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

/* 테두리 라벨(연구 분야) */
export function OutlinePill({ children }: { children: ReactNode }) {
  return (
    <span style={{
      border: `1.2px solid ${NAVY}`, borderRadius: '100px', padding: '3px 8px',
      fontSize: '11px', fontWeight: 600, color: NAVY, whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}

export function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
      marginTop: '40px',
    }}>
      <ArrowButton label="첫 페이지" disabled={page === 1} onClick={() => onChange(1)} double flip />
      <ArrowButton label="이전 페이지" disabled={page === 1} onClick={() => onChange(page - 1)} flip />

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            fontFamily: 'inherit', fontSize: '14px',
            fontWeight: n === page ? 600 : 500,
            color: n === page ? NAVY : INK_80,
          }}
        >
          {n}
        </button>
      ))}

      <ArrowButton label="다음 페이지" disabled={page === totalPages} onClick={() => onChange(page + 1)} />
      <ArrowButton label="마지막 페이지" disabled={page === totalPages} onClick={() => onChange(totalPages)} double />
    </div>
  )
}

function ArrowButton({ label, disabled, onClick, double, flip }: {
  label: string; disabled: boolean; onClick: () => void; double?: boolean; flip?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        background: 'none', border: 'none', padding: '2px',
        display: 'flex', alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transform: flip ? 'rotate(180deg)' : undefined,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {double ? <path d="M7 5l7 7-7 7M13 5l7 7-7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )
}

/* ───────── 아이콘 ───────── */

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

export function ChevronIcon({ dir = 'down', color = INK_80 }: { dir?: 'down' | 'up' | 'left'; color?: string }) {
  const d = { down: 'M6 9l6 6 6-6', up: 'M6 15l6-6 6 6', left: 'M15 6l-6 6 6 6' }[dir]
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

/* 채워진 하트 — 게시글 좋아요는 늘 빨강, 댓글 좋아요는 회색이다가 누르면 빨강 */
export function HeartIcon({ color = HEART_RED, size = 14 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{ flexShrink: 0 }}>
      <path d="M12 21s-8.5-5.2-8.5-11.3A4.7 4.7 0 0 1 12 6.6a4.7 4.7 0 0 1 8.5 3.1C20.5 15.8 12 21 12 21z" />
    </svg>
  )
}
