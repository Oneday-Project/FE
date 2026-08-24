// 로드맵 API 연동 — 설문 제출/조회, 전공 로드맵 조회
//
//   POST  /roadmap/analyze       → 저장 안 하는 미리보기 분석
//   POST  /roadmap               → 최초 생성 및 저장 (이미 있으면 409)
//   PATCH /roadmap                → 최근 로드맵 수정 (없으면 404)
//   GET   /roadmap/me             → 내 로드맵 조회 (최초+최근 스냅샷)
//   GET   /roadmap/major-courses  → 전공 로드맵 (학년·학기별, 관심분야 매칭 강조)

import { getToken } from './auth'

// Roadmap.tsx 설문 답변 → 백엔드 AnalyzeRoadmapDto 형태로 변환한 값
export type RoadmapPayload = {
  year: number
  semester: number
  interestFields: string[]
  q3: number
  q4: number
  q5: number
  q6: number
  q7: number
  q8: number
  q9: string[]
  q10: string[]
  q11: number
  gpaBand: number
}

export type RoadmapRadar = {
  interest: number
  experience: number
  paper: number
  preparation: number
  academic: number
}

export type RoadmapOverview = {
  totalScore: number
  stage: string
  interestFields: string[]
  comment: string
}

// major/paper/growth 는 백엔드에서 아직 항상 빈 배열로 옴 — 형태 확정 전까지 unknown[] 로 둠
export type RoadmapAnalysis = {
  overview: RoadmapOverview
  radar: RoadmapRadar
  strengths: string[]
  weaknesses: string[]
  roadmap: {
    major: unknown[]
    paper: unknown[]
    growth: unknown[]
  }
}

export type RoadmapSnapshot = {
  result: RoadmapAnalysis
  answers: RoadmapPayload
  createdAt: string
}

export type MyRoadmap = {
  hasRoadmap: boolean
  initial?: RoadmapSnapshot
  latest?: RoadmapSnapshot
}

export type MajorCourse = {
  courseId: string
  name: string
  description: string
  fields: string[]
  level: string
  recommended: boolean
}

export type MajorCoursesResponse = {
  interestFields: string[]
  years: {
    year: number
    semesters: { semester: number; courses: MajorCourse[] }[]
  }[]
}

function authHeaders(): HeadersInit {
  const token = getToken()
  return {
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

// 실패 시 status 를 담아 throw — 호출부에서 409(이미 존재)/404(없음) 등을 구분해 처리할 수 있게
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...authHeaders(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message = Array.isArray(data?.message) ? data.message.join('\n') : data?.message ?? `요청에 실패했습니다. (${res.status})`
    const error = new Error(message) as Error & { status?: number }
    error.status = res.status
    throw error
  }

  return res.json()
}

export function analyzeRoadmap(payload: RoadmapPayload): Promise<RoadmapAnalysis> {
  return request<RoadmapAnalysis>('/roadmap/analyze', { method: 'POST', body: JSON.stringify(payload) })
}

export function createRoadmap(payload: RoadmapPayload): Promise<MyRoadmap> {
  return request<MyRoadmap>('/roadmap', { method: 'POST', body: JSON.stringify(payload) })
}

export function updateRoadmap(payload: RoadmapPayload): Promise<MyRoadmap> {
  return request<MyRoadmap>('/roadmap', { method: 'PATCH', body: JSON.stringify(payload) })
}

export function getMyRoadmap(): Promise<MyRoadmap> {
  return request<MyRoadmap>('/roadmap/me')
}

export function getMajorCourses(): Promise<MajorCoursesResponse> {
  return request<MajorCoursesResponse>('/roadmap/major-courses')
}
