import { useEffect, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { pageContainer, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'
import { RadarChart } from "./RoadmapResult";
import ReadStatusTag from "../components/ReadStatusTag";
import { subscribeReadStatus, getReadStatusSnapshot, getReadingCalendar, type ReadingCalendar } from "../lib/readStatus";
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from "../lib/bookmarks";
import { getToken, fetchMe } from "../lib/auth";
import { getMyRoadmap, type MyRoadmap, type RoadmapAnalysis } from "../lib/roadmap";

const BRAND = "#00178E";

/* ── 미니 캘린더 ─────────────────────────────────────────
   reading = 읽는 중(연한 파랑), completed = 읽기 완료(진한 파랑)
   GET /papers/reading-status/calendar?year=&month= 로 달별 조회 (비로그인이면 호출 안 함) */
function MiniCalendar() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() }); // month: 0-based
  const [calendar, setCalendar] = useState<ReadingCalendar | null>(null);

  const { year, month } = cursor;

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    getReadingCalendar(year, month + 1) // API는 1~12월
      .then((res) => { if (!cancelled) setCalendar(res); })
      .catch(() => { if (!cancelled) setCalendar(null); });

    return () => { cancelled = true; };
  }, [year, month]);

  const dayStatus: Record<number, "reading" | "completed"> = {};
  calendar?.days.forEach((d) => {
    dayStatus[Number(d.date.slice(-2))] = d.status;
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay(); // 0=일
  const startOffset = (firstDay + 6) % 7; // 월요일 시작으로 보정

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const bgFor = (day: number | null) => {
    if (!day) return "transparent";
    const s = dayStatus[day];
    if (s === "completed") return "#7f9bec";
    if (s === "reading") return "#d3ddf9";
    return "#f1f5f9";
  };

  const goPrevMonth = () => setCursor(({ year: y, month: m }) => (m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }));
  const goNextMonth = () => setCursor(({ year: y, month: m }) => (m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }));

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", margin: "0 0 12px" }}>
        <MonthArrow direction="left" onClick={goPrevMonth} />
        <p style={{ fontSize: "14px", fontWeight: 700, color: "#334155", margin: 0, minWidth: "72px", textAlign: "center" }}>
          {year}.{String(month + 1).padStart(2, "0")}
        </p>
        <MonthArrow direction="right" onClick={goNextMonth} />
      </div>
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
              color: day && dayStatus[day] === "completed" ? "#fff" : "#94a3b8",
              fontWeight: day && dayStatus[day] ? 600 : 400,
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

      {/* 월간 기록 요약 */}
      <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "24px 0 14px" }}>월간 기록 요약</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <StatRow pillLabel="읽는 중" pillColor={STAT_GREEN} icon={<BookIcon color={STAT_GREEN} />} label="읽는 중" value={`${calendar?.readingCount ?? 0}편`} />
        <StatRow pillLabel="읽기 완료" pillColor={STAT_ORANGE} icon={<CheckIcon color={STAT_ORANGE} />} label="완독 논문" value={`${calendar?.completedCount ?? 0}편`} />
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "14px" }}>🔥🔥🔥</span>
          <span style={{ fontSize: "14px", color: "#475569" }}>연속 기록</span>
          <b style={{ marginLeft: "auto", fontSize: "16px", color: STAT_ORANGE }}>{calendar?.streak ?? 0}일</b>
        </div>
      </div>
    </div>
  );
}

