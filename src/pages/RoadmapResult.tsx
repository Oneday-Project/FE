import { useEffect, useState, type ReactNode, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMe } from "../lib/auth";
import { getMyRoadmap, getMajorCourses, type RoadmapAnalysis, type MajorCoursesResponse, type MajorCourse } from "../lib/roadmap";

/* =========================================================
 *  대표색 (앞으로 색 바꿀 땐 여기 두 줄만 수정하면 됨)
 * =======================================================*/
const BRAND = "#00178E";
const BRAND_FILL = "rgba(0,23,142,0.22)";

/* =========================================================
 *  방사형 그래프
 *  - 라벨을 각도 기반으로 자동 정렬(start/middle/end) → 잘림 없앰
 *  - requestAnimationFrame 으로 0→1 보간 → scale 꼼수 제거
 *  - Main.tsx(메인페이지 My 로드맵 요약)도 이 컴포넌트를 그대로 가져다 씀
 * =======================================================*/
export function RadarChart({
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

/* 방사형 축 — 백엔드 radar 응답 키 순서 고정 (preparation/experience/paper/interest/academic) */
const RADAR_AXES: { key: keyof RoadmapAnalysis["radar"]; label: string }[] = [
  { key: "preparation", label: "이해도" },
  { key: "experience", label: "경험" },
  { key: "paper", label: "논문 루틴" },
  { key: "interest", label: "관심 분야" },
  { key: "academic", label: "학업" },
];

/* 성장 가이드 "현재 상태" 카드용 — 답변의 숫자 점수(0/2.5/5/7.5/10)를 설문 문구로 역변환
   Roadmap.tsx 의 q5·q7 보기와 동일한 순서 */
const Q5_LABELS = ["0회", "1~3회", "3~5회", "5~8회", "10회 이상"];
const Q7_LABELS = ["없음", "1~3편", "4~10편", "11~20편", "20편 이상"];
const labelOf = (labels: string[], score: unknown) => {
  if (typeof score !== "number") return "-";
  return labels[Math.round(score / 2.5)] ?? "-";
};

/* 과목 칩 — 호버 시 description 말풍선 (추천/일반 상관없이 표시) */
function CourseChip({ course }: { course: MajorCourse }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position: "relative", width: "fit-content" }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      {hover && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 9px)",
            left: "50%",
            transform: "translateX(-50%)",
            width: "max-content",
            maxWidth: "260px",
            background: "#fff",
            border: "1px solid #e2e8f0",
            boxShadow: "0 8px 22px rgba(15,23,42,0.14)",
            borderRadius: "10px",
            padding: "10px 14px",
            fontSize: "12px",
            lineHeight: 1.5,
            color: "#475569",
            zIndex: 30,
          }}
        >
          {course.description}
          {/* 말풍선 꼬리 */}
          <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid #fff", filter: "drop-shadow(0 2px 1px rgba(15,23,42,0.06))" }} />
        </div>
      )}
      <div
        style={{
          padding: "9px 14px",
          borderRadius: "6px 18px 6px 6px",
          fontSize: "12px",
          fontWeight: course.recommended ? 700 : 600,
          whiteSpace: "nowrap",
          cursor: "default",
          color: course.recommended ? "#fff" : "#475569",
          background: course.recommended
            ? "linear-gradient(145deg, #2a45ad 0%, #00178E 58%)"
            : "linear-gradient(145deg, #eef1f6 0%, #e2e8f0 60%)",
          boxShadow: course.recommended
            ? "0 4px 14px rgba(0,23,142,0.30), inset 0 1px 0 rgba(255,255,255,0.22)"
            : "0 2px 6px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.7)",
        }}
      >
        {course.name}
      </div>
    </div>
  );
}

const pageBg = { width: "100%", minHeight: "100vh", background: "linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)" };

/* =========================================================
 *  결과 페이지 — GET /roadmap/me + GET /roadmap/major-courses 로 조회
 * =======================================================*/
