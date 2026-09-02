import { Routes, Route, Navigate } from 'react-router-dom'
import { PAGE_BACKGROUND } from './styles/pageTheme'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import LoginPage from './pages/login'
import Community from './pages/Community'
import Papers from './pages/Papers'
import Main from './pages/Main'
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
      /* 배경은 여기서만 지정한다 — 페이지별로 다시 깔지 않기 */
      background: PAGE_BACKGROUND,
      backgroundRepeat: 'no-repeat',
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
                <Route path="/" element={<Main />} />
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

export default App
