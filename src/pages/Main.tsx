import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useNavigate } from "react-router-dom";
import { pageContainer, pageTitle, pageSubtitle, HERO_GAP, INK_80 } from '../styles/pageTheme'
import { RadarChart } from "./RoadmapResult";
import ReadStatusTag from "../components/ReadStatusTag";
import { subscribeReadStatus, getReadStatusSnapshot, getReadingCalendar, type ReadingCalendar } from "../lib/readStatus";
import { subscribeBookmarks, getBookmarksSnapshot, toggleBookmark } from "../lib/bookmarks";
import { getToken, fetchMe } from "../lib/auth";
import { getMyRoadmap, type MyRoadmap, type RoadmapAnalysis } from "../lib/roadmap";
import { askChatbot, type ChatHistoryItem } from "../lib/chatbot";

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

  const iconFor = (day: number | null) => {
    if (!day) return undefined;
    const s = dayStatus[day];
    if (s === "completed") return "/calendar_done.svg";
    if (s === "reading") return "/calendar_reading.svg";
    return "/calendar_none.svg";
  };

  const goPrevMonth = () => setCursor(({ year: y, month: m }) => (m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }));
  const goNextMonth = () => setCursor(({ year: y, month: m }) => (m === 11 ? { year: y + 1, month: 0 } : { year: y, month: m + 1 }));

  const weekdays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "nowrap" }}>
      {/* 달력 — 이 카드의 메인 요소라 통계보다 넓게(약 7:3) */}
      <div style={{ flex: "7 1 0%", minWidth: "220px" }}>
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
                backgroundImage: day ? `url(${iconFor(day)})` : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
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
        <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "12px", fontSize: "13px", color: "#64748b" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            읽는 중 <span style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundImage: "url(/calendar_reading.svg)", backgroundSize: "cover", backgroundPosition: "center" }} />
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
            읽기 완료 <span style={{ width: "14px", height: "14px", borderRadius: "50%", backgroundImage: "url(/calendar_done.svg)", backgroundSize: "cover", backgroundPosition: "center" }} />
          </span>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ width: "1px", alignSelf: "stretch", background: "#e5e7eb" }} />

      {/* 읽는 중 / 읽기 완료 / 연속 기록 — 달력 옆에 나란히 */}
      <div style={{ flex: "3 1 0%", minWidth: "90px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "18px" }}>
        <StatRow pillLabel="읽는 중" pillColor={STAT_GREEN} icon={<BookIcon color={STAT_GREEN} />} label="읽는 중" value={`${calendar?.readingCount ?? 0}편`} />
        <StatRow pillLabel="읽기 완료" pillColor={STAT_ORANGE} icon={<CheckIcon color={STAT_ORANGE} />} label="완독 논문" value={`${calendar?.completedCount ?? 0}편`} />
        <div>
          <span style={{ fontSize: "14px" }}>🔥🔥🔥</span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "6px" }}>
            <span style={{ fontSize: "14px", color: "#475569" }}>연속 기록</span>
            <b style={{ fontSize: "16px", color: STAT_ORANGE }}>{calendar?.streak ?? 0}일</b>
          </div>
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
    <div>
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
      <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "6px" }}>
        <span style={{ fontSize: "14px", color: "#475569" }}>{label}</span>
        <b style={{ fontSize: "16px", color: STAT_ORANGE }}>{value}</b>
      </div>
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

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 19V5M6 11l6-6 6 6" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── "나의 대학원 준비 현황" 카드 공용 틀 ── */
function SummaryCard({
  icon,
  title,
  onClick,
  flex = "1 1 320px",
  children,
}: {
  icon: React.ReactNode;
  title: string;
  onClick?: () => void;
  flex?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        flex,
        background: "#fff",
        borderRadius: "24px",
        padding: "28px 30px",
        border: "1px solid #eef1f5",
        cursor: onClick ? "pointer" : "default",
        transition: "0.15s",
      }}
      onMouseEnter={onClick ? (e) => (e.currentTarget.style.transform = "translateY(-2px)") : undefined}
      onMouseLeave={onClick ? (e) => (e.currentTarget.style.transform = "translateY(0)") : undefined}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "22px" }}>
        {icon}
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#1e293b", margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ── 인사말 아래 학기 + 관심분야 태그 줄 (로드맵 만든 적 있을 때만) ── */
function RoadmapInfoRow({ year, semester, tags }: { year: number; semester: number; tags: string[] }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: HERO_GAP }}>
      <img src="/main_semester_icon.svg" alt="" width={25} height={25} />
      <span style={{ fontSize: "14px", fontWeight: 400, color: INK_80 }}>{year}학년 {semester}학기</span>
      <span style={{ width: "1px", height: "14px", background: "rgba(60,60,67,0.25)" }} />
      <span style={{ fontSize: "14px", fontWeight: 400, color: INK_80 }}>관심 분야</span>
      {tags.map((tag) => (
        <span key={tag} style={{ padding: "3px 11px", borderRadius: "999px", fontSize: "11px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600 }}>
          {tag}
        </span>
      ))}
    </div>
  );
}

