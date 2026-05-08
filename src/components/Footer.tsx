export default function Footer() {
  return (
    <div style={{
      width: '100%',
      marginTop: '80px',
      padding: '40px 80px',
      borderTop: '2px solid #3B6FE8',
      background: '#fff'
    }}>

      {/* 상단 영역 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>

        {/* 로고 */}
        <div>
          <img src="/logo.svg" style={{ height: '40px' }} />
        </div>

        {/* 정보 */}
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          ABC Company, 123 East, 17th Street
        </div>

      </div>

      {/* 하단 메뉴 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '13px',
        color: '#6b7280'
      }}>

        <div style={{ display: 'flex', gap: '20px' }}>
          <span>ABOUT US</span>
          <span>CONTACT</span>
          <span>HELP</span>
          <span>PRIVACY POLICY</span>
          <span>DISCLAIMER</span>
        </div>

        <div>
          Copyright © 2026 H-AI Grad
        </div>

      </div>

    </div>
  )
}