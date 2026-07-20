import type { ReactNode } from 'react'

/* 피그마: Footer final (1229:13681)
   구성은 피그마 그대로, 크기만 프로젝트 스케일에 맞춰 살짝 줄임. */

const NAVY = '#00178E'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'

const teams = [
  {
    title: 'Design',
    icon: <NibIcon />,
    members: ['Yeongju Sim'],
  },
  {
    title: 'Front - End',
    icon: <WebDesignIcon />,
    members: ['Heejung Jang', 'Serih Yu'],
  },
  {
    title: 'Back - End',
    icon: <BrowserIcon />,
    members: ['Jungwoo Kim', 'Yerin Song'],
  },
]

export default function Footer() {
  return (
    <footer style={{
      width: '100%',
      background: '#fff',
      borderTop: '1px solid #E3E8F5',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '64px 40px 24px' }}>

        {/* ── 상단: 소개 + 팀 + 연락처 ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(260px, 1.7fr) repeat(3, minmax(104px, 0.75fr)) minmax(230px, 1.2fr)',
          gap: '32px',
          alignItems: 'start',
        }}>

          {/* 소개 */}
          <div>
            <p style={{
              fontFamily: "'DM Sans', 'Pretendard', sans-serif",
              fontSize: '26px', fontWeight: 700, color: NAVY,
              margin: '0 0 20px', lineHeight: 1.05,
            }}>
              onedayproject
            </p>

            <p style={{
              fontSize: '12px', color: NAVY, lineHeight: 1.5,
              margin: '0 0 28px', maxWidth: '310px',
            }}>
              H-AI Grad helps students discover papers, track reading progress,
              and build personalized graduate school roadmaps.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* 상명대 로고 — public/sangmyung.svg 로 교체 */}
              <img
                src="/sangmyung.svg"
                alt="상명대학교"
                style={{ width: '16px', height: '22px', flexShrink: 0, objectFit: 'contain' }}
              />
              <div style={{ fontSize: '12px', color: INK_80, lineHeight: 1.5 }}>
                <div>휴먼AI공학전공 2026 졸업프로젝트</div>
                <div>Human-AI Engineering Major 2026 Graduation Project</div>
              </div>
            </div>
          </div>

          {/* 팀 컬럼 3개 */}
          {teams.map(team => (
            <div key={team.title}>
              <ColumnTitle icon={team.icon}>{team.title}</ColumnTitle>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {team.members.map(name => (
                  <span key={name} style={{ fontSize: '14px', fontWeight: 500, color: INK_80 }}>
                    {name}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {/* 연락처 */}
          <div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: NAVY, margin: '0 0 22px' }}>
              Contacts us
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <a
                href="mailto:onedayproject179@gmail.com"
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '14px', fontWeight: 500, color: INK_80, textDecoration: 'none',
                }}
              >
                <MailIcon />
                onedayproject179@gmail.com
              </a>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                <span style={{ flexShrink: 0, marginTop: '2px' }}><PinIcon /></span>
                <span style={{ fontSize: '14px', fontWeight: 500, color: INK_80, lineHeight: 1.45 }}>
                  20, Hongjimun 2-gil, Jongno-gu, Seoul
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 하단 ── */}
        <div style={{ height: '1px', background: '#E3E8F5', margin: '80px 0 20px' }} />

        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: '8px',
          fontSize: '12px', color: INK_80,
        }}>
          <span>Copyright © 2026 oneday project</span>
          <span>All Rights Reserved</span>
        </div>
      </div>
    </footer>
  )
}

function ColumnTitle({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '0 0 22px' }}>
      <span style={{ fontSize: '15px', fontWeight: 600, color: INK }}>{children}</span>
      {icon}
    </div>
  )
}

/* ───────── 아이콘 ───────── */

function NibIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={NAVY}>
      <path d="M3 3l7.5 2.2 8.3 8.3-5 5-8.3-8.3L3 3zm4.6 4.6a1.4 1.4 0 1 0 2-2 1.4 1.4 0 0 0-2 2zm7.7 12.6l1.8-1.8 2.6 2.6-1.8 1.8-2.6-2.6z" />
    </svg>
  )
}

function WebDesignIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="3.5" width="19" height="17" rx="2.5" />
      <path d="M2.5 8.5h19M6 6h.01M8.5 6h.01" />
    </svg>
  )
}

function BrowserIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={NAVY}>
      <path d="M3 4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4zm2 5v11h14V9H5zm1.6-3.4a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm2.8 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    </svg>
  )
}

function MailIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M3.5 7l8.5 6 8.5-6" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21.5s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </svg>
  )
}