/* ── H-AI에게 물어보기 — POST /chatbot/ask 연동 (로그인 필요, 서버는 대화를 저장 안 해서 history 를 매번 같이 보냄) ── */
const ASK_SUGGESTIONS = ["CV 입문 논문 추천해줘", "대학원 준비는 언제부터 시작하면 좋을까?", "관심 분야를 어떻게 정하면 좋을까?"];

// 답변 글자를 한 번에 몇 자씩, 몇 ms 간격으로 보여줄지 — ChatGPT처럼 타이핑되는 느낌을 흉내냄
// (백엔드가 스트리밍 API가 아니라 완성된 답변을 한 번에 주기 때문에, 받은 다음 프론트에서 재생함)
const TYPE_CHARS_PER_TICK = 2;
const TYPE_INTERVAL_MS = 18;

function AskHaiSection() {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [typingText, setTypingText] = useState<string | null>(null); // null = 타이핑 중 아님
  const [error, setError] = useState<string | null>(null);
  const typingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearInterval(typingTimer.current);
    };
  }, []);

  const playTyping = (fullText: string) => {
    let shown = 0;
    setTypingText("");
    typingTimer.current = setInterval(() => {
      shown += TYPE_CHARS_PER_TICK;
      if (shown >= fullText.length) {
        if (typingTimer.current) clearInterval(typingTimer.current);
        typingTimer.current = null;
        setTypingText(null);
        setMessages((prev) => [...prev, { role: "assistant", content: fullText }]);
        return;
      }
      setTypingText(fullText.slice(0, shown));
    }, TYPE_INTERVAL_MS);
  };

  const busy = loading || typingText !== null;

  const handleSend = async () => {
    const question = text.trim();
    if (!question || busy) return;

    if (!getToken()) {
      setError("로그인 후 이용할 수 있어요.");
      return;
    }

    setError(null);
    const history = messages;
    setMessages([...history, { role: "user", content: question }]);
    setText("");
    setLoading(true);

    try {
      const res = await askChatbot(question, history);
      setLoading(false);
      playTyping(res.answer);
    } catch (e) {
      setLoading(false);
      setError(e instanceof Error ? e.message : "답변을 받아오지 못했어요.");
    }
  };

  return (
    <section style={{ marginBottom: "56px", textAlign: "center" }}>
      <h2 style={{ margin: "0 0 20px", textAlign: "center" }}>
        <img src="/main_ask_hai_title.svg" alt="H-AI에게 물어보기" height={52} style={{ display: "inline-block" }} />
      </h2>
      <div style={{ background: "#fff", borderRadius: "24px", padding: "32px 36px", boxShadow: "0 12px 40px rgba(15,23,42,0.06)" }}>
        {messages.length > 0 ? (
          <div style={{ marginBottom: "18px" }}>
            <img src="/logo.svg" alt="" style={{ height: "26px", width: "auto" }} />
          </div>
        ) : (
          <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.6, margin: "0 0 18px", textAlign: "left" }}>
            대학원 진학, 논문, 연구 분야에 대해<br />궁금한 점을 자유롭게 질문해보세요.
          </p>
        )}

        {messages.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px", maxHeight: "340px", overflowY: "auto", padding: "2px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                    background: m.role === "user" ? BRAND : "#f1f5f9",
                    color: m.role === "user" ? "#fff" : "#1e293b",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={{ padding: "10px 14px", borderRadius: "14px", background: "#f1f5f9", color: "#94a3b8", fontSize: "13px" }}>
                  답변을 준비하고 있어요...
                </div>
              </div>
            )}
            {typingText !== null && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    maxWidth: "80%",
                    padding: "10px 14px",
                    borderRadius: "14px",
                    fontSize: "13.5px",
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    textAlign: "left",
                    background: "#f1f5f9",
                    color: "#1e293b",
                  }}
                >
                  {typingText}
                  <span style={{ display: "inline-block", width: "2px", height: "13px", background: "#94a3b8", marginLeft: "2px", verticalAlign: "-2px" }} />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-start", gap: "8px", marginBottom: "20px" }}>
            {ASK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setText(s)}
                style={{ padding: "8px 14px", borderRadius: "999px", border: "1px solid #e2e8f0", background: "#f8fafc", color: "#475569", fontSize: "12.5px", cursor: "pointer" }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {error && <p style={{ fontSize: "12.5px", color: "#ef4444", textAlign: "left", margin: "0 0 10px" }}>{error}</p>}

        <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "#f8fafc", borderRadius: "14px", padding: "8px 8px 8px 18px" }}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
            placeholder="질문을 입력해주세요."
            style={{ flex: 1, border: "none", background: "transparent", outline: "none", fontSize: "13.5px", color: "#1e293b" }}
          />
          <button
            onClick={handleSend}
            disabled={busy || !text.trim()}
            aria-label="질문 보내기"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: BRAND, border: "none", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: busy || !text.trim() ? "not-allowed" : "pointer", opacity: busy || !text.trim() ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </section>
  );
}

