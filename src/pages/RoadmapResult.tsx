import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

/* 타입 */
type Answers = {
  [key: string]: string | string[];
};

/* 점수 계산 */
function calculateScores(answers: Answers) {
  const safe = (v: number | undefined) => v || 0;

  const q3Map = {
    "아직 관심 분야가 없어요.": 0,
    "개념을 조금 들어봤어요.": 2.5,
    "기본 개념은 알고 있어요.": 5,
    "꽤 익숙하고 설명할 수 있어요.": 7.5,
    "프로젝트/공부를 많이 해서 자신 있어요.": 10,
  };

  const q4Map = {
    "아직 정하지 못했어요.": 0,
    "대략적인 분야만 있어요.": 2.5,
    "세부 키워드까지 정했어요.": 5,
    "전체적인 내용을 구성했어요.": 7.5,
    "구체적인 연구 주제와 방향이 있어요.": 10,
  };

  const prep =
    safe(q3Map[answers.q3 as string]) +
    safe(q4Map[answers.q4 as string]);

  const q5Map = {
    "0회": 0, "1~3회": 2.5, "3~5회": 5, "5~8회": 7.5, "10회 이상": 10,
  };

  const q6Map = {
    "없음": 0, "3개월 이하": 2.5, "3~6개월": 5, "6개월~1년": 7.5, "1년 이상": 10,
  };

  const exp =
    safe(q5Map[answers.q5 as string]) +
    safe(q6Map[answers.q6 as string]);

  const q7Map = {
    "0회": 0, "1~3회": 2.5, "4~6회": 5, "6~9회": 7.5, "10회 이상": 10,
  };

  const q8Map = {
    "거의 이해 못함": 0,
    "요약만 가능": 2.5,
    "대부분 이해": 5,
    "정리 가능": 7.5,
    "발표 가능": 10,
  };

  const paper =
    safe(q7Map[answers.q7 as string]) +
    safe(q8Map[answers.q8 as string]);

  const q9Count = Array.isArray(answers.q9) ? answers.q9.length : 0;
  const q10Count = Array.isArray(answers.q10) ? answers.q10.length : 0;

  const portfolio = Math.min((q9Count + q10Count) * 2.5, 20);

  const q11Map = {
    "거의 모름": 0,
    "수업 수준": 2.5,
    "개념 이해": 5,
    "응용 가능": 7.5,
    "설명 가능": 10,
  };

  const q12Map = {
    "불가": 0,
    "부분 이해": 2.5,
    "대략 이해": 5,
    "문맥 이해": 7.5,
    "완전 해석": 10,
  };

  const study =
    safe(q11Map[answers.q11 as string]) +
    safe(q12Map[answers.q12 as string]);

  return {
    prep,
    exp,
    paper,
    portfolio,
    study,
    total: Math.round(prep + exp + paper + portfolio + study),
  };
}

/* 방사형 */
function RadarChart({ data }: { data: number[] }) {

  const [animated, setAnimated] = useState([0, 0, 0, 0, 0]);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setAnimated(data);
      setScale(1);
    }, 200);
  }, [data]);

  const labels = ["이해도", "경험", "논문 루틴", "포트폴리오", "성적"];

  const center = 130;
  const radius = 90;
  const max = 20;

  const labelOffset = [
    [0, -24],
    [32, 6],
    [20, 28],
    [0, 28],
    [-32, 6],
  ];

  const getPoint = (value: number, i: number) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;

    // ⭐ 핵심 보정
    const r = (value / max) * (radius - 2);

    return [
      center + r * Math.cos(angle),
      center + r * Math.sin(angle),
    ];
  };

  const getOuter = (i: number) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    return [
      center + radius * Math.cos(angle),
      center + radius * Math.sin(angle),
    ];
  };

  const levels = [5, 10, 15];

  return (
    <svg width="260" height="260">

      {levels.map(lv => {
        const points = Array.from({ length: 5 }, (_, i) => {
          const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
          const r = (lv / max) * radius;
          return [
            center + r * Math.cos(angle),
            center + r * Math.sin(angle),
          ].join(",");
        }).join(" ");

        return (
          <polygon key={lv} points={points} fill="none" stroke="#9ca3af" strokeDasharray="4 6"/>
        );
      })}

      <polygon
        points={Array.from({ length: 5 }, (_, i) => getOuter(i).join(",")).join(" ")}
        fill="none"
        stroke="#6b7280"
        strokeWidth="2"
      />

      {/* ⭐ 애니메이션 핵심 */}
      <polygon
        points={animated.map((v, i) => getPoint(v, i).join(",")).join(" ")}
        fill="rgba(59,111,232,0.25)"
        stroke="#3B6FE8"
        strokeWidth="2.5"
        style={{
          transition: "all 0.6s ease",
          transform: `scale(${scale})`,
          transformOrigin: "130px 130px"
        }}
      />

      {animated.map((v, i) => {
        const [x, y] = getPoint(v, i);
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4"
            fill="#3B6FE8"
            style={{
              transition: "all 0.6s ease",
              transform: `scale(${scale})`,
              transformOrigin: `${x}px ${y}px`
            }}
          />
        );
      })}

      {labels.map((label, i) => {
        const [x, y] = getOuter(i);
        return (
          <text
            key={label}
            x={x + labelOffset[i][0]}
            y={y + labelOffset[i][1]}
            textAnchor="middle"
            fontSize="14"
            fill="#374151"
          >
            {label}
          </text>
        );
      })}
    </svg>
  );
}

