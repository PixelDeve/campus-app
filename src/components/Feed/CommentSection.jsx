import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { SendHorizontal, Trash2 } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return 'now';
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function CommentSection({ postId }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [postId]);

  async function submitComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, 'posts', postId, 'comments'), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || 'Student',
        authorAvatar: profile?.avatarUrl || '',
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setSending(false);
    }
  }

  async function deleteComment(commentId) {
    try {
      await deleteDoc(doc(db, 'posts', postId, 'comments', commentId));
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(-1) });
    } catch (err) {
      console.error('Failed to delete comment:', err);
    }
  }

  return (
    <div className="mt-3 border-t border-paper-200 dark:border-ink-700 pt-3 space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-ink-600/50 dark:text-paper-100/40">
          No comments yet. Be the first to say something.
        </p>
      )}

      <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
        {comments.map((c) => {
          const canDelete = c.authorId === user.uid || profile?.isAdmin;
          return (
            <li key={c.id} className="flex gap-2.5">
              <img
                src={c.authorAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${c.authorId}`}
                alt={`${c.authorName}'s avatar`}
                className="w-7 h-7 rounded-full object-cover bg-paper-100 dark:bg-ink-800 shrink-0 mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-sm text-ink-900 dark:text-paper-50">
                    {c.authorName}
                  </span>
                  <span className="text-[0.7rem] text-ink-600/40 dark:text-paper-100/30">
                    {timeAgo(c.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-ink-800/90 dark:text-paper-100/80 break-words">
                  {c.text}
                </p>
              </div>
              {canDelete && (
                <button
                  onClick={() => deleteComment(c.id)}
                  aria-label="Delete comment"
                  className="shrink-0 p-1 text-ink-600/30 hover:text-danger-500 dark:text-paper-100/20 dark:hover:text-danger-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      <form onSubmit={submitComment} className="flex items-center gap-2">
        <label htmlFor={`comment-input-${postId}`} className="sr-only">
          Write a comment
        </label>
        <input
          id={`comment-input-${postId}`}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment…"
          className="flex-1 text-sm px-3 py-2 rounded-full bg-paper-100 dark:bg-ink-800 border border-transparent focus:border-signal-500 outline-none"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send comment"
          className="w-8 h-8 shrink-0 rounded-full bg-signal-500 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <SendHorizontal className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
