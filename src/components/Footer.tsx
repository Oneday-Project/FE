import type { ReactNode } from 'react'
import designNibIcon from './iconoir_design-nib-solid.png'
import frontEndIcon from './hugeicons_web-design-02.png'
import backEndIcon from './streamline-ultimate_coding-apps-website-apps-browser-bold.svg'

/* 피그마: Footer final (1229:13681)
   구성은 피그마 그대로, 크기만 프로젝트 스케일에 맞춰 살짝 줄임. */

import { MAIN as NAVY } from '../styles/pageTheme'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'

/* 파트별 아이콘은 디자인에서 내보낸 파일을 그대로 쓴다
   (직접 그린 SVG 는 모양이 달라서 교체함) */
const teams = [
  {
    title: 'Design',
    icon: designNibIcon,        // 펜촉
    members: ['Yeongju Sim'],
  },
  {
    title: 'Front - End',
    icon: frontEndIcon,         // 브라우저 창
    members: ['Heejung Jang', 'Serih Yu'],
  },
  {
    title: 'Back - End',
    icon: backEndIcon,          // 브라우저 창 + 데이터 블록
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

function ColumnTitle({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', margin: '0 0 22px' }}>
      <span style={{ fontSize: '15px', fontWeight: 600, color: INK }}>{children}</span>
      <img
        src={icon}
        alt=""
        width={15}
        height={15}
        style={{ display: 'block', flexShrink: 0, objectFit: 'contain' }}
      />
    </div>
  )
}

/* ───────── 아이콘 ───────── */

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
