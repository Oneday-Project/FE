// H-AI 챗봇 연동 — 메인 페이지 "H-AI에게 물어보기"
//
//   POST /chatbot/ask  → 질문 + (선택) 이전 대화 내역을 보내면 답변을 받음
//                        로그인 필요, 서버는 대화를 저장하지 않으므로 history 를 매번 같이 보내야 함

import { apiFetch } from './auth'

export type ChatRole = 'user' | 'assistant'

export type ChatHistoryItem = {
  role: ChatRole
  content: string
}

export type ChatResponse = {
  answer: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(`/api${path}`, {
    ...init,
    headers: {
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

export function askChatbot(question: string, history: ChatHistoryItem[] = []): Promise<ChatResponse> {
  return request<ChatResponse>('/chatbot/ask', { method: 'POST', body: JSON.stringify({ question, history }) })
}
