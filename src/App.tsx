import './App.css'

function App() {
  return (
    <div className="wrapper">
      <div className="container">
        <header className="header">
          <h1>Project Title</h1>
        </header>

        <main className="main">
          <section className="content">
            메인 콘텐츠 영역
          </section>

          <aside className="sidebar">
            사이드 영역
          </aside>
        </main>

        <footer className="footer">
          © 2026
        </footer>
      </div>
    </div>
  )
}

export default App