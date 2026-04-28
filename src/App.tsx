import Navbar from './components/Navbar'

function App() {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
      overflow: 'hidden',
    }}>
      <Navbar />

      <div style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100vh - 64px)',
        padding: '100px 80px',
        overflow: 'hidden',
      }}>

        {/* 배경 이미지 - public/bg-icon.png 넣어주세요 */}
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

        {/* 텍스트 */}
        <h1 style={{
          fontSize: '30px', fontWeight: 700,
          color: '#1a1a1a', marginBottom: '12px', lineHeight: 1.3
        }}>
          내 로드맵, 지금 생성하기
        </h1>
        <p style={{ fontSize: '15px', color: '#6b7280', marginBottom: '32px' }}>
          전공·논문·준비 액션을 한 플랜으로 정리해드려요.
        </p>

        {/* 버튼 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: 'fit-content' }}>
          <button style={{
            padding: '13px 28px', fontSize: '15px', fontWeight: 600,
            color: '#fff', background: '#3B6FE8', border: 'none',
            borderRadius: '10px', cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(59,111,232,0.3)',
          }}>
            로드맵 생성하러 가기
          </button>
          <button style={{
            padding: '13px 28px', fontSize: '15px', fontWeight: 500,
            color: '#adb5bd', background: '#e9ecef', border: 'none',
            borderRadius: '10px', cursor: 'pointer',
          }}>
            로드맵 수정하러 가기
          </button>
        </div>
      </div>
    </div>
  )
}

export default App