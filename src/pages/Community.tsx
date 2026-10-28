import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { pageContainer } from '../styles/pageTheme'
import { isLoggedIn } from '../lib/auth'
import LoginGateModal from '../components/LoginGateModal'
import {
  FREE_CATEGORIES, SENIOR_FIELDS, freePosts, seniorStories, commentsOf,
  type BoardTab, type FreeCategory, type FreePost, type SeniorField, type SeniorStory,
} from '../lib/communityData'
import { NAVY, INK, INK_80, INK_40, MUTED, CARD_BORDER, TAG_BG, pageWrapper, cardBox, formatAgo, COMMUNITY_TOP } from '../styles/communityTheme'
import {
  CommunityHeader, BoardHeading, CategoryTag, Pill, OutlinePill, Pagination, SearchIcon, ChevronIcon,
} from '../components/CommunityParts'

/* 피그마: 커뮤니티_1021수정 (자유 게시판 목록 / 선배들의 발자취 목록)
   - 피그마는 1440 고정(본문 1062)이라 구성·색만 가져오고 크기는 프로젝트 스케일(본문 1000)에 맞춤
   - App.tsx 가 Navbar/Footer 를 감싸므로 여기선 페이지 내용만 렌더
   - 탭은 ?tab=seniors 로 URL에 남겨서 상세 → 목록으로 돌아와도 같은 탭이 열린다
   - 글 상세·글쓰기는 회원 전용. 비로그인은 목록 보기·페이지 넘기기까지만 되고, 누르면 안내 모달을 띄운다
   - 게시글은 아직 API가 없어 목 데이터. 검색·분류·정렬·페이지네이션은 실제로 동작한다. */

const POSTS_PER_PAGE = 5
const STORIES_PER_PAGE = 6

export default function Community() {
  const [searchParams, setSearchParams] = useSearchParams()
  const tab: BoardTab = searchParams.get('tab') === 'seniors' ? 'seniors' : 'free'
  const navigate = useNavigate()
  const [showLoginGate, setShowLoginGate] = useState(false)

  const requireLogin = (action: () => void) => {
    if (!isLoggedIn()) {
      setShowLoginGate(true)
      return
    }
    action()
  }
  const openDetail = (board: BoardTab, id: number) => requireLogin(() => navigate(`/community/${board}/${id}`))
  // 글쓰기 화면은 API 연동 후 연결 — 지금은 회원 확인만 한다
  const write = () => requireLogin(() => {})

  return (
    <div style={pageWrapper}>
      <div style={{ ...pageContainer, paddingTop: COMMUNITY_TOP, paddingBottom: 0 }}>
        <CommunityHeader tab={tab} onTabChange={t => setSearchParams(t === 'free' ? {} : { tab: t })} />
        {tab === 'free'
          ? <FreeBoard onOpen={id => openDetail('free', id)} onWrite={write} />
          : <SeniorsBoard onOpen={id => openDetail('seniors', id)} onWrite={write} />}
      </div>

      {showLoginGate && (
        <LoginGateModal onClose={() => setShowLoginGate(false)} onLogin={() => navigate('/login')} />
      )}
    </div>
  )
}

/* ───────── 자유 게시판 ───────── */

type BoardProps = { onOpen: (id: number) => void; onWrite: () => void }

