import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* 타입 정의 */
type Question =
  | {
      id: string;
      type: "single" | "multi";
      title: string;
      options: string[];
    }
  | {
      type: "section";
      label: string;
    };

type Answers = {
  [key: string]: string | string[];
};

/* 질문 데이터 */
const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    title: "Q1. 재학 중이신 학년과 학기를 선택해주세요.",
    options: [
      "1학년 1학기","1학년 2학기",
      "2학년 1학기","2학년 2학기",
      "3학년 1학기","3학년 2학기",
      "4학년 1학기","4학년 2학기"
    ]
  },
  {
    id: "q2",
    type: "multi",
    title: "Q2. 관심분야를 선택해주세요 (최대 3개까지 선택 가능)",
    options: [
      "BCI","Bio","CV","Generative AI","GNN","HCI","LLM","Multimodal",
      "NLP","RL","Robotics","UI/UX","XAI"
    ]
  },

  { type: "section", label: "전공 및 연구 준비도" },

  {
    id: "q3",
    type: "single",
    title: "Q3. 선택한 관심 분야에 대해 어느 정도 이해하고 있나요?",
    options: [
      "아직 관심 분야가 없어요.",
      "개념을 조금 들어봤어요.",
      "기본 개념은 알고 있어요.",
      "꽤 익숙하고 설명할 수 있어요.",
      "프로젝트/공부를 많이 해서 자신 있어요."
    ]
  },
  {
    id: "q4",
    type: "single",
    title: "Q4. 하고자 하는 연구가 얼마나 구체화되어 있나요?",
    options: [
      "아직 정하지 못했어요.",
      "대략적인 분야만 있어요.",
      "세부 키워드까지 정했어요.",
      "전체적인 내용을 구성했어요.",
      "구체적인 연구 주제와 방향이 있어요."
    ]
  },

  { type: "section", label: "실전 경험" },

  {
    id: "q5",
    type: "single",
    title: "Q5. 프로젝트 또는 대회 참여 경험은?",
    options: ["0회","1~3회","3~5회","5~8회","10회 이상"]
  },
  {
    id: "q6",
    type: "single",
    title: "Q6. 연구실 인턴 경험이 있나요?",
    options: ["없음","3개월 이하","3~6개월","6개월~1년","1년 이상"]
  },

  { type: "section", label: "논문 역량" },

  {
    id: "q7",
    type: "single",
    title: "Q7. 한 달에 논문을 몇 편 읽나요?",
    options: ["0회","1~3회","4~6회","6~9회","10회 이상"]
  },
  {
    id: "q8",
    type: "single",
    title: "Q8. 논문 이해 수준은?",
    options: [
      "거의 이해 못함",
      "요약만 가능",
      "대부분 이해",
      "정리 가능",
      "발표 가능"
    ]
  },

  { type: "section", label: "대외 활동 (복수 선택)" },

  {
    id: "q9",
    type: "multi",
    title: "Q9. 준비된 항목 선택",
    options: [
      "없음","자격증","Notion","CV","영어 성적"
    ]
  },
  {
    id: "q10",
    type: "multi",
    title: "Q10. 발표 경험",
    options: [
      "없음","수업","동아리","교외","학회"
    ]
  },

  { type: "section", label: "학업 기반 역량" },

  {
    id: "q11",
    type: "single",
    title: "Q11. 수학 이해 수준",
    options: [
      "거의 모름","수업 수준","개념 이해","응용 가능","설명 가능"
    ]
  },
  {
    id: "q12",
    type: "single",
    title: "Q12. 영어 논문 독해",
    options: [
      "불가","부분 이해","대략 이해","문맥 이해","완전 해석"
    ]
  }
];

