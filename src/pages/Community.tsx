import { useMemo, useState, type ReactNode } from 'react'
import { pageContainer, PAGE_TOP, pageTitle, pageSubtitle, HERO_GAP } from '../styles/pageTheme'

/* 피그마: 커뮤니티_자유게시판_Final (1557:14288)
   - 피그마는 1440 고정(본문 1062)이라 구성·색만 가져오고 크기는 프로젝트 스케일(본문 1000)에 맞춤
   - App.tsx 가 Navbar/Footer 를 감싸므로 여기선 페이지 내용만 렌더
   - 게시글은 아직 API가 없어 목 데이터. 검색·분류·정렬·페이지네이션은 실제로 동작한다. */

async function askClaude(prompt: string): Promise<string> {
  const res = await fetch('/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
    }),
  })

  const data = await res.json()
  if (!res.ok) {
    throw new Error(data?.error || 'Claude 연결에 실패했습니다.')
  }

  return data.answer || 'Claude 응답이 비어 있습니다.'
}

const NAVY = '#00178E'
const INK = '#3C3C43'
const INK_80 = 'rgba(60,60,67,0.8)'
const INK_40 = 'rgba(60,60,67,0.4)'
const MUTED = '#9797A9'
const GRAY = '#737885'
const TAG_BG = '#F0F5FF'
const CARD_BORDER = '#E0E5F0'
const LINE = '#E5EBF2'

const CATEGORIES = ['전체', '대학원', '연구/논문', '진로', '학교생활', '기타'] as const
type Category = (typeof CATEGORIES)[number]

const POSTS_PER_PAGE = 5

type Post = {
  id: number
  category: Exclude<Category, '전체'>
  title: string
  excerpt: string
  author: string
  minutesAgo: number
  views: number
  comments: number
  likes: number
}

