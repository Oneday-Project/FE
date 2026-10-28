/* 커뮤니티 목 데이터 (API 연동 전)
   자유 게시판 · 선배들의 발자취 목록/상세가 같이 쓴다.
   댓글 수는 따로 들고 있지 않고 COMMENTS 개수로 계산해서 목록과 상세가 어긋나지 않게 한다. */

export const FREE_CATEGORIES = ['전체', '대학원', '연구/논문', '진로', '학교생활', '기타'] as const
export type FreeCategory = (typeof FREE_CATEGORIES)[number]

/* 피그마 커뮤니티_선배들의발자취_Final 필터 그대로 (SML·SAP 표기 포함) */
export const SENIOR_FIELDS = ['전체', 'SML', 'CV', 'NLP', 'Robotics', 'Retrieval AI', 'SAP', 'HCI', 'Multimodal', 'Code AI'] as const
export type SeniorField = (typeof SENIOR_FIELDS)[number]

export type SeniorType = '대학원 진학' | '학석사 연계' | '취업'

export type FreePost = {
  id: number
  category: Exclude<FreeCategory, '전체'>
  title: string
  excerpt: string
  body: string[]
  author: string
  /* 작성자 옆 소속 표기 (예: 학부 3학년) */
  authorInfo: string
  minutesAgo: number
  views: number
  likes: number
}

export type SeniorStory = {
  id: number
  type: SeniorType
  /* 카드 태그. 피그마 카드에 필터에 없는 분야(XAI)도 있어서 문자열로 둔다 */
  fields: string[]
  title: string
  author: string
  /* 학번 (예: 19학번) */
  classOf: string
  from: string
  to: string
  summary: string
  sections: { heading: string; body: string }[]
  minutesAgo: number
  views: number
  likes: number
}

export type Comment = {
  id: number
  author: string
  minutesAgo: number
  content: string
  likes: number
}

export type BoardTab = 'free' | 'seniors'

export function commentsOf(board: BoardTab, id: number): Comment[] {
  return COMMENTS[`${board}-${id}`] ?? []
}

