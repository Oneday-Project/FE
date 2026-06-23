import { useLocation } from "react-router-dom";
import { useEffect, useState, type ReactNode, type CSSProperties } from "react";

/* =========================================================
 *  대표색 (앞으로 색 바꿀 땐 여기 두 줄만 수정하면 됨)
 * =======================================================*/
const BRAND = "#00178E";
const BRAND_FILL = "rgba(0,81,215,0.22)";

/* 타입 */
type Answers = {
  [key: string]: string | string[];
};

/* =========================================================
 *  점수 계산 (기존 로직 유지, 맵 타입만 안전하게 보강)
 * =======================================================*/
function calculateScores(answers: Answers) {
  const safe = (v: number | undefined) => v || 0;
  const pick = (map: Record<string, number>, key: unknown) =>
    safe(map[key as string]);

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

  const q7Map: Record<string, number> = { "0회": 0, "1~3회": 2.5, "4~6회": 5, "6~9회": 7.5, "10회 이상": 10 };
  const q8Map: Record<string, number> = {
    "거의 이해 못함": 0, "요약만 가능": 2.5, "대부분 이해": 5, "정리 가능": 7.5, "발표 가능": 10,
  };
  const paper = pick(q7Map, answers.q7) + pick(q8Map, answers.q8);

  const q9Count = Array.isArray(answers.q9) ? answers.q9.length : 0;
  const q10Count = Array.isArray(answers.q10) ? answers.q10.length : 0;
  const portfolio = Math.min((q9Count + q10Count) * 2.5, 20);

  const q11Map: Record<string, number> = {
    "거의 모름": 0, "수업 수준": 2.5, "개념 이해": 5, "응용 가능": 7.5, "설명 가능": 10,
  };
  const q12Map: Record<string, number> = {
    "불가": 0, "부분 이해": 2.5, "대략 이해": 5, "문맥 이해": 7.5, "완전 해석": 10,
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

/* =========================================================
 *  방사형 그래프
 *  - 라벨을 각도 기반으로 자동 정렬(start/middle/end) → 잘림 없앰
 *  - requestAnimationFrame 으로 0→1 보간 → scale 꼼수 제거
 * =======================================================*/
function RadarChart({
  values,
  labels,
  max = 20,
}: {
  values: number[];
  labels: string[];
  max?: number;
}) {
  const size = 280;
  const center = size / 2;
  const radius = 92;
  const rings = [0.25, 0.5, 0.75, 1];
  const [t, setT] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const dur = 700;
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      setT(1 - Math.pow(1 - p, 3)); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // values 가 매 렌더 새 배열이어도 재실행 안 되도록 문자열 키로 비교
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.join(",")]);

  const angleFor = (i: number) => (Math.PI * 2 * i) / values.length - Math.PI / 2;
  const point = (i: number, r: number): [number, number] => [
    center + r * Math.cos(angleFor(i)),
    center + r * Math.sin(angleFor(i)),
  ];
  const ring = (frac: number) =>
    values.map((_, i) => point(i, radius * frac).join(",")).join(" ");

  const clamp = (v: number) => Math.max(0, Math.min(v, max));
  const dataPoints = values
    .map((v, i) => point(i, (clamp(v) / max) * radius * t).join(","))
    .join(" ");

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="역량 방사형 그래프">
      {/* 동심 오각형 */}
      {rings.map((f, idx) => (
        <polygon
          key={f}
          points={ring(f)}
          fill="none"
          stroke={idx === rings.length - 1 ? "#94a3b8" : "#cbd5e1"}
          strokeWidth={idx === rings.length - 1 ? 1.5 : 1}
          strokeDasharray={idx === rings.length - 1 ? "0" : "4 6"}
        />
      ))}
      {/* 축 스포크 */}
      {values.map((_, i) => {
        const [x, y] = point(i, radius);
        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />;
      })}
      {/* 데이터 영역 */}
      <polygon points={dataPoints} fill={BRAND_FILL} stroke={BRAND} strokeWidth="2.5" strokeLinejoin="round" />
      {/* 꼭짓점 */}
      {values.map((v, i) => {
        const [x, y] = point(i, (clamp(v) / max) * radius * t);
        return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={BRAND} strokeWidth="2.5" />;
      })}
      {/* 라벨 (위치 기반 자동 정렬) */}
      {labels.map((label, i) => {
        const [lx, ly] = point(i, radius + 22);
        const c = Math.cos(angleFor(i));
        const anchor = Math.abs(c) < 0.3 ? "middle" : c > 0 ? "start" : "end";
        return (
          <text key={label} x={lx} y={ly} textAnchor={anchor} dominantBaseline="middle" fontSize="13" fontWeight="600" fill="#475569">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* 섹션 카드 (배지 라벨 + 테두리) — 4번 반복되던 박스 공통화 */
function SectionCard({ label, children, style }: { label: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div style={{ position: "relative", border: `2px solid ${BRAND}`, borderRadius: "20px", padding: "30px 28px 28px", background: "#fff", ...style }}>
      <div style={{ position: "absolute", top: "-14px", left: "20px", background: BRAND, color: "#fff", padding: "6px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700, letterSpacing: "0.3px" }}>
        {label}
      </div>
      {children}
    </div>
  );
}

const sectionDesc: CSSProperties = { fontSize: "14px", fontWeight: 600, color: "#334155", marginBottom: "22px" };

/* =========================================================
 *  mock 데이터 (← 추후 백엔드 추천 API 응답으로 교체)
 * =======================================================*/
type Course = { n: string; hot?: boolean };
type YearPlan = { year: number; terms: { term: number; courses: Course[] }[] };

const majorRoadmap: YearPlan[] = [
  {
    year: 1,
    terms: [
      { term: 1, courses: [{ n: "프로그래밍 기초" }, { n: "미적분학" }, { n: "일반물리" }] },
      { term: 2, courses: [{ n: "파이썬", hot: true }, { n: "이산수학" }, { n: "C언어" }, { n: "확률통계", hot: true }] },
    ],
  },
  {
    year: 2,
    terms: [
      { term: 1, courses: [{ n: "객체지향프로그래밍", hot: true }, { n: "선형대수학", hot: true }, { n: "자료구조", hot: true }, { n: "인터랙션디자인" }, { n: "컴퓨팅로직설계" }] },
      { term: 2, courses: [{ n: "알고리즘", hot: true }, { n: "운영체제" }, { n: "데이터베이스" }, { n: "컴퓨터구조" }] },
    ],
  },
  {
    year: 3,
    terms: [
      { term: 1, courses: [{ n: "머신러닝", hot: true }, { n: "컴퓨터비전", hot: true }, { n: "신호처리" }] },
      { term: 2, courses: [{ n: "딥러닝", hot: true }, { n: "자연어처리", hot: true }, { n: "캡스톤설계" }] },
    ],
  },
];

type Paper = { year: number; title: string; desc: string };
const paperRoadmap: Paper[] = [
  { year: 2025, title: "Leveraging Recent Advances in Deep Learning for Audio-Visual Emotion Recognition", desc: "오디오(음성)와 비디오(얼굴) 특징을 딥러닝으로 추출해 결합하고, 시간 흐름(LSTM)까지 반영해 감정의 valence/arousal을 예측하는 멀티모달 감정인식 논문." },
  { year: 2024, title: "Scaling Instruction-Tuned Language Models for Reasoning Tasks", desc: "지시 튜닝과 사고 사슬(chain-of-thought)을 결합해, 모델 크기 대비 추론 성능을 끌어올리는 방법을 다룬 논문." },
  { year: 2025, title: "Bridging Vision and Language with Unified Contrastive Pretraining", desc: "이미지와 텍스트를 하나의 임베딩 공간에서 정렬하는 대조 학습으로, 제로샷 분류·검색 성능을 높인 멀티모달 사전학습 논문." },
];

/* =========================================================
 *  결과 페이지
 * =======================================================*/
export default function RoadmapResult() {
  const location = useLocation();
  const answers: Answers = location.state?.answers || location.state || {};

  const scores = calculateScores(answers);
  const tags = Array.isArray(answers.q2) ? answers.q2 : [];

  /* 방사형 축 (값 + 라벨). ⚠ '성적' 축은 실제로 Q11 수학 + Q12 영어 합산값.
     라벨 의미를 '학업'으로 바꾸거나, 학점을 따로 입력받는 방안 검토 권장 */
  const axes = [
    { label: "이해도", v: scores.prep },
    { label: "경험", v: scores.exp },
    { label: "논문 루틴", v: scores.paper },
    { label: "포트폴리오", v: scores.portfolio },
    { label: "성적", v: scores.study },
  ];
  const strong = axes.reduce((a, b) => (b.v > a.v ? b : a));
  const weak = axes.reduce((a, b) => (b.v < a.v ? b : a));

  /* 성장 가이드용 현재 상태 (설문 답변 그대로 사용) */
  const paperFreq = (answers.q7 as string) || "-";
  const extracurricular = (answers.q5 as string) || "-";

  return (
    <div style={{ width: "100%", minHeight: "100vh", background: "linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)" }}>
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "56px 48px 90px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "56px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>wnnye님의 로드맵 결과입니다.</h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>전공·논문·준비 액션을 한 플랜으로 정리해드려요.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "44px" }}>
          {/* ── 종합 코멘트 ── */}
          <SectionCard label="종합 코멘트">
            <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 280px", display: "flex", justifyContent: "center" }}>
                <RadarChart values={axes.map((a) => a.v)} labels={axes.map((a) => a.label)} max={20} />
              </div>
              <div style={{ width: "1px", alignSelf: "stretch", background: "#e5e7eb" }} />
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "15px", color: "#475569" }}>종합 점수</span>
                  <b style={{ fontSize: "34px", color: BRAND, lineHeight: 1 }}>{scores.total}점</b>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", marginRight: "2px" }}>관심 분야</span>
                  {tags.map((tag) => (
                    <span key={tag} style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "13px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
                <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  현재 준비도는 <b style={{ color: BRAND }}>{scores.total}점</b>이에요.<br />
                  강점은 <b>{strong.label}</b> 영역이고,<br />
                  다음 단계로는 <b>{weak.label}</b>을(를) 먼저 보완하면 좋아요.
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── 전공 로드맵 ── */}
          <SectionCard label="전공 로드맵">
            <p style={sectionDesc}>관심 분야에 따라 추천된 전공 과목 내역입니다.</p>
            <div style={{ display: "flex", gap: "20px" }}>
              {majorRoadmap.map((y) => (
                <div key={y.year} style={{ flex: 1 }}>
                  <div style={{ background: "#eef2ff", color: BRAND, borderRadius: "8px", textAlign: "center", padding: "7px 0", fontSize: "13px", fontWeight: 700, marginBottom: "12px" }}>{y.year}학년</div>
                  <div style={{ display: "flex", gap: "10px" }}>
                    {y.terms.map((term) => (
                      <div key={term.term} style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", marginBottom: "8px", fontWeight: 600 }}>{term.term}학기</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {term.courses.map((c) => (
                            <div
                              key={c.n}
                              title={c.n}
                              style={{
                                padding: "8px 6px",
                                borderRadius: "8px",
                                textAlign: "center",
                                fontSize: "11.5px",
                                fontWeight: c.hot ? 700 : 500,
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                background: c.hot ? BRAND : "#f1f5f9",
                                color: c.hot ? "#fff" : "#64748b",
                                border: c.hot ? "none" : "1px solid #e2e8f0",
                              }}
                            >
                              {c.n}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "18px", fontSize: "12px", color: "#64748b" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: BRAND, display: "inline-block" }} /> 추천 과목
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#f1f5f9", border: "1px solid #e2e8f0", display: "inline-block" }} /> 일반 과목
              </span>
            </div>
          </SectionCard>

          {/* ── 논문 로드맵 ── */}
          <SectionCard label="논문 로드맵">
            <p style={sectionDesc}>선택한 관심 분야에 대한 핵심 논문 추천 결과입니다.</p>
            <div style={{ display: "flex", gap: "24px" }}>
              {paperRoadmap.map((p, i) => (
                <div key={i} style={{ flex: 1, paddingLeft: "16px", borderLeft: `3px solid ${BRAND}` }}>
                  {tags[i] && (
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 700, marginBottom: "12px" }}>{tags[i]}</span>
                  )}
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "0 0 4px" }}>{p.year}</p>
                  <p style={{ fontSize: "13px", fontWeight: 700, lineHeight: 1.35, color: "#1e293b", margin: "0 0 10px" }}>{p.title}</p>
                  <div style={{ height: "1px", background: "#e5e7eb", margin: "0 0 10px" }} />
                  <p style={{ fontSize: "11.5px", color: "#64748b", lineHeight: 1.55, margin: 0 }}>{p.desc}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 성장 가이드 (신규) ── */}
          <SectionCard label="성장 가이드">
            <div style={{ display: "flex", alignItems: "stretch", gap: "18px", flexWrap: "wrap" }}>
              {/* 현재 상태 카드 2개 */}
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: "0 0 200px" }}>
                <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>📑 현재 논문 역량</p>
                  <b style={{ fontSize: "24px", color: "#0f172a" }}>월 {paperFreq}</b>
                </div>
                <div style={{ border: "1.5px solid #e2e8f0", borderRadius: "14px", padding: "16px 18px", textAlign: "center" }}>
                  <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 8px" }}>🏆 현재 대외 경험</p>
                  <b style={{ fontSize: "24px", color: "#0f172a" }}>{extracurricular}</b>
                </div>
              </div>
              {/* 셰브론 */}
              <div style={{ display: "flex", alignItems: "center" }}>
                <svg width="40" height="44" viewBox="0 0 40 44" fill="none">
                  <path d="M6 6 L20 22 L6 38" stroke="#c7d2fe" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20 6 L34 22 L20 38" stroke="#a5b4fc" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              {/* Tip 박스 */}
              <div style={{ flex: 1, minWidth: "280px", background: "#f5f8ff", border: `1.5px solid ${BRAND}`, borderRadius: "14px", padding: "20px 22px" }}>
                <p style={{ margin: "0 0 14px", fontSize: "14px", fontWeight: 700, color: "#1e293b" }}>
                  <span style={{ color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: "6px", padding: "1px 7px", fontSize: "12px", marginRight: "8px" }}>Tip!</span>
                  앞으로 이렇게 해보는 건 어떨까요?
                </p>
                <ol style={{ margin: 0, paddingLeft: "18px", fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
                  <li>논문 읽기 횟수를 유지하되, <b style={{ color: BRAND }}>이해하고 정리할 수 있는 수준</b>으로 학습해보세요.</li>
                  <li>관심 있는 분야에 초점을 맞춰 <b style={{ color: BRAND }}>다양한 형태의 대외 활동</b>을 꾸준히 진행해보세요.</li>
                </ol>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}