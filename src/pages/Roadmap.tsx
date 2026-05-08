import { useState } from "react";

export default function Roadmap() {

  const [answers, setAnswers] = useState({
    grade: "",
    interest: [] as string[],
    understanding: "",
  });

  const toggleInterest = (item: string) => {
    setAnswers(prev => {
      if (prev.interest.includes(item)) {
        return {
          ...prev,
          interest: prev.interest.filter(i => i !== item)
        };
      }
      if (prev.interest.length >= 3) return prev;

      return {
        ...prev,
        interest: [...prev.interest, item]
      };
    });
  };

  return (
    <div style={{
      padding: '80px 5vw 200px',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>

      {/* 상단 텍스트 */}
      <div style={{
        marginBottom: '140px',   
        maxWidth: '600px',
        marginLeft: '-40px'
      }}>
        <h1 style={{
          fontSize: '24px',
          fontWeight: 700,
          marginBottom: '10px'
        }}>
          내 로드맵, 지금 생성하기
        </h1>

        <p style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>
          전공·논문·준비 액션을 한 플랜으로 정리해드려요.
        </p>
      </div>

      {/* 설문 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '40px'
      }}>

        {/* Q1 */}
        <div style={cardStyle}>
          <p style={qTitle}>Q1. 재학 중인 학년과 학기를 선택해주세요.</p>

          <div style={radioWrap}>
            {["1학년 1학기","1학년 2학기","2학년 1학기","2학년 2학기"].map(v => (
              <label key={v}>
                <input
                  type="radio"
                  name="grade"
                  onChange={() => setAnswers({...answers, grade: v})}
                />
                {v}
              </label>
            ))}
          </div>
        </div>

        {/* Q2 */}
        <div style={cardStyle}>
          <p style={qTitle}>Q2. 관심분야를 선택해주세요 (최대 3개)</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {["CV","LLM","NLP","HCI","GNN","RL","Bio","UI/UX"].map(v => (
              <div
                key={v}
                onClick={() => toggleInterest(v)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '20px',
                  border: answers.interest.includes(v)
                    ? '2px solid #3B6FE8'
                    : '1px solid #d1d5db',
                  background: answers.interest.includes(v)
                    ? '#eef3ff'
                    : '#fff',
                  cursor: 'pointer'
                }}
              >
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* Q3 */}
        <div style={cardStyle}>
          <p style={qTitle}>Q3. 이해도 수준은 어느 정도인가요?</p>

          <div style={radioWrap}>
            {[
              "아직 관심 분야가 없어요",
              "개념을 조금 들어봤어요",
              "기본 개념은 알고 있어요",
              "설명할 수 있어요",
              "프로젝트 경험 충분"
            ].map(v => (
              <label key={v}>
                <input
                  type="radio"
                  name="understanding"
                  onChange={() => setAnswers({...answers, understanding: v})}
                />
                {v}
              </label>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

const cardStyle = {
  width: '100%',
  maxWidth: '900px',
  padding: '30px',
  borderRadius: '20px',
  border: '2px solid #3B6FE8',
  background: '#fff'
};

const qTitle = {
  marginBottom: '20px',
  fontWeight: 600
};

const radioWrap = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '20px'
};