export default function Community() {
  const [tab, setTab] = useState<'free' | 'seniors'>('free')
  const [category, setCategory] = useState<Category>('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [page, setPage] = useState(1)
  const [claudeInput, setClaudeInput] = useState('대학원 준비를 위해 가장 먼저 해야 할 일 3가지를 알려줘.')
  const [claudeAnswer, setClaudeAnswer] = useState('')
  const [claudeLoading, setClaudeLoading] = useState(false)
  const [claudeError, setClaudeError] = useState('')

  const handleClaudeAsk = async () => {
    if (!claudeInput.trim()) return

    setClaudeLoading(true)
    setClaudeError('')
    setClaudeAnswer('')

    try {
      const answer = await askClaude(claudeInput.trim())
      setClaudeAnswer(answer)
    } catch (error) {
      setClaudeError(error instanceof Error ? error.message : 'Claude 연결 중 오류가 발생했습니다.')
    } finally {
      setClaudeLoading(false)
    }
  }

  /* 분류·검색·정렬을 모두 통과한 목록. 조건이 바뀌면 페이지는 아래에서 1로 되돌린다. */
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const list = posts.filter(p => {
      const matchCategory = category === '전체' || p.category === category
      const matchKeyword =
        !keyword ||
        p.title.toLowerCase().includes(keyword) ||
        p.excerpt.toLowerCase().includes(keyword)
      return matchCategory && matchKeyword
    })

    return [...list].sort((a, b) =>
      sort === 'latest'
        ? a.minutesAgo - b.minutesAgo
        : b.likes + b.comments - (a.likes + a.comments),
    )
  }, [category, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  // 필터 결과가 줄어 현재 페이지가 사라졌을 때를 대비해 범위 안으로 눌러준다
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  // 검색어·분류·정렬을 바꾸면 항상 첫 페이지부터 다시 본다
  const resetToFirstPage = () => setPage(1)

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
      boxSizing: 'border-box',
      paddingBottom: '100px',
    }}>
      <div style={{ ...pageContainer, paddingTop: PAGE_TOP, paddingBottom: 0 }}>

        {/* 헤더 */}
        <h1 style={pageTitle}>
          커뮤니티
        </h1>
        <p style={pageSubtitle}>
          대학원 진학과 연구에 대한 이야기를 자유롭게 나눠보세요.
        </p>

        {/* 상단 탭 */}
        <div style={{ display: 'flex', gap: '32px', marginTop: HERO_GAP, borderBottom: `1px solid ${LINE}` }}>
          <MainTab active={tab === 'free'} onClick={() => setTab('free')}>자유 게시판</MainTab>
          <MainTab active={tab === 'seniors'} onClick={() => setTab('seniors')}>선배들의 발자취</MainTab>
        </div>

        {tab === 'free' ? (
          <>
            {/* 게시판 헤더 + 글쓰기 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: '16px', margin: '32px 0 40px',
            }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, color: INK, margin: '0 0 8px' }}>
                  자유 게시판
                </h2>
                <p style={{ fontSize: '13px', color: GRAY, margin: 0 }}>
                  대학원, 연구, 진로와 관련된 이야기를 자유롭게 나눠보세요.
                </p>
              </div>
              <button
                type="button"
                style={{
                  flexShrink: 0,
                  background: NAVY, color: '#fff', border: 'none', borderRadius: '20px',
                  padding: '11px 20px', fontSize: '14px', fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                + 글쓰기
              </button>
            </div>

            {/* 이번 주 인기글 */}
            <section style={{ marginBottom: '32px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '14px',
              }}>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: INK, margin: 0 }}>이번 주 인기글</h3>
                <span style={{ fontSize: '12px', color: NAVY }}>전체 인기글 보기 →</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                {weeklyPopular.map((p, i) => (
                  <PopularCard key={p.title} rank={i + 1} {...p} />
                ))}
              </div>
            </section>

            {/* 분류 필터 */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {CATEGORIES.map(c => (
                <CategoryTag
                  key={c}
                  active={category === c}
                  onClick={() => { setCategory(c); resetToFirstPage() }}
                >
                  {c}
                </CategoryTag>
              ))}
            </div>

            {/* 검색 + 정렬 */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
              <div style={{
                flex: 1, minWidth: 0,
                display: 'flex', alignItems: 'center', gap: '12px',
                background: '#fff', borderRadius: '999px', padding: '14px 20px',
              }}>
                <SearchIcon />
                <input
                  value={query}
                  onChange={e => { setQuery(e.target.value); resetToFirstPage() }}
                  placeholder="게시글 제목이나 내용을 검색해보세요."
                  style={{
                    flex: 1, minWidth: 0,
                    border: 'none', outline: 'none', background: 'transparent',
                    fontFamily: 'inherit', fontSize: '14px', color: INK,
                  }}
                />
              </div>

              <div style={{ position: 'relative', flexShrink: 0 }}>
                <select
                  value={sort}
                  onChange={e => { setSort(e.target.value as 'latest' | 'popular'); resetToFirstPage() }}
                  aria-label="정렬"
                  style={{
                    appearance: 'none', WebkitAppearance: 'none',
                    background: '#fff', border: 'none', borderRadius: '999px',
                    padding: '14px 40px 14px 20px',
                    fontFamily: 'inherit', fontSize: '14px', color: INK_80,
                    cursor: 'pointer', height: '100%',
                  }}
                >
                  <option value="latest">최신순</option>
                  <option value="popular">인기순</option>
                </select>
                <span style={{
                  position: 'absolute', right: '18px', top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none', display: 'flex',
                }}>
                  <ChevronDownIcon />
                </span>
              </div>
            </div>

            {/* 게시글 목록 */}
            <div style={{
              background: '#fff', border: `1px solid ${TAG_BG}`, borderRadius: '20px',
              overflow: 'hidden',
            }}>
              {pageItems.length > 0 ? (
                pageItems.map((post, i) => (
                  <PostRow key={post.id} post={post} last={i === pageItems.length - 1} />
                ))
              ) : (
                <div style={{ padding: '60px 0', textAlign: 'center', fontSize: '14px', color: MUTED }}>
                  조건에 맞는 게시글이 없어요.
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            {filtered.length > 0 && (
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            )}
          </>
        ) : (
          <div style={{ padding: '100px 0', textAlign: 'center', fontSize: '15px', color: MUTED }}>
            선배들의 발자취는 준비 중이에요.
          </div>
        )}

        <section style={{
          marginTop: '40px',
          background: '#fff',
          border: `1px solid ${CARD_BORDER}`,
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 10px 24px rgba(0, 23, 142, 0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: INK, margin: 0 }}>Claude AI 도우미</h3>
            <span style={{ fontSize: '12px', color: NAVY, background: TAG_BG, padding: '6px 10px', borderRadius: '999px' }}>
              실시간 연결
            </span>
          </div>

          <textarea
            value={claudeInput}
            onChange={e => setClaudeInput(e.target.value)}
            rows={4}
            placeholder="대학원 진학, 논문 읽기, 진로 선택에 대해 Claude에게 물어보세요."
            style={{
              width: '100%',
              resize: 'vertical',
              border: `1px solid ${LINE}`,
              borderRadius: '14px',
              padding: '14px 16px',
              fontSize: '14px',
              fontFamily: 'inherit',
              lineHeight: 1.5,
              boxSizing: 'border-box',
              color: INK,
              outline: 'none',
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
            <button
              type="button"
              onClick={handleClaudeAsk}
              disabled={claudeLoading || !claudeInput.trim()}
              style={{
                background: NAVY,
                color: '#fff',
                border: 'none',
                borderRadius: '999px',
                cursor: claudeLoading || !claudeInput.trim() ? 'not-allowed' : 'pointer',
                opacity: claudeLoading || !claudeInput.trim() ? 0.6 : 1,
                padding: '11px 20px',
                fontSize: '14px',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              {claudeLoading ? '답변 생성 중...' : 'Claude에게 물어보기'}
            </button>
          </div>

          {claudeError && (
            <div style={{ marginTop: '18px', padding: '12px 14px', borderRadius: '12px', background: '#fff1f2', color: '#be123c', fontSize: '13px' }}>
              {claudeError}
            </div>
          )}

          {claudeAnswer && (
            <div style={{ marginTop: '18px', padding: '18px 18px 16px', background: '#f8faff', borderRadius: '14px', border: `1px solid ${LINE}` }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: NAVY, marginBottom: '10px' }}>Claude 답변</div>
              <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: INK, fontSize: '14px' }}>
                {claudeAnswer}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

/* ───────── 공용 조각 ───────── */

function MainTab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0 4px 12px',
        background: 'none', border: 'none', cursor: 'pointer',
        fontSize: '16px', fontWeight: active ? 600 : 500, fontFamily: 'inherit',
        color: active ? INK : INK_80,
        borderBottom: active ? `3px solid ${NAVY}` : '3px solid transparent',
        marginBottom: '-1px',
        transition: 'color 0.15s',
      }}
    >
      {children}
    </button>
  )
}

function CategoryTag({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: '#fff', borderRadius: '100px', padding: '7px 14px',
        border: active ? `1.2px solid ${NAVY}` : '1.2px solid transparent',
        fontSize: '13px', fontWeight: active ? 600 : 500, fontFamily: 'inherit',
        color: active ? NAVY : INK,
        cursor: 'pointer', whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  )
}

function PopularCard({ rank, title, comments, likes }: { rank: number; title: string; comments: number; likes: number }) {
  return (
    <div style={{
      background: '#fff', border: `1px solid ${CARD_BORDER}`, borderRadius: '16px',
      padding: '16px 18px',
      display: 'flex', flexDirection: 'column', gap: '10px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: NAVY }}>
          {String(rank).padStart(2, '0')}
        </span>
        <span style={{
          border: `1.2px solid ${NAVY}`, borderRadius: '100px', padding: '3px 8px',
          fontSize: '11px', fontWeight: 600, color: NAVY,
        }}>
          인기
        </span>
      </div>
      <p style={{
        fontSize: '14px', fontWeight: 600, color: INK, margin: 0, lineHeight: 1.4,
        /* 제목이 길어도 카드 높이가 흐트러지지 않게 두 줄로 자른다 */
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {title}
      </p>
      <p style={{ fontSize: '12px', color: INK_80, margin: 0 }}>
        댓글 {comments} · 좋아요 {likes}
      </p>
    </div>
  )
}

function PostRow({ post, last }: { post: Post; last: boolean }) {
  return (
    <article style={{
      padding: '22px 24px',
      display: 'flex', flexDirection: 'column', gap: '10px',
      borderBottom: last ? 'none' : `1px solid ${TAG_BG}`,
    }}>
      <span style={{
        alignSelf: 'flex-start',
        background: TAG_BG, borderRadius: '100px', padding: '6px 12px',
        fontSize: '12px', fontWeight: 500, color: NAVY,
      }}>
        {post.category}
      </span>

      <h3 style={{ fontSize: '15px', fontWeight: 600, color: INK, margin: 0 }}>{post.title}</h3>
      <p style={{ fontSize: '13px', color: MUTED, margin: 0, lineHeight: 1.5 }}>{post.excerpt}</p>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap', fontSize: '12px',
      }}>
        <span style={{ color: INK_40 }}>{post.author} · {formatAgo(post.minutesAgo)}</span>
        <span style={{ display: 'flex', gap: '14px', color: MUTED }}>
          <span>조회 {post.views}</span>
          <span>댓글 {post.comments}</span>
          <span>좋아요 {post.likes}</span>
        </span>
      </div>
    </article>
  )
}

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px',
      marginTop: '40px',
    }}>
      <ArrowButton label="첫 페이지" disabled={page === 1} onClick={() => onChange(1)} double flip />
      <ArrowButton label="이전 페이지" disabled={page === 1} onClick={() => onChange(page - 1)} flip />

      {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            fontFamily: 'inherit', fontSize: '14px',
            fontWeight: n === page ? 600 : 500,
            color: n === page ? NAVY : INK_80,
          }}
        >
          {n}
        </button>
      ))}

      <ArrowButton label="다음 페이지" disabled={page === totalPages} onClick={() => onChange(page + 1)} />
      <ArrowButton label="마지막 페이지" disabled={page === totalPages} onClick={() => onChange(totalPages)} double />
    </div>
  )
}

