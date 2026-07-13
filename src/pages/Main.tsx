import { useNavigate } from "react-router-dom";
import { RadarChart } from "./RoadmapResult";
import { calculateScores } from "./roadmapScore";   

const BRAND = "#00178E";

/* 임시 사용자 (백엔드 연동 시 교체) */
const userName = "wnnye";

/* ── 미니 캘린더 ─────────────────────────────────────────
   reading = 읽는 중(연한 파랑), done = 읽기 완료(진한 파랑)
   실제로는 백엔드에서 "날짜별 활동" 받아서 activity 로 넣으면 됨 */
type Activity = "reading" | "done";
const mockActivity: Record<number, Activity> = {
  3: "done", 4: "done", 5: "reading",
  10: "done", 11: "done", 12: "reading", 13: "reading",
  18: "reading", 19: "done", 20: "reading",
  24: "reading", 25: "reading",
};

function MiniCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const startOffset = (firstDay + 6) % 7; // 월요일 시작으로 보정

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const bgFor = (day: number | null) => {
    if (!day) return "transparent";
    const a = mockActivity[day];
    if (a === "done") return "#7f9bec";
    if (a === "reading") return "#d3ddf9";
    return "#f1f5f9";
  };

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div>
      <p style={{ textAlign: "center", fontSize: "14px", fontWeight: 700, color: "#334155", margin: "0 0 12px" }}>
        {year}.{String(month + 1).padStart(2, "0")}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "6px" }}>
        {weekdays.map((w) => (
          <div key={w} style={{ textAlign: "center", fontSize: "10px", fontWeight: 600, color: "#94a3b8", marginBottom: "2px" }}>{w}</div>
        ))}
        {cells.map((day, i) => (
          <div
            key={i}
            style={{
              aspectRatio: "1 / 1",
              borderRadius: "6px",
              background: bgFor(day),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "10px",
              color: day && mockActivity[day] === "done" ? "#fff" : "#94a3b8",
              fontWeight: day && mockActivity[day] ? 600 : 400,
            }}
          >
            {day ?? ""}
          </div>
        ))}
      </div>
      {/* 범례 */}
      <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontSize: "11px", color: "#64748b" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#d3ddf9" }} /> 읽는 중
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#7f9bec" }} /> 읽기 완료
        </span>
      </div>
    </div>
  );
}

/* ── 기록 요약 통계 한 줄 ── */
function StatRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span style={{ fontSize: "16px", width: "22px", textAlign: "center" }}>{icon}</span>
      <span style={{ fontSize: "14px", color: "#475569" }}>{label}</span>
      <b style={{ marginLeft: "auto", fontSize: "16px", color: BRAND }}>{value}</b>
    </div>
  );
}

