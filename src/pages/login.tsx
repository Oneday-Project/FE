import { useState } from 'react';
import { setToken } from '../lib/auth';

export default function LoginPage({ onClose }: { onClose: () => void }) {
  const [showSignup, setShowSignup] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const isMismatch = confirm.length > 0 && password !== confirm;

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    if (!loginEmail || !loginPassword) {
      setLoginError("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = Array.isArray(data?.message)
          ? data.message.join("\n")
          : data?.message ?? "로그인에 실패했습니다.";

        throw new Error(msg);
      }

      if (!data?.accessToken) {
        throw new Error("응답에서 accessToken을 찾지 못했습니다.");
      }

      setToken(data.accessToken, data.refreshToken);
      onClose();
    } catch (e) {
      setLoginError(
        e instanceof Error
          ? e.message
          : "로그인 중 오류가 발생했습니다."
      );
    } finally {
      setLoading(false);
    }
  };

  const [signupEmail, setSignupEmail] = useState("");
  const [signupUsername, setSignupUsername] = useState("");
  const [signupNickname, setSignupNickname] = useState("");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

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

      if (data?.accessToken) {
        setToken(data.accessToken, data.refreshToken);
        onClose();
      } else {
        setShowSignup(false);
      }
    } catch (e) {
      setSignupError(
        e instanceof Error
          ? e.message
          : "회원가입 중 오류가 발생했습니다."
      );
    } finally {
      setSignupLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    background: '#f1f5f9',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          background: '#f8fafc',
        }}
      >
        {/* ── 왼쪽 장식 영역 ── */}
        <div
          style={{
            flex: 1,
            background:
              'linear-gradient(160deg, #dde8ff 0%, #eaf0ff 100%)',
            position: 'relative',
            overflow: 'visible',
          }}
        >
          {/* 로고 */}
          <img
            src="/logo.svg"
            alt="H-AI Grad"
            style={{
              position: 'absolute',
              top: '28%',
              left: '12%',
              width: '180px',
              zIndex: 2,
            }}
          />

          {/* 왼쪽 카드 */}
          <img
            src="/login-left.svg"
            alt=""
            style={{
              position: 'absolute',
              left: '-40px',
              bottom: '25%',
              width: '400px',
              transform: 'rotate(8deg)',
              filter:
                'drop-shadow(0 18px 18px rgba(0, 0, 0, 0.18))',
              zIndex: 1,
            }}
          />

          {/* 오른쪽 카드 */}
          <img
            src="/login-right.svg"
            alt=""
            style={{
              position: 'absolute',
              right: '-45px',
              top: '35%',
              width: '400px',
              transform: 'rotate(8deg)',
              filter:
                'drop-shadow(0 18px 18px rgba(0, 0, 0, 0.18))',
              zIndex: 2,
            }}
          />
        </div>

        {/* ── 오른쪽 로그인 폼 ── */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.12)',
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 5,
            boxShadow: '-30px 0 60px rgba(0,0,0,0.06)',
          }}
        >
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
              color: '#6b7280',
            }}
          >
            ✕
          </button>

          <div style={{ width: 360 }}>
            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0f172a',
                margin: '0 0 4px',
              }}
            >
              대학원 준비,
            </h2>

            <h2
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: '#0f172a',
                marginBottom: 32,
              }}
            >
              한 곳에서 끝내는 H-AI Grad
            </h2>

            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                이메일
              </p>

              <input
                type="email"
                placeholder="이메일을 입력해주세요."
                style={inputStyle}
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleLogin()
                }
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                비밀번호
              </p>

              <input
                type="password"
                placeholder="비밀번호를 입력해주세요."
                style={inputStyle}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleLogin()
                }
              />
            </div>

            {loginError && (
              <p
                style={{
                  fontSize: 13,
                  color: '#ef4444',
                  marginBottom: 12,
                  whiteSpace: 'pre-line',
                }}
              >
                {loginError}
              </p>
            )}

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
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? 'default' : 'pointer',
                marginBottom: 16,
              }}
            >
              {loading ? '로그인 중…' : '로그인'}
            </button>

            <p
              onClick={() => setShowSignup(true)}
              style={{
                textAlign: 'center',
                fontSize: 13,
                color: '#6b7280',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '4px',
              }}
            >
              아직 회원이 아니신가요?
            </p>
          </div>
        </div>
      </div>

      {/* ── 회원가입 모달 ── */}
      {showSignup && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.35)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
          }}
        >
          <div
            style={{
              width: '90%',
              maxWidth: '480px',
              background: '#fff',
              borderRadius: '20px',
              padding: '32px',
              position: 'relative',
              boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
            }}
          >
            <button
              onClick={() => setShowSignup(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontSize: 18,
              }}
            >
              ✕
            </button>

            <h2
              style={{
                textAlign: 'center',
                marginBottom: 24,
                fontWeight: 700,
              }}
            >
              회원가입
            </h2>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
              }}
            >
              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  이메일
                </p>

                <input
                  type="email"
                  placeholder="이메일을 입력해주세요."
                  style={inputStyle}
                  value={signupEmail}
                  onChange={(e) =>
                    setSignupEmail(e.target.value)
                  }
                />
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  비밀번호
                </p>

                <input
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  style={inputStyle}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                />
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#475569',
                    }}
                  >
                    비밀번호 확인
                  </p>

                  {isMismatch && (
                    <span
                      style={{
                        fontSize: 12,
                        color: '#ef4444',
                      }}
                    >
                      ⚠ 비밀번호가 일치하지 않습니다.
                    </span>
                  )}
                </div>

                <input
                  type="password"
                  placeholder="비밀번호를 입력해주세요."
                  style={{
                    ...inputStyle,
                    border: isMismatch
                      ? '1px solid #ef4444'
                      : '1px solid #d1d5db',
                  }}
                  value={confirm}
                  onChange={(e) =>
                    setConfirm(e.target.value)
                  }
                />
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  이름
                </p>

                <input
                  placeholder="이름을 입력해주세요."
                  style={inputStyle}
                  value={signupUsername}
                  onChange={(e) =>
                    setSignupUsername(e.target.value)
                  }
                />
              </div>

              <div>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#475569',
                    marginBottom: 6,
                  }}
                >
                  닉네임
                </p>

                <input
                  placeholder="닉네임을 입력해주세요."
                  style={inputStyle}
                  value={signupNickname}
                  onChange={(e) =>
                    setSignupNickname(e.target.value)
                  }
                />
              </div>

              {signupError && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#ef4444',
                    margin: 0,
                    whiteSpace: 'pre-line',
                  }}
                >
                  {signupError}
                </p>
              )}

              <button
                onClick={handleSignup}
                disabled={signupLoading}
                style={{
                  marginTop: 10,
                  padding: 14,
                  background: signupLoading
                    ? '#93b0f5'
                    : '#00178E',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  cursor: signupLoading
                    ? 'default'
                    : 'pointer',
                }}
              >
                {signupLoading ? '가입 중…' : '회원가입'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}