export default function Roadmap() {

  const [answers, setAnswers] = useState<Answers>({});
  const navigate = useNavigate();

  /* 전체 완료 체크 */
  const isAllAnswered = questions.every(q => {
    if (!("id" in q)) return true;
    const val = answers[q.id];
    if (!val) return false;
    return Array.isArray(val) ? val.length > 0 : true;
  });

  /* 체크 여부 */
  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!("id" in q)) return true;

    const val = answers[q.id];
    if (!val) return false;

    return Array.isArray(val) ? val.length > 0 : true;
  };

  /* 활성화 */
  const isEnabled = (idx: number) => {
    if (idx === 0) return true;

    let prev = idx - 1;
    while (questions[prev]?.type === "section") prev--;

    return isAnswered(prev);
  };

  const handleSingle = (qid: string, value: string) => {
    setAnswers(prev => ({ ...prev, [qid]: value }));
  };

  const handleMulti = (qid: string, value: string) => {
    setAnswers(prev => {
      const current = (prev[qid] as string[]) || [];

      if (current.includes(value)) {
        return { ...prev, [qid]: current.filter(v => v !== value) };
      }

      if (qid === "q2" && current.length >= 3) return prev;

      return { ...prev, [qid]: [...current, value] };
    });
  };

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
    }}>

      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '56px 48px 80px'
      }}>

        <div style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
            내 로드맵, 지금 생성하기
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            전공·논문·준비 액션을 한 플랜으로 정리해드려요.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {questions.map((q, idx) => {

            if (q.type === "section") {
              return (
                <div key={idx}>
                  <div style={{
                    display: 'inline-block',
                    background: '#3B6FE8',
                    color: '#fff',
                    padding: '6px 14px',
                    borderRadius: '0 999px 999px 0',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {q.label}
                  </div>
                </div>
              );
            }

            const enabled = isEnabled(idx);
            const selected = isAnswered(idx);

            return (
              <div key={q.id} style={{ display: 'flex', gap: '12px' }}>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: selected ? '#3B6FE8' : '#d1d5db'
                  }} />
                  <div style={{
                    width: '2px',
                    height: '120px',
                    background: selected ? '#3B6FE8' : '#d1d5db',
                    marginTop: '6px'
                  }} />
                </div>

                <div style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '16px',
                  background: '#fff',
                  border: selected ? '2px solid #3B6FE8' : '1px solid #e5e7eb',
                  opacity: enabled ? 1 : 0.4,
                  pointerEvents: enabled ? 'auto' : 'none'
                }}>

                  <p style={{ fontWeight: 600, marginBottom: '10px' }}>
                    {q.title}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                    {q.options.map(opt => {

                      const isSelected =
                        q.type === "multi"
                          ? ((answers[q.id] as string[]) || []).includes(opt)
                          : answers[q.id] === opt;

                      return (
                        <label key={opt} style={{ cursor: 'pointer' }}>
                          <input
                            type={q.type === "multi" ? "checkbox" : "radio"}
                            name={q.id}
                            checked={isSelected}
                            onChange={() =>
                              q.type === "multi"
                                ? handleMulti(q.id, opt)
                                : handleSingle(q.id, opt)
                            }
                          />
                          {" "}{opt}
                        </label>
                      );
                    })}
                  </div>

                </div>
              </div>
            );
          })}

        </div>

        {/* ⭐ 버튼 추가 */}
        <div style={{ marginTop: '60px', textAlign: 'center' }}>
          <button
            disabled={!isAllAnswered}
            onClick={() => isAllAnswered && navigate("/roadmap-result")}
            style={{
              padding: '14px 28px',
              borderRadius: '10px',
              border: 'none',
              fontSize: '16px',
              fontWeight: 600,
              cursor: isAllAnswered ? 'pointer' : 'not-allowed',
              background: isAllAnswered ? '#3B6FE8' : '#d1d5db',
              color: isAllAnswered ? '#fff' : '#6b7280',
              transition: '0.2s'
            }}
          >
            로드맵 생성하러 가기
          </button>
        </div>

      </div>
    </div>
  );
}