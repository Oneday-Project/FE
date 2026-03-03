**Vite + React + TypeScript** 

---

## 🛠 Tech Stack

- **Vite**
- **React**
- **TypeScript**
- **npm**

---

# 📦 1️⃣ 프로젝트 실행 방법

## 1. 레포 클론

```bash
git clone https://github.com/Oneday-Project/FE.git
cd FE

## 2. 의존성 설치
npm install

## 3. 개발 서버 실행
npm run dev

브라우저 접속:http://localhost:5173/

# 📦 2️⃣ 프로젝트 실행 방법
main 브런치에서 작업하는 것이 아닌! 항상 main 최신 상태를 받아온 후 새 브런치를 생성하기
git checkout main
git pull origin main
git checkout -b feature/기능이름

# 💾 3️⃣ 작업 후 커밋 & 푸시
git add .
git commit -m "feat: 로그인 UI 구현"
git push origin feature/login

이후 Github에서 Pull Request 생성 후 main으로 merge하기


# 📝 4️⃣ 커밋 컨벤션
| 타입           | 설명                |
| ------------ | ----------------- |
| **feat**     | 새로운 기능            |
| **fix**      | 버그 수정             |
| **style**    | 스타일 변경 (기능 변화 없음) |
| **refactor** | 리팩토링              |
| **chore**    | 설정, 패키지 변경        |


+프로젝트 구조 src는 차차...

#  ⚠️ 주의사항

node_modules는 커밋하지않기 

main 브랜치 직접 push 금지

작업 전 반드시 git pull origin main 실행

패키지 추가 시 팀원에게 공유
