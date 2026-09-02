import { useState, type ReactNode } from 'react'
import { pageContainer, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'

/* 피그마: 소개_서비스소개 (1436:13883 / 1436:13963)
   - 탭 2개: H-AI Grad 소개 / 휴먼AI공학전공 대학원 소개
   - App.tsx 가 Navbar/Footer 를 감싸므로 여기선 페이지 내용만 렌더
   - 피그마는 1440 고정 기준이라 구성·색만 가져오고 크기는 프로젝트 스케일 유지 */

const NAVY = '#00178E'
const NAVY_60 = 'rgba(0,23,142,0.6)'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'
const INK_40 = 'rgba(60,60,67,0.4)'
type Tab = 'service' | 'grad'

export default function About() {
  const [tab, setTab] = useState<Tab>('service')

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      boxSizing: 'border-box',
      paddingBottom: '100px',
    }}>
      <div style={{ ...pageContainer, paddingTop: '72px', paddingBottom: 0 }}>

        {/* 헤더 */}
        <h1 style={pageTitle}>
          내 관심 분야에서 시작하는 대학원 준비
        </h1>
        <p style={pageSubtitle}>
          내 관심 분야에서 시작하는 대학원 준비. 논문을 찾고 기록하며, 나에게 맞는 전공·논문 로드맵을 확인해보세요.
        </p>

        {/* 탭 */}
        <div style={{ display: 'flex', marginTop: HERO_GAP, borderBottom: `1px solid ${INK_40}` }}>
          <TabButton active={tab === 'service'} onClick={() => setTab('service')}>
            H - AI Grad 소개
          </TabButton>
          <TabButton active={tab === 'grad'} onClick={() => setTab('grad')}>
            휴먼AI공학전공 대학원 소개
          </TabButton>
        </div>

        {/* 내용 */}
        <div style={{ marginTop: '48px' }}>
          {tab === 'service' ? <ServiceIntro /> : <GradIntro />}
        </div>
      </div>
    </div>
  )
}

/* ───────── 탭 1: H-AI Grad 소개 ───────── */

function ServiceIntro() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>

      {/* 서비스 한 줄 소개 */}
      <section>
        <p style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 16px', lineHeight: 1.5 }}>
          H-AI Grad는 대학원 준비를 돕는 맞춤형 진학 가이드 서비스입니다.
        </p>
        <p style={{ fontSize: '14px', color: INK_80, margin: 0, lineHeight: 1.9 }}>
          관심 분야에 맞는 논문을 살펴보고, 읽은 논문을 기록하며, 현재 상태에 맞는 전공·논문 로드맵을 확인할 수 있도록 돕습니다.
          <br />
          논문 탐색부터 읽기 기록, 맞춤형 로드맵까지 대학원 준비 과정을 하나의 흐름으로 연결합니다.
        </p>
      </section>

      {/* 주요 기능 */}
      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 24px' }}>주요 기능</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
          <FeatureCard
            icon={<DocIcon />}
            title="논문 탐색"
            desc="관심 분야별 논문을 확인하고, 논문 요약으로 핵심 정보를 빠르게 살펴볼 수 있습니다."
          />
          <FeatureCard
            icon={<CalendarIcon />}
            title="읽기 기록 관리"
            desc="읽는 중인 논문을 기록하고, 읽은 논문을 관리하며 월별 논문 현황을 한눈에 확인할 수 있습니다."
          />
          <FeatureCard
            icon={<RouteIcon />}
            title="맞춤 로드맵"
            desc="준비도 진단 결과와 관심 분야를 바탕으로 전공 과목·논문을 함께 제안합니다."
          />
        </div>
      </section>

      {/* 이용 흐름 */}
      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 8px' }}>H-AI Grad 이용 흐름</h2>
        <p style={{ fontSize: '13px', color: INK_80, margin: '0 0 32px', lineHeight: 1.6 }}>
          관심 분야 선택부터 논문 탐색, 읽기 기록, 로드맵 확인까지 한 흐름으로 이어집니다.
        </p>
        <Timeline
          steps={['01 관심 분야 선택', '02 논문 탐색', '03 읽기 기록 관리', '04 로드맵 확인']}
        />
      </section>

      {/* 팀원 소개 */}
      <section>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: NAVY, margin: '0 0 88px', textAlign: 'center' }}>
          H-AI Grad 팀원 소개
        </h2>
        <div style={{
          background: '#fff', borderRadius: '100px', padding: '32px 56px 40px',
          display: 'flex', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap',
        }}>
          {team.map(m => <TeamMember key={m.name} {...m} />)}
        </div>
      </section>
    </div>
  )
}

