import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { MessageSquarePlus, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import ChatWindow from './ChatWindow';

function chatIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

function timeAgo(timestamp) {
  if (!timestamp?.toDate) return '';
  const seconds = Math.floor((Date.now() - timestamp.toDate().getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ChatsPage({ pendingChatUser, onConsumePendingChatUser }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null); // { id, otherUser }
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    const unsubChats = onSnapshot(
      query(collection(db, 'chats'), where('participants', 'array-contains', user.uid)),
      (snap) => setChats(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubFriendships = onSnapshot(
      query(collection(db, 'friendships'), where('users', 'array-contains', user.uid)),
      (snap) => setFriendships(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubChats();
      unsubUsers();
      unsubFriendships();
    };
  }, [user.uid]);

  const usersById = useMemo(() => {
    const map = {};
    allUsers.forEach((u) => { map[u.id] = u; });
    return map;
  }, [allUsers]);

  const friendsList = useMemo(() => {
    const friendIds = friendships.map((f) => f.users.find((u) => u !== user.uid));
    return friendIds.map((id) => usersById[id]).filter(Boolean);
  }, [friendships, usersById, user.uid]);

  const sortedChats = useMemo(() => {
    return [...chats]
      .map((c) => ({
        ...c,
        otherId: c.participants.find((p) => p !== user.uid)
      }))
      .sort((a, b) => (b.lastMessageAt?.seconds || 0) - (a.lastMessageAt?.seconds || 0));
  }, [chats, user.uid]);

  async function openOrCreateChat(otherUser) {
    const id = chatIdFor(user.uid, otherUser.id);
    const chatRef = doc(db, 'chats', id);
    const existing = await getDoc(chatRef);
    if (!existing.exists()) {
      await setDoc(chatRef, {
        participants: [user.uid, otherUser.id],
        lastMessage: '',
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp()
      });
    }
    setShowPicker(false);
    setSelectedChat({ id, otherUser });
  }

  useEffect(() => {
    if (pendingChatUser) {
      openOrCreateChat(pendingChatUser);
      onConsumePendingChatUser?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingChatUser]);

  if (selectedChat) {
    return (
      <ChatWindow
        chatId={selectedChat.id}
        otherUser={selectedChat.otherUser}
        onBack={() => setSelectedChat(null)}
      />
    );
  }

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
          Messages
        </h2>
        <button
          onClick={() => setShowPicker(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-signal-500"
        >
          <MessageSquarePlus className="w-4 h-4" aria-hidden="true" />
          New chat
        </button>
      </div>

      <div className="space-y-2">
        {sortedChats.length === 0 && (
          <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-14">
            No conversations yet — start one with a friend.
          </p>
        )}
        {sortedChats.map((chat) => {
          const other = usersById[chat.otherId];
          if (!other) return null;
          return (
            <button
              key={chat.id}
              onClick={() => setSelectedChat({ id: chat.id, otherUser: other })}
              className="w-full flex items-center gap-3 rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-3 text-left"
            >
              <img
                src={other.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${other.id}`}
                alt={`${other.name}'s avatar`}
                className="w-11 h-11 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-ink-900 dark:text-paper-50 truncate">
                  {other.name}
                </p>
                <p className="text-xs text-ink-600/60 dark:text-paper-100/50 truncate">
                  {chat.lastMessage || 'No messages yet'}
                </p>
              </div>
              <span className="text-[0.65rem] text-ink-600/40 dark:text-paper-100/30 shrink-0">
                {timeAgo(chat.lastMessageAt)}
              </span>
            </button>
          );
        })}
      </div>

      {showPicker && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Start a new conversation"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-950/50 backdrop-blur-sm"
        >
          <div className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-card p-5 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
                Message a friend
              </h3>
              <button onClick={() => setShowPicker(false)} aria-label="Close" className="p-1.5 text-ink-600/50">
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-2">
              {friendsList.length === 0 && (
                <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-8">
                  Add friends first to start messaging them.
                </p>
              )}
              {friendsList.map((f) => (
                <button
                  key={f.id}
                  onClick={() => openOrCreateChat(f)}
                  className="w-full flex items-center gap-3 rounded-xl hover:bg-paper-100 dark:hover:bg-ink-800 p-2.5 text-left transition-colors"
                >
                  <img
                    src={f.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${f.id}`}
                    alt={`${f.name}'s avatar`}
                    className="w-9 h-9 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
                  />
                  <p className="font-medium text-sm text-ink-900 dark:text-paper-50">{f.name}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