export default function RoadmapResult() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nickname, setNickname] = useState("");
  const [analysis, setAnalysis] = useState<RoadmapAnalysis | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);
  const [majorCourses, setMajorCourses] = useState<MajorCoursesResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const [me, mine, majors] = await Promise.all([
          fetchMe(),
          getMyRoadmap(),
          getMajorCourses().catch(() => null), // 전공 로드맵은 부가 정보 — 실패해도 나머지는 보여줌
        ]);
        if (cancelled) return;

        if (!mine.hasRoadmap || !mine.latest) {
          setError("아직 생성된 로드맵이 없어요.");
          return;
        }

        setNickname(me?.nickname ?? "");
        setAnalysis(mine.latest.result);
        setAnswers(mine.latest.answers);
        setMajorCourses(majors);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "로드맵을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div style={{ ...pageBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontSize: "14px", color: "#64748b" }}>불러오는 중...</p>
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div style={{ ...pageBg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px" }}>
        <p style={{ fontSize: "14px", color: "#64748b" }}>{error ?? "로드맵을 불러오지 못했습니다."}</p>
        <button
          onClick={() => navigate("/roadmap")}
          style={{ padding: "12px 24px", background: BRAND, color: "#fff", border: "none", borderRadius: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
        >
          로드맵 만들러 가기
        </button>
      </div>
    );
  }

  const tags = analysis.overview.interestFields ?? [];
  const paperFreq = labelOf(Q7_LABELS, answers?.q7);
  const extracurricular = labelOf(Q5_LABELS, answers?.q5);
  const commentLines = analysis.overview.comment.split("\n");

  return (
    <div style={pageBg}>
      <div style={{ maxWidth: "980px", margin: "0 auto", padding: "56px 48px 90px" }}>
        {/* 헤더 */}
        <div style={{ marginBottom: "56px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: 0 }}>
            {nickname ? `${nickname}님의 로드맵 결과입니다.` : "로드맵 결과입니다."}
          </h1>
          <p style={{ fontSize: "14px", color: "#6b7280", marginTop: "8px" }}>전공·논문·준비 액션을 한 플랜으로 정리해드려요.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "44px" }}>
          {/* ── 종합 코멘트 ── */}
          <SectionCard label="종합 코멘트">
            <div style={{ display: "flex", alignItems: "center", gap: "28px", flexWrap: "wrap" }}>
              <div style={{ flex: "0 0 280px", display: "flex", justifyContent: "center" }}>
                <RadarChart values={RADAR_AXES.map((a) => analysis.radar[a.key])} labels={RADAR_AXES.map((a) => a.label)} max={10} />
              </div>
              <div style={{ width: "1px", alignSelf: "stretch", background: "#e5e7eb" }} />
              <div style={{ flex: 1, minWidth: "260px" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "15px", color: "#475569" }}>종합 점수</span>
                  <b style={{ fontSize: "34px", color: BRAND, lineHeight: 1 }}>{analysis.overview.totalScore}점</b>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "13px", color: "#64748b", marginRight: "2px" }}>관심 분야</span>
                  {tags.map((tag) => (
                    <span key={tag} style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "13px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600 }}>{tag}</span>
                  ))}
                </div>
                <p style={{ fontSize: "13.5px", color: "#475569", lineHeight: 1.7, margin: 0 }}>
                  {commentLines.map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < commentLines.length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </SectionCard>

          {/* ── 전공 로드맵 ── */}
          <SectionCard label="전공 로드맵">
            <p style={sectionDesc}>관심 분야에 따라 추천된 전공 과목 내역입니다.</p>
            {majorCourses && majorCourses.years.length > 0 ? (
              <>
                <div style={{ display: "flex", gap: "20px" }}>
                  {majorCourses.years.map((yearGroup) => (
                    <div key={yearGroup.year} style={{ flex: 1 }}>
                      <div style={{ border: "1px solid #cbd5e1", borderRadius: "8px", textAlign: "center", padding: "8px 0", fontSize: "13px", fontWeight: 700, color: "#334155", marginBottom: "10px" }}>{yearGroup.year}학년</div>
                      <div style={{ display: "flex" }}>
                        {yearGroup.semesters.map((s) => (
                          <div key={s.semester} style={{ flex: 1, textAlign: "center", fontSize: "12px", color: "#94a3b8", fontWeight: 600 }}>{s.semester}학기</div>
                        ))}
                      </div>
                      <div style={{ height: "1px", background: "#e5e7eb", margin: "8px 0 14px" }} />
                      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                        {yearGroup.semesters.map((s) => (
                          <div key={s.semester} style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px", alignItems: "flex-start" }}>
                            {s.courses.map((c) => (
                              <CourseChip key={c.courseId} course={c} />
                            ))}
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
                    <span style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#e2e8f0", display: "inline-block" }} /> 일반 과목
                  </span>
                  <span style={{ color: "#94a3b8" }}>· 과목에 마우스를 올리면 설명이 표시됩니다</span>
                </div>
              </>
            ) : (
              <p style={{ fontSize: "13px", color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>전공 로드맵을 불러오지 못했어요.</p>
            )}
          </SectionCard>

          {/* ── 논문 로드맵 (추천 데이터는 백엔드 준비 중 — 관심 분야 태그만 우선 표시) ── */}
          <SectionCard label="논문 로드맵">
            <p style={sectionDesc}>선택한 관심 분야에 대한 핵심 논문 추천 결과입니다.</p>
            <div style={{ display: "flex", gap: "24px" }}>
              {[0, 1, 2].map((i) => {
                const tag = tags[i];

                if (!tag) {
                  return (
                    <div key={i} style={{ flex: 1, paddingLeft: "16px", borderLeft: "3px solid #c7d2fe", display: "flex", flexDirection: "column", minHeight: "200px" }}>
                      <span style={{ alignSelf: "flex-start", padding: "4px 16px", borderRadius: "999px", fontSize: "13px", border: "1.5px dashed #cbd5e1", color: "#cbd5e1", fontWeight: 700, marginBottom: "12px" }}>-</span>
                      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img src="/logo.svg" alt="" style={{ height: "30px", opacity: 0.2 }} />
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={i} style={{ flex: 1, paddingLeft: "16px", borderLeft: `3px solid ${BRAND}`, display: "flex", flexDirection: "column", minHeight: "200px" }}>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "999px", fontSize: "12px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 700, marginBottom: "12px" }}>{tag}</span>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
                      <p style={{ fontSize: "12.5px", color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>
                        추천 논문을 준비하고 있어요.<br />곧 만나보실 수 있어요!
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* ── 성장 가이드 (Tip 은 백엔드 준비 중 — 현재 상태 카드만 실데이터) ── */}
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
              <div style={{ flex: 1, minWidth: "280px", background: "#f5f8ff", border: `1.5px solid ${BRAND}`, borderRadius: "14px", padding: "20px 22px", display: "flex", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "13px", color: "#475569", lineHeight: 1.7 }}>
                  <span style={{ color: "#ef4444", border: "1.5px solid #ef4444", borderRadius: "6px", padding: "1px 7px", fontSize: "12px", marginRight: "8px" }}>Tip!</span>
                  맞춤 성장 가이드를 준비하고 있어요. 곧 만나보실 수 있어요!
                </p>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
