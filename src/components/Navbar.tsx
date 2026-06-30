import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const BRAND = '#00178E'

const navItems = [
  { name: '소개', key: 'about' },
  { name: '논문', key: 'papers' },
  { name: '로드맵', key: 'roadmap' },
  { name: '커뮤니티', key: 'community' }
]

const keyToPath: Record<string, string> = {
  about: '/about',
  papers: '/papers',
  roadmap: '/roadmap',
  community: '/community',
  login: '/login',
  mypage: '/mypage',
}

// 임시 로그인 상태 (백 연동 전)
const mockLoggedIn = true
const mockUserName = 'wnnye'

export default function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()

  // 현재 경로 기준으로 활성 메뉴 계산 (로고/URL 이동에도 하이라이트가 따라옴)
  const activeName = navItems.find(item => location.pathname.startsWith(keyToPath[item.key]))?.name
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      height: '64px',
      background: 'rgba(255,255,255,0.85)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid rgba(0,0,0,0.06)',
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      padding: '0 80px',
    }}>
      {/* 로고 → 메인 */}
      <div>
        <img
          src="/logo.svg"
          alt="H-AI Grad"
          onClick={() => navigate('/')}
          style={{ height: '28px', cursor: 'pointer' }}
        />
      </div>

      {/* 메뉴 */}
      <ul style={{
        display: 'flex', gap: '8px',
        listStyle: 'none', margin: 0, padding: 0
      }}>
        {navItems.map((item) => {
          const isActive = activeName === item.name
          return (
            <li key={item.name}>
              <button
                onClick={() => navigate(keyToPath[item.key])}
                onMouseEnter={() => setHovered(item.name)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  padding: '8px 20px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  color: isActive || hovered === item.name ? BRAND : '#9ca3af',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {item.name}
              </button>
            </li>
          )
        })}
      </ul>

      {/* 로그인 / 프로필 */}
      <div style={{ textAlign: 'right' }}>
        {mockLoggedIn ? (
          <span
            onClick={() => navigate('/mypage')}
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
              color: location.pathname === '/mypage' ? BRAND : '#374151',
            }}
          >
            {mockUserName}님
          </span>
        ) : (
          <span
            onClick={() => navigate('/login')}
            style={{
              cursor: 'pointer',
              fontSize: '14px',
              color: '#6b7280',
            }}
          >
            로그인 / 회원가입
          </span>
        )}
      </div>
    </nav>
  )
}