/* ── 다음 준비를 이어가보세요 — 다른 기능으로 이동하는 카드 3개 ── */
function NextStepCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: React.ReactNode; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        flex: "1 1 220px",
        background: "#fff",
        borderRadius: "18px",
        padding: "22px 24px",
        boxShadow: "0 4px 16px rgba(15,23,42,0.05)",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        cursor: "pointer",
        transition: "0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
      onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <h4 style={{ fontSize: "17px", fontWeight: 700, color: "#1e293b", margin: "0 0 4px" }}>{title}</h4>
        <p style={{ fontSize: "14px", color: "#64748b", lineHeight: 1.5, margin: 0 }}>{desc}</p>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="#94a3b8" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

/* ── "나의 대학원 준비 현황" 오른쪽 카드 — 저장된 로드맵의 방사형+점수+태그를 요약해서 보여줌
   로드맵이 없으면 만들러 가기 CTA 를 같은 카드 자리에 표시 (레이아웃이 비어 보이지 않게) */
const RADAR_AXES: { key: keyof RoadmapAnalysis["radar"]; label: string }[] = [
  { key: "interest", label: "이해도" },
  { key: "experience", label: "경험" },
  { key: "paper", label: "논문 루틴" },
  { key: "preparation", label: "포트폴리오" },
  { key: "academic", label: "성적" },
];

