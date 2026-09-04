import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { pageContainer, PAGE_TOP, pageTitle, HERO_GAP } from '../styles/pageTheme'
import { useNavigate } from 'react-router-dom'
import { clearToken, fetchMe, getToken, type Me } from '../lib/auth'
import ReadStatusTag from '../components/ReadStatusTag'
import {
  subscribeReadStatus,
  getReadStatusSnapshot,
  type ReadStatus,
} from '../lib/readStatus'
import {
  subscribeBookmarks,
  getBookmarksSnapshot,
  toggleBookmark,
  type BookmarkedPaper,
} from '../lib/bookmarks'

const sideMenuItems = ['북마크한 논문', '읽고 있는 논문', '다 읽은 논문']

export default function MyPage() {
  const navigate = useNavigate()
  const [activeMenu, setActiveMenu] = useState('프로필 수정')
  const [me, setMe] = useState<Me | null>(null)   // 로그인 사용자 정보 (/users/me)
  // const [password, setPassword] = useState('')  // 비밀번호 변경 기능 미사용
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [modal, setModal] = useState<'logout' | 'withdraw' | null>(null)
  const [withdrawing, setWithdrawing] = useState(false)

  // 마운트 시 실제 사용자 정보 조회 → 인사말·이름·닉네임·이메일 표시
  useEffect(() => {
    fetchMe().then(user => {
      if (user) setMe(user)
    })
  }, [])

  // 실제 로그아웃 처리: 저장된 토큰을 삭제하고 메인으로 이동
  const handleLogout = () => {
    clearToken()          // 토큰 삭제 + auth-change 이벤트 → 네브바가 '로그인/회원가입'으로 바뀜
    setModal(null)
    navigate('/')         // 로그아웃 후 화면은 미정 → 일단 메인으로
  }

  // 실제 회원 탈퇴: DELETE /users/me → 성공하면 토큰 삭제 후 로그아웃 상태의 메인으로
  const handleWithdraw = async () => {
    setWithdrawing(true)
    try {
      await fetch('/api/users/me', {
        method: 'DELETE',
        headers: {
          Accept: 'application/json',
          'ngrok-skip-browser-warning': 'true',
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
      })
    } catch {
      // 네트워크 실패해도 클라이언트 세션은 정리하고 내보냄
    } finally {
      clearToken()        // 토큰 삭제 → 네브바가 '로그인/회원가입'으로, 로그인 안 된 상태가 됨
      setModal(null)
      setWithdrawing(false)
      navigate('/')       // 로그아웃(비로그인) 상태의 메인 페이지로
    }
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
  return (
    <div style={{
      width: '100%',
      minHeight: 'calc(100vh - 64px)',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      boxSizing: 'border-box',
    }}>
      <div style={{ ...pageContainer, paddingTop: PAGE_TOP, paddingBottom: '80px' }}>

        {/* 인사말 */}
        <h1 style={{ ...pageTitle, margin: `0 0 ${HERO_GAP}` }}>
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
                onClick={() => setActiveMenu(item)}
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
                onClick={() => setModal(item === '로그아웃' ? 'logout' : 'withdraw')}
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

            {/* 북마크한 논문 — POST /papers/bookmark/{arxivId} 로 서버와 동기화 */}
            {activeMenu === '북마크한 논문' && <BookmarkList />}

            {/* 읽고 있는 논문 / 다 읽은 논문 — 상세 페이지에서 지정한 상태로 채워짐 */}
            {(activeMenu === '읽고 있는 논문' || activeMenu === '다 읽은 논문') && (
              <ReadStatusList status={activeMenu === '읽고 있는 논문' ? 'reading' : 'completed'} />
            )}
          </div>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      {modal === 'logout' && (
        <ConfirmModal
          message="로그아웃 하시겠습니까?"
          confirmLabel="로그아웃 하기"
          confirmColor="#8b8fab"
          onConfirm={handleLogout}
          onClose={() => setModal(null)}
        />
      )}

      {/* 회원 탈퇴 확인 모달 — 탈퇴 / 취소 두 버튼 */}
      {modal === 'withdraw' && (
        <ConfirmModal
          message="정말 탈퇴하시겠어요?"
          confirmLabel={withdrawing ? '탈퇴 중…' : '회원 탈퇴'}
          confirmColor="#EF4444"
          cancelLabel="취소"
          loading={withdrawing}
          onConfirm={handleWithdraw}
          onClose={() => { if (!withdrawing) setModal(null) }}
        />
      )}
    </div>
  )
}

/* 로그아웃·회원탈퇴 공용 확인 모달
   cancelLabel 이 있으면 취소 버튼도 함께 노출(탈퇴용) */
function ConfirmModal({
  message, confirmLabel, confirmColor, cancelLabel, loading, onConfirm, onClose,
}: {
  message: string
  confirmLabel: string
  confirmColor: string
  cancelLabel?: string
  loading?: boolean
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
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
        <button
          onClick={onClose}
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

        <p style={{ fontSize: '15px', fontWeight: 600, color: '#374151', margin: '0 0 24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: '13px',
              background: confirmColor, color: '#fff',
              border: 'none', borderRadius: '10px',
              fontSize: '14px', fontWeight: 600,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {confirmLabel}
          </button>

          {cancelLabel && (
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: '13px',
                background: '#8b8fab', color: '#fff',
                border: 'none', borderRadius: '10px',
                fontSize: '14px', fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
              }}
            >
              {cancelLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

/* 북마크한 논문 목록
   논문 목록·상세·메인에서 북마크를 누르면 서버(POST /papers/bookmark/{arxivId})에 반영되고
   여기에도 함께 나타남. 최초 목록은 GET /users/me 의 bookmarkPapers 로 불러옴. */
function BookmarkList() {
  const bookmarks = useSyncExternalStore(subscribeBookmarks, getBookmarksSnapshot)
  const papers = Object.values(bookmarks)

  if (papers.length === 0) {
    return (
      <div style={{
        background: '#fff', borderRadius: '20px', padding: '40px 48px',
        border: '1px solid #e5e7eb', boxShadow: '0 2px 20px rgba(0,0,0,0.04)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', minHeight: '240px', gap: '10px',
      }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>북마크한 논문이 없어요.</div>
        <div style={{ fontSize: '13px', color: '#9ca3af', textAlign: 'center' }}>
          논문 카드의 북마크 아이콘을 누르면 여기에 모여요.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
      {papers.map(paper => (
        <BookmarkCard key={paper.arxivId} paper={paper} />
      ))}
    </div>
  )
}

function BookmarkCard({ paper }: { paper: BookmarkedPaper }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/papers?paper=${encodeURIComponent(paper.arxivId)}`)}
      style={{
        background: '#fff', borderRadius: '14px', padding: '18px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
        display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>
          {paper.publishedDate?.slice(0, 4) ?? ''}
        </span>
        <button
          onClick={e => { e.stopPropagation(); void toggleBookmark(paper) }}
          aria-label="북마크 해제"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', lineHeight: 0 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#3B6FE8" stroke="#3B6FE8" strokeWidth="2" strokeLinecap="round">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>

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
  )
}

/* 읽고 있는 / 다 읽은 논문 목록
   논문 상세에서 '읽는 중 / 읽기 완료'를 누르면 서버에 반영되고 여기에 나타남.
   (GET /users/me 의 readingPapers 기준 — lib/readStatus.ts 참고) */
function ReadStatusList({ status }: { status: ReadStatus }) {
  const navigate = useNavigate()
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
          onClick={() => navigate(`/papers?paper=${encodeURIComponent(paper.arxivId)}`)}
          style={{
            background: '#fff', borderRadius: '14px', padding: '18px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0f0f0',
            display: 'flex', flexDirection: 'column', gap: '8px', cursor: 'pointer',
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
