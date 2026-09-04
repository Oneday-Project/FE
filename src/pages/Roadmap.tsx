import { useEffect, useState } from "react";
import { pageContainer, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'
import { useNavigate, useLocation } from "react-router-dom";
import { createRoadmap, getMyRoadmap, updateRoadmap, type RoadmapPayload } from "../lib/roadmap";
import { getToken } from "../lib/auth";

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

/* 멀티 선택에서 배타 처리할 옵션들 ("없음" 계열 누르면 나머지 해제) */
const EXCLUSIVE_OPTIONS = ["없음", "아직 아무 것도 없어요"];

/* 질문 데이터 */
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
    options: ["SML", "ML", "CV", "NLP", "Robotics", "Retrieval AI", "SAP", "HCI", "Multimodal", "Code AI"],
  },

  { type: "section", label: "전공 및 연구 준비도" },

  {
    id: "q3",
    type: "single",
    title: "Q3. 선택한 관심 분야 중 가장 자신 있는 분야를 기준으로 현재 이해 수준은 어느 정도인가요?",
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

  { id: "q7", type: "single", title: "Q7. 한 달에 논문을 몇 편 정도 읽나요? (요약/정리 포함 여부 무관)", options: ["없음", "1~3편", "4~10편", "11~20편", "20편 이상"] },
  {
    id: "q8",
    type: "single",
    title: "Q8. 논문을 읽고 핵심 내용을 이해하는 수준은 어느 정도인가요?",
    options: ["거의 이해하지 못해요.", "요약만 이해할 수 있어요.", "거의 이해할 수 있어요.", "정리 및 요약이 가능해요.", "완벽히 이해하고 발표할 수 있어요."],
  },

  { type: "section", label: "대외 활동 (복수 선택)" },

  { id: "q9", type: "multi", title: "Q9. 대학원 진학을 위해 현재 준비된 항목을 모두 선택해 주세요.", options: ["아직 아무 것도 없어요", "GitHub 포트폴리오", "CV(이력서)", "연구·학습 기록용 Notion", "공인 영어 성적 (TOEIC, TOEFL, OPIC 등)"] },
  { id: "q10", type: "multi", title: "Q10. 기술 또는 연구 관련 발표 경험이 있나요?", options: ["없음", "수업 프로젝트 발표", "동아리/스터디 발표", "교내 학술 발표", "학회 발표"] },

  { type: "section", label: "학업 기반 역량" },

  { id: "q11", type: "single", title: "Q11. 수학/이론 이해 수준 정도가 어떻게 되나요?", options: ["거의 이해하지 못해요.", "수업을 수강한 정도예요.", "개념을 완벽히 이해했어요.", "개념을 응용할 수 있어요.", "증명 및 이론 설명이 자유롭게 가능해요."] },
  { id: "q12", type: "single", title: "Q12. 현재 누적 평점(GPA)은 어느 구간에 해당하나요?", options: ["2.5 미만", "2.5 이상 ~ 3.0 미만", "3.0 이상 ~ 3.5 미만", "3.5 이상 ~ 4.0 미만", "4.0 이상"] },
];

const questionItems = questions.filter((q): q is Extract<Question, { id: string }> => "id" in q);

// 백엔드 숫자 점수(0/2.5/5/7.5/10) → 화면에 표시할 문항 텍스트로 역변환
// buildPayload() 의 scoreOf() 와 반대 방향 (q12 는 gpaBand 로 저장되므로 호출부에서 qid만 다르게 넘김)
const optionOfScore = (qid: string, score: number): string => {
  const q = questionItems.find((item) => item.id === qid);
  const idx = Math.round(score / 2.5);
  return q?.options[idx] ?? "";
};

// GET /roadmap/me 의 latest.answers(RoadmapPayload) → 설문 화면 Answers 형태로 역변환 ("수정하러 가기" 초기값 채우기용)
function payloadToAnswers(payload: RoadmapPayload): Answers {
  return {
    q1: `${payload.year}학년 ${payload.semester}학기`,
    q2: payload.interestFields,
    q3: optionOfScore("q3", payload.q3),
    q4: optionOfScore("q4", payload.q4),
    q5: optionOfScore("q5", payload.q5),
    q6: optionOfScore("q6", payload.q6),
    q7: optionOfScore("q7", payload.q7),
    q8: optionOfScore("q8", payload.q8),
    q9: payload.q9,
    q10: payload.q10,
    q11: optionOfScore("q11", payload.q11),
    q12: optionOfScore("q12", payload.gpaBand),
  };
}

/* =========================================================
 *  선택지 컴포넌트 (커스텀 스타일)
 * =======================================================*/
