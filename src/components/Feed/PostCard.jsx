import { useState } from 'react';
import {
  arrayRemove,
  arrayUnion,
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { Check, Flag, Heart, MessageCircle, MoreVertical, Pencil, Trash2, X } from 'lucide-react';
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
  const { user, profile } = useAuth();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [flagged, setFlagged] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || '');
  const [saving, setSaving] = useState(false);

  const liked = post.likedBy?.includes(user?.uid);
  const isOwner = user?.uid === post.authorId;
  const canManage = isOwner || profile?.isAdmin;

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

  async function saveEdit() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'posts', post.id), {
        text: editText.trim(),
        editedAt: serverTimestamp()
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm('Delete this post? This cannot be undone.');
    if (!confirmed) return;
    await deleteDoc(doc(db, 'posts', post.id));
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
            {post.editedAt && ' · edited'}
          </p>
        </div>

        <div className="ml-auto relative flex items-center gap-1">
          {!isOwner && (
            <button
              onClick={reportPost}
              disabled={flagged}
              aria-label="Report this post"
              title="Report this post"
              className="text-ink-600/40 hover:text-danger-500 dark:text-paper-100/30 dark:hover:text-danger-400 disabled:text-danger-500 transition-colors p-1"
            >
              <Flag className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {canManage && (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="Post options"
                aria-expanded={menuOpen}
                className="text-ink-600/40 hover:text-ink-900 dark:text-paper-100/30 dark:hover:text-paper-50 transition-colors p-1"
              >
                <MoreVertical className="w-4 h-4" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-8 z-10 w-36 rounded-xl bg-white dark:bg-ink-800 border border-paper-200 dark:border-ink-700 shadow-card dark:shadow-cardDark overflow-hidden">
                  {isOwner && (
                    <button
                      onClick={() => { setEditing(true); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-ink-800 dark:text-paper-100/90 hover:bg-paper-100 dark:hover:bg-ink-700 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => { setMenuOpen(false); handleDelete(); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-danger-500 hover:bg-danger-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Delete
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Body */}
      {editing ? (
        <div className="mt-3">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none focus:ring-2 focus:ring-signal-500"
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={saveEdit}
              disabled={saving}
              className="flex items-center gap-1.5 text-sm font-semibold bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" aria-hidden="true" />
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(post.text || ''); }}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-600/70 dark:text-paper-100/60 px-3 py-1.5 rounded-lg hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
              Cancel
            </button>
          </div>
        </div>
      ) : (
        post.text && (
          <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-800 dark:text-paper-100/90 whitespace-pre-wrap">
            {post.text}
          </p>
        )
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
