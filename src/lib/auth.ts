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
  clearUserData()   // 로그아웃 없이 다른 계정으로 로그인해도 이전 사용자 데이터가 안 남게
  localStorage.setItem(ACCESS_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken)
  window.dispatchEvent(new Event('auth-change'))
}

/* 계정에 딸린 로컬 데이터 키.
   남겨두면 같은 브라우저에서 새로 가입/로그인한 사람에게 이전 사용자 것이 그대로 보인다.
     roadmapAnswers  — 로드맵 설문 답변 (Roadmap.tsx 가 저장)
     paperReadStatus — 서버 연동 전 읽음 상태 (지금은 읽는 코드 없음)
     userInfo        — 이전 사용자 이메일 등 (지금은 읽는 코드 없음)
   뒤 두 개는 옛 버전의 흔적이라 남아만 있는데, 개인정보가 들어있어 같이 정리한다. */
const USER_DATA_KEYS = ['roadmapAnswers', 'paperReadStatus', 'userInfo']

function clearUserData(): void {
  USER_DATA_KEYS.forEach(key => localStorage.removeItem(key))
}

export function clearToken(): void {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
  clearUserData()
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
  if (!getToken()) return null
  try {
    const res = await apiFetch('/api/users/me')
    if (!res.ok) return null   // 재발급까지 실패한 경우
    return await res.json()
  } catch {
    return null
  }
}

/* ───────── 토큰 재발급 & 공용 요청 ─────────
   accessToken 은 약 1시간이면 만료된다. 그런데 isLoggedIn() 은 토큰이 "있는지"만
   보기 때문에, 갱신을 안 하면 화면상 로그인 상태인데 모든 API 가 401 이 되는
   ("로그인된 척하는") 상태가 된다. 아래 apiFetch 가 그걸 막는다. */

const API_HEADERS: Record<string, string> = {
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// 동시에 여러 요청이 401 이 나도 재발급은 한 번만 돌도록 진행 중인 Promise 를 공유
let refreshing: Promise<boolean> | null = null

/* POST /auth/token/access — refreshToken 을 Authorization 으로 보내 accessToken 재발급.
   성공하면 새 토큰을 저장하고 true. auth-change 는 쏘지 않는다(같은 사용자라 캐시를 비울 이유가 없음). */
export function refreshAccessToken(): Promise<boolean> {
  if (refreshing) return refreshing

  refreshing = (async () => {
    const refreshToken = getRefreshToken()
    if (!refreshToken) return false

    try {
      const res = await fetch('/api/auth/token/access', {
        method: 'POST',
        headers: { ...API_HEADERS, Authorization: `Bearer ${refreshToken}` },
      })
      if (!res.ok) {
        console.error('토큰 재발급 실패:', res.status, await res.text().catch(() => ''))
        return false
      }

      // 응답 형태가 확실치 않아 흔한 키들을 방어적으로 훑는다
      const json = await res.json().catch(() => null)
      const data = (json?.data ?? json) as Record<string, unknown> | null
      const accessToken = (data?.accessToken ?? data?.access_token ?? data?.token) as string | undefined
      if (!accessToken) {
        console.error('토큰 재발급 응답에 accessToken 이 없습니다:', json)
        return false
      }

      localStorage.setItem(ACCESS_KEY, accessToken)
      const nextRefresh = (data?.refreshToken ?? data?.refresh_token) as string | undefined
      if (nextRefresh) localStorage.setItem(REFRESH_KEY, nextRefresh)
      return true
    } catch (e) {
      console.error('토큰 재발급 오류:', e)
      return false
    } finally {
      refreshing = null
    }
  })()

  return refreshing
}

/* 인증이 필요한 API 요청은 전부 이걸 쓴다.
   401 이 오면 refreshToken 으로 한 번 재발급받고 원래 요청을 다시 보낸다.
   재발급까지 실패하면 토큰을 지워(clearToken) 로그아웃 상태로 되돌린다. */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = () => fetch(input, {
    ...init,
    // 로그인한 사용자의 응답이 브라우저 캐시에 남지 않도록 (계정 전환 시 이전 응답 노출 방지)
    cache: 'no-store',
    headers: {
      ...API_HEADERS,
      ...authHeader(),                                  // 재시도 때 새 토큰을 다시 읽는다
      ...(init.headers as Record<string, string> | undefined),
    },
  })

  const res = await send()
  if (res.status !== 401 || !getRefreshToken()) return res

  if (!(await refreshAccessToken())) {
    clearToken()   // auth-change → 캐시 비우고 네브바도 로그아웃 상태로
    return res
  }
  return send()
}
