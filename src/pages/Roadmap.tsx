import { useState } from "react";
import { useNavigate } from "react-router-dom";

/* =========================================================
 *  대표색 (색 바꿀 땐 여기 두 줄만 수정)
 * =======================================================*/
const BRAND = "#00178E";
const BRAND_TINT = "rgba(0,23,142,0.06)";

/* 타입 정의 */
type Question =
  | { id: string; type: "single" | "multi"; title: string; options: string[] }
  | { type: "section"; label: string };

type Answers = {
  [key: string]: string | string[];
};

/* 멀티 선택에서 배타 처리할 옵션 ("없음" 누르면 나머지 해제) */
const EXCLUSIVE = "없음";

/* 질문 데이터 (변경 없음) */
const questions: Question[] = [
  {
    id: "q1",
    type: "single",
    title: "Q1. 재학 중이신 학년과 학기를 선택해주세요.",
    options: ["1학년 1학기", "1학년 2학기", "2학년 1학기", "2학년 2학기", "3학년 1학기", "3학년 2학기", "4학년 1학기", "4학년 2학기"],
  },
  {
    id: "q2",
    type: "multi",
    title: "Q2. 관심분야를 선택해주세요 (최대 3개까지 선택 가능)",
    options: ["BCI", "Bio", "CV", "Generative AI", "GNN", "HCI", "LLM", "Multimodal", "NLP", "RL", "Robotics", "UI/UX", "XAI"],
  },

  { type: "section", label: "전공 및 연구 준비도" },

  {
    id: "q3",
    type: "single",
    title: "Q3. 선택한 관심 분야에 대해 어느 정도 이해하고 있나요?",
    options: ["아직 관심 분야가 없어요.", "개념을 조금 들어봤어요.", "기본 개념은 알고 있어요.", "꽤 익숙하고 설명할 수 있어요.", "프로젝트/공부를 많이 해서 자신 있어요."],
  },
  {
    id: "q4",
    type: "single",
    title: "Q4. 하고자 하는 연구가 얼마나 구체화되어 있나요?",
    options: ["아직 정하지 못했어요.", "대략적인 분야만 있어요.", "세부 키워드까지 정했어요.", "전체적인 내용을 구성했어요.", "구체적인 연구 주제와 방향이 있어요."],
  },

  { type: "section", label: "실전 경험" },

  { id: "q5", type: "single", title: "Q5. 프로젝트 또는 대회 참여 경험은?", options: ["0회", "1~3회", "3~5회", "5~8회", "10회 이상"] },
  { id: "q6", type: "single", title: "Q6. 연구실 인턴 경험이 있나요?", options: ["없음", "3개월 이하", "3~6개월", "6개월~1년", "1년 이상"] },

  { type: "section", label: "논문 역량" },

  { id: "q7", type: "single", title: "Q7. 한 달에 논문을 몇 편 읽나요?", options: ["0회", "1~3회", "4~6회", "6~9회", "10회 이상"] },
  {
    id: "q8",
    type: "single",
    title: "Q8. 논문 이해 수준은?",
    options: ["거의 이해 못함", "요약만 가능", "대부분 이해", "정리 가능", "발표 가능"],
  },

  { type: "section", label: "대외 활동 (복수 선택)" },

  { id: "q9", type: "multi", title: "Q9. 준비된 항목 선택", options: ["없음", "자격증", "Notion", "CV", "영어 성적"] },
  { id: "q10", type: "multi", title: "Q10. 발표 경험", options: ["없음", "수업", "동아리", "교외", "학회"] },

  { type: "section", label: "학업 기반 역량" },

  { id: "q11", type: "single", title: "Q11. 수학 이해 수준", options: ["거의 모름", "수업 수준", "개념 이해", "응용 가능", "설명 가능"] },
  { id: "q12", type: "single", title: "Q12. 영어 논문 독해", options: ["불가", "부분 이해", "대략 이해", "문맥 이해", "완전 해석"] },
];

/* =========================================================
 *  선택지 컴포넌트 (커스텀 스타일)
 * =======================================================*/
