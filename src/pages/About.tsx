import { Fragment, useState, type CSSProperties, type ReactNode } from 'react'
import { MAIN, INK, INK_80, FONT, PAGE_BG } from '../styles/pageTheme'

/* 피그마: 소개페이지2_ 0902 (1647:26091)
   - 서비스 소개 탭 1647:26507 / 대학원 소개 탭 1647:26717
   - App.tsx 가 Navbar/Footer 를 감싸므로 여기선 페이지 내용만 렌더
   - 피그마는 1440 고정 캔버스라 전체를 S(0.7)배로 줄여 본문 폭(약 1000)에 맞춘다.
     f(피그마 px) 로 적어 두면 피그마 수치와 바로 대조할 수 있다.
   - 자유 배치 구간(로고, 이용 흐름, 팀원, 말풍선)은 피그마 좌표를 그대로 옮겨
     1440 폭 캔버스(FRAME) 안에 absolute 로 놓는다.
   - 이미지·아이콘은 피그마에서 내보낸 파일(public/about/)을 쓴다. */

const S = 0.7
const f = (figmaPx: number) => `${+(figmaPx * S).toFixed(2)}px`

const INK_40 = 'rgba(60,60,67,0.4)'
const DESC = '#666666'   // 피그마 카드 설명 텍스트
const BLACK = '#000000'

/* 피그마 1440 캔버스를 축소한 폭 — 가운데 정렬 */
const FRAME: CSSProperties = { position: 'relative', width: f(1440), margin: '0 auto' }

/* 피그마 좌표(캔버스 기준) 그대로 절대 배치 */
const abs = (x: number, y: number): CSSProperties => ({ position: 'absolute', left: f(x), top: f(y) })

type Tab = 'service' | 'grad'

export default function About() {
  const [tab, setTab] = useState<Tab>('service')

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      fontFamily: FONT,
      boxSizing: 'border-box',
      // 배경 블러 원이 화면 밖으로 나가도 가로 스크롤이 생기지 않게
      overflow: 'hidden',
      paddingTop: f(154),
      paddingBottom: f(240),
    }}>
      <Hero />

      {/* 탭 — 아래 흰 영역 윗변에 절반쯤 걸친다 (피그마 탭 700~764 / 흰 영역 734~) */}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', justifyContent: 'center', gap: f(26),
        marginTop: f(220), marginBottom: f(-30),
      }}>
        <button onClick={() => setTab('service')} style={TAB_BUTTON}>
          <Pill active={tab === 'service'}>H - AI Grad 소개</Pill>
        </button>
        <button onClick={() => setTab('grad')} style={TAB_BUTTON}>
          <Pill active={tab === 'grad'}>휴먼AI공학전공 대학원 소개</Pill>
        </button>
      </div>

      {tab === 'service' ? <ServiceIntro /> : <GradIntro />}
    </div>
  )
}

/* ───────── 상단 로고 ───────── */

function Hero() {
  return (
    <div style={{ position: 'relative', width: f(417), height: f(206), margin: '0 auto' }}>
      {/* 로고 아래 그림자 (블러 여백까지 포함된 svg) */}
      <img src="/about/hero-shadow.svg" alt="" style={{ ...abs(-24, 140), width: f(465), height: f(90), maxWidth: 'none' }} />

      {/* 졸업모자 — 피그마에서 -16° 회전, 이미지 위아래 여백은 잘라낸다 */}
      <div style={{
        ...abs(5, 0), width: f(130.915), height: f(104.735),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          position: 'relative', flexShrink: 0, overflow: 'hidden',
          width: f(114.327), height: f(76.055), transform: 'rotate(-16.07deg)',
        }}>
          <img src="/about/grad-cap.png" alt="" style={{
            position: 'absolute', left: '-2.85%', top: '-28.27%', width: '107.13%', height: '141.97%', maxWidth: 'none',
          }} />
        </div>
      </div>

      <img src="/nav-logo.svg" alt="H-AI Grad" style={{ ...abs(70, 63), width: f(344), height: f(112), objectFit: 'contain' }} />

      <p style={{
        position: 'absolute', left: 0, right: 0, top: f(157), margin: 0,
        textAlign: 'center', fontSize: f(16), fontWeight: 500, color: BLACK, whiteSpace: 'nowrap',
      }}>
        대학원 진학 준비를 위한 맞춤형 가이드
      </p>
    </div>
  )
}