function MonthArrow({ direction, onClick }: { direction: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={direction === "left" ? "이전 달" : "다음 달"}
      style={{
        width: "20px", height: "20px", flexShrink: 0,
        background: "none", border: "none", padding: 0,
        cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <svg
        width="14" height="14" viewBox="0 0 24 24" fill="none"
        stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

/* ── 기록 요약 통계 한 줄 ── */
const STAT_ORANGE = "#F59E0B";
const STAT_GREEN = "#00B454";

function StatRow({
  pillLabel,
  pillColor,
  icon,
  label,
  value,
}: {
  pillLabel: string;
  pillColor: string;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <span
        style={{
          display: "inline-flex", alignItems: "center", gap: "5px",
          height: "24px", padding: "0 11px", borderRadius: "999px",
          background: `${pillColor}1F`, color: pillColor,
          fontSize: "11px", fontWeight: 600, whiteSpace: "nowrap",
        }}
      >
        {icon} {pillLabel}
      </span>
      <span style={{ fontSize: "14px", color: "#475569" }}>{label}</span>
      <b style={{ marginLeft: "auto", fontSize: "16px", color: STAT_ORANGE }}>{value}</b>
    </div>
  );
}

function BookIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5V4.5z" />
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v5H6.5A2.5 2.5 0 0 1 4 19.5z" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <path d="M8 12.4l2.7 2.7L16 9.8" />
    </svg>
  );
}

/* ── 카드 안 배지 아이콘 (흰 원/사각 배지 위에 얹는 SVG) ── */
function PapersIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={BRAND} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5.3A2 2 0 0 1 6 3.3h5.3v17.4H6A2 2 0 0 1 4 18.7V5.3z" />
      <path d="M20 5.3a2 2 0 0 0-2-2h-5.3v17.4H18a2 2 0 0 0 2-2V5.3z" />
      <path d="M14.6 7.8h3.2M14.6 10.8h3.2M14.6 13.8h2" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8.5" stroke={BRAND} strokeWidth="1.7" />
      <path d="M12 3.5V12l7.3-3.6A8.5 8.5 0 0 0 12 3.5z" fill={BRAND} />
    </svg>
  );
}

