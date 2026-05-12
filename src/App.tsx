import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import LoginPage from './pages/login'
import Community from './pages/Community'
import Papers from './pages/Papers'
import Roadmap from './pages/Roadmap'

function App() {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
    }}>
      <Routes>
        {/* 로그인 페이지는 Navbar/Footer 없이 */}
        <Route path="/login" element={<LoginPage onClose={() => window.history.back()} />} />

        {/* 나머지 페이지는 Navbar + Footer 있음 */}
        <Route path="/*" element={
          <>
            <Navbar />
            <div style={{ flex: 1, minHeight: '100vh' }}>
              <Routes>
                <Route path="/" element={<MainPage />} />
                <Route path="/papers" element={<Papers />} />
                <Route path="/roadmap" element={<Roadmap />} />
                <Route path="/community" element={<Community />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
            <Footer />
          </>
        } />
      </Routes>
    </div>
  )
}

function MainPage() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      padding: '100px 80px',
    }}>
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

      <h1 style={{
        fontSize: '30px',
        fontWeight: 700,
        color: '#1a1a1a',
        marginBottom: '12px'
      }}>
        내 로드맵, 지금 생성하기
      </h1>

      <p style={{
        fontSize: '15px',
        color: '#6b7280',
        marginBottom: '32px'
      }}>
        전공·논문·준비 액션을 한 플랜으로 정리해드려요.
      </p>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        width: 'fit-content'
      }}>
        <button
          onClick={() => window.location.href = '/login'}
          style={{
            padding: '13px 28px',
            background: '#3B6FE8',
            color: '#fff',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
          }}>
          로드맵 생성하러 가기
        </button>

        <button style={{
          padding: '13px 28px',
          background: '#e9ecef',
          color: '#adb5bd',
          border: 'none',
          borderRadius: '10px',
        }}>
          로드맵 수정하러 가기
        </button>
      </div>
    </div>
  )
}

export default App