function RadioOption({ name, label, selected, onSelect, align = "center" }: { name: string; label: string; selected: boolean; onSelect: () => void; align?: "center" | "start" }) {
  const wrap = align === "start";
  return (
    <label style={{ display: "flex", alignItems: wrap ? "flex-start" : "center", gap: "9px", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", border: `1.5px solid ${selected ? BRAND : "transparent"}`, background: selected ? BRAND_TINT : "transparent", transition: "0.15s", whiteSpace: wrap ? "normal" : "nowrap", width: wrap ? "100%" : undefined, boxSizing: "border-box" }}>
      <input type="radio" name={name} checked={selected} onChange={onSelect} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: "18px", height: "18px", borderRadius: "50%", border: `2px solid ${selected ? BRAND : "#cbd5e1"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: wrap ? "1px" : 0 }}>
        {selected && <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: BRAND }} />}
      </span>
      <span style={{ fontSize: "13.5px", color: selected ? BRAND : "#475569", fontWeight: selected ? 600 : 500 }}>{label}</span>
    </label>
  );
}

function CheckOption({ name, label, selected, onToggle, align = "center" }: { name: string; label: string; selected: boolean; onToggle: () => void; align?: "center" | "start" }) {
  const wrap = align === "start";
  return (
    <label style={{ display: "flex", alignItems: wrap ? "flex-start" : "center", gap: "9px", padding: "8px 12px", borderRadius: "10px", cursor: "pointer", border: `1.5px solid ${selected ? BRAND : "transparent"}`, background: selected ? BRAND_TINT : "transparent", transition: "0.15s", whiteSpace: wrap ? "normal" : "nowrap", width: wrap ? "100%" : undefined, boxSizing: "border-box" }}>
      <input type="checkbox" name={name} checked={selected} onChange={onToggle} style={{ position: "absolute", opacity: 0, width: 0, height: 0 }} />
      <span style={{ width: "18px", height: "18px", borderRadius: "5px", border: `2px solid ${selected ? BRAND : "#cbd5e1"}`, background: selected ? BRAND : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: wrap ? "1px" : 0 }}>
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
 *  - 긴 문장형(Q3·Q4 등): 3열 균등
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

  const renderOpt = (opt: string, align: "center" | "start" = "center") =>
    q.type === "multi" ? (
      <CheckOption key={opt} name={q.id} label={opt} selected={selectedArr.includes(opt)} onToggle={() => onMulti(q.id, opt)} align={align} />
    ) : (
      <RadioOption key={opt} name={q.id} label={opt} selected={answers[q.id] === opt} onSelect={() => onSingle(q.id, opt)} align={align} />
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
        {q.options.map((opt) => renderOpt(opt))}
      </div>
    );
  }

  // 긴 문장형: 3열 균등 (카드 폭 활용) — 열 너비에 맞춰 왼쪽 정렬해서 동그라미 위치를 줄마다 맞춤
  if (maxLen > 9) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", columnGap: "12px", rowGap: "4px", justifyItems: "stretch" }}>
        {q.options.map((opt) => renderOpt(opt, "start"))}
      </div>
    );
  }

  // 짧은 보기: 가운데 모아 정렬
  return <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "6px 28px" }}>{q.options.map((opt) => renderOpt(opt))}</div>;
}

function PreviewNotice() {
  return (
    <div style={{ display: "flex", borderLeft: `3px solid ${BRAND}`, padding: "2px 0 2px 16px", marginBottom: "32px" }}>
      <div>
        <p style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "14px", fontWeight: 700, color: BRAND, margin: "0 0 6px" }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 11v5.5M12 8v.01" />
          </svg>
          로드맵 생성 미리보기
        </p>
        <p style={{ fontSize: "13px", color: BRAND, lineHeight: 1.6, margin: 0 }}>
          아래 질문을 통해 로드맵 생성 과정을 미리 확인해보세요.
          <br />
          맞춤형 로드맵 생성은 로그인 후 이용할 수 있습니다.
        </p>
      </div>
    </div>
  );
}

export default function Roadmap() {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = !!location.state?.edit;
  const isLoggedIn = !!getToken();

  const [answers, setAnswers] = useState<Answers>({});
  // "수정하러 가기"로 들어오면(isEditMode) GET /roadmap/me 의 latest.answers 로 초기값을 채움
  const [loadingSaved, setLoadingSaved] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode) return;
    let cancelled = false;

    (async () => {
      try {
        const mine = await getMyRoadmap();
        if (cancelled) return;
        if (mine.hasRoadmap && mine.latest) {
          setAnswers(payloadToAnswers(mine.latest.answers));
        } else {
          setLoadError("불러올 로드맵이 없어요.");
        }
      } catch (e) {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "이전 답변을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoadingSaved(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // 최초 진입 시 한 번만 조회
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastQuestionId = questionItems[questionItems.length - 1].id;

  // 프론트 설문 답변(문자열 라벨) → 백엔드 AnalyzeRoadmapDto(숫자/코드) 변환
  // q3~q8·q11 은 옵션이 모두 5개(0/2.5/5/7.5/10 순)라 인덱스*2.5 로 바로 환산됨
  const buildPayload = (): RoadmapPayload => {
    const q1 = (answers.q1 as string) ?? "";
    const m = q1.match(/(\d)학년\s*(\d)학기/);

    const scoreOf = (qid: string) => {
      const q = questionItems.find((item) => item.id === qid);
      const idx = q ? q.options.indexOf(answers[qid] as string) : -1;
      return idx >= 0 ? idx * 2.5 : 0;
    };

    return {
      year: m ? Number(m[1]) : 1,
      semester: m ? Number(m[2]) : 1,
      interestFields: (answers.q2 as string[]) ?? [],
      q3: scoreOf("q3"),
      q4: scoreOf("q4"),
      q5: scoreOf("q5"),
      q6: scoreOf("q6"),
      q7: scoreOf("q7"),
      q8: scoreOf("q8"),
      q9: (answers.q9 as string[]) ?? [],
      q10: (answers.q10 as string[]) ?? [],
      q11: scoreOf("q11"),
      gpaBand: scoreOf("q12"),
    };
  };

  const handleSubmit = async () => {
    if (!isAllAnswered || submitting) return;
    setSubmitting(true);
    setSubmitError(null);

    const payload = buildPayload();

    try {
      if (isEditMode) {
        await updateRoadmap(payload);
      } else {
        try {
          await createRoadmap(payload);
        } catch (e) {
          // 이미 로드맵이 있으면(409) 수정으로 대체
          if ((e as { status?: number })?.status === 409) {
            await updateRoadmap(payload);
          } else {
            throw e;
          }
        }
      }

      localStorage.setItem("roadmapAnswers", JSON.stringify(answers));
      navigate("/roadmap-result", { state: answers });
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "로드맵 저장에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

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
      // "없음" 계열 선택 → 그것만 남김
      if (EXCLUSIVE_OPTIONS.includes(value)) {
        return { ...prev, [qid]: [value] };
      }
      // 일반 항목 선택 → "없음" 계열 제거
      const next = current.filter((v) => !EXCLUSIVE_OPTIONS.includes(v));
      // q2 는 최대 3개
      if (qid === "q2" && next.length >= 3) return prev;
      return { ...prev, [qid]: [...next, value] };
    });
  };

  const pageBg = { width: "100%", minHeight: "100vh" };

  if (loadingSaved) {
    return (
      <div style={{ ...pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "14px", color: "#64748b" }}>이전 답변을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={pageBg}>
      <div style={{ ...pageContainer, paddingTop: "72px", paddingBottom: "80px" }}>
        <div style={{ marginBottom: HERO_GAP }}>
          <h1 style={pageTitle}>내 로드맵, 지금 생성하기</h1>
          <p style={pageSubtitle}>전공·논문·준비 액션을 한 플랜으로 정리해드려요.</p>
          {loadError && <p style={{ fontSize: "13px", color: "#dc2626", marginTop: "8px" }}>{loadError}</p>}
        </div>

        {!isLoggedIn && <PreviewNotice />}

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
                    minHeight: "160px",
                    display: "flex",
                    flexDirection: "column",
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

                  {/* 보기 영역: 남은 공간 채우고 세로 가운데 정렬 → 카드 높이 통일 */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
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
              </div>
            );
          })}
        </div>

        {/* 제출 버튼 */}
        <div style={{ marginTop: "48px", textAlign: "center" }}>
          <button
            disabled={!isAllAnswered || submitting}
            onClick={handleSubmit}
            style={{
              padding: "14px 32px",
              borderRadius: "12px",
              border: "none",
              fontSize: "16px",
              fontWeight: 700,
              cursor: isAllAnswered && !submitting ? "pointer" : "not-allowed",
              background: isAllAnswered ? BRAND : "#d1d5db",
              color: isAllAnswered ? "#fff" : "#6b7280",
              transition: "0.2s",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? "저장하는 중..." : "로드맵 생성하러 가기"}
          </button>
          {submitError && (
            <p style={{ marginTop: "12px", fontSize: "13px", color: "#dc2626" }}>{submitError}</p>
          )}
        </div>
      </div>
    </div>
  );
}
