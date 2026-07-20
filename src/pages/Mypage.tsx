import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { useNavigate } from 'react-router-dom'
import { clearToken, fetchMe, type Me } from '../lib/auth'
import ReadStatusTag from '../components/ReadStatusTag'
import {
  subscribeReadStatus,
  getReadStatusSnapshot,
  type ReadStatus,
} from '../lib/readStatus'

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
const sideMenuItems = ['북마크한 논문', '읽고 있는 논문', '다 읽은 논문']

export default function MyPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('프로필 수정')
  const [me, setMe] = useState<Me | null>(null)   // 로그인 사용자 정보 (/users/me)
  // const [password, setPassword] = useState('')  // 비밀번호 변경 기능 미사용
  const [currentPage, setCurrentPage] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  // 마운트 시 실제 사용자 정보 조회 → 인사말·이름·닉네임·이메일 표시
  useEffect(() => {
    fetchMe().then(user => {
      if (user) setMe(user)
    })
  }, [])

  // 실제 로그아웃 처리: 저장된 토큰을 삭제하고 메인으로 이동
  const handleLogout = () => {
    clearToken()          // 토큰 삭제 + auth-change 이벤트 → 네브바가 '로그인/회원가입'으로 바뀜
    setShowLogoutModal(false)
    navigate('/')         // 로그아웃 후 화면은 미정 → 일단 메인으로
  }

  // 업로드 아이콘 클릭 → 숨겨진 input 열기 → 선택한 이미지 미리보기
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setProfileImage(reader.result as string)
      reader.readAsDataURL(file)
    }
  }
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
          {me?.nickname ?? ''}님, 반갑습니다.
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
              논문
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
                onClick={() => { if (item === '로그아웃') setShowLogoutModal(true) }}
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
                      background: 'linear-gradient(135deg, #aeb4bd 0%, #c8ccd4 100%)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {profileImage ? (
                        <img src={profileImage} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <img
                          src="/tabler_compass.svg"
                          alt="프로필"
                          style={{ width: '48px', height: '48px', filter: 'brightness(0) invert(1)' }}
                        />
                      )}
                    </div>
                    <img
                      src="/mdi_upload-circle.svg"
                      alt="이미지 업로드"
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        position: 'absolute', bottom: 0, right: 0,
                        width: '24px', height: '24px', cursor: 'pointer',
                      }}
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <span style={{ fontSize: '15px', color: '#6b7280' }}>이름</span>
                    <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>{me?.username ?? ''}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '15px', color: '#374151', width: '80px', flexShrink: 0 }}>닉네임</span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>{me?.nickname ?? ''}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <span style={{ fontSize: '15px', color: '#374151', width: '80px', flexShrink: 0 }}>이메일</span>
                    <span style={{ fontSize: '14px', color: '#9ca3af' }}>{me?.email ?? ''}</span>
                  </div>
                  {/* 비밀번호 변경 기능 미사용 — 회원가입 시 설정한 비밀번호로만 로그인 (필요 시 주석 해제)
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
                      background: '#1e3a8a', color: '#fff', border: 'none',
                      borderRadius: '10px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
                    }}>
                      비밀번호 변경
                    </button>
                  </div>
                  */}
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

            {/* 읽고 있는 논문 / 다 읽은 논문 — 상세 페이지에서 지정한 상태로 채워짐 */}
            {(activeMenu === '읽고 있는 논문' || activeMenu === '다 읽은 논문') && (
              <ReadStatusList status={activeMenu === '읽고 있는 논문' ? 'reading' : 'done'} />
            )}
          </div>
        </div>
      </div>

      {/* 로그아웃 확인 모달 — 화면 전체를 회색으로 덮고 가운데 팝업 */}
      {showLogoutModal && (
        <div
          onClick={() => setShowLogoutModal(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(71, 78, 94, 0.45)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'relative',
              width: '90%', maxWidth: '380px',
              background: '#fff', borderRadius: '16px',
              padding: '32px 32px 28px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            {/* 닫기 */}
            <button
              onClick={() => setShowLogoutModal(false)}
              aria-label="닫기"
              style={{
                position: 'absolute', top: 18, right: 18,
                border: 'none', background: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#6b7280', lineHeight: 1,
              }}
            >
              ✕
            </button>

            {/* 타이틀 (로그인 화면과 동일 문구) */}
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', margin: 0, lineHeight: 1.5 }}>
              대학원 준비,
            </h2>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 28px', lineHeight: 1.5 }}>
              한 곳에서 끝내는 H-AI Grad
            </h2>

            {/* 안내 문구 */}
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 24px' }}>
              로그아웃 하시겠습니까?
            </p>

            {/* 실제 로그아웃 실행 */}
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '13px',
                background: '#8b8fab', color: '#fff',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              로그아웃 하기
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* 읽고 있는 / 다 읽은 논문 목록
   논문 상세에서 '읽는 중 / 읽기 완료'를 누르면 localStorage에 쌓이고 여기에 반영됨.
   (백엔드에 읽음 상태 API가 아직 없어서 로컬 저장 — lib/readStatus.ts 참고) */
function ReadStatusList({ status }: { status: ReadStatus }) {
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot)

  const entries = Object.values(readMap)
    .filter(entry => entry.status === status)
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt))

  if (entries.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px 48px',
        border: '1px solid #e5e7eb', boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>
          {status === 'reading' ? '읽고 있는 논문이 없어요.' : '다 읽은 논문이 없어요.'}
        </div>
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
          논문 상세 페이지에서 “{status === 'reading' ? '읽는 중' : '읽기 완료'}”을 누르면 여기에 모여요.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {entries.map(({ paper }) => (
        <div
          key={paper.arxivId}
          style={{
            background: '#fff', borderRadius: '14px', padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}
        >
          <ReadStatusTag status={status} />

          <span style={{ fontSize: '11px', color: '#9ca3af' }}>
            {paper.publishedDate?.slice(0, 4) ?? ''}
          </span>

          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1a1a1a', lineHeight: 1.5, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } as React.CSSProperties}>
            {paper.title}
          </p>

          <p style={{
            fontSize: '12px', color: '#6b7280', lineHeight: 1.6, margin: 0,
            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } as React.CSSProperties}>
            {paper.abstract}
          </p>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
            {paper.fields.map(field => (
              <span key={field} style={{
                fontSize: '11px', fontWeight: 500,
                color: '#3B6FE8', background: '#EEF3FF',
                borderRadius: '20px', padding: '3px 9px',
              }}>
                {field}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
