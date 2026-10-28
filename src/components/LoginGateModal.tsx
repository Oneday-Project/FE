import { MAIN } from '../styles/pageTheme'

/* 회원 전용 안내 모달 — 논문 상세·커뮤니티 글 상세처럼 로그인해야 볼 수 있는 곳에서 띄운다.
   로그인 페이지는 닫힐 때 history.back() 하므로 로그인 후 원래 화면으로 돌아온다. */
export default function LoginGateModal({ onClose, onLogin }: { onClose: () => void; onLogin: () => void }) {
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
          width: '360px', maxWidth: '90%',
          background: '#fff', borderRadius: '16px',
          padding: '48px 50px 46px',
          boxSizing: 'border-box',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}
      >
        {/* 닫기 */}
        <button
          onClick={onClose}
          aria-label="닫기"
          style={{
            position: 'absolute', top: '12px', right: '12px',
            width: '26px', height: '26px',
            border: 'none', background: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#3C3C43" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* 아이콘 — public/personal-privacy.svg */}
        <img
          src="/personal-privacy.svg"
          alt=""
          style={{ width: '78px', height: '78px', marginBottom: '26px' }}
        />

        <p style={{
          fontSize: '16px', fontWeight: 500, color: '#3C3C43',
          margin: '0 0 24px', textAlign: 'center',
        }}>
          회원만 접근 가능한 페이지입니다.
        </p>

        <button
          onClick={onLogin}
          style={{
            width: '100%', height: '46px',
            background: MAIN, color: '#fff',
            border: 'none', borderRadius: '8px',
            fontSize: '15px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
          }}
        >
          로그인하러 가기
        </button>
      </div>
    </div>
  )
}