/* 결과 페이지 */
export default function RoadmapResult() {
  const location = useLocation();

  // ⭐ 안전하게 받기
  const answers: Answers = location.state?.answers || location.state || {};

  const scores = calculateScores(answers);
  const tags = Array.isArray(answers.q2) ? answers.q2 : [];

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #ffffff 0%, #eaf0ff 40%, #ddeaff 100%)',
    }}>
      <div style={{
        maxWidth: '960px',
        margin: '0 auto',
        padding: '56px 48px 80px',
      }}>

        <div style={{ marginBottom: '60px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800 }}>
            wnnye님의 로드맵 결과입니다.
          </h1>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            전공·논문·준비 액션을 한 플랜으로 정리해드려요.
          </p>
        </div>

        <div style={{
          border: '2px solid #3B6FE8',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          background: '#fff',
        }}>

          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '16px',
            background: '#3B6FE8',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            종합 코멘트
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>

            {/* 그래프 */}
            <div style={{
              width: '260px',
              display: 'flex',
              justifyContent: 'center',
              marginLeft: '60px'
            }}>
              <RadarChart
                data={[
                  scores.prep,
                  scores.exp,
                  scores.paper,
                  scores.portfolio,
                  scores.study
                ]}
              />
            </div>

            {/* 구분선 */}
            <div style={{
              width: '1px',
              height: '150px',
              background: '#e5e7eb',
              margin: '0 20px'
            }} />

            {/* 오른쪽 */}
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '14px', marginBottom: '8px' }}>
                종합 점수 <b style={{ fontSize: '28px', color:'#3B6FE8' }}>{scores.total}점</b>
              </p>

              <p style={{ fontSize: '13px', marginBottom: '6px', color:'#6b7280' }}>
                관심 분야
              </p>

              <div style={{ marginBottom: '12px' }}>
                {tags.map(tag => (
                  <span key={tag} style={{
                    padding: '6px 12px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    marginRight: '8px',
                    border: '1px solid #3B6FE8',
                    color: '#3B6FE8',
                    background: '#fff'
                  }}>
                    {tag}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: '13px', color: '#6b7280' }}>
                현재 준비도는 {scores.total}점이에요.<br />
                강점과 약점을 기반으로 로드맵을 추천드려요.
              </p>
            </div>

          </div>
        </div>
        {/* 전공 로드맵 */}
        <div style={{
          border: '2px solid #3B6FE8',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          background: '#fff',
          marginTop: '40px'
        }}>

          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '16px',
            background: '#3B6FE8',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            전공 로드맵
          </div>

          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            marginBottom: '20px'
          }}>
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '40px'
          }}>

            {[1, 2, 3].map((year) => (
              <div key={year} style={{ flex: 1 }}>

                <div style={{
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  textAlign: 'center',
                  padding: '6px 0',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}>
                  {year}학년
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '80px',
                  fontSize: '11px',
                  color: '#6b7280',
                  marginBottom: '10px'
                }}>
                  <span>1학기</span>
                  <span>2학기</span>
                </div>

                <div style={{
                  height: '1px',
                  background: '#e5e7eb',
                  marginBottom: '12px'
                }} />

                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '80px',
                }}>

                  {[0,1].map((col) => (
                    <div key={col} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      {[1,2,3,4].map((i) => (
                        <div key={i} style={{
                          width: '60px',
                          height: '16px',
                          background: '#e5e7eb',
                          borderRadius: '6px'
                        }} />
                      ))}
                    </div>
                  ))}

                </div>

              </div>
            ))}

          </div>
        </div>

        {/* 논문 로드맵 */}
        <div style={{
          border: '2px solid #3B6FE8',
          borderRadius: '20px',
          padding: '24px',
          position: 'relative',
          background: '#fff',
          marginTop: '40px'
        }}>

          <div style={{
            position: 'absolute',
            top: '-14px',
            left: '16px',
            background: '#3B6FE8',
            color: '#fff',
            padding: '6px 14px',
            borderRadius: '999px',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            논문 로드맵
          </div>

          {/* 🔥 세미볼드 */}
          <p style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#374151',
            marginTop: '18px',
            marginBottom: '18px'
          }}>
            사용자의 관심 분야 및 중요도에 따른 논문 추천 내역입니다.
          </p>

          {/* 태그 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '20px'
          }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: '30%' }}>
                {tags[i] && (
                  <span style={{
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '13px',
                    border: '2px solid #3B6FE8',
                    color: '#3B6FE8',
                    fontWeight: 600
                  }}>
                    {tags[i]}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* 논문 */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: '20px'
          }}>

            {[0,1,2].map(i => (
              <div key={i} style={{
                flex: 1,
                paddingRight: i !== 2 ? '20px' : '0',
                borderRight: i !== 2 ? '1px solid #e5e7eb' : 'none'
              }}>

                {/* 🔥 year 간격 줄임 */}
                <p style={{
                  fontSize: '11px',
                  color: '#9ca3af',
                  marginBottom: '2px'
                }}>
                  2025
                </p>

                {/* 🔥 영어 타이틀 줄간격 줄임 */}
                <p style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  lineHeight: '1.25',
                  marginBottom: '6px'
                }}>
                  Leveraging Recent Advances in Deep Learning for Audio-Visual Emotion Recognition
                </p>

                <div style={{
                  height: '1px',
                  background: '#e5e7eb',
                  marginTop: '6px',
                  marginBottom: '8px'

                }} />

                {/* 🔥 한글 설명 */}
                <p style={{
                  fontSize: '11px',
                  color: '#6b7280',
                  lineHeight: '1.4',
                  marginBottom: '10px'
                }}>
                  오디오(음성)와 비디오(얼굴) 특징을 딥러닝으로 추출해 결합하고,
                  시간 흐름(LSTM)까지 반영해 감정의 valence/arousal을 예측하는 멀티모달 감정인식 논문
                </p>

              </div>
            ))}

          </div>

        </div>

      </div>
    </div>
  );
}

