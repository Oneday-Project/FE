// 인증 토큰 관리 — 로그인/로그아웃/네브바가 공통으로 사용
// POST /auth/login 응답: { accessToken, refreshToken }
//  - accessToken  : API 요청 인증에 사용 (약 1시간 만료)
//  - refreshToken : 만료 시 POST /auth/token/access 로 새 accessToken 재발급용

const ACCESS_KEY = 'accessToken'
const REFRESH_KEY = 'refreshToken'

export function getToken(): string | null {
  return localStorage.getItem(ACCESS_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY)
}

// 토큰이 있으면 로그인된 것으로 간주
export function isLoggedIn(): boolean {
  return !!getToken()
}

// 로그인 성공 시 호출 — 토큰 저장 후 네브바 등에 변경을 알림
export function setToken(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  window.dispatchEvent(new Event('auth-change'))
}

// 로그아웃 시 호출 — 토큰 삭제 후 변경을 알림
export function clearToken(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  sessionStorage.clear()
  window.dispatchEvent(new Event('auth-change'))
}

// GET /users/me 응답 형태
export type Me = {
  id: number
  username: string   // 이름
  nickname: string   // 닉네임
  email: string      // 아이디
  role: string       // ADMIN | USER
  bookmarkPapers?: unknown[]
}

// 현재 로그인한 사용자 정보 조회 (토큰 필요)
export async function fetchMe(): Promise<Me | null> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch('/api/users/me', {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        'ngrok-skip-browser-warning': 'true',
      },
    })
    if (!res.ok) return null   // 토큰 만료/무효 등
    return await res.json()
  } catch {
    return null
  }
}
