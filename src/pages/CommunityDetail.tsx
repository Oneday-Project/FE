import { Fragment, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { pageContainer } from '../styles/pageTheme'
import {
  freePosts, seniorStories, commentsOf,
  type BoardTab, type Comment, type FreePost, type SeniorStory,
} from '../lib/communityData'
import {
  NAVY, INK, INK_80, INK_40, MUTED, LINE, TAG_BG, HEART_RED, HEART_GRAY,
  pageWrapper, BOARD_LABEL, formatAgo, COMMUNITY_TOP, COMMUNITY_TAB_GAP,
} from '../styles/communityTheme'
import { isLoggedIn } from '../lib/auth'
import LoginGateModal from '../components/LoginGateModal'
import { CommunityHeader, Pill, OutlinePill, ChevronIcon, HeartIcon } from '../components/CommunityParts'

/* 피그마: 커뮤니티_1021수정 (자유 게시판 상세 / 선배들의 발자취 상세)
   /community/free/:id, /community/seniors/:id 를 이 화면 하나가 맡는다.
   회원 전용 — 주소로 바로 들어와도 비로그인이면 안내 모달만 띄운다(논문 상세와 같은 방식).
   좋아요·댓글은 API 연동 전이라 화면 안에서만 반영된다. */

type Entry =
  | { board: 'free'; post: FreePost }
  | { board: 'seniors'; post: SeniorStory }

/* 목록과 같은 순서(최신순)로 정렬해 두고 이전 글·다음 글을 고른다 */
const byLatest = <T extends { minutesAgo: number }>(list: T[]) => [...list].sort((a, b) => a.minutesAgo - b.minutesAgo)
const LISTS = { free: byLatest(freePosts), seniors: byLatest(seniorStories) }

/* 상세 화면 카드 — 목록 카드보다 모서리가 작다 */
const detailCard: CSSProperties = {
  background: '#fff',
  borderRadius: '16px',
  boxShadow: '0 2px 12px rgba(0, 23, 142, 0.03)',
}
const CARD_PAD_X = '36px'

export default function CommunityDetail() {
  const { board, id } = useParams()
  const navigate = useNavigate()
  const tab: BoardTab = board === 'seniors' ? 'seniors' : 'free'
  const listPath = tab === 'free' ? '/community' : '/community?tab=seniors'
  const exists = LISTS[tab].some(p => p.id === Number(id))

  if (!exists) return <Navigate to={listPath} replace />
  if (!isLoggedIn()) {
    return <LoginGateModal onClose={() => navigate(listPath, { replace: true })} onLogin={() => navigate('/login')} />
  }

  // 이전 글·다음 글로 넘어가면 좋아요·댓글 상태를 새 글 기준으로 다시 잡도록 key 로 새로 마운트한다
  return <DetailView key={`${tab}-${id}`} tab={tab} id={Number(id)} />
}

function DetailView({ tab, id }: { tab: BoardTab; id: number }) {
  const navigate = useNavigate()
  const listPath = tab === 'free' ? '/community' : '/community?tab=seniors'

  const list = LISTS[tab]
  const index = list.findIndex(p => p.id === id)
  const entry = (tab === 'free'
    ? { board: 'free', post: LISTS.free[index] }
    : { board: 'seniors', post: LISTS.seniors[index] }) as Entry
  const { post } = entry

  // 이전 글 = 한 칸 오래된 글, 다음 글 = 한 칸 최근 글
  const prev = list[index + 1]
  const next = list[index - 1]

  const [liked, setLiked] = useState(false)
  const [comments, setComments] = useState<Comment[]>(() => commentsOf(tab, id))
  const likeCount = post.likes + (liked ? 1 : 0)

  const goTo = (postId: number) => {
    navigate(`/community/${tab}/${postId}`)
    window.scrollTo(0, 0)
  }

  const meta = entry.board === 'free'
    ? [entry.post.authorInfo, formatAgo(post.minutesAgo)]
    : [entry.post.classOf, `${entry.post.from} → ${entry.post.to}`]

  return (
    <div style={pageWrapper}>
      <div style={{ ...pageContainer, paddingTop: COMMUNITY_TOP, paddingBottom: 0 }}>
        <CommunityHeader tab={tab} onTabChange={t => navigate(t === 'free' ? '/community' : '/community?tab=seniors')} />

        {/* 경로 + 목록으로 돌아가기 */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          margin: `${COMMUNITY_TAB_GAP} 0 22px`, padding: '0 6px', fontSize: '13px',
        }}>
          <span style={{ color: INK_80 }}>
            {BOARD_LABEL[tab]}
            <span style={{ color: INK_40, margin: '0 6px' }}>/</span>
            <span style={{ color: NAVY, fontWeight: 600 }}>
              {entry.board === 'free' ? entry.post.category : entry.post.type}
            </span>
          </span>
          <button
            type="button"
            onClick={() => navigate(listPath)}
            style={{
              display: 'flex', alignItems: 'center', gap: '4px',
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: 'inherit', fontSize: '13px', color: INK,
            }}
          >
            <ChevronIcon dir="left" color={INK} />
            목록으로 돌아가기
          </button>
        </div>

        {/* 본문 */}
        <article style={detailCard}>
          <header style={{ padding: `32px ${CARD_PAD_X} 26px`, borderBottom: `1px solid ${TAG_BG}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {entry.board === 'free' ? (
                <Pill>{entry.post.category}</Pill>
              ) : (
                <>
                  <Pill>{entry.post.type}</Pill>
                  {entry.post.fields.map(f => <OutlinePill key={f}>{f}</OutlinePill>)}
                </>
              )}
            </div>

            <h2 style={{ fontSize: '22px', fontWeight: 700, color: INK, margin: '0 0 14px', lineHeight: 1.4 }}>
              {post.title}
            </h2>

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: '12px', flexWrap: 'wrap',
            }}>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '12px', color: INK_40 }}>
                <span style={{ fontWeight: 600, color: INK }}>{post.author}</span>
                {meta.map(m => (
                  <Fragment key={m}>
                    <Dot />
                    <span>{m}</span>
                  </Fragment>
                ))}
              </span>
              <span style={{ display: 'flex', gap: '12px', fontSize: '13px', color: MUTED }}>
                <span>조회 {post.views}</span>
                <span>댓글 {comments.length}</span>
                <span>좋아요 {likeCount}</span>
              </span>
            </div>
          </header>

          <div style={{ padding: `32px ${CARD_PAD_X} 48px`, fontSize: '13px', lineHeight: 1.7, color: INK }}>
            {entry.board === 'free'
              ? entry.post.body.map((para, i) => <p key={i} style={{ margin: '0 0 16px' }}>{para}</p>)
              : entry.post.sections.map(s => (
                  <section key={s.heading} style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 600, color: INK, margin: '0 0 8px' }}>{s.heading}</h3>
                    <p style={{ margin: 0 }}>{s.body}</p>
                  </section>
                ))}
          </div>

          {/* 좋아요 + 수정/삭제/목록으로 */}
          <footer style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            padding: `0 ${CARD_PAD_X} 28px`,
          }}>
            <button
              type="button"
              onClick={() => setLiked(v => !v)}
              aria-pressed={liked}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                background: liked ? '#FFF2F4' : '#fff',
                border: `1px solid ${liked ? '#FFD6DC' : TAG_BG}`, borderRadius: '999px',
                padding: '6px 14px', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: '12px', color: INK,
              }}
            >
              <HeartIcon color={HEART_RED} size={13} />
              좋아요 <span style={{ marginLeft: '2px' }}>{likeCount}</span>
            </button>

            <div style={{ display: 'flex', alignItems: 'center', fontSize: '12px' }}>
              {/* 수정·삭제는 작성자 확인 API 연동 후 연결 */}
              <TextButton muted small>수정</TextButton>
              <span style={{ width: '1px', height: '12px', background: LINE, margin: '0 16px' }} />
              <TextButton muted small>삭제</TextButton>
              <button
                type="button"
                onClick={() => navigate(listPath)}
                style={{
                  marginLeft: '18px',
                  background: '#fff', border: `1px solid ${LINE}`, borderRadius: '8px',
                  padding: '8px 16px', cursor: 'pointer',
                  fontFamily: 'inherit', fontSize: '12px', fontWeight: 500, color: INK,
                }}
              >
                목록으로
              </button>
            </div>
          </footer>
        </article>

        <CommentSection comments={comments} onChange={setComments} />

        {/* 이전 글 / 다음 글 — 글이 없어도 두 줄 모두 보여준다 */}
        <div style={{ ...detailCard, marginTop: '30px', overflow: 'hidden' }}>
          <SiblingRow label="이전 글" dir="up" target={prev} empty="이전 글이 없어요." onClick={goTo} />
          <div style={{ height: '1px', background: TAG_BG }} />
          <SiblingRow label="다음 글" dir="down" target={next} empty="다음 글이 없어요." onClick={goTo} />
        </div>
      </div>
    </div>
  )
}

/* ───────── 댓글 ───────── */

function CommentSection({ comments, onChange }: { comments: Comment[]; onChange: (c: Comment[]) => void }) {
  const [draft, setDraft] = useState('')
  const [likedIds, setLikedIds] = useState<number[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const content = draft.trim()
    if (!content) return
    const nextId = Math.max(0, ...comments.map(c => c.id)) + 1
    onChange([...comments, { id: nextId, author: '나', minutesAgo: 0, content, likes: 0 }])
    setDraft('')
  }

  // 답글 기능은 API 연동 전이라 작성자를 멘션한 채로 입력창에 포커스만 옮긴다
  const replyTo = (author: string) => {
    setDraft(`@${author} `)
    inputRef.current?.focus()
  }

  const toggleLike = (id: number) =>
    setLikedIds(ids => (ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]))

  return (
    <section style={{ ...detailCard, marginTop: '30px', padding: `40px ${CARD_PAD_X} 24px` }}>
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: INK, margin: '0 0 18px' }}>
        댓글 <span style={{ color: NAVY, marginLeft: '4px' }}>{comments.length}</span>
      </h3>

      {/* 입력 */}
      <div style={{ padding: '0 16px 16px', borderBottom: `1px solid ${TAG_BG}` }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          rows={3}
          placeholder="댓글을 입력해주세요. 타인을 배려하는 친절한 답변을 남겨주세요."
          style={{
            width: '100%', resize: 'none', border: 'none', outline: 'none', padding: 0,
            fontFamily: 'inherit', fontSize: '13px', lineHeight: 1.6, color: INK,
            background: 'transparent', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px' }}>
          <span style={{ fontSize: '11px', color: MUTED }}>
            연구와 대학원에 관한 따뜻한 조언을 공유해주세요.
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            style={{
              flexShrink: 0,
              background: NAVY, color: '#fff', border: 'none', borderRadius: '999px',
              padding: '8px 20px', fontFamily: 'inherit', fontSize: '12px', fontWeight: 600,
              cursor: draft.trim() ? 'pointer' : 'not-allowed', opacity: draft.trim() ? 1 : 0.5,
            }}
          >
            등록
          </button>
        </div>
      </div>

      {/* 목록 */}
      {comments.length > 0 ? (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {comments.map((c, i) => {
            const liked = likedIds.includes(c.id)
            return (
              <li key={c.id} style={{ padding: '22px 0', borderBottom: i === comments.length - 1 ? 'none' : `1px solid ${TAG_BG}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', fontSize: '11px' }}>
                  <span>
                    <span style={{ fontWeight: 600, color: INK }}>{c.author}</span>
                    <span style={{ color: INK_40, marginLeft: '8px' }}>· {c.minutesAgo === 0 ? '방금 전' : formatAgo(c.minutesAgo)}</span>
                  </span>
                  {/* 신고는 API 연동 후 연결 */}
                  <TextButton muted tiny>신고</TextButton>
                </div>
                <p style={{ fontSize: '13px', color: INK, margin: '0 0 10px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {c.content}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '11px' }}>
                  <button
                    type="button"
                    onClick={() => toggleLike(c.id)}
                    aria-pressed={liked}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                      fontFamily: 'inherit', fontSize: '11px', color: MUTED,
                    }}
                  >
                    <HeartIcon color={liked ? HEART_RED : HEART_GRAY} size={12} />
                    좋아요 {c.likes + (liked ? 1 : 0)}
                  </button>
                  <TextButton muted tiny onClick={() => replyTo(c.author)}>답글달기</TextButton>
                </div>
              </li>
            )
          })}
        </ul>
      ) : (
        <p style={{ margin: '32px 0 8px', textAlign: 'center', fontSize: '12px', color: MUTED }}>
          아직 댓글이 없어요. 첫 댓글을 남겨보세요.
        </p>
      )}
    </section>
  )
}

