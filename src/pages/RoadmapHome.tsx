import { useEffect, useState } from 'react'
import { pageContainer, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'
import { useNavigate } from 'react-router-dom'
import { getToken } from '../lib/auth'
import { getMyRoadmap } from '../lib/roadmap'

const BRAND = '#00178E'

/* 로드맵 페이지의 첫 화면(랜딩) — 큰 버튼 2개
   생성 → 빈 질문 화면 / 수정 → 저장된 답 채운 질문 화면 */
export default function RoadmapHome() {
  const navigate = useNavigate()

  // 저장된 로드맵이 있어야 "수정하러 가기" 활성화 — GET /roadmap/me 로 확인
  const [hasSaved, setHasSaved] = useState(false)

  useEffect(() => {
    if (!getToken()) return
    let cancelled = false

    getMyRoadmap()
      .then((res) => { if (!cancelled) setHasSaved(res.hasRoadmap) })
      .catch(() => { if (!cancelled) setHasSaved(false) })

    return () => { cancelled = true }
  }, [])

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

      <div style={{ ...pageContainer, paddingTop: '72px', paddingBottom: '100px' }}>
        <h1 style={pageTitle}>
          내 로드맵, 지금 생성하기
        </h1>

        <p style={{ ...pageSubtitle, marginBottom: HERO_GAP }}>
          전공·논문·준비 액션을 한 플랜으로 정리해드려요.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: 'fit-content' }}>
          {/* 생성 → 빈 질문 화면 */}
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

          {/* 수정 → 저장된 답 채운 질문 화면 (저장본 없으면 비활성) */}
          <button
            disabled={!hasSaved}
            onClick={() => hasSaved && navigate('/roadmap/create', { state: { edit: true } })}
            style={{
              padding: '13px 28px',
              background: hasSaved ? '#e6e9f5' : '#e9ecef',
              color: hasSaved ? BRAND : '#adb5bd',
              border: 'none',
              borderRadius: '10px',
              fontWeight: hasSaved ? 600 : 400,
              cursor: hasSaved ? 'pointer' : 'not-allowed',
            }}>
            로드맵 수정하러 가기
          </button>
        </div>
      </div>
    </div>
  )
}