export const freePosts: FreePost[] = [
  {
    id: 1, category: '대학원',
    title: '대학원 컨택은 보통 언제부터 시작하시나요?',
    excerpt: '3학년 2학기인데 교수님께 메일을 보내도 너무 이르지 않을지 궁금해요.',
    body: [
      '안녕하세요. 현재 3학년 2학기이고 대학원 진학을 고민하고 있는 학부생입니다.',
      '관심 있는 연구실이 두세 곳 정도 생겼는데, 지금 교수님께 컨택 메일을 보내도 너무 이르지 않을지 궁금해요. 보통 몇 학년 몇 학기쯤 처음 연락을 드리셨나요?',
      '메일에 어떤 내용을 담으셨는지, 미리 준비해두면 좋은 것이 있었는지도 공유해주시면 큰 도움이 될 것 같습니다.',
    ],
    author: '영주', authorInfo: '학부 3학년', minutesAgo: 120, views: 128, likes: 12,
  },
  {
    id: 2, category: '연구/논문',
    title: '학부생이 처음 논문 읽을 때 추천하는 방법 있나요?',
    excerpt: '초록부터 읽어야 할지, 구현을 먼저 따라 해봐야 할지 선배님들의 방법이 궁금합니다.',
    body: [
      '논문을 처음 읽어보려고 하는데 한 편 읽는 데 너무 오래 걸려요.',
      '초록과 결론부터 읽으라는 말도 있고, 코드를 먼저 돌려보라는 말도 있어서 어떤 방식이 맞는지 헷갈립니다. 선배님들은 어떻게 시작하셨나요?',
    ],
    author: '하이그래드', authorInfo: '학부 2학년', minutesAgo: 300, views: 96, likes: 18,
  },
  {
    id: 3, category: '진로',
    title: '학석사 연계과정 고민 중입니다.',
    excerpt: '대학원 진학과 취업 사이에서 고민하고 있어 실제 경험담을 듣고 싶어요.',
    body: [
      '학석사 연계과정을 신청할지 고민 중입니다. 졸업을 빨리 할 수 있다는 장점은 알겠는데, 학부 마지막 학기가 많이 바빠진다고 들었어요.',
      '실제로 연계과정을 하신 분들의 경험담이 궁금합니다.',
    ],
    author: '민서', authorInfo: '학부 4학년', minutesAgo: 1500, views: 214, likes: 23,
  },
  {
    id: 4, category: '대학원',
    title: '연구실 선택할 때 가장 중요하게 봐야 하는 게 뭘까요?',
    excerpt: '연구 주제, 지도 방식, 랩 문화 중 어떤 점을 우선하면 좋을까요?',
    body: [
      '관심 있는 연구실이 여러 곳인데 어떤 기준으로 골라야 할지 모르겠어요.',
      '연구 주제가 가장 중요하다는 분도 있고, 지도 방식이나 연구실 분위기가 더 중요하다는 분도 있더라고요. 연구실을 고르실 때 어떤 점을 가장 먼저 보셨나요?',
    ],
    author: '준호', authorInfo: '학부 3학년', minutesAgo: 2880, views: 302, likes: 31,
  },
  {
    id: 5, category: '연구/논문',
    title: '논문 리뷰 스터디 같이 하실 분 계신가요?',
    excerpt: '매주 한 편씩 읽고 정리해서 공유하는 방식으로 진행하려고 합니다.',
    body: [
      'CV 분야 논문을 매주 한 편씩 읽고 정리해서 공유하는 스터디를 만들려고 합니다.',
      '처음 논문을 읽는 분도 환영해요. 관심 있으신 분은 댓글 남겨주세요.',
    ],
    author: '서연', authorInfo: '학부 3학년', minutesAgo: 4320, views: 187, likes: 20,
  },
  {
    id: 6, category: '학교생활',
    title: '휴먼AI공학전공 수업 중 대학원 준비에 도움된 과목 추천해주세요.',
    excerpt: '전공 선택할 때 참고하려고 하는데 선배님들 의견이 궁금해요.',
    body: [
      '다음 학기 수강 신청을 앞두고 있는데, 대학원 준비에 실제로 도움이 됐던 과목이 있다면 추천 부탁드려요.',
    ],
    author: '지우', authorInfo: '학부 2학년', minutesAgo: 5760, views: 143, likes: 15,
  },
  {
    id: 7, category: '진로',
    title: '연구실 인턴 경험이 대학원 입시에 얼마나 반영될까요?',
    excerpt: '학점보다 인턴 경험이 더 중요하다는 말을 들었는데 실제로 어떤가요?',
    body: [
      '학부연구생 경험이 입시에서 꽤 중요하다고 들었어요. 학점이 조금 아쉬운 편인데, 인턴 경험으로 어느 정도 보완이 될까요?',
    ],
    author: '태윤', authorInfo: '학부 4학년', minutesAgo: 7200, views: 265, likes: 28,
  },
  {
    id: 8, category: '대학원',
    title: '타대 대학원 준비하시는 분들 계신가요?',
    excerpt: '내부 진학과 비교했을 때 어떤 점을 더 챙겨야 하는지 궁금합니다.',
    body: [
      '타대 대학원을 준비하고 있는데 내부 진학과 비교해서 더 챙겨야 할 점이 있는지 궁금합니다. 면접 준비 방법도 공유해주시면 감사하겠습니다.',
    ],
    author: '하늘', authorInfo: '학부 4학년', minutesAgo: 10080, views: 198, likes: 22,
  },
  {
    id: 9, category: '기타',
    title: '연구 관련 도구 추천받아요.',
    excerpt: '레퍼런스 관리랑 실험 기록에 쓰기 좋은 도구가 있을까요?',
    body: [
      '논문 레퍼런스 관리와 실험 기록에 쓰기 좋은 도구를 찾고 있어요. 다들 어떤 걸 쓰시나요?',
    ],
    author: '도현', authorInfo: '학부 3학년', minutesAgo: 14400, views: 112, likes: 16,
  },
]

