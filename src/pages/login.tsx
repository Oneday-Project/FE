import { useState } from 'react';
import { setToken, isLoggedIn } from '../lib/auth';

export default function LoginPage({ onClose }: { onClose: () => void }) {
  const [showSignup, setShowSignup] = useState(false);
  const [signupDone, setSignupDone] = useState(false);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const isMismatch = confirm.length > 0 && password !== confirm;

  const [studentId, setStudentId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoginError(null);
    if (!studentId || !loginPassword) {
      setLoginError("학번과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/smu/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          studentId,
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
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const handleSignup = async () => {
    setSignupError(null);

    if (!signupEmail || !password || !signupUsername) {
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
          nickname: signupUsername,
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
      }
      setSignupDone(true);
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
              <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', margin: '0 0 4px' }}>
                샘물 로그인
              </p>
              <p style={{ fontSize: 12.5, color: '#64748b', margin: '0 0 14px' }}>
                상명대학교 샘물 계정으로 로그인하세요.
              </p>

              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#475569',
                  marginBottom: 6,
                }}
              >
                학번
              </p>

              <input
                type="text"
                placeholder="학번을 입력해주세요."
                style={inputStyle}
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
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
                placeholder="샘물 비밀번호를 입력해주세요."
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
                background: loading ? '#c7cbd1' : studentId && loginPassword ? '#00178E' : '#9ca3af',
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

            <p style={{ textAlign: 'center', fontSize: 12.5, color: '#94a3b8', margin: '0 0 6px' }}>
              샘물 로그인을 이용하기 어려우신가요?
            </p>
            <p
              onClick={() => setShowSignup(true)}
              style={{
                textAlign: 'center',
                fontSize: 13.5,
                fontWeight: 700,
                color: '#00178E',
                cursor: 'pointer',
                margin: 0,
              }}
            >
              이메일로 회원가입하기 →
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

            {signupDone ? (
              <div style={{ textAlign: 'center', padding: '12px 0' }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 4px' }}>
                  대학원 준비,
                </h2>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', margin: '0 0 24px' }}>
                  한 곳에서 끝내는 H-AI Grad
                </h2>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 28 }}>
                  회원가입이 완료되었습니다.
                </p>
                <button
                  onClick={() => {
                    if (isLoggedIn()) {
                      onClose();
                    } else {
                      setShowSignup(false);
                      setSignupDone(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: 14,
                    background: '#00178E',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 700,
                    fontSize: 15,
                    cursor: 'pointer',
                  }}
                >
                  로그인하러 가기
                </button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}