/* ───────── 탭 2: 휴먼AI공학전공 대학원 소개 ───────── */

function GradIntro() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '64px' }}>

      {/* 말풍선 + 수뭉 (수뭉은 말풍선 오른쪽 아래) */}
      <section>
        <div style={{
          position: 'relative',
          background: '#fff', borderRadius: '24px', padding: '28px 32px',
          boxShadow: '0 4px 20px rgba(15,23,42,0.05)',
          maxWidth: '660px',
        }}>
          {/* 오른쪽 아래 수뭉을 향해 내려가는 말풍선 꼬리 */}
          <span style={{
            position: 'absolute', right: '28px', bottom: '-19px',
            width: 0, height: 0,
            borderTop: '20px solid #fff',
            borderLeft: '20px solid transparent',
          }} />

          <p style={{ fontSize: '16px', fontWeight: 700, color: NAVY, margin: '0 0 14px', lineHeight: 1.6 }}>
            휴먼AI공학전공은 학부 교육에서 더 나아가<br />
            심화 연구와 전문성 개발을 위한 대학원 과정을 제공합니다.
          </p>
          <p style={{ fontSize: '14px', color: INK_80, margin: 0, lineHeight: 1.8 }}>
            학생들은 자신의 관심 분야와 진로 방향에 따라 지능정보공학, 감성공학과,
            스포츠 ICT융합학과 중 선택하여 학업과 연구를 이어갈 수 있습니다.
          </p>
        </div>

        {/* 상명대 마스코트 수뭉 */}
        <img
          src="/soomoong.svg"
          alt="상명대학교 마스코트 수뭉"
          style={{ display: 'block', width: '170px', marginLeft: 'auto', marginTop: '12px' }}
        />
      </section>

      {/* 대학원 소개 */}
      <section>
        <h2 style={{ fontSize: '20px', fontWeight: 700, color: NAVY, margin: '0 0 8px', textAlign: 'center' }}>
          대학원 소개
        </h2>
        <p style={{ fontSize: '13px', color: INK_80, margin: '0 0 32px', textAlign: 'center' }}>
          관심 분야에 따라 선택할 수 있는 세 가지 대학원 과정을 소개합니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {majors.map(m => <MajorCard key={m.name} {...m} />)}
        </div>
      </section>
    </div>
  )
}

/* ───────── 공용 조각 ───────── */

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '14px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '15px', fontWeight: active ? 700 : 500, fontFamily: 'inherit',
        color: active ? NAVY : INK_40,
        borderBottom: active ? `2px solid ${NAVY}` : '2px solid transparent',
        marginBottom: '-1px',
        transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function FeatureCard({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '28px 24px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '14px',
    }}>
      <span style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: '#EEF3FF', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </span>
      <h3 style={{ fontSize: '15px', fontWeight: 700, color: INK, margin: 0 }}>{title}</h3>
      <p style={{ fontSize: '12px', color: INK_80, margin: 0, lineHeight: 1.7 }}>{desc}</p>
    </div>
  )
}

function Timeline({ steps }: { steps: string[] }) {
  return (
    <div style={{ position: 'relative', padding: '40px 0' }}>
      {/* 가로선 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: '1px', background: NAVY, opacity: 0.5 }} />

      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between' }}>
        {steps.map((step, i) => (
          <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            {/* 위/아래 번갈아 배치 */}
            <span style={{
              order: i % 2 === 0 ? 0 : 2,
              fontSize: '13px', fontWeight: 600, color: NAVY, whiteSpace: 'nowrap',
            }}>
              {step}
            </span>
            <span style={{
              order: 1,
              width: '14px', height: '14px', borderRadius: '50%',
              background: NAVY, border: '3px solid #F5F9FF', boxSizing: 'content-box',
            }} />
          </div>
        ))}
      </div>
    </div>
  )
}

function TeamMember({ name, studentId, role, img, color }: { name: string; studentId: string; role: string; img: string; color: string }) {
  const [failed, setFailed] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '130px', marginTop: '-90px' }}>
      <div style={{
        width: '108px', height: '144px', borderRadius: '20px',
        /* 사진은 배경이 투명한 누끼라 뒷배경이 비친다 —
           그라데이션은 사진 로드 실패 시 폴백 아바타에만 사용 */
        background: failed ? color : 'transparent',
        overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fff', fontSize: '40px', fontWeight: 700,
      }}>
        {/* public/team/ 에 사진이 있으면 표시, 없으면(로드 실패) 이름 첫 글자 */}
        {!failed ? (
          <img
            src={img}
            alt={name}
            onError={() => setFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          name.charAt(0)
        )}
      </div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: INK, marginTop: '14px' }}>{name}</div>
      {/* 학번이 없어도 자리를 차지해야 아래 역할 줄이 나란히 맞는다 */}
      <div style={{ fontSize: '12px', color: INK_40, marginTop: '2px', minHeight: '17px' }}>{studentId || ' '}</div>
      <div style={{ fontSize: '12px', color: NAVY_60, fontWeight: 500, marginTop: '8px' }}>{role}</div>
    </div>
  )
}

