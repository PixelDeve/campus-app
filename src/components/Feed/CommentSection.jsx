import { useEffect, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { SendHorizontal } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

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
        text: text.trim(),
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
      setText('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 border-t border-paper-200 dark:border-ink-700 pt-3 space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-ink-600/50 dark:text-paper-100/40">
          No comments yet. Be the first to say something.
        </p>
      )}

      <ul className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2 text-sm">
            <span className="font-semibold text-ink-900 dark:text-paper-50 shrink-0">
              {c.authorName}
            </span>
            <span className="text-ink-800/90 dark:text-paper-100/80 break-words">
              {c.text}
            </span>
          </li>
        ))}
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