function FreeBoard({ onOpen: openPost, onWrite }: BoardProps) {
  const [category, setCategory] = useState<FreeCategory>('전체')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<'latest' | 'popular'>('latest')
  const [page, setPage] = useState(1)

  /* 분류·검색·정렬을 모두 통과한 목록. 조건이 바뀌면 페이지는 아래에서 1로 되돌린다. */
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    const list = freePosts.filter(p => {
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
        : b.likes + commentsOf('free', b.id).length - (a.likes + commentsOf('free', a.id).length),
    )
  }, [category, query, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE))
  // 필터 결과가 줄어 현재 페이지가 사라졌을 때를 대비해 범위 안으로 눌러준다
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * POSTS_PER_PAGE, currentPage * POSTS_PER_PAGE)

  // 검색어·분류·정렬을 바꾸면 항상 첫 페이지부터 다시 본다
  const resetToFirstPage = () => setPage(1)

  return (
    <>
      <BoardHeading title="자유 게시판" desc="대학원, 연구, 진로와 관련된 이야기를 자유롭게 나눠보세요." onWrite={onWrite} />

      {/* 이번 주 인기글 */}
      <section style={{ marginBottom: '32px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: '14px',
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: INK, margin: 0 }}>이번 주 인기글</h3>
          <button
            type="button"
            onClick={() => { setSort('popular'); setCategory('전체'); setQuery(''); resetToFirstPage() }}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', color: NAVY }}
          >
            전체 인기글 보기 →
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {weeklyPopular.map((p, i) => (
            <PopularCard key={p.id} rank={i + 1} post={p} onClick={() => openPost(p.id)} />
          ))}
        </div>
      </section>

      {/* 분류 필터 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {FREE_CATEGORIES.map(c => (
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
            <ChevronIcon />
          </span>
        </div>
      </div>

      {/* 게시글 목록 */}
      <div style={{ ...cardBox, overflow: 'hidden' }}>
        {pageItems.length > 0 ? (
          pageItems.map((post, i) => (
            <PostRow key={post.id} post={post} last={i === pageItems.length - 1} onClick={() => openPost(post.id)} />
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
  )
}

function PopularCard({ rank, post, onClick }: { rank: number; post: FreePost; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: '#fff', border: `1px solid ${CARD_BORDER}`, borderRadius: '16px',
        padding: '16px 18px', textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: NAVY }}>
          {String(rank).padStart(2, '0')}
        </span>
        <OutlinePill>인기</OutlinePill>
      </div>
      <p style={{
        fontSize: '14px', fontWeight: 600, color: INK, margin: 0, lineHeight: 1.4,
        /* 제목이 길어도 카드 높이가 흐트러지지 않게 두 줄로 자른다 */
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {post.title}
      </p>
      <p style={{ fontSize: '11px', color: INK_40, margin: 0 }}>
        댓글 {commentsOf('free', post.id).length} · 좋아요 {post.likes}
      </p>
    </button>
  )
}

function PostRow({ post, last, onClick }: { post: FreePost; last: boolean; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      style={{
        padding: '22px 24px', cursor: 'pointer',
        display: 'flex', flexDirection: 'column', gap: '10px',
        borderBottom: last ? 'none' : `1px solid ${TAG_BG}`,
      }}
    >
      <Pill>{post.category}</Pill>

      <h3 style={{ fontSize: '14px', fontWeight: 600, color: INK, margin: 0, lineHeight: 1.4 }}>{post.title}</h3>
      <p style={{ fontSize: '12px', color: MUTED, margin: 0, lineHeight: 1.4 }}>{post.excerpt}</p>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: '12px', flexWrap: 'wrap', fontSize: '11px',
      }}>
        <span style={{ color: INK_40 }}>{post.author} · {formatAgo(post.minutesAgo)}</span>
        <span style={{ display: 'flex', gap: '14px', color: MUTED }}>
          <span>조회 {post.views}</span>
          <span>댓글 {commentsOf('free', post.id).length}</span>
          <span>좋아요 {post.likes}</span>
        </span>
      </div>
    </article>
  )
}

/* ───────── 선배들의 발자취 ───────── */

function SeniorsBoard({ onOpen, onWrite }: BoardProps) {
  const [field, setField] = useState<SeniorField>('전체')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => seniorStories
      .filter(s => field === '전체' || s.fields.includes(field))
      .sort((a, b) => a.minutesAgo - b.minutesAgo),
    [field],
  )

  const totalPages = Math.max(1, Math.ceil(filtered.length / STORIES_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * STORIES_PER_PAGE, currentPage * STORIES_PER_PAGE)

  return (
    <>
      <BoardHeading title="선배들의 발자취" desc="휴먼AI공학전공 선배들의 대학원 진학과 연구 경험을 확인해보세요." onWrite={onWrite} />

      {/* 연구 분야 필터 */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
        {SENIOR_FIELDS.map(f => (
          <CategoryTag key={f} active={field === f} onClick={() => { setField(f); setPage(1) }}>
            {f}
          </CategoryTag>
        ))}
      </div>

      {pageItems.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {pageItems.map(s => (
            <StoryCard key={s.id} story={s} onClick={() => onOpen(s.id)} />
          ))}
        </div>
      ) : (
        <div style={{ ...cardBox, padding: '60px 0', textAlign: 'center', fontSize: '14px', color: MUTED }}>
          아직 이 분야의 이야기가 없어요.
        </div>
      )}

      {filtered.length > 0 && (
        <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
      )}
    </>
  )
}

function StoryCard({ story, onClick }: { story: SeniorStory; onClick: () => void }) {
  return (
    <article
      onClick={onClick}
      style={{
        ...cardBox, border: `1px solid ${CARD_BORDER}`,
        padding: '20px', cursor: 'pointer', minHeight: '340px', boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {/* 요소마다 간격이 달라서 gap 대신 marginTop 으로 피그마 값을 맞춘다 */}
      <Pill>{story.type}</Pill>

      <h3 style={{
        fontSize: '14px', fontWeight: 600, color: INK, margin: '14px 0 0', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {story.title}
      </h3>
      <span style={{ display: 'flex', gap: '6px', marginTop: '8px', fontSize: '11px', lineHeight: 1.4, color: INK_40 }}>
        <span>{story.author}</span>
        <span>{story.classOf}</span>
      </span>

      <span style={{ marginTop: '10px', fontSize: '13px', fontWeight: 600, lineHeight: 1.4, color: INK_80 }}>
        {story.from} → {story.to}
      </span>

      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '11px' }}>
        {story.fields.map(f => <OutlinePill key={f}>{f}</OutlinePill>)}
      </div>

      <p style={{
        fontSize: '12px', color: MUTED, margin: '15px 0 0', lineHeight: 1.4,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {story.summary}
      </p>

      {/* 요약 바로 아래에 둔다 — 카드 아래쪽은 비워 두는 게 피그마 기준 */}
      <span style={{ marginTop: '12px', fontSize: '12px', fontWeight: 600, lineHeight: 1.4, color: NAVY }}>자세히 보기 →</span>
    </article>
  )
}

/* ───────── 데이터 ───────── */

const weeklyPopular = [1, 2, 4]
  .map(id => freePosts.find(p => p.id === id))
  .filter((p): p is FreePost => !!p)
