import { useEffect, useRef, useState } from 'react';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { ArrowLeft, SendHorizontal } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

export default function ChatWindow({ chatId, otherUser, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const messageText = text.trim();
    setText('');
    try {
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: messageText,
        createdAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: messageText,
        lastMessageAt: serverTimestamp()
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      {/* Thread header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-paper-200 dark:border-ink-700 bg-white dark:bg-ink-900">
        <button onClick={onBack} aria-label="Back to conversations" className="p-1 text-ink-600/60 dark:text-paper-100/50">
          <ArrowLeft className="w-5 h-5" aria-hidden="true" />
        </button>
        <img
          src={otherUser?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${otherUser?.id}`}
          alt={`${otherUser?.name}'s avatar`}
          className="w-8 h-8 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
        />
        <p className="font-semibold text-sm text-ink-900 dark:text-paper-50">{otherUser?.name}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-10">
            Say hi to {otherUser?.name} 👋
          </p>
        )}
        {messages.map((m) => {
          const isMine = m.senderId === user.uid;
          return (
            <div key={m.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap break-words ${
                  isMine
                    ? 'bg-signal-500 text-white rounded-br-sm'
                    : 'bg-paper-100 dark:bg-ink-800 text-ink-900 dark:text-paper-100 rounded-bl-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={sendMessage}
        className="flex items-center gap-2 px-4 py-3 border-t border-paper-200 dark:border-ink-700 bg-white dark:bg-ink-900 pb-[env(safe-area-inset-bottom)]"
      >
        <label htmlFor="chat-input" className="sr-only">Message</label>
        <input
          id="chat-input"
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 px-3.5 py-2.5 rounded-full bg-paper-100 dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-signal-500"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          aria-label="Send message"
          className="w-10 h-10 shrink-0 rounded-full bg-signal-500 disabled:opacity-40 flex items-center justify-center text-white"
        >
          <SendHorizontal className="w-[18px] h-[18px]" aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