function RadioOption({ name, label, selected, onSelect }: { name: string; label: string; selected: boolean; onSelect: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", border: `1.5px solid ${selected ? BRAND : "transparent"}`, background: selected ? BRAND_TINT : "transparent", transition: "0.15s", whiteSpace: "nowrap" }}>
      <input type="radio" name={name} checked={selected} onChange={onSelect} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${selected ? BRAND : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {selected && <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: BRAND }} />}
      </span>
      <span style={{ fontSize: "13.5px", color: selected ? BRAND : "#475569", fontWeight: selected ? 600 : 500 }}>{label}</span>
    </label>
  );
}

function CheckOption({ name, label, selected, onToggle }: { name: string; label: string; selected: boolean; onToggle: () => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: "9px", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", border: `1.5px solid ${selected ? BRAND : "transparent"}`, background: selected ? BRAND_TINT : "transparent", transition: "0.15s", whiteSpace: "nowrap" }}>
      <input type="checkbox" name={name} checked={selected} onChange={onToggle} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${selected ? BRAND : "#cbd5e1"}`, background: selected ? BRAND : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {selected && (
          <svg width="11" height="11" viewBox="0 0 12 12">
            <path d="M2 6 L5 9 L10 3" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: "13.5px", color: selected ? BRAND : "#475569", fontWeight: selected ? 600 : 500 }}>{label}</span>
    </label>
  );
}

function Chip({ label, selected, disabled, onToggle }: { label: string; selected: boolean; disabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      style={{
        padding: "8px 16px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: selected ? 700 : 500,
        cursor: disabled ? "not-allowed" : "pointer",
        border: `1.5px solid ${selected ? BRAND : "#cbd5e1"}`,
        background: selected ? BRAND : "#fff",
        color: selected ? "#fff" : "#475569",
        opacity: disabled ? 0.4 : 1,
        transition: "0.15s",
      }}
    >
      {label}
    </button>
  );
}

/* =========================================================
 *  선택지 레이아웃 (가운데 정렬)
 *  - Q1(8개): 4열 2행, 열 기준 채움 → 윗줄 1학기 / 아랫줄 2학기
 *  - 긴 문장형(Q3·Q4): 3열 균등
 *  - 짧은 보기: 가운데 모아서 flex 정렬
 * =======================================================*/
function OptionsField({
  q,
  answers,
  onSingle,
  onMulti,
}: {
  q: Extract<Question, { id: string }>;
  answers: Answers;
  onSingle: (qid: string, v: string) => void;
  onMulti: (qid: string, v: string) => void;
}) {
  const selectedArr = (answers[q.id] as string[]) || [];
  const maxLen = Math.max(...q.options.map((o) => o.length));

  const renderOpt = (opt: string) =>
    q.type === "multi" ? (
      <CheckOption key={opt} name={q.id} label={opt} selected={selectedArr.includes(opt)} onToggle={() => onMulti(q.id, opt)} />
    ) : (
      <RadioOption key={opt} name={q.id} label={opt} selected={answers[q.id] === opt} onSelect={() => onSingle(q.id, opt)} />
    );

  // Q1: 4열 2행, 열 단위로 채워서 학기별로 묶임
  if (q.options.length >= 8) {
    return (
      <div
        style={{
          display: "grid",
          gridAutoFlow: "column",
          gridTemplateRows: "repeat(2, auto)",
          gridTemplateColumns: `repeat(${Math.ceil(q.options.length / 2)}, max-content)`,
          justifyContent: "center",
          columnGap: "44px",
          rowGap: "4px",
        }}
      >
        {q.options.map(renderOpt)}
      </div>
    );
  }

  // 긴 문장형: 3열 균등 (카드 폭 활용)
  if (maxLen > 9) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: "12px", rowGap: "4px", justifyItems: "center" }}>
        {q.options.map(renderOpt)}
      </div>
    );
  }

  // 짧은 보기: 가운데 모아 정렬
  return <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 28px" }}>{q.options.map(renderOpt)}</div>;
}

export default function Roadmap() {
  const [answers, setAnswers] = useState<Answers>({});
  const navigate = useNavigate();

  const questionItems = questions.filter((q): q is Extract<Question, { id: string }> => "id" in q);
  const lastQuestionId = questionItems[questionItems.length - 1].id;

  const isAllAnswered = questions.every((q) => {
    if (!("id" in q)) return true;
    const val = answers[q.id];
    if (!val) return false;
    return Array.isArray(val) ? val.length > 0 : true;
  });

  const isAnswered = (idx: number) => {
    const q = questions[idx];
    if (!("id" in q)) return true;
    const val = answers[q.id];
    if (!val) return false;
    return Array.isArray(val) ? val.length > 0 : true;
  };

  const isEnabled = (idx: number) => {
    if (idx === 0) return true;
    let prev = idx - 1;
    while (questions[prev]?.type === "section") prev--;
    return isAnswered(prev);
  };

  const handleSingle = (qid: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  };

  const handleMulti = (qid: string, value: string) => {
    setAnswers((prev) => {
      const current = (prev[qid] as string[]) || [];
      if (current.includes(value)) {
        return { ...prev, [qid]: current.filter((v) => v !== value) };
      }
      if (value === EXCLUSIVE) {
        return { ...prev, [qid]: [EXCLUSIVE] };
      }
      const next = current.filter((v) => v !== EXCLUSIVE);
      if (qid === "q2" && next.length >= 3) return prev;
      return { ...prev, [qid]: [...next, value] };
    });
  };

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)" }}>
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "56px 48px 80px" }}>
        <div style={{ marginBottom: "56px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>내 로드맵, 지금 생성하기</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>전공·논문·준비 액션을 한 플랜으로 정리해드려요.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {questions.map((q, idx) => {
            if (q.type === "section") {
              return (
                <div key={idx} style={{ marginTop: "8px" }}>
                  <span style={{ display: "inline-block", background: BRAND, color: "#fff", padding: "6px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.3px" }}>{q.label}</span>
                </div>
              );
            }

            const enabled = isEnabled(idx);
            const selected = isAnswered(idx);
            const isLast = q.id === lastQuestionId;
            const selectedArr = (answers[q.id] as string[]) || [];

            return (
              <div key={q.id} style={{ display: "flex", gap: "14px", alignItems: "stretch" }}>
                {/* 타임라인 */}
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: selected ? BRAND : "#d1d5db", flexShrink: 0 }} />
                  {!isLast && <div style={{ width: "2px", flex: 1, background: selected ? BRAND : "#e5e7eb", marginTop: "6px", minHeight: "20px" }} />}
                </div>

                {/* 질문 카드 */}
                <div
                  style={{
                    width: "100%",
                    padding: "18px 22px",
                    borderRadius: "16px",
                    background: "#fff",
                    border: selected ? `2px solid ${BRAND}` : "1px solid #e5e7eb",
                    opacity: enabled ? 1 : 0.45,
                    pointerEvents: enabled ? "auto" : "none",
                    marginBottom: "4px",
                  }}
                >
                  <p style={{ fontWeight: 700, fontSize: "15px", color: "#1e293b", marginBottom: "14px", marginTop: 0 }}>{q.title}</p>

                  {q.id === "q2" ? (
                    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "10px" }}>
                      {q.options.map((opt) => {
                        const isSel = selectedArr.includes(opt);
                        return <Chip key={opt} label={opt} selected={isSel} disabled={!isSel && selectedArr.length >= 3} onToggle={() => handleMulti(q.id, opt)} />;
                      })}
                    </div>
                  ) : (
                    <OptionsField q={q} answers={answers} onSingle={handleSingle} onMulti={handleMulti} />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 제출 버튼 */}
        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <button
            disabled={!isAllAnswered}
            onClick={() => isAllAnswered && navigate("/roadmap-result", { state: answers })}
            style={{
              padding: "14px 32px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isAllAnswered ? "pointer" : "not-allowed",
              background: isAllAnswered ? BRAND : "#d1d5db",
              color: isAllAnswered ? "#fff" : "#6b7280",
              transition: "0.2s",
            }}
          >
            로드맵 생성하러 가기
          </button>
        </div>
      </div>
    </div>
  );
}