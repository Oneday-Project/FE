import { useState } from 'react'

const navItems = [
  { name: '소개', key: 'main' },
  { name: '논문', key: 'papers' },
  { name: '로드맵', key: 'roadmap' },
  { name: '커뮤니티', key: 'community' }
]

interface NavbarProps {
  onNavigate?: (item: string) => void
}

export default function Navbar({ onNavigate }: { onNavigate: (p: string) => void }) {
  const [active, setActive] = useState('논문')
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

      {/* 로고 */}
      <div>
        <img src="/logo.svg" style={{ height: '28px' }} />
      </div>

      {/* 메뉴 */}
      <ul style={{
        display: 'flex', gap: '8px',
        listStyle: 'none', margin: 0, padding: 0
      }}>
        {navItems.map((item) => (
          <li key={item.name}>
            <button
              onClick={() => {
                  setActive(item.name)
                  onNavigate(item.key) 
              }}
              onMouseEnter={() => setHovered(item.name)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '8px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                borderRadius: '8px',
                color: active === item.name || hovered === item.name
                  ? '#3B6FE8'
                  : '#9ca3af',
                fontWeight: active === item.name ? 600 : 400,
              }}
            >
              {item.name}
            </button>
          </li>
        ))}
      </ul>

      {/* 로그인 */}
      <div style={{ textAlign: 'right' }}>
        <span
          onClick={() => onNavigate("login")} 
          style={{ cursor: 'pointer' }}
        >
          로그인 / 회원가입
        </span>
      </div>

    </nav>
  )
}