function MyRoadmapCard({ myRoadmap }: { myRoadmap: MyRoadmap | null }) {
  const navigate = useNavigate();

  if (!myRoadmap?.hasRoadmap || !myRoadmap.latest) {
    return (
      <SummaryCard icon={<img src="/main_roadmap_icon.svg" alt="" width={28} height={28} style={{ filter: "drop-shadow(0 4px 8px rgba(15,23,42,0.15))" }} />} title="내 로드맵" flex="1 1 300px">
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: "13px", color: "#94a3b8", margin: "0 0 16px" }}>아직 생성된 로드맵이 없어요.</p>
          <button
            onClick={() => navigate("/roadmap")}
            style={{ padding: "10px 22px", background: BRAND, color: "#fff", border: "none", borderRadius: "10px", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
          >
            로드맵 만들러 가기
          </button>
        </div>
      </SummaryCard>
    );
  }

  const { result } = myRoadmap.latest;
  const tags = result.overview.interestFields ?? [];
  const axes = RADAR_AXES.map((a) => ({ label: a.label, v: result.radar[a.key] }));

  return (
    <SummaryCard icon={<img src="/main_roadmap_icon.svg" alt="" width={28} height={28} style={{ filter: "drop-shadow(0 4px 8px rgba(15,23,42,0.15))" }} />} title="내 로드맵" flex="1 1 300px" onClick={() => navigate("/roadmap-result")}>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <RadarChart values={axes.map((a) => a.v)} labels={axes.map((a) => a.label)} max={10} />
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginTop: "14px", flexWrap: "nowrap" }}>
        <div style={{ flexShrink: 0, marginLeft: "10px" }}>
          <b style={{ fontSize: "26px", color: BRAND }}>{result.overview.totalScore}점</b>
          <span style={{ fontSize: "14px", color: BRAND, fontWeight: 600 }}>/100</span>
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "5px", flexWrap: "nowrap", minWidth: 0 }}>
          {tags.map((tag) => (
            <span key={tag} style={{ padding: "3px 9px", borderRadius: "999px", fontSize: "10.5px", border: `1.5px solid ${BRAND}`, color: BRAND, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>{tag}</span>
          ))}
        </div>
      </div>
    </SummaryCard>
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
      <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>이어서 읽어볼까요?</h2>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", margin: "0 0 20px" }}>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>읽는 중인 논문을 이어서 확인해보세요.</p>
        {reading.length > 0 && (
          <button
            onClick={() => navigate("/mypage")}
            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", fontSize: "13px", fontWeight: 600, color: BRAND, whiteSpace: "nowrap" }}
          >
            읽는 중인 논문 전체보기 →
          </button>
        )}
      </div>

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
        width: "32px", height: "52px", flexShrink: 0,
        background: "none", border: "none", padding: 0,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.25 : 1,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "opacity 0.15s",
      }}
    >
      <svg
        width="28" height="28" viewBox="0 0 24 24" fill="none"
        stroke="#1e293b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
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
  // 페이지 하단 카드에서 이동할 때, 이동한 페이지도 스크롤이 아래쪽에서 시작되는 걸 막기 위해 맨 위로 올리고 이동
  const goToTop = (path: string) => {
    window.scrollTo(0, 0);
    navigate(path);
  };
  const [nickname, setNickname] = useState("");

  const [myRoadmap, setMyRoadmap] = useState<MyRoadmap | null>(null);

  useEffect(() => {
    fetchMe().then((me) => setNickname(me?.nickname ?? ""));
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;

    getMyRoadmap()
      .then((res) => { if (!cancelled) setMyRoadmap(res); })
      .catch(() => { /* 조회 실패해도 카드 쪽 빈 상태로 자연스럽게 처리됨 */ });

    return () => { cancelled = true; };
  }, []);

  const latestAnswers = myRoadmap?.hasRoadmap ? myRoadmap.latest?.answers : undefined;
  const latestTags = myRoadmap?.hasRoadmap ? myRoadmap.latest?.result.overview.interestFields ?? [] : [];

  return (
    <div style={{ ...pageContainer, paddingTop: "72px", paddingBottom: "160px" }}>
      {/* 인사말 */}
      <div style={{ marginBottom: latestAnswers ? "16px" : HERO_GAP }}>
        <h1 style={{ ...pageTitle, fontWeight: 400 }}>안녕하세요, {nickname || "회원"}님!</h1>
        <p style={pageSubtitle}>오늘 필요한 대학원 준비를 이어가보세요.</p>
      </div>

      {/* 학기 + 관심 분야 태그 — 로드맵을 만든 적 있을 때만 */}
      {latestAnswers && (
        <RoadmapInfoRow year={latestAnswers.year} semester={latestAnswers.semester} tags={latestTags} />
      )}

      {/* H-AI에게 물어보기 */}
      <AskHaiSection />

      {/* 나의 대학원 준비 현황 — 박스는 그대로 두고, 화면 좌우 끝까지 흰 배경이 꽉 차게(풀블리드) 깔고
          그 안에서 본문 내용만 다시 pageContainer 폭으로 가운데 정렬 */}
      <section style={{ marginBottom: "20px", background: "#fff", padding: "32px 0", width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
        <div style={pageContainer}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>나의 대학원 준비 현황</h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>논문 활동과 로드맵을 한눈에 확인해보세요.</p>
          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
            <SummaryCard icon={<img src="/main_papers_icon.svg" alt="" width={28} height={28} style={{ filter: "drop-shadow(0 4px 8px rgba(15,23,42,0.15))" }} />} title="이번 달 논문 활동" flex="1.6 1 420px">
              <MiniCalendar />
            </SummaryCard>
            <MyRoadmapCard myRoadmap={myRoadmap} />
          </div>
        </div>
      </section>

      {/* 이어서 읽어볼까요? — 읽는 중인 논문 캐러셀 */}
      <ContinueReadingSection />

      {/* 다음 준비를 이어가보세요 — 풀블리드 흰 배경 (푸터도 흰색이라, Main 루트의 paddingBottom 이
          이 섹션과 푸터 사이에 하늘색 여백으로 남아서 둘이 바로 안 붙어 보이게 함) */}
      <section style={{ marginTop: "64px", background: "#fff", padding: "32px 0", width: "100vw", marginLeft: "calc(50% - 50vw)", marginRight: "calc(50% - 50vw)" }}>
        <div style={pageContainer}>
          <h2 style={{ fontSize: "22px", fontWeight: 600, color: "#1e293b", margin: "0 0 4px" }}>다음 준비를 이어가보세요</h2>
          <p style={{ fontSize: "14px", color: "#64748b", margin: "0 0 24px" }}>더 많은 기능으로 대학원 준비를 체계적으로.</p>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
            <NextStepCard icon={<img src="/main_explore_icon.svg" alt="" width={56} height={56} />} title="논문 탐색하기" desc="관심 분야의 최신 논문을 찾아보세요." onClick={() => goToTop("/papers")} />
            <NextStepCard icon={<img src="/main_community_icon.svg" alt="" width={56} height={56} />} title="커뮤니티 둘러보기" desc={<>다른 사람들의 경험과<br />정보를 만나보세요.</>} onClick={() => goToTop("/community")} />
            <NextStepCard icon={<img src="/main_myroadmap_icon.svg" alt="" width={56} height={56} />} title="내 로드맵 확인하기" desc={<>현재 준비 상태와 다음<br />단계를 확인하세요.</>} onClick={() => goToTop("/roadmap")} />
          </div>
        </div>
      </section>
    </div>
  );
}
