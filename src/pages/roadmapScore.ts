/* 로드맵 점수 계산 유틸 (컴포넌트가 아니므로 별도 파일로 분리)
   맵의 키 = Roadmap.tsx 설문 보기 문구. 현재 보기 기준으로 맞춰둠. */

export type Answers = {
  [key: string]: string | string[];
};

export function calculateScores(answers: Answers) {
  const safe = (v: number | undefined) => v || 0;
  const pick = (map: Record<string, number>, key: unknown) => safe(map[key as string]);

  const q3Map: Record<string, number> = {
    "아직 관심 분야가 없어요.": 0,
    "개념을 조금 들어봤어요.": 2.5,
    "기본 개념은 알고 있어요.": 5,
    "꽤 익숙하고 설명할 수 있어요.": 7.5,
    "프로젝트/공부를 많이 해서 자신 있어요.": 10,
  };
  const q4Map: Record<string, number> = {
    "아직 정하지 못했어요.": 0,
    "대략적인 분야만 있어요.": 2.5,
    "세부 키워드까지 정했어요.": 5,
    "전체적인 내용을 구성했어요.": 7.5,
    "구체적인 연구 주제와 방향이 있어요.": 10,
  };
  const prep = pick(q3Map, answers.q3) + pick(q4Map, answers.q4);

  const q5Map: Record<string, number> = { "0회": 0, "1~3회": 2.5, "3~5회": 5, "5~8회": 7.5, "10회 이상": 10 };
  const q6Map: Record<string, number> = { "없음": 0, "3개월 이하": 2.5, "3~6개월": 5, "6개월~1년": 7.5, "1년 이상": 10 };
  const exp = pick(q5Map, answers.q5) + pick(q6Map, answers.q6);

  const q7Map: Record<string, number> = { "없음": 0, "1~3편": 2.5, "4~10편": 5, "11~20편": 7.5, "20편 이상": 10 };
  const q8Map: Record<string, number> = {
    "거의 이해하지 못해요.": 0, "요약만 이해할 수 있어요.": 2.5, "거의 이해할 수 있어요.": 5, "정리 및 요약이 가능해요.": 7.5, "완벽히 이해하고 발표할 수 있어요.": 10,
  };
  const paper = pick(q7Map, answers.q7) + pick(q8Map, answers.q8);

  const q9Count = Array.isArray(answers.q9) ? answers.q9.length : 0;
  const q10Count = Array.isArray(answers.q10) ? answers.q10.length : 0;
  const portfolio = Math.min((q9Count + q10Count) * 2.5, 20);

  const q11Map: Record<string, number> = {
    "거의 이해하지 못해요.": 0, "수업을 수강한 정도예요.": 2.5, "개념을 완벽히 이해했어요.": 5, "개념을 응용할 수 있어요.": 7.5, "증명 및 이론 설명이 자유롭게 가능해요.": 10,
  };
  const q12Map: Record<string, number> = {
    "읽을 수 있는 단어가 없어요.": 0, "뜨문뜨문 아는 단어가 나와요.": 2.5, "어느 정도 독해 가능해요.": 5, "혼자서 문맥 이해가 가능해요.": 7.5, "번역 없이도 전부 해석 가능해요.": 10,
  };
  const study = pick(q11Map, answers.q11) + pick(q12Map, answers.q12);

  return {
    prep,
    exp,
    paper,
    portfolio,
    study,
    total: Math.round(prep + exp + paper + portfolio + study),
  };
}