function ArrowButton({ label, disabled, onClick, double, flip }: {
  label: string; disabled: boolean; onClick: () => void; double?: boolean; flip?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        background: 'none', border: 'none', padding: '2px',
        display: 'flex', alignItems: 'center',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.3 : 1,
        transform: flip ? 'rotate(180deg)' : undefined,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {double ? <path d="M7 5l7 7-7 7M13 5l7 7-7 7" /> : <path d="M9 5l7 7-7 7" />}
      </svg>
    </button>
  )
}

/* ───────── 아이콘 ───────── */

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={INK_80} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

/* ───────── 유틸 ───────── */

function formatAgo(minutes: number): string {
  if (minutes < 60) return `${minutes}분 전`
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}시간 전`
  if (minutes < 60 * 48) return '어제'
  return `${Math.floor(minutes / (60 * 24))}일 전`
}

/* ───────── 데이터 (API 연동 전 목 데이터) ───────── */

const weeklyPopular = [
  { title: '대학원 컨택은 보통 언제부터 시작하시나요?', comments: 15, likes: 42 },
  { title: '학부생이 처음 논문 읽을 때 추천하는 방법', comments: 12, likes: 37 },
  { title: '연구실 선택 전에 꼭 확인해야 할 체크리스트', comments: 9, likes: 31 },
]

const posts: Post[] = [
  {
    id: 1, category: '대학원',
    title: '대학원 컨택은 보통 언제부터 시작하시나요?',
    excerpt: '3학년 2학기인데 교수님께 메일을 보내도 너무 이르지 않을지 궁금해요.',
    author: '영주', minutesAgo: 120, views: 128, comments: 5, likes: 12,
  },
  {
    id: 2, category: '연구/논문',
    title: '학부생이 처음 논문 읽을 때 추천하는 방법 있나요?',
    excerpt: '초록부터 읽어야 할지, 구현을 먼저 따라 해봐야 할지 선배님들의 방법이 궁금합니다.',
    author: '하이그래드', minutesAgo: 300, views: 96, comments: 8, likes: 18,
  },
  {
    id: 3, category: '진로',
    title: '학석사 연계과정 고민 중입니다.',
    excerpt: '대학원 진학과 취업 사이에서 고민하고 있어 실제 경험담을 듣고 싶어요.',
    author: '민서', minutesAgo: 1500, views: 214, comments: 11, likes: 23,
  },
  {
    id: 4, category: '대학원',
    title: '연구실 선택할 때 가장 중요하게 봐야 하는 게 뭘까요?',
    excerpt: '연구 주제, 지도 방식, 랩 문화 중 어떤 점을 우선하면 좋을까요?',
    author: '준호', minutesAgo: 2880, views: 302, comments: 14, likes: 31,
  },
  {
    id: 5, category: '연구/논문',
    title: '논문 리뷰 스터디 같이 하실 분 계신가요?',
    excerpt: '매주 한 편씩 읽고 정리해서 공유하는 방식으로 진행하려고 합니다.',
    author: '서연', minutesAgo: 4320, views: 187, comments: 9, likes: 20,
  },
  {
    id: 6, category: '학교생활',
    title: '휴먼AI공학전공 수업 중 대학원 준비에 도움된 과목 추천해주세요.',
    excerpt: '전공 선택할 때 참고하려고 하는데 선배님들 의견이 궁금해요.',
    author: '지우', minutesAgo: 5760, views: 143, comments: 6, likes: 15,
  },
  {
    id: 7, category: '진로',
    title: '연구실 인턴 경험이 대학원 입시에 얼마나 반영될까요?',
    excerpt: '학점보다 인턴 경험이 더 중요하다는 말을 들었는데 실제로 어떤가요?',
    author: '태윤', minutesAgo: 7200, views: 265, comments: 13, likes: 28,
  },
  {
    id: 8, category: '대학원',
    title: '타대 대학원 준비하시는 분들 계신가요?',
    excerpt: '내부 진학과 비교했을 때 어떤 점을 더 챙겨야 하는지 궁금합니다.',
    author: '하늘', minutesAgo: 10080, views: 198, comments: 10, likes: 22,
  },
  {
    id: 9, category: '기타',
    title: '연구 관련 도구 추천받아요.',
    excerpt: '레퍼런스 관리랑 실험 기록에 쓰기 좋은 도구가 있을까요?',
    author: '도현', minutesAgo: 14400, views: 112, comments: 7, likes: 16,
  },
]
