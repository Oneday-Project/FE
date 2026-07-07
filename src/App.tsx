import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import LoginPage from './pages/login'
import Community from './pages/Community'
import Papers from './pages/Papers'
import RoadmapHome from './pages/RoadmapHome'
import Roadmap from './pages/Roadmap'
import MyPage from './pages/Mypage'
import RoadmapResult from "./pages/RoadmapResult"
import About from './pages/About'

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
                <Route path="/about" element={<About />} />
                <Route path="/papers" element={<Papers />} />

                {/* 로드맵: 랜딩(버튼 2개) → 질문 → 결과 */}
                <Route path="/roadmap" element={<RoadmapHome />} />
                <Route path="/roadmap/create" element={<Roadmap />} />
                <Route path="/roadmap-result" element={<RoadmapResult />} />

                <Route path="/community" element={<Community />} />
                <Route path="/mypage" element={<MyPage />} />
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

/* 임시 홈 — 다음 단계에서 배너/공지/캘린더로 제작 예정 */
function MainPage() {
  return (
    <div style={{ padding: '100px 80px' }}>
      <h1 style={{ fontSize: '30px', fontWeight: 700, color: '#1a1a1a', marginBottom: '12px' }}>
        H-AI Grad
      </h1>
      <p style={{ fontSize: '15px', color: '#6b7280' }}>
        메인 홈은 다음 단계에서 제작할 예정입니다.
      </p>
    </div>
  )
}

export default App