function IconBadge({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        width: "52px", height: "52px", borderRadius: "15px",
        background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 14px rgba(15,23,42,0.10)", flexShrink: 0,
      }}
    >
      {children}
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
  icon: React.ReactNode;
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
        borderRadius: "20px",
        padding: "22px 60px 22px 24px",
        cursor: "pointer",
        transition: "0.15s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: "18px",
        minHeight: "128px",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 800, color: blue ? BRAND : "#1e293b", margin: "0 0 8px" }}>{title}</h3>
        <p style={{ fontSize: "12.5px", color: blue ? "#3b4a8c" : "#64748b", lineHeight: 1.5, margin: 0 }}>{subtitle}</p>
      </div>
      {/* 아이콘 배지 */}
      <IconBadge>{icon}</IconBadge>
      {/* 화살표 */}
      <div
        style={{
          position: "absolute", right: "18px", top: "50%", transform: "translateY(-50%)",
          width: "34px", height: "34px", borderRadius: "50%",
          background: "#fff", boxShadow: "0 2px 8px rgba(15,23,42,0.10)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: BRAND,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

/* ── My 로드맵 요약 섹션 ──
   저장된 로드맵 답변을 기반으로 방사형+점수 요약을 보여주고,
   "자세히 보기" 누르면 결과 페이지로(저장된 답 넘겨서) 이동 */
const RADAR_AXES: { key: keyof RoadmapAnalysis["radar"]; label: string }[] = [
  { key: "preparation", label: "이해도" },
  { key: "experience", label: "경험" },
  { key: "paper", label: "논문 루틴" },
  { key: "interest", label: "관심 분야" },
  { key: "academic", label: "학업" },
];

function MyRoadmapSection() {
  const navigate = useNavigate();
  const [myRoadmap, setMyRoadmap] = useState<MyRoadmap | null>(null);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    getMyRoadmap()
      .then((res) => { if (!cancelled) setMyRoadmap(res); })
      .catch(() => { /* 못 불러오면 섹션 자체를 숨김 */ });

    return () => { cancelled = true; };
  }, []);

  // 비로그인, 또는 아직 만든 로드맵이 없으면 섹션 자체를 안 보여줌
  if (!myRoadmap?.hasRoadmap || !myRoadmap.latest) return null;

  const { result } = myRoadmap.latest;
  const tags = result.overview.interestFields ?? [];
  const axes = RADAR_AXES.map((a) => ({ label: a.label, v: result.radar[a.key] }));
  const strong = axes.reduce((a, b) => (b.v > a.v ? b : a));
  const weak = axes.reduce((a, b) => (b.v < a.v ? b : a));

  return (
    <section style={{ marginTop: "64px" }}>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "36px 40px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
        <h2 style={{ fontSize: "22px", fontWeight: 800, color: BRAND, margin: "0 0 8px" }}>My 로드맵</h2>
        <p style={{ fontSize: "14px", color: "#475569", margin: "0 0 28px" }}>현재 준비 상태를 확인하고, 관심 분야에 맞는 전공 과목과 논문 추천을 받아보세요.</p>

        <div style={{ display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
          <div style={{ flex: "0 0 280px", display: "flex", justifyContent: "center" }}>
            <RadarChart values={axes.map((a) => a.v)} labels={axes.map((a) => a.label)} max={10} />
          </div>

          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "16px" }}>
              <span style={{ fontSize: "16px", color: "#475569" }}>종합 점수</span>
              <b style={{ fontSize: "34px", color: BRAND, lineHeight: 1 }}>{result.overview.totalScore}점</b>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", color: "#64748b", marginRight: "2px" }}>관심 분야</span>
              {tags.map((tag) => (
                <span key={tag} style={{ padding: "5px 14px", borderRadius: "999px", fontSize: "13px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600 }}>{tag}</span>
              ))}
            </div>
            <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7, margin: "0 0 24px" }}>
              현재 준비도는 <b style={{ color: BRAND }}>{result.overview.totalScore}점</b>이에요.<br />
              강점은 <b>{strong.label}</b> 영역이고,<br />
              다음 단계로는 <b>{weak.label}</b>을(를) 먼저 보완하면 좋아요.
            </p>

            <div style={{ textAlign: "right" }}>
              <button
                onClick={() => navigate("/roadmap-result")}
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

/* ── 이어서 읽어볼까요? — 읽는 중인 논문 캐러셀 ──
   논문 상세에서 '읽는 중'으로 표시한 논문이 여기에 모임 (lib/readStatus)
   한 번에 3개씩, 좌우 화살표로 넘김 */
const CARDS_PER_PAGE = 3;

function ContinueReadingSection() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const bookmarks = useSyncExternalStore(subscribeBookmarks, getBookmarksSnapshot);
  const readMap = useSyncExternalStore(subscribeReadStatus, getReadStatusSnapshot);
  const reading = Object.values(readMap)
    .filter((entry) => entry.status === "reading")
    .sort((a, b) => b.savedAt.localeCompare(a.savedAt));

  const pageCount = Math.max(1, Math.ceil(reading.length / CARDS_PER_PAGE));
  const current = Math.min(page, pageCount - 1);
  const shown = reading.slice(current * CARDS_PER_PAGE, current * CARDS_PER_PAGE + CARDS_PER_PAGE);

  return (
    <section style={{ marginTop: "64px" }}>
      <h2 style={{ fontSize: "22px", fontWeight: 800, color: BRAND, margin: "0 0 20px" }}>이어서 읽어볼까요?</h2>

      {reading.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "24px", padding: "48px 40px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)", textAlign: "center" }}>
          <p style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", margin: "0 0 6px" }}>아직 읽는 중인 논문이 없어요.</p>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>논문 상세 페이지에서 “읽는 중”을 누르면 여기에 모여요.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <CarouselArrow direction="left" disabled={current === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} />

            <div style={{ flex: 1, minWidth: 0, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {shown.map(({ paper, status }) => (
                <div
                  key={paper.arxivId}
                  onClick={() => navigate(`/papers?paper=${encodeURIComponent(paper.arxivId)}`)}
                  style={{
                    background: "#fff", borderRadius: "14px", padding: "16px",
                    boxShadow: "0 2px 12px rgba(15,23,42,0.07)", border: "1px solid #f0f0f0",
                    height: "196px",
                    display: "flex", flexDirection: "column", gap: "8px",
                    cursor: "pointer", transition: "box-shadow 0.2s, transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 24px rgba(0,23,142,0.13)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(15,23,42,0.07)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                  }}
                >
                  {/* 상태 태그(없으면 빈 자리) + 북마크 */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <ReadStatusTag status={status} />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        void toggleBookmark(paper);
                      }}
                      aria-label="북마크"
                      style={{ background: "none", border: "none", padding: 0, cursor: "pointer", lineHeight: 0 }}
                    >
                      <BookmarkIcon filled={!!bookmarks[paper.arxivId]} />
                    </button>
                  </div>

                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>{paper.publishedDate?.slice(0, 4) ?? ""}</span>

                  <p style={{
                    fontSize: "13px", fontWeight: 700, color: "#0f172a", lineHeight: 1.5, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {paper.title}
                  </p>

                  <div style={{ height: "1px", background: "rgba(60,60,67,0.25)" }} />

                  <p style={{
                    flex: 1, minHeight: 0,
                    fontSize: "11px", color: "#64748b", lineHeight: 1.5, margin: 0,
                    display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
                  }}>
                    {paper.abstract}
                  </p>

                  <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                    {paper.fields.slice(0, 3).map((field) => (
                      <span key={field} style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "999px", border: `1px solid ${BRAND}`, color: BRAND }}>
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* 3개 미만이면 자리 유지 */}
              {Array.from({ length: CARDS_PER_PAGE - shown.length }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
            </div>

            <CarouselArrow direction="right" disabled={current >= pageCount - 1} onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} />
          </div>

          <div style={{ textAlign: "right", marginTop: "20px" }}>
            <button
              onClick={() => navigate("/mypage")}
              style={{ padding: "12px 24px", background: "#7f9bec", color: "#fff", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
            >
              읽는 중인 논문 전체보기 &gt;
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="13" height="18" viewBox="0 0 22 31" fill="none">
      <path
        d="M1 3a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v26l-10-7-10 7V3z"
        fill={filled ? "#3B82F6" : "none"}
        stroke={filled ? "#3B82F6" : "rgba(60,60,67,0.4)"}
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarouselArrow({ direction, disabled, onClick }: { direction: "left" | "right"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={direction === "left" ? "이전" : "다음"}
      style={{
        width: "24px", height: "48px", flexShrink: 0,
        background: "none", border: "none", padding: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.25 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "opacity 0.15s",
      }}
    >
      <svg
        width="20" height="20" viewBox="0 0 24 24" fill="none"
        stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{ transform: direction === "right" ? "rotate(180deg)" : undefined }}
      >
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </button>
  );
}

/* ── 메인 페이지 ── */
export default function Main() {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState("");

  useEffect(() => {
    fetchMe().then((me) => setNickname(me?.nickname ?? ""));
  }, []);

  return (
    <div style={{ ...pageContainer, paddingTop: "72px", paddingBottom: "56px" }}>
      {/* 인사말 */}
      <div style={{ marginBottom: HERO_GAP }}>
        <h1 style={pageTitle}>안녕하세요, {nickname || "회원"}님!</h1>
        <p style={pageSubtitle}>관심 분야 논문을 읽고, 나만의 대학원 진학 로드맵을 완성해보세요.</p>
      </div>

      {/* 흰 박스 */}
      <div style={{ background: "#fff", borderRadius: "24px", padding: "34px 36px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)", display: "flex", gap: "32px", flexWrap: "wrap" }}>
        {/* 왼쪽: 캘린더 + 기록 요약 */}
        <div style={{ flex: "1 1 320px" }}>
          <MiniCalendar />
        </div>

        {/* 오른쪽: 이동 카드 2개 (파란 카드 위쪽에 붙는 볼록 원 장식 — 호버 시 카드와 같이 움직임) */}
        <div style={{ flex: "1 1 320px", display: "flex", flexDirection: "column", gap: "28px" }}>
          <NavCard
            variant="gray"
            title="내 관심 분야 논문, 한눈에"
            subtitle="관심 분야별 최신 논문을 모아보고 기록을 관리하세요."
            icon={<PapersIcon />}
            onClick={() => navigate("/papers")}
          />
          <NavCard
            variant="blue"
            title="나에게 맞는 대학원 준비 로드맵"
            subtitle="진로 준비 상태를 확인하고, 관심 분야에 맞는 전공·과목과 논문 추천을 받아보세요."
            icon={<RoadmapIcon />}
            onClick={() => navigate("/roadmap")}
          />
        </div>
      </div>

      {/* 이어서 읽어볼까요? — 읽는 중인 논문 캐러셀 */}
      <ContinueReadingSection />


      {/* My 로드맵 요약 */}
      <MyRoadmapSection />
    </div>
  );
}