/* ───────── 조각 ───────── */

function Dot() {
  return <span style={{ width: '3px', height: '3px', borderRadius: '50%', background: INK_40, margin: '0 8px' }} />
}

function SiblingRow({ label, dir, target, empty, onClick }: {
  label: string
  dir: 'up' | 'down'
  target?: { id: number; title: string; minutesAgo: number }
  empty: string
  onClick: (id: number) => void
}) {
  return (
    <button
      type="button"
      onClick={() => target && onClick(target.id)}
      disabled={!target}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: '16px',
        background: 'none', border: 'none', padding: `16px ${CARD_PAD_X} 16px 22px`,
        cursor: target ? 'pointer' : 'default',
        fontFamily: 'inherit', fontSize: '12px', textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: MUTED, flexShrink: 0 }}>
        <ChevronIcon dir={dir} color={MUTED} />
        {label}
      </span>
      <span style={{
        flex: 1, minWidth: 0, color: target ? INK : MUTED, fontWeight: target ? 500 : 400,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {target ? target.title : empty}
      </span>
      {target && <span style={{ color: MUTED, flexShrink: 0 }}>{formatAgo(target.minutesAgo)}</span>}
    </button>
  )
}

function TextButton({ children, onClick, muted, small, tiny }: {
  children: ReactNode; onClick?: () => void; muted?: boolean; small?: boolean; tiny?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: tiny ? '11px' : small ? '12px' : '13px',
        color: muted ? MUTED : INK_80,
      }}
    >
      {children}
    </button>
  )
}
