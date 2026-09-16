import { useEffect, useState } from 'react'
import { pageContainer, PAGE_TOP, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'
import { useNavigate } from 'react-router-dom'
import { getToken } from '../lib/auth'
import { getMyRoadmap } from '../lib/roadmap'

const BRAND = '#00178E'

/* 랜딩 상단의 4단계 소개 카드 */
const STEPS = [
  { title: '준비도 진단', desc: '관심 분야와 경험을 바탕으로 현재 준비 상태를 확인해요.' },
  { title: '전공 로드맵', desc: '관심 분야를 바탕으로 필요한 전공 과목과 흐름을 제안해요.' },
  { title: '논문 로드맵', desc: '관심 분야와 논문 경험을 바탕으로 중요도별 추천 논문을 확인해요.' },
  { title: '성장 가이드', desc: '현재 준비도와 보완할 영역을 바탕으로 앞으로의 실천 방향을 제안해요.' },
]

/* 4단계 소개 카드 — 랜딩/질문 화면에서 같이 씀 */
export function RoadmapSteps() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '4px',
        flexWrap: 'nowrap',
        marginBottom: '56px',
      }}>
      {STEPS.map((step, i) => (
        <div key={step.title} style={{ flex: '1 1 0', minWidth: 0 }}>
          <div style={{ position: 'relative', width: '68px', height: '68px', margin: '0 auto', zIndex: 2 }}>
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#FFFFFF' }} />
            <div
              style={{
                position: 'absolute',
                inset: '8px',
                borderRadius: '50%',
                background: '#F5F9FF',
                color: BRAND,
                fontWeight: 700,
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {i + 1}
            </div>
          </div>
          <div style={{ background: '#fff', borderRadius: '36px', padding: '28px 18px 20px', marginTop: '-24px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: BRAND, margin: '0 0 8px' }}>
              {step.title}
            </h3>
            <p style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              {step.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

/* 로드맵 페이지의 첫 화면(랜딩) — 큰 버튼 2개
   생성 → 빈 질문 화면 / 수정 → 저장된 답 채운 질문 화면 */
export default function RoadmapHome() {
  const navigate = useNavigate()

  // 로그인했고 로드맵이 이미 있으면 이 랜딩은 건너뛰고 결과 페이지로 바로 이동
  const [checking, setChecking] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    let cancelled = false

    getMyRoadmap()
      .then((res) => {
        if (cancelled) return
        if (res.hasRoadmap) {
          navigate('/roadmap-result', { replace: true })
          return
        }
        setChecking(false)
      })
      .catch(() => { if (!cancelled) setChecking(false) })

    return () => { cancelled = true }
  }, [navigate])

  if (checking) return null

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img
        src="/bg-icon.png"
        alt=""
        style={{
          position: 'absolute',
          right: '-40px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '520px',
          opacity: 0.2,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      <div style={{ ...pageContainer, paddingTop: PAGE_TOP, paddingBottom: '100px', textAlign: 'center' }}>

        <h1 style={pageTitle}>
          나에게 맞는 대학원 준비 로드맵
        </h1>

        <p style={{ ...pageSubtitle, marginBottom: HERO_GAP }}>
          현재 준비 상태를 바탕으로 전공·논문·성장 방향을 한 번에 정리해보세요!
        </p>

        <RoadmapSteps />

        <div style={{ width: 'fit-content', margin: '0 auto' }}>
          {/* 이 화면은 비로그인 또는 로드맵 미생성 상태에서만 보임 — 생성 버튼만 필요 */}
          <button
            onClick={() => navigate('/roadmap/create')}
            style={{
              padding: '13px 28px',
              background: BRAND,
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
            }}>
            로드맵 생성하러 가기
          </button>
        </div>
      </div>
    </div>
  )
}