export const seniorStories: SeniorStory[] = [
  {
    id: 1, type: '대학원 진학', fields: ['CV', 'SML'],
    title: '학부 연구생부터 AI 대학원 진학까지',
    author: '고O연', classOf: '19학번', from: '휴먼AI공학전공', to: 'AI 대학원',
    summary: '학부 연구 경험을 시작으로 관심 연구 분야를 좁히고 대학원에 진학한 과정을 소개합니다.',
    sections: [
      { heading: '1. 진학을 준비하게 된 계기', body: '3학년 때 들은 컴퓨터비전 수업에서 직접 모델을 학습시켜 본 경험이 계기가 됐어요. 프로젝트를 진행하며 연구를 더 깊이 해보고 싶다는 생각이 들었고, 그때부터 대학원 진학을 진지하게 고민하기 시작했습니다.' },
      { heading: '2. 준비 과정', body: '학부연구생으로 1년 정도 활동하면서 매주 논문 세미나에 참여했어요. 처음에는 논문 한 편을 읽는 데 일주일이 걸렸지만, 꾸준히 정리하다 보니 속도가 붙었습니다. 학점은 전공 과목 위주로 관리했어요.' },
      { heading: '3. 연구실 선택 및 컨택', body: '관심 분야의 최근 논문을 읽고 연구 방향이 맞는 연구실 세 곳을 골랐어요. 컨택 메일에는 읽은 논문에 대한 짧은 생각과 학부 연구 경험을 함께 담았고, 면담 전에 CV와 연구 계획을 준비해 갔습니다.' },
      { heading: '4. 후배들에게 전하고 싶은 말', body: '처음부터 완벽하게 준비하려고 하기보다, 관심 있는 논문을 한 편씩 읽어보는 것부터 시작해보세요. 작은 경험이 쌓이면 진학 방향도 자연스럽게 보이기 시작합니다.' },
    ],
    minutesAgo: 1440, views: 128, likes: 12,
  },
  {
    id: 2, type: '학석사 연계', fields: ['NLP', 'SML'],
    title: '관심 분야를 찾고 학석사 연계에 도전한 기록',
    author: '김O준', classOf: '20학번', from: '휴먼AI공학전공', to: '학석사 연계과정',
    summary: '수업과 프로젝트를 연결하며 연구 주제를 발견하고 연계과정을 준비한 경험을 나눕니다.',
    sections: [
      { heading: '1. 관심 분야를 찾게 된 계기', body: '자연어처리 수업 프로젝트로 챗봇을 만들면서 언어 모델에 흥미가 생겼어요. 수업이 끝난 뒤에도 관련 논문을 찾아 읽으며 관심 분야를 좁혀 갔습니다.' },
      { heading: '2. 준비 과정', body: '연계과정은 학부 성적 기준이 있어서 3학년 때부터 학점 관리에 신경 썼어요. 연구실 세미나와 수업을 병행하는 게 가장 힘들었습니다.' },
      { heading: '3. 후배들에게 전하고 싶은 말', body: '연계과정은 시간을 아낄 수 있지만 마지막 학기가 정말 바빠요. 미리 수강 계획을 세워두세요.' },
    ],
    minutesAgo: 4320, views: 96, likes: 9,
  },
  {
    id: 3, type: '취업', fields: ['Code AI', 'HCI'],
    title: 'HCI 프로젝트 경험을 UX 리서처 직무로',
    author: '이O서', classOf: '19학번', from: '휴먼AI공학전공', to: 'IT 기업 UX Researcher',
    summary: '사용자 연구 프로젝트와 포트폴리오를 바탕으로 진로를 구체화한 과정을 담았습니다.',
    sections: [
      { heading: '1. 진로를 정하게 된 계기', body: 'HCI 수업에서 사용자 인터뷰를 진행하며 사람의 행동을 분석하는 일에 흥미를 느꼈어요.' },
      { heading: '2. 준비 과정', body: '수업 프로젝트와 공모전 결과물을 연구 과정 중심으로 포트폴리오에 정리했습니다.' },
      { heading: '3. 후배들에게 전하고 싶은 말', body: '결과보다 문제를 정의하고 검증한 과정을 잘 보여주는 게 중요해요.' },
    ],
    minutesAgo: 7200, views: 143, likes: 15,
  },
  {
    id: 4, type: '대학원 진학', fields: ['Multimodal'],
    title: 'Multimodal 연구 주제로 해외 대학원 준비하기',
    author: '박O현', classOf: '18학번', from: '휴먼AI공학전공', to: '해외 AI 대학원',
    summary: '연구 인턴, 영어 점수, 추천서 준비를 병행하며 지원 일정을 관리한 방법을 공유합니다.',
    sections: [
      { heading: '1. 해외 대학원을 선택한 이유', body: '이미지와 텍스트를 함께 다루는 연구를 하고 싶었는데, 관련 연구실이 해외에 많아 지원을 결심했어요.' },
      { heading: '2. 준비 과정', body: '연구 인턴을 하면서 영어 시험과 추천서를 함께 준비했어요. 지원 마감이 학교마다 달라서 일정표를 만들어 관리했습니다.' },
      { heading: '3. 후배들에게 전하고 싶은 말', body: '해외 지원은 준비 기간이 길어요. 최소 1년 전부터 일정을 세워두는 걸 추천합니다.' },
    ],
    minutesAgo: 10080, views: 187, likes: 20,
  },
  {
    id: 5, type: '취업', fields: ['XAI'],
    title: '설명 가능한 AI 연구를 산업 프로젝트로 연결하기',
    author: '최O민', classOf: '20학번', from: '휴먼AI공학전공', to: 'AI 스타트업',
    summary: '캡스톤과 논문 리뷰 경험을 실무 역량으로 정리해 취업까지 연결한 이야기입니다.',
    sections: [
      { heading: '1. 준비 과정', body: '캡스톤 프로젝트에서 모델의 예측 근거를 시각화하는 기능을 만들었고, 관련 논문을 리뷰하며 쌓은 지식을 면접에서 자세히 설명했습니다.' },
      { heading: '2. 후배들에게 전하고 싶은 말', body: '연구 경험도 실무 문제와 연결해서 설명하면 큰 강점이 됩니다.' },
    ],
    minutesAgo: 14400, views: 112, likes: 11,
  },
  {
    id: 6, type: '대학원 진학', fields: ['NLP'],
    title: '비전공 수업에서 NLP 연구실 진학까지',
    author: '정O우', classOf: '19학번', from: '휴먼AI공학전공', to: '지능정보공학과',
    summary: '관심 분야가 늦게 정해진 상황에서 수업과 스터디로 기초를 채운 과정을 소개합니다.',
    sections: [
      { heading: '1. 진학을 준비하게 된 계기', body: '4학년 때 들은 언어학 교양 수업에서 언어를 계산으로 다루는 방법에 관심이 생겼어요.' },
      { heading: '2. 준비 과정', body: '늦게 시작한 만큼 스터디를 꾸려 기초 강의와 핵심 논문을 빠르게 따라잡았습니다.' },
      { heading: '3. 후배들에게 전하고 싶은 말', body: '관심 분야가 늦게 정해져도 괜찮아요. 전공 밖의 수업도 연구 주제의 출발점이 될 수 있어요.' },
    ],
    minutesAgo: 20160, views: 165, likes: 14,
  },
]

