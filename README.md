# H-AI Grad · Frontend

**대학원 진학 준비를 한 곳에서.**
관심 분야 논문을 발견·기록하고, 개인 맞춤 대학원 로드맵을 완성하는 웹 서비스입니다.

> 휴먼AI공학전공 2026 졸업프로젝트 (Human-AI Engineering Major 2026 Graduation Project)
> onedayproject 팀

<br />

## 소개

H-AI Grad는 대학원을 준비하는 학생을 위한 서비스입니다.

- **논문 탐색** — 관심 분야의 최신 논문을 찾고, AI 요약으로 핵심을 빠르게 파악
- **읽기 기록** — 읽는 중 / 읽기 완료 상태를 관리하고, 캘린더로 학습 흐름을 확인
- **북마크** — 다시 볼 논문을 저장
- **로드맵** — 준비 상태를 진단하고 관심 분야에 맞는 전공 과목·논문을 추천

<br />

## 기술 스택

| 구분 | 사용 기술 |
| --- | --- |
| 언어 | TypeScript |
| 프레임워크 | React 19 |
| 빌드 도구 | Vite |
| 라우팅 | React Router |
| 스타일 | 인라인 스타일 (CSS-in-JS 방식) |
| 폰트 | Pretendard |
| 린트 | ESLint |

<br />

## 실행 방법

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정 — 프로젝트 루트에 .env 생성
#    백엔드 API 주소(ngrok)를 입력합니다.
echo "VITE_API_BASE_URL=<백엔드 주소>" > .env

# 3. 개발 서버 실행 (http://localhost:5173)
npm run dev
```

기타 명령어

```bash
npm run build     # 타입 검사 후 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
npm run lint      # ESLint 검사
```

> API 요청은 `/api`로 시작하며, Vite 프록시가 `.env`의 `VITE_API_BASE_URL`로 전달합니다.
> ngrok 주소는 재시작 시 바뀌므로 그때마다 `.env`를 갱신해야 합니다.

<br />

## 폴더 구조

```
src/
├─ pages/          # 화면 단위 컴포넌트
│  ├─ Main.tsx           # 메인 (기록 요약 · 이어서 읽기 · 로드맵 요약)
│  ├─ Papers.tsx         # 논문 목록 · 검색 · 필터
│  ├─ PaperDetail.tsx    # 논문 상세 (AI 요약 · 읽음 토글)
│  ├─ Mypage.tsx         # 마이페이지 (프로필 · 북마크 · 읽음 기록 · 탈퇴)
│  ├─ Roadmap*.tsx       # 로드맵 (질문 · 결과)
│  ├─ login.tsx          # 로그인 / 회원가입
│  ├─ About.tsx          # 소개
│  └─ Community.tsx      # 커뮤니티
├─ components/     # 공용 컴포넌트 (Navbar, Footer, ReadStatusTag)
├─ lib/            # 도메인 로직 · API 연동
│  ├─ auth.ts            # 토큰 · 로그인 상태 관리
│  ├─ bookmarks.ts       # 북마크 저장소 (서버 연동)
│  └─ readStatus.ts      # 읽음 상태 저장소 (서버 연동)
└─ App.tsx         # 라우팅
```

여러 화면이 공유하는 상태(북마크·읽음 상태)는 `lib/`의 저장소에서 관리하고,
`useSyncExternalStore`로 구독해 한 곳에서 바꾸면 모든 화면에 즉시 반영됩니다.

<br />

## 팀

| 파트 | 담당 |
| --- | --- |
| Design | Yeongju Sim |
| Front-End | Heejung Jang · Serih Yu |
| Back-End | Jungwoo Kim · Yerin Song |

📧 onedayproject179@gmail.com
