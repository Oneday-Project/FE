import { useState } from 'react'

const navItems = ['소개', '논문', '로드맵', '커뮤니티']

interface NavbarProps {
  onNavigate?: (item: string) => void
}

export default function Navbar({ onNavigate }: NavbarProps) {
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

      {/* 로고 - 좌측 */}
      <div>
        <img src="/logo.svg" alt="H-AI Grad" style={{ height: '28px', display: 'block' }} />
      </div>

      {/* 탭 - 가운데 */}
      <ul style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        listStyle: 'none', margin: 0, padding: 0
      }}>
        {navItems.map((item) => (
          <li key={item}>
            <button
              onClick={() => {
                setActive(item)
                onNavigate?.(item)
              }}
              onMouseEnter={() => setHovered(item)}
              onMouseLeave={() => setHovered(null)}
              style={{
                padding: '8px 20px', fontSize: '15px',
                border: 'none', background: 'none', cursor: 'pointer',
                borderRadius: '8px',
                color: active === item || hovered === item ? '#3B6FE8' : '#9ca3af',
                fontWeight: active === item ? 600 : 400,
                transition: 'color 0.15s ease',
              }}
            >
              {item}
            </button>
          </li>
        ))}
      </ul>

      {/* 유저 - 우측 */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '15px', fontWeight: 500, color: '#1a1a1a' }}>wnnnye님</span>
      </div>

    </nav>
  )
}
