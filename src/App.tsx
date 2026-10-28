import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PAGE_BACKGROUND } from './styles/pageTheme'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

import LoginPage from './pages/login'
import Community from './pages/Community'
import CommunityDetail from './pages/CommunityDetail'
import Papers from './pages/Papers'
import Main from './pages/Main'
import RoadmapHome from './pages/RoadmapHome'
import Roadmap from './pages/Roadmap'
import MyPage from './pages/Mypage'
import RoadmapResult from "./pages/RoadmapResult"
import About from './pages/About'

function App() {
  // 네브바 로고를 눌러 "/"로 다시 이동했을 때(이미 메인이어도) Main이 새로 마운트되게,
  // location.key(매 navigate 마다 바뀜)를 key로 줘서 챗봇 입력 등 내부 상태를 초기화함
  const location = useLocation()

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
                <Route path="/" element={<Main key={location.key} />} />
                <Route path="/about" element={<About />} />
                <Route path="/papers" element={<Papers />} />

                {/* 로드맵: 랜딩(버튼 2개) → 질문 → 결과 */}
                <Route path="/roadmap" element={<RoadmapHome />} />
                <Route path="/roadmap/create" element={<Roadmap />} />
                <Route path="/roadmap-result" element={<RoadmapResult />} />

                <Route path="/community" element={<Community />} />
                <Route path="/community/:board/:id" element={<CommunityDetail />} />
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