/* ───────── 탭 1: H-AI Grad 소개 ───────── */

function ServiceIntro() {
  return (
    <>
      {/* 흰 띠 — 소개 문구 + 주요 기능. 기능 카드는 띠 아래로 절반쯤 걸쳐 나온다.
          flow-root: 카드의 음수 margin 이 띠 밖으로 새지 않고 띠 높이만 줄이도록 */}
      <section style={{ background: '#fff', paddingTop: f(189), display: 'flow-root' }}>
        <div style={{ ...FRAME, textAlign: 'center' }}>
          <h2 style={{ fontSize: f(32), fontWeight: 600, color: MAIN, margin: 0 }}>
            H-AI Grad는 대학원 준비를 돕는 맞춤형 진학 가이드 서비스입니다.
          </h2>
          <p style={{ fontSize: f(20), fontWeight: 500, color: INK, margin: `${f(49)} 0 0`, lineHeight: 'normal' }}>
            관심 분야에 맞는 논문을 탐색하고, 읽은 논문을 기록하며,<br />
            현재 준비 상태에 맞는 전공·논문 로드맵을 확인할 수 있도록 돕습니다.<br />
            <br />
            논문 탐색부터 읽기 기록, 맞춤형 로드맵 추천까지 대학원 준비 과정을 하나의 흐름으로 연결합니다.
          </p>

          <h3 style={{ fontSize: f(24), fontWeight: 600, color: MAIN, margin: `${f(146)} 0 0` }}>주요 기능</h3>
          {/* 피그마: 카드 300 중 위 141 만 흰 띠 안 → 나머지 159 는 띠 아래로 */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: f(56), marginBottom: f(-159) }}>
            {features.map(ft => <FeatureCard key={ft.title} {...ft} />)}
          </div>
        </div>
      </section>

      <FlowSection />
      <TeamSection />
    </>
  )
}

/* 이용 흐름 — 화면 전체 폭 점선 위아래로 단계가 번갈아 달린다 (피그마 1814~2186) */
function FlowSection() {
  return (
    <section style={{ position: 'relative', marginTop: f(1814 - 1415), height: f(372) }}>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: f(213), height: f(5),
        background: `repeating-linear-gradient(90deg, ${MAIN} 0 ${f(15)}, transparent ${f(15)} ${f(20)})`,
      }} />

      <div style={{ ...FRAME, height: '100%' }}>
        <h2 style={{ ...abs(184, 0), margin: 0, fontSize: f(32), fontWeight: 600, color: MAIN, whiteSpace: 'nowrap' }}>
          H-AI Grad 이용 흐름
        </h2>
        <p style={{ ...abs(184, 58), margin: 0, fontSize: f(20), fontWeight: 500, color: INK_80, lineHeight: 'normal', whiteSpace: 'nowrap' }}>
          관심 분야 선택부터<br />
          논문 탐색, 읽기 기록, 로드맵 확인까지<br />
          한 흐름으로 이어집니다.
        </p>

        {flowSteps.map(step => <FlowStep key={step.label} {...step} />)}
      </div>
    </section>
  )
}

