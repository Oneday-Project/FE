import { useState } from 'react';
import { setToken } from '../lib/auth';

export default function LoginPage({ onClose }: { onClose: () => void }) {
  const [showSignup, setShowSignup] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const isMismatch = confirm.length > 0 && password !== confirm;

  // 로그인 폼 상태
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 실제 로그인: POST /api/auth/login → 응답 토큰 저장
  const handleLogin = async () => {
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoading(true);
    try {
      // /api → vite proxy → ngrok → 백엔드 /auth/login
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // NestJS 에러 메시지(배열/문자열) 처리
        const msg = Array.isArray(data?.message)
          ? data.message.join("\n")
          : data?.message ?? "로그인에 실패했습니다.";
        throw new Error(msg);
      }

      // 응답: { accessToken, refreshToken }
      if (!data?.accessToken) {
        throw new Error("응답에서 accessToken을 찾지 못했습니다.");
      }

      setToken(data.accessToken, data.refreshToken); // 저장 + auth-change 이벤트 → 네브바 갱신
      onClose();                                     // 이전 화면으로 복귀
    } catch (e) {
      setLoginError(e instanceof Error ? e.message : "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 폼 상태 (password/confirm은 위에서 공유)
  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");   // 이름
  const [signupNickname, setSignupNickname] = useState("");   // 닉네임
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  // 실제 회원가입: POST /api/auth/register → 응답 토큰으로 바로 로그인 처리
  const handleSignup = async () => {
    setSignupError(null);
    if (!signupEmail || !password || !signupNickname || !signupUsername) {
      setSignupError("모든 항목을 입력해주세요.");
      return;
    }
    if (password !== confirm) {
      setSignupError("비밀번호가 일치하지 않습니다.");
      return;
    }
    setSignupLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        // 백엔드 요구 필드: username(이름), nickname(닉네임), email, password
        body: JSON.stringify({
          username: signupUsername,
          nickname: signupNickname,
          email: signupEmail,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join("\n")
          : data?.message ?? "회원가입에 실패했습니다.";
        throw new Error(msg);
      }

      // register 응답도 { accessToken, refreshToken } → 가입 즉시 로그인
      if (data?.accessToken) {
        setToken(data.accessToken, data.refreshToken);
        onClose();
      } else {
        // 토큰이 안 오면 로그인 화면으로 전환
        setShowSignup(false);
      }
    } catch (e) {
      setSignupError(e instanceof Error ? e.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setSignupLoading(false);
    }
  };

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
              <input
                type="email"
                placeholder="이메일을 입력해주세요."
                style={inputStyle}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* 비밀번호 */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 14, marginBottom: 6 }}>비밀번호</p>
              <input
                type="password"
                placeholder="비밀번호를 입력해주세요."
                style={inputStyle}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {/* 에러 메시지 */}
            {loginError && (
              <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 12, whiteSpace: 'pre-line' }}>
                {loginError}
              </p>
            )}

            {/* 로그인 버튼 */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
              width: '100%',
              padding: 14,
              background: loading ? '#c7cbd1' : '#9ca3af',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'default' : 'pointer',
              marginBottom: 16
            }}>
              {loading ? '로그인 중…' : '로그인'}
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
                <input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  style={inputStyle}
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
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

              {/* 이름 */}
              <div>
                <p style={{ fontSize: 14, marginBottom: 6 }}>이름</p>
                <input
                  placeholder="이름을 입력해주세요"
                  style={inputStyle}
                  value={signupUsername}
                  onChange={(e) => setSignupUsername(e.target.value)}
                />
              </div>

              {/* 닉네임 */}
              <div>
                <p style={{ fontSize: 14, marginBottom: 6 }}>닉네임</p>
                <input
                  placeholder="닉네임을 입력해주세요"
                  style={inputStyle}
                  value={signupNickname}
                  onChange={(e) => setSignupNickname(e.target.value)}
                />
              </div>

              {/* 에러 메시지 */}
              {signupError && (
                <p style={{ fontSize: 13, color: '#ef4444', margin: 0, whiteSpace: 'pre-line' }}>
                  {signupError}
                </p>
              )}

              {/* 버튼 */}
              <button
                onClick={handleSignup}
                disabled={signupLoading}
                style={{
                marginTop: 10,
                padding: 14,
                background: signupLoading ? '#93b0f5' : '#2563eb',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontWeight: 600,
                cursor: signupLoading ? 'default' : 'pointer'
              }}>
                {signupLoading ? '가입 중…' : '회원가입'}
              </button>

            </div>

          </div>
        </div>
      )}
    </>
  );
}