/* ── 오른쪽 이동 카드 ── */
function NavCard({
  title,
  subtitle,
  icon,
  variant,
  onClick,
}: {
  title: string;
  subtitle: string;
  icon: string;
  variant: "gray" | "blue";
  onClick: () => void;
}) {
  const blue = variant === "blue";
  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        flex: 1,
        background: blue ? "#dbe4fb" : "#eef1f5",
        borderRadius: "18px",
        padding: "22px 24px",
        cursor: "pointer",
        overflow: "hidden",
        transition: "0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ paddingRight: "36px" }}>
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: blue ? BRAND : "#1e293b", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: "12.5px", color: blue ? "#3b4a8c" : "#64748b", lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
      </div>
      {/* 아이콘 */}
      <div style={{ position: "absolute", right: "48px", bottom: "14px", fontSize: "34px", opacity: 0.9 }}>{icon}</div>
      {/* 화살표 */}
      <div style={{ position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)", color: blue ? BRAND : "#94a3b8" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── My 로드맵 요약 섹션 ──
   저장된 로드맵 답변을 기반으로 방사형+점수 요약을 보여주고,
   "자세히 보기" 누르면 결과 페이지로(저장된 답 넘겨서) 이동 */
function MyRoadmapSection() {
  const navigate = useNavigate();

  const saved = (() => {
    try {
      const s = localStorage.getItem("roadmapAnswers");
      return s ? (JSON.parse(s) as Record<string, string | string[]>) : null;
    } catch {
      return null;
    }
  })();

  // 아직 로드맵을 안 만든 경우 → 안내
  if (!saved) {
    return (
      <section style={{ marginTop: "64px" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: BRAND, margin: "0 0 8px" }}>My 로드맵</h2>
        <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 20px" }}>현재 준비 상태를 확인하고, 관심 분야에 맞는 전공 과목과 논문 추천을 받아보세요.</p>
        <div style={{ background: "#fff", borderRadius: "20px", padding: "48px", textAlign: "center", boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
          <p style={{ fontSize: "15px", color: "#64748b", margin: "0 0 18px" }}>아직 생성된 로드맵이 없어요. 지금 만들어볼까요?</p>
          <button
            onClick={() => navigate("/roadmap")}
            style={{ padding: "12px 24px", background: BRAND, color: "#fff", border: "none", borderRadius: "10px", fontSize: "15px", fontWeight: 700, cursor: "pointer" }}
          >
            로드맵 만들러 가기
          </button>
        </div>
      </section>
    );
  }

  const scores = calculateScores(saved);
  const tags = Array.isArray(saved.q2) ? saved.q2 : [];
  const axes = [
    { label: "이해도", v: scores.prep },
    { label: "경험", v: scores.exp },
    { label: "논문 루틴", v: scores.paper },
    { label: "포트폴리오", v: scores.portfolio },
    { label: "성적", v: scores.study },
  ];
  const strong = axes.reduce((a, b) => (b.v > a.v ? b : a));
  const weak = axes.reduce((a, b) => (b.v < a.v ? b : a));

  return (
    <section style={{ marginTop: "64px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "36px 40px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: BRAND, margin: "0 0 8px" }}>My 로드맵</h2>
        <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 28px" }}>현재 준비 상태를 확인하고, 관심 분야에 맞는 전공 과목과 논문 추천을 받아보세요.</p>

        <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 280px", display: "flex", justifyContent: "center" }}>
            <RadarChart values={axes.map((a) => a.v)} labels={axes.map((a) => a.label)} max={20} />
          </div>

          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", color: "#475569" }}>종합 점수</span>
              <b style={{ fontSize: "34px", color: BRAND, lineHeight: 1 }}>{scores.total}점</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", color: "#64748b", marginRight: "2px" }}>관심 분야</span>
              {tags.map((tag) => (
                <span key={tag} style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "13px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>
              현재 준비도는 <b style={{ color: BRAND }}>{scores.total}점</b>이에요.<br />
              강점은 <b>{strong.label}</b> 영역이고,<br />
              다음 단계로는 <b>{weak.label}</b>을(를) 먼저 보완하면 좋아요.
            </p>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => navigate("/roadmap-result", { state: saved })}
                style={{ padding: "12px 24px", background: "#7f9bec", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
              >
                내 로드맵 자세히 보기 &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── 메인 페이지 ── */
export default function Main() {
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "56px 48px" }}>
      {/* 인사말 */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 800, color: "#0f172a", margin: "0 0 6px" }}>안녕하세요, {userName}님!</h1>
        <p style={{ fontSize: "15px", color: "#475569", margin: 0 }}>관심 분야 논문을 읽고, 나만의 대학원 진학 로드맵을 완성해보세요.</p>
      </div>

      {/* 흰 박스 */}
      <div style={{ background: "#fff", borderRadius: "24px", padding: "34px 36px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)", display: "flex", gap: "32px", flexWrap: "wrap" }}>
        {/* 왼쪽: 캘린더 + 기록 요약 */}
        <div style={{ flex: "1 1 320px" }}>
          <MiniCalendar />
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "24px 0 14px" }}>월간 기록 요약</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <StatRow icon="📖" label="읽는 중" value="5편" />
            <StatRow icon="✅" label="완독 논문" value="5편" />
            <StatRow icon="🔥" label="연속 기록" value="6일" />
          </div>
        </div>

        {/* 오른쪽: 이동 카드 2개 */}
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <NavCard
            variant="gray"
            title="내 관심 분야 논문, 한눈에"
            subtitle="관심 분야별 최신 논문을 모아보고 기록을 관리하세요."
            icon="📄"
            onClick={() => navigate("/papers")}
          />
          <NavCard
            variant="blue"
            title="나에게 맞는 대학원 준비 로드맵"
            subtitle="진로 준비 상태를 확인하고, 관심 분야에 맞는 전공·과목과 논문 추천을 받아보세요."
            icon="📊"
            onClick={() => navigate("/roadmap")}
          />
        </div>
      </div>

      {/* 이어서 읽어볼까요? 논문 캐러셀 — 팀원 컴포넌트 자리 (추후 삽입) */}

      {/* My 로드맵 요약 */}
      <MyRoadmapSection />
    </div>
  );
}
