import { useState } from 'react';

export default function LoginPage({ onClose }: { onClose: () => void }) {
  const [showSignup, setShowSignup] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isMismatch = confirm.length > 0 && password !== confirm;

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px'
  };

  return (
    <>
      {/* 전체 */}
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: '#f8fafc'
      }}>

        {/* 🔥 왼쪽 */}
        <div style={{
          flex: 1,
          background: '#eaf0ff',
          position: 'relative',
          overflow: 'visible'
        }}>

          {/* 로고 */}
          <img
            src="/logo.svg"
            alt="logo"
            style={{
              position: 'absolute',
              top: '28%',
              left: '12%',
              width: '180px',
              zIndex: 2
            }}
          />

          {/* 왼쪽 카드 (밖으로 튀어나감) */}
          <img
            src="/login-left.svg"
            alt=""
            style={{
              position: 'absolute',
              left: '-100px',
              bottom: '8%',
              width: '400px',
              transform: 'rotate(-14deg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              zIndex: 1,
            }}
          />

          {/* 오른쪽 카드 (침범) */}
          <img
            src="/login-right.svg"
            alt=""
            style={{
              position: 'absolute',
              right: '-120px',
              top: '36%',
              width: '440px',
              transform: 'rotate(12deg)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.18)',
              zIndex: 2,
            }}
          />

        </div>

        {/* 🔥 오른쪽 로그인 */}
        <div style={{
          flex: 1,
          background: 'rgba(255,255,255,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          boxShadow: '-30px 0 60px rgba(0,0,0,0.06)'
        }}>

          {/* X 버튼 */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 30,
              right: 30,
              fontSize: 20,
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              color: '#6b7280'
            }}
          >
            ✕
          </button>

          <div style={{ width: 360 }}>

            {/* 타이틀 */}
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>대학원 준비,</h2>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>
              한 곳에서 끝내는 H-AI Grad
            </h2>

            {/* 이메일 */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 14, marginBottom: 6 }}>이메일</p>
              <input placeholder="이메일을 입력해주세요." style={inputStyle} />
            </div>

            {/* 비밀번호 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, marginBottom: 6 }}>비밀번호</p>
              <input type="password" placeholder="비밀번호를 입력해주세요." style={inputStyle} />
            </div>

            {/* 로그인 버튼 */}
            <button style={{
              width: '100%',
              padding: 14,
              background: '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: 'pointer',
              marginBottom: 16
            }}>
              로그인
            </button>

            {/* 회원가입 */}
            <p
              onClick={() => setShowSignup(true)}
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#6b7280',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '4px'
              }}
            >
              아직 회원이 아니신가요?
            </p>

          </div>
        </div>
      </div>

      {/* 🔥 회원가입 모달 */}
      {showSignup && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.35)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 999
        }}>

          <div style={{
            width: '90%',
            maxWidth: '480px',
            background: '#fff',
            borderRadius: '20px',
            padding: '32px',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>

            {/* 닫기 */}
            <button
              onClick={() => setShowSignup(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 18
              }}
            >
              ✕
            </button>

            <h2 style={{
              textAlign: 'center',
              marginBottom: 24,
              fontWeight: 700
            }}>
              회원가입
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* 이메일 */}
              <div>
                <p style={{ fontSize: 14, marginBottom: 6 }}>이메일</p>
                <input placeholder="이메일을 입력해주세요." style={inputStyle} />
              </div>

              {/* 비밀번호 */}
              <div>
                <p style={{ fontSize: 14, marginBottom: 6 }}>비밀번호</p>
                <input
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  style={inputStyle}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 6
                }}>
                  <p style={{ fontSize: 14 }}>비밀번호 확인</p>

                  {isMismatch && (
                    <span style={{ fontSize: 12, color: '#ef4444' }}>
                      ⚠ 비밀번호가 일치하지 않습니다.
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  style={{
                    ...inputStyle,
                    border: isMismatch ? '1px solid #ef4444' : inputStyle.border
                  }}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>

              {/* 닉네임 */}
              <div>
                <p style={{ fontSize: 14, marginBottom: 6 }}>닉네임</p>
                <input placeholder="닉네임을 입력해주세요." style={inputStyle} />
              </div>

              {/* 버튼 */}
              <button style={{
                marginTop: 10,
                padding: 14,
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: 'pointer'
              }}>
                회원가입
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}