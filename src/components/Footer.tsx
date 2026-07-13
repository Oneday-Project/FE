import type { ReactNode } from "react";

const BRAND = "#00178E";

/* 팀 크레딧 컬럼 */
function CreditColumn({ icon, title, names }: { icon: ReactNode; title: string; names: string[] }) {
  return (
    <div style={{ minWidth: "120px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "18px" }}>
        <span style={{ fontSize: "15px", fontWeight: 700, color: BRAND }}>{title}</span>
        {icon}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {names.map((n) => (
          <span key={n} style={{ fontSize: "14px", color: "#475569" }}>{n}</span>
        ))}
      </div>
    </div>
  );
}

export default function Footer() {
  /* 아이콘 (작은 SVG) */
  const penIcon = (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4L18 10l-4-4L4 16v4z" stroke={BRAND} strokeWidth="2" strokeLinejoin="round" />
      <path d="M14 6l4 4" stroke={BRAND} strokeWidth="2" />
    </svg>
  );
  const codeIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" stroke={BRAND} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
  const dbIcon = (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="5" width="16" height="6" rx="1.5" stroke={BRAND} strokeWidth="2" />
      <rect x="4" y="13" width="16" height="6" rx="1.5" stroke={BRAND} strokeWidth="2" />
    </svg>
  );
  const mailIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2" stroke={BRAND} strokeWidth="1.8" />
      <path d="M4 7l8 6 8-6" stroke={BRAND} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
  const pinIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M12 21s7-6.5 7-11a7 7 0 10-14 0c0 4.5 7 11 7 11z" stroke={BRAND} strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.5" stroke={BRAND} strokeWidth="1.8" />
    </svg>
  );

  return (
    <footer style={{ width: "100%", background: "#fff", padding: "56px 80px 28px" }}>
      {/* 상단 */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>
        {/* 브랜드 */}
        <div style={{ flex: "1 1 300px", maxWidth: "360px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: 800, color: BRAND, margin: "0 0 14px", letterSpacing: "-0.5px" }}>onedayproject</h2>
          <p style={{ fontSize: "12.5px", color: "#3b4a8c", lineHeight: 1.6, margin: "0 0 18px" }}>
            H-AI Grad helps students discover papers, track reading progress, and build personalized graduate school roadmaps.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "30px", height: "30px", borderRadius: "7px", background: BRAND, color: "#fff", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>AI</span>
            <div style={{ fontSize: "11px", color: "#64748b", lineHeight: 1.4 }}>
              휴먼AI공학전공 2026 졸업프로젝트<br />
              Human-AI Engineering Major 2026 Graduation Project
            </div>
          </div>
        </div>

        {/* 팀 크레딧 */}
        <CreditColumn icon={penIcon} title="Design" names={["Yeongju Sim"]} />
        <CreditColumn icon={codeIcon} title="Front - End" names={["Heejung Jang", "Serih Yu"]} />
        <CreditColumn icon={dbIcon} title="Back - End" names={["Jungwoo Kim", "Yerin Song"]} />

        {/* 연락처 */}
        <div style={{ minWidth: "220px" }}>
          <div style={{ fontSize: "15px", fontWeight: 700, color: BRAND, marginBottom: "18px" }}>Contacts us</div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
            {mailIcon}
            <span style={{ fontSize: "13px", color: "#475569" }}>onedayproject179@gmail.com</span>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
            {pinIcon}
            <span style={{ fontSize: "13px", color: "#475569", lineHeight: 1.5 }}>
              20, Hongjimun 2-gil,<br />Jongno-gu, Seoul
            </span>
          </div>
        </div>
      </div>

      {/* 구분선 */}
      <div style={{ height: "1px", background: "#e5e7eb", margin: "40px 0 18px" }} />

      {/* 하단 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "#94a3b8", flexWrap: "wrap", gap: "8px" }}>
        <span>Copyright © 2026 oneday project</span>
        <span>All Rights Reserved</span>
      </div>
    </footer>
  );
}