function FlowStep({ label, x, up }: { label: string; x: number; up: boolean }) {
  return (
    <>
      {/* 점 + 세로선 (피그마 Line 137/138) — 위 단계는 점이 위, 아래 단계는 점이 아래 */}
      <div style={{
        position: 'absolute', left: f(x), top: f(up ? 127.67 : 213), transform: 'translateX(-50%)',
        width: f(26.67), height: f(85.33),
      }}>
        <img
          src={up ? '/about/flow-stem-up.svg' : '/about/flow-stem-down.svg'}
          alt=""
          style={{
            position: 'absolute', left: '50%', top: '50%', width: f(85.33), height: f(26.67), maxWidth: 'none',
            transform: `translate(-50%, -50%) rotate(${up ? 90 : -90}deg)`,
          }}
        />
      </div>
      <span style={{
        position: 'absolute', left: f(x), top: f(up ? 72 : 343), transform: 'translateX(-50%)',
        fontSize: f(24), fontWeight: 500, color: MAIN, whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </>
  )
}

/* 팀원 소개 — 흰 카드 위에 원형 사진 5개가 두 줄로 엇갈려 놓인다 (피그마 2554~3131) */
function TeamSection() {
  return (
    <section style={{ ...FRAME, marginTop: f(2554 - 2186), height: f(3131 - 2554) }}>
      <Blob src="/about/blob-b.svg" cx={286} cy={350} size={1371} />
      <Blob src="/about/blob-a.svg" cx={1281} cy={906} size={1371} />

      <div style={{ ...abs(69, 32), width: f(1303), height: f(545), background: '#fff', borderRadius: f(78) }} />
      <div style={abs(150, 0)}>
        <Pill active>H - AI Grad 팀원 소개</Pill>
      </div>

      {team.map(m => <TeamMember key={m.name} {...m} />)}
    </section>
  )
}

function TeamMember({ name, studentId, role, img, x, y }: Member) {
  return (
    <div style={{ ...abs(x, y), width: f(277.84), height: f(192) }}>
      {/* 원형 사진 — 피그마 원형 프레임(그라데이션 배경·그림자 포함)을 그대로 내보낸 이미지.
          그림자 여백(왼쪽·위 6px)만큼 당겨서 원 위치를 맞춘다 */}
      <img src={img} alt={name} style={{ ...abs(40, -6), width: f(208), height: f(208) }} />
      <div style={{
        ...abs(0, 19), fontSize: f(24), fontWeight: 700, letterSpacing: f(-1.68),
        color: BLACK, lineHeight: 'normal', whiteSpace: 'pre',
      }}>
        {role}
      </div>
      <div style={{
        position: 'absolute', right: 0, top: f(112), textAlign: 'right',
        fontSize: f(15.36), fontWeight: 600, letterSpacing: f(-1.0752), color: BLACK, lineHeight: 'normal',
      }}>
        {studentId}<br />{name}
      </div>
    </div>
  )
}

/* ───────── 탭 2: 휴먼AI공학전공 대학원 소개 ───────── */

function GradIntro() {
  return (
    <>
      {/* 말풍선 카드 + 꼬리 + 마스코트 (피그마 734~1422) */}
      <section style={{ ...FRAME, height: f(1422 - 734) }}>
        <div style={{ ...abs(189, 0), width: f(1062), height: f(407), background: '#fff', borderRadius: f(78) }}>
          <p style={{
            ...abs(255, 117), width: f(553), margin: 0,
            fontSize: f(24), fontWeight: 600, color: MAIN, lineHeight: 'normal',
          }}>
            <span style={{ fontSize: f(32) }}>휴먼AI공학전공</span>은 학부 교육에서 더 나아가<br />
            심화 연구와 전문성 개발을 위한 대학원 과정을 제공합니다.
          </p>
          <p style={{
            position: 'absolute', left: '50%', top: f(232), transform: 'translateX(-50%)', width: f(700), margin: 0,
            textAlign: 'center', fontSize: f(24), fontWeight: 500, color: INK, lineHeight: 'normal',
          }}>
            학생들은 자신의 관심 분야와 진로 방향에 따라<br />
            지능정보공학, 감성공학과, 스포츠 ICT융합학과 중 선택하여<br />
            학업과 연구를 이어갈 수 있습니다.
          </p>

          {/* 말풍선 꼬리 — 마스코트 쪽을 향해 151.58° 회전 */}
          <div style={{
            ...abs(748, 313), width: f(192.565), height: f(219.942),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              position: 'relative', flexShrink: 0,
              width: f(118.251), height: f(186.09), transform: 'rotate(151.58deg)',
            }}>
              <img src="/about/bubble-tail.svg" alt="" style={{
                position: 'absolute', left: '8.89%', top: '6.14%', width: '82.22%', height: '68.86%',
              }} />
            </div>
          </div>
        </div>

        {/* 상명대 마스코트 수뭉 — 이미지 바깥 여백은 잘라낸다 */}
        <div style={{ ...abs(1036, 487), width: f(209), height: f(201), overflow: 'hidden' }}>
          <img src="/about/mascot.png" alt="상명대학교 마스코트 수뭉" style={{
            position: 'absolute', left: '-11.91%', top: '-8.7%', width: '132.85%', height: '118.14%', maxWidth: 'none',
          }} />
        </div>
      </section>

      {/* 대학원 소개 (피그마 1576~) */}
      <section style={{ ...FRAME, marginTop: f(1576 - 1422) }}>
        <Blob src="/about/blob-b.svg" cx={228} cy={1809 - 1576} size={1408} />
        <Blob src="/about/blob-a.svg" cx={1255.5} cy={2531.5 - 1576} size={1371} />

        {/* 배경 블러 원보다 위에 그려지도록 relative */}
        <div style={{ position: 'relative', textAlign: 'center' }}>
          <h2 style={{ fontSize: f(32), fontWeight: 600, color: MAIN, margin: 0 }}>대학원 소개</h2>
          <p style={{ fontSize: f(20), fontWeight: 500, color: INK_80, margin: `${f(8)} 0 0` }}>
            관심 분야에 따라 선택할 수 있는 세 가지 대학원 과정을 소개합니다.
          </p>
          <div style={{
            display: 'flex', flexDirection: 'column', gap: f(32),
            width: f(1062), margin: `${f(96)} auto 0`, textAlign: 'left',
          }}>
            {majors.map(m => <MajorCard key={m.name} {...m} />)}
          </div>
        </div>
      </section>
    </>
  )
}

function MajorCard({ name, tags, desc }: Major) {
  return (
    <div style={{
      background: '#fff', borderRadius: f(12), height: f(216), boxSizing: 'border-box',
      padding: `0 ${f(16)}`, display: 'flex', alignItems: 'center', gap: f(32),
    }}>
      <div style={{ width: f(227), flexShrink: 0, textAlign: 'center', fontSize: f(24), fontWeight: 600, color: MAIN }}>
        {name}
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: f(32) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: f(753) }}>
          <div style={{ display: 'flex', gap: f(8) }}>
            {tags.map(tag => <span key={tag} style={TAG}>{tag}</span>)}
          </div>
          <a
            href="https://hi.smu.ac.kr/hi/index.do"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: f(20), fontWeight: 500, color: INK_80, textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            자세히 보기 →
          </a>
        </div>
        <p style={{ margin: 0, fontSize: f(20), fontWeight: 500, color: DESC, lineHeight: 'normal' }}>
          {lines(desc)}
        </p>
      </div>
    </div>
  )
}

