import { useState } from 'react';
import { doc, increment, arrayRemove, arrayUnion, updateDoc } from 'firebase/firestore';
import { Flag, Heart, MessageCircle } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import CommentSection from './CommentSection';

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return 'just now';
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function PostCard({ post }) {
  const { user } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);

  const liked = post.likedBy?.includes(user?.uid);

  async function toggleLike() {
    const postRef = doc(db, 'posts', post.id);
    if (liked) {
      await updateDoc(postRef, {
        likeCount: increment(-1),
        likedBy: arrayRemove(user.uid)
      });
    } else {
      await updateDoc(postRef, {
        likeCount: increment(1),
        likedBy: arrayUnion(user.uid)
      });
    }
  }

  async function reportPost() {
    if (flagged) return;
    const postRef = doc(db, 'posts', post.id);
    await updateDoc(postRef, {
      flagged: true,
      flagCount: increment(1),
      flaggedBy: arrayUnion(user.uid)
    });
    setFlagged(true);
  }

  return (
    <article className="rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 shadow-card dark:shadow-cardDark p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <img
          src={post.authorAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${post.authorId}`}
          alt={`${post.authorName}'s avatar`}
          className="w-10 h-10 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
        />
        <div className="min-w-0">
          <p className="font-semibold text-sm text-ink-900 dark:text-paper-50 truncate">
            {post.authorName}
          </p>
          <p className="text-xs text-ink-600/60 dark:text-paper-100/50">
            {timeAgo(post.createdAt)}
          </p>
        </div>
        <button
          onClick={reportPost}
          disabled={flagged}
          aria-label="Report this post"
          title="Report this post"
          className="ml-auto text-ink-600/40 hover:text-danger-500 dark:text-paper-100/30 dark:hover:text-danger-400 disabled:text-danger-500 transition-colors p-1"
        >
          <Flag className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Body */}
      {post.text && (
        <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-800 dark:text-paper-100/90 whitespace-pre-wrap">
          {post.text}
        </p>
      )}

      {post.imageUrl && (
        <img
          src={post.imageUrl}
          alt="Post attachment"
          loading="lazy"
          className="mt-3 w-full rounded-xl object-cover max-h-96 bg-paper-100 dark:bg-ink-800"
        />
      )}

      {/* Actions */}
      <div className="mt-4 flex items-center gap-5 border-t border-paper-200 dark:border-ink-700 pt-3">
        <button
          onClick={toggleLike}
          aria-pressed={liked}
          aria-label={liked ? 'Unlike post' : 'Like post'}
          className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
            liked ? 'text-signal-500' : 'text-ink-600/60 dark:text-paper-100/50 hover:text-signal-500'
          }`}
        >
          <Heart className="w-[18px] h-[18px]" fill={liked ? 'currentColor' : 'none'} aria-hidden="true" />
          {post.likeCount || 0}
        </button>

        <button
          onClick={() => setCommentsOpen((v) => !v)}
          aria-expanded={commentsOpen}
          aria-label="Toggle comments"
          className="flex items-center gap-1.5 text-sm font-medium text-ink-600/60 dark:text-paper-100/50 hover:text-ink-900 dark:hover:text-paper-50 transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" aria-hidden="true" />
          {post.commentCount || 0}
        </button>
      </div>

      {commentsOpen && <CommentSection postId={post.id} />}
    </article>
  );
}
