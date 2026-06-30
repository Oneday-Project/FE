/* pages/About.tsx
 * 소개 페이지 — 내용은 자유롭게 채우면 됨.
 * App.tsx 의 Navbar/Footer 레이아웃 안에 들어가고,
 * 바깥 div 에 이미 그라데이션 배경이 있어서 여기선 배경을 따로 깔지 않음.
 */
const BRAND = "#00178E";

export default function About() {
  return (
    <div style={{ position: "relative", width: "100%", maxWidth: "960px", margin: "0 auto", padding: "80px 48px" }}>
      {/* 헤더 */}
      <h1 style={{ fontSize: "30px", fontWeight: 800, color: "#0f172a", margin: 0 }}>서비스 소개</h1>
      <p style={{ fontSize: "15px", color: "#6b7280", marginTop: "10px", marginBottom: "48px" }}>
        AI 대학원 진학 준비를 한 곳에서 — 논문·트렌드·로드맵을 한 번에.
      </p>

      {/* 서비스 소개 */}
      <section style={{ marginBottom: "44px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: BRAND, marginBottom: "12px" }}>우리 서비스</h2>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7 }}>
          {/* TODO: 서비스 핵심 소개 작성 (대학원 정보 통합 / 논문 요약·트렌드 / 개인 맞춤 로드맵 등) */}
          여기에 서비스 소개 내용을 채워주세요.
        </p>
      </section>

      {/* 학과 소개 */}
      <section style={{ marginBottom: "44px" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: BRAND, marginBottom: "12px" }}>학과 소개</h2>

        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "16px 0 6px" }}>학과 비전</h3>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7 }}>{/* TODO */}여기에 학과 비전을 작성해주세요.</p>

        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "16px 0 6px" }}>학년별 로드맵 및 커리큘럼</h3>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7 }}>{/* TODO */}여기에 교육과정을 작성해주세요.</p>

        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: "16px 0 6px" }}>학과 기본 정보</h3>
        <p style={{ fontSize: "14px", color: "#475569", lineHeight: 1.7 }}>{/* TODO */}여기에 학과 기본 정보를 작성해주세요.</p>
      </section>
    </div>
  );
}