/* ───────── 공용 조각 ───────── */

const TAB_BUTTON: CSSProperties = {
  background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit',
}

/* 탭 모양 알약 — 피그마 Frame 757/758: 흰 알약 안에, 선택되면 연한 파랑 알약이 한 겹 더 */
function Pill({ active, children }: { active: boolean; children: ReactNode }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', height: f(64), boxSizing: 'border-box',
      padding: f(10), borderRadius: f(48), background: '#fff',
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', height: '100%',
        padding: `0 ${f(22)}`, borderRadius: f(48),
        background: active ? PAGE_BG : 'transparent',
        fontSize: f(24), fontWeight: active ? 600 : 500,
        color: active ? MAIN : INK_40, whiteSpace: 'nowrap',
      }}>
        {children}
      </span>
    </span>
  )
}

function FeatureCard({ icon, title, desc }: Feature) {
  return (
    <div style={{
      width: f(311), height: f(300), borderRadius: f(200), background: '#fff', boxSizing: 'border-box',
      padding: f(24), display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ width: f(260), display: 'flex', flexDirection: 'column', alignItems: 'center', gap: f(20) }}>
        <img src={icon} alt="" style={{ width: f(48), height: f(48) }} />
        <div style={{ fontSize: f(24), fontWeight: 500, color: BLACK }}>{title}</div>
        <div style={{ fontSize: f(20), fontWeight: 500, color: DESC, lineHeight: 'normal' }}>{lines(desc)}</div>
      </div>
    </div>
  )
}

/* 배경 블러 원 (피그마 Ellipse 77/116) — svg 에 블러 여백이 포함돼 있어 중심 기준으로 놓는다 */
function Blob({ src, cx, cy, size }: { src: string; cx: number; cy: number; size: number }) {
  return (
    <img src={src} alt="" style={{
      position: 'absolute', left: f(cx - size / 2), top: f(cy - size / 2),
      width: f(size), height: f(size), maxWidth: 'none', pointerEvents: 'none',
    }} />
  )
}

