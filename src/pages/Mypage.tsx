import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const mockUser = {
  name: '심영주',
  nickname: '',
  email: '202310847@sangmyung.kr',
}

// 북마크 논문 임시 데이터
const mockBookmarkedPapers = [
  { id: 1, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
  { id: 2, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
  { id: 3, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
  { id: 4, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
  { id: 5, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
  { id: 6, year: 2025, tag: '논문태그', title: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', summary: '안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요안녕하세요', chips: ['CV', 'LLM', 'UI/UX'], bookmarked: true },
]

const ITEMS_PER_PAGE = 6
const sideMenuItems = ['북마크한 논문', '로드맵 히스토리', '내가 작성한 게시물', '내가 작성한 댓글']

export default function MyPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('프로필 수정')
  const [nickname, setNickname] = useState(mockUser.nickname)
  const [password, setPassword] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [bookmarks, setBookmarks] = useState<Record<number, boolean>>(
    Object.fromEntries(mockBookmarkedPapers.map(p => [p.id, p.bookmarked]))
  )

  const totalPages = Math.ceil(mockBookmarkedPapers.length / ITEMS_PER_PAGE)
  const pagedPapers = mockBookmarkedPapers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      boxSizing: 'border-box',
    }}>
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '56px 48px 80px' }}>

        {/* 인사말 */}
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1a1a1a', marginBottom: '48px' }}>
          wnnye님, 반갑습니다.
        </h1>

        <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: '48px', alignItems: 'start' }}>

          {/* 사이드바 */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button
              onClick={() => setActiveMenu('프로필 수정')}
              style={{
                textAlign: 'left', background: 'none', border: 'none',
                padding: '0 0 16px 0', fontSize: '15px', fontWeight: 500,
                color: activeMenu === '프로필 수정' ? '#3B6FE8' : '#374151',
                cursor: 'pointer',
              }}
            >
              프로필 수정
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '0 0 16px 0' }} />

            <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151', marginBottom: '12px' }}>
              내 활동
            </div>

            {sideMenuItems.map(item => (
              <button
                key={item}
                onClick={() => { setActiveMenu(item); setCurrentPage(1) }}
                style={{
                  textAlign: 'left', background: 'none', border: 'none',
                  padding: '6px 0', fontSize: '14px', fontWeight: 400,
                  color: activeMenu === item ? '#3B6FE8' : '#6b7280',
                  cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}

            <hr style={{ border: 'none', borderTop: '1px solid #d1d5db', margin: '16px 0' }} />

            {['로그아웃', '회원탈퇴'].map(item => (
              <button
                key={item}
                onClick={() => item === '로그아웃' && navigate('/')}
                style={{
                  textAlign: 'left', background: 'none', border: 'none',
                  padding: '6px 0', fontSize: '14px', fontWeight: 400,
                  color: '#6b7280', cursor: 'pointer',
                }}
              >
                {item}
              </button>
            ))}
          </div>

          {/* 메인 콘텐츠 */}
          <div>

            {/* 프로필 수정 */}
            {activeMenu === '프로필 수정' && (
              <div style={{
                background: '#fff', borderRadius: '20px', padding: '40px 48px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '36px' }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: '80px', height: '80px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #c7d8ff 0%, #dde8ff 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <svg width="44" height="44" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="30" fill="#c7d8ff"/>
                        <path d="M32 18L52 26L32 34L12 26L32 18Z" fill="#7096e8"/>
                        <path d="M20 30V42C20 42 25 48 32 48C39 48 44 42 44 42V30" stroke="#7096e8" strokeWidth="2.5" strokeLinecap="round"/>
                        <line x1="52" y1="26" x2="52" y2="38" stroke="#7096e8" strokeWidth="2.5" strokeLinecap="round"/>
                        <circle cx="52" cy="39" r="2" fill="#7096e8"/>
                      </svg>
                    </div>
                    <div style={{
                      position: 'absolute', bottom: 0, right: 0,
                      width: '24px', height: '24px', borderRadius: '50%',
                      background: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: '2px solid #fff', cursor: 'pointer',
                    }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '15px', color: '#6b7280' }}>이름</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{mockUser.name}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '24px' }}>
                    <span style={{ fontSize: '15px', color: '#374151', width: '80px', flexShrink: 0 }}>닉네임</span>
                    <input
                      value={nickname}
                      onChange={e => setNickname(e.target.value)}
                      placeholder="닉네임을 입력해주세요"
                      style={{
                        flex: 1, padding: '12px 16px', fontSize: '14px',
                        border: '1px solid #d1d5db', borderRadius: '10px',
                        outline: 'none', color: '#374151', background: '#fff',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '15px', color: '#374151', width: '80px', flexShrink: 0 }}>이메일</span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>{mockUser.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '15px', color: '#374151', width: '80px', flexShrink: 0 }}>비밀번호</span>
                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••"
                      style={{
                        flex: 1, padding: '12px 16px', fontSize: '14px',
                        border: '1px solid #d1d5db', borderRadius: '10px',
                        outline: 'none', color: '#374151', background: '#fff',
                      }}
                    />
                    <button style={{
                      padding: '12px 20px', fontSize: '14px', fontWeight: 500,
                      background: '#3B6FE8', color: '#fff', border: 'none',
                      borderRadius: '10px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      비밀번호 변경
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 북마크한 논문 */}
            {activeMenu === '북마크한 논문' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', marginBottom: '32px' }}>
                  {pagedPapers.map(paper => (
                    <div
                      key={paper.id}
                      style={{
                        background: '#fff', borderRadius: '14px', padding: '18px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
                        display: 'flex', flexDirection: 'column', gap: '8px',
                        cursor: 'pointer', transition: 'box-shadow 0.2s, transform 0.2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 6px 24px rgba(59,111,232,0.13)'
                        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)'
                        ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, color: '#6b7280',
                          background: '#f3f4f6', borderRadius: '6px', padding: '3px 8px',
                        }}>
                          {paper.tag}
                        </span>
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            setBookmarks(prev => ({ ...prev, [paper.id]: !prev[paper.id] }))
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24"
                            fill={bookmarks[paper.id] ? '#3B6FE8' : 'none'}
                            stroke={bookmarks[paper.id] ? '#3B6FE8' : '#9ca3af'}
                            strokeWidth="2" strokeLinecap="round"
                          >
                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                          </svg>
                        </button>
                      </div>

                      <span style={{ fontSize: '11px', color: '#9ca3af' }}>{paper.year}</span>

                      <p style={{
                        fontSize: '13px', fontWeight: 700, color: '#1a1a1a',
                        lineHeight: 1.5, margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}>
                        {paper.title}
                      </p>

                      <p style={{
                        fontSize: '12px', color: '#6b7280', lineHeight: 1.6, margin: 0,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      } as React.CSSProperties}>
                        {paper.summary}
                      </p>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {paper.chips.map(chip => (
                          <span key={chip} style={{
                            fontSize: '11px', fontWeight: 500,
                            color: '#3B6FE8', background: '#EEF3FF',
                            borderRadius: '20px', padding: '3px 9px',
                          }}>
                            {chip}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지네이션 */}
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', color: '#9ca3af', fontSize: '14px' }}
                  >
                    «
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{ background: 'none', border: 'none', cursor: currentPage === 1 ? 'default' : 'pointer', color: '#9ca3af', fontSize: '14px' }}
                  >
                    ‹
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        width: '32px', height: '32px', borderRadius: '6px',
                        border: 'none', cursor: 'pointer', fontSize: '14px',
                        background: currentPage === page ? '#3B6FE8' : 'none',
                        color: currentPage === page ? '#fff' : '#6b7280',
                        fontWeight: currentPage === page ? 600 : 400,
                      }}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', color: '#9ca3af', fontSize: '14px' }}
                  >
                    ›
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    style={{ background: 'none', border: 'none', cursor: currentPage === totalPages ? 'default' : 'pointer', color: '#9ca3af', fontSize: '14px' }}
                  >
                    »
                  </button>
                </div>
              </div>
            )}

            {/* 나머지 메뉴 준비중 */}
            {!['프로필 수정', '북마크한 논문'].includes(activeMenu) && (
              <div style={{
                background: '#fff', borderRadius: '20px', padding: '40px 48px',
                border: '1px solid #e5e7eb', boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px',
              }}>
                <div style={{ fontSize: '36px' }}>🚧</div>
                <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>{activeMenu}</div>
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>준비 중입니다.</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