const COMMENTS: Record<string, Comment[]> = {
  'free-1': [
    { id: 1, author: '대학원준비중', minutesAgo: 60, content: '저는 3학년 2학기 말에 처음 연락드렸어요. 관심 있는 연구실 논문을 한두 편 읽고 메일 보내니 면담 때 이야기하기 훨씬 수월했습니다.', likes: 4 },
    { id: 2, author: '선배연구생', minutesAgo: 240, content: '너무 이르지 않아요. 학부연구생 자리가 있는지 같이 여쭤보는 것도 추천합니다.', likes: 3 },
    { id: 3, author: '하이그래드', minutesAgo: 600, content: '메일에는 자기소개, 관심 연구 주제, 읽은 논문에 대한 짧은 생각 정도면 충분했어요.', likes: 1 },
  ],
  'free-2': [
    { id: 1, author: '논문읽는중', minutesAgo: 180, content: '초록 → 그림 → 결론 순서로 먼저 훑고, 관심 가는 부분만 본문을 읽는 방식이 저한테 맞았어요.', likes: 5 },
  ],
  'free-4': [
    { id: 1, author: '석사1년차', minutesAgo: 1440, content: '연구 주제도 중요하지만 지도 방식이 저랑 맞는지가 생각보다 훨씬 중요했어요. 재학생 선배와 꼭 이야기해보세요.', likes: 6 },
    { id: 2, author: '준비생', minutesAgo: 2000, content: '저도 같은 고민 중이라 댓글 기다리고 있어요!', likes: 0 },
  ],
  'seniors-1': [
    { id: 1, author: '연구하는학부생', minutesAgo: 600, content: '선배님 컨택 메일 쓰는 방법이 정말 도움이 됐어요. 감사합니다!', likes: 2 },
    { id: 2, author: '논문초보', minutesAgo: 1000, content: 'CV 연구실 준비할 때 어떤 강의를 들으셨는지도 궁금해요.', likes: 1 },
  ],
  'seniors-2': [
    { id: 1, author: '3학년', minutesAgo: 3000, content: '연계과정 마지막 학기 수강 계획 팁 더 알려주실 수 있나요?', likes: 1 },
  ],
}