/* 피그마 줄바꿈 그대로 — 빈 문자열은 빈 줄 */
function lines(list: string[]) {
  return list.map((line, i) => (
    <Fragment key={i}>
      {i > 0 && <br />}
      {line}
    </Fragment>
  ))
}

const TAG: CSSProperties = {
  background: '#fff', border: `1.2px solid ${MAIN}`, borderRadius: '100px',
  padding: `${f(8)} ${f(12)}`, fontSize: f(16), fontWeight: 600, color: MAIN,
  lineHeight: 'normal', whiteSpace: 'nowrap',
}

/* ───────── 데이터 ───────── */

type Feature = { icon: string; title: string; desc: string[] }
type Member = { name: string; studentId: string; role: string; img: string; x: number; y: number }
type Major = { name: string; tags: string[]; desc: string[] }

const features: Feature[] = [
  {
    icon: '/about/icon-file-eye.svg',
    title: '논문 탐색',
    desc: ['관심 분야별 논문을 확인하고,', '논문 요약과 H-AI Grad만의', '핵심 정보를 빠르게', '살펴볼 수 있습니다.'],
  },
  {
    icon: '/about/icon-calendar.svg',
    title: '읽기 기록 관리',
    desc: ['읽는 중인 논문과', '완독한 논문을 기록하고,', '월별 논문 활동을 한눈에', '확인할 수 있습니다.'],
  },
  {
    icon: '/about/icon-route.svg',
    title: '맞춤 로드맵',
    desc: ['준비도 진단 결과와', '관심 분야를 바탕으로', '전공 과목과 추천 논문을', '함께 제안합니다.'],
  },
]

/* x: 피그마 캔버스 기준 세로선 위치, up: 점선 위쪽 단계 */
const flowSteps = [
  { label: '[01 관심 분야 선택]', x: 673, up: true },
  { label: '[02 논문 탐색]', x: 871, up: false },
  { label: '[03 읽기 기록 관리]', x: 1069, up: true },
  { label: '[04 로드맵 확인]', x: 1267, up: false },
]

/* x, y: 팀원 소개 영역 기준 피그마 좌표 (윗줄 118 / 아랫줄 310) */
const team: Member[] = [
  { name: '심영주', studentId: '202310847', role: 'AI &\nDesign', img: '/about/team-sim.png', x: 165, y: 118 },
  { name: '유세리', studentId: '202310856', role: 'AI &\nFront-End', img: '/about/team-yoo.png', x: 390, y: 310 },
  { name: '장희정', studentId: '202310871', role: 'AI &\nFront-End', img: '/about/team-jang.png', x: 580.84, y: 118 },
  { name: '송예린', studentId: '202310843', role: 'AI &\nBack-End', img: '/about/team-song.png', x: 805.84, y: 310 },
  { name: '김정우', studentId: '202110843', role: 'AI &\nBack-End', img: '/about/team-kim.png', x: 996.68, y: 118 },
]

const majors: Major[] = [
  {
    name: '스포츠ICT융합학과',
    tags: ['ML', 'CV', 'NLP', 'Retrieval AI'],
    desc: [
      '스포츠와 첨단 ICT 기술을 융합해 미래 스포츠산업을 연구하는 대학원 과정입니다.',
      '',
      '스포츠 데이터 분석, 디지털 헬스케어, 웨어러블 디바이스, 퍼포먼스 최적화 기술 등을 다룹니다.',
    ],
  },
  {
    name: '감성공학과',
    tags: ['HCI', 'Multimodal', 'SAP', 'ML'],
    desc: [
      '인간의 감정과 행동을 인식하고 이해하는 기술을 연구하는 대학원 과정입니다.',
      '',
      '감성 인식, 감성 컴퓨팅, 인간-컴퓨터 상호작용을',
      '바탕으로 인간 중심 AI 시스템을 탐구합니다.',
    ],
  },
  {
    name: '지능정보공학과',
    tags: ['SAP', 'ML', 'CV', 'Multimodal'],
    desc: [
      'AI 기술과 데이터 처리 시스템을 심화 연구하는 대학원 과정입니다.',
      '',
      '딥러닝, 컴퓨터 비전, 자연어 처리, 빅데이터 분석 등을 중심으로',
      'AI 시스템 개발과 최적화 역량을 기릅니다.',
    ],
  },
]