function MajorCard({ name, tags, desc }: { name: string; tags: string[]; desc: string }) {
  return (
    <div style={{
      background: '#fff', borderRadius: '16px', padding: '24px 28px',
      display: 'flex', gap: '24px', alignItems: 'flex-start',
    }}>
      {/* 학과명 */}
      <div style={{ width: '130px', flexShrink: 0, fontSize: '16px', fontWeight: 700, color: INK, paddingTop: '2px' }}>
        {name}
      </div>

      {/* 태그 + 설명 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
          {tags.map(tag => (
            <span key={tag} style={{
              border: `1px solid ${NAVY}`, borderRadius: '100px', padding: '3px 10px',
              fontSize: '11px', fontWeight: 600, color: NAVY, whiteSpace: 'nowrap',
            }}>
              {tag}
            </span>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: INK_80, margin: 0, lineHeight: 1.7 }}>{desc}</p>
      </div>

      {/* 자세히 보기 */}
      <a
        href="https://hi.smu.ac.kr/hi/index.do"
        target="_blank"
        rel="noreferrer"
        style={{
          flexShrink: 0, alignSelf: 'flex-start',
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: '12px', fontWeight: 500, color: INK_80, textDecoration: 'none',
        }}
      >
        자세히 보기
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 6l6 6-6 6" />
        </svg>
      </a>
    </div>
  )
}

/* ───────── 데이터 ───────── */

/* 사진은 public/team/ 에 아래 파일명으로 넣으면 자동으로 표시됨.
   파일이 없으면 이름 첫 글자 아바타로 대체된다. */
const team = [
  { name: '심영주', studentId: '202310847', role: 'AI & Design', img: '/team/sim.svg', color: 'linear-gradient(135deg, #6D8BFF, #A8B4FF)' },
  { name: '유세리', studentId: '202310856', role: 'AI & Front - End', img: '/team/yoo.svg', color: 'linear-gradient(135deg, #4C96FF, #7FB8FF)' },
  { name: '장희정', studentId: '202310871', role: 'AI & Front - End', img: '/team/jang.svg', color: 'linear-gradient(135deg, #5B7CFA, #9AA9FF)' },
  { name: '김정우', studentId: '202110834', role: 'AI & Back - End', img: '/team/kim.svg', color: 'linear-gradient(135deg, #3B6FE8, #6D8BFF)' },
  { name: '송예린', studentId: '202310843', role: 'AI & Back - End', img: '/team/song.svg', color: 'linear-gradient(135deg, #4C7DFF, #8FA6FF)' },
]

const majors = [
  {
    name: '스포츠ICT융합학과',
    tags: ['ML', 'CV', 'NLP', 'Retrieval AI'],
    desc: '스포츠와 첨단 ICT 기술을 융합해 미래 스포츠산업을 연구하는 대학원 과정입니다. 스포츠 데이터 분석, 디지털 헬스케어, 웨어러블 디바이스, 퍼포먼스 최적화 기술 등을 다룹니다.',
  },
  {
    name: '감성공학과',
    tags: ['HCI', 'Multimodal', 'SAP', 'ML'],
    desc: '인간의 감정과 행동을 인식하고 이해하는 기술을 연구하는 대학원 과정입니다. 감성 인식, 감성 컴퓨팅, 인간-컴퓨터 상호작용을 바탕으로 인간 중심 AI 시스템을 탐구합니다.',
  },
  {
    name: '지능정보공학과',
    tags: ['SAP', 'ML', 'CV', 'Multimodal'],
    desc: 'AI 기술과 데이터 처리 시스템을 심화 연구하는 대학원 과정입니다. 딥러닝, 컴퓨터 비전, 자연어 처리, 빅데이터 분석 등을 중심으로 AI 시스템 개발과 최적화 역량을 기릅니다.',
  },
]

/* ───────── 아이콘 ───────── */

function DocIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="19" r="2.5" />
      <circle cx="18" cy="5" r="2.5" />
      <path d="M8.5 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.5" />
    </svg>
  )
}
