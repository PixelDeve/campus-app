import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';
import { Check, UserMinus, UserPlus, Users, MessageCircle, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function friendshipId(uidA, uidB) {
  return [uidA, uidB].sort().join('_');
}

export default function FriendsPage({ onMessage }) {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('discover'); // 'discover' | 'requests' | 'friends'
  const [allUsers, setAllUsers] = useState([]);
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setAllUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubIncoming = onSnapshot(
      query(collection(db, 'friendRequests'), where('toId', '==', user.uid), where('status', '==', 'pending')),
      (snap) => setIncoming(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubOutgoing = onSnapshot(
      query(collection(db, 'friendRequests'), where('fromId', '==', user.uid), where('status', '==', 'pending')),
      (snap) => setOutgoing(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubFriendships = onSnapshot(
      query(collection(db, 'friendships'), where('users', 'array-contains', user.uid)),
      (snap) => setFriendships(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubUsers();
      unsubIncoming();
      unsubOutgoing();
      unsubFriendships();
    };
  }, [user.uid]);

  const friendIds = useMemo(
    () => new Set(friendships.map((f) => f.users.find((u) => u !== user.uid))),
    [friendships, user.uid]
  );
  const outgoingIds = useMemo(() => new Set(outgoing.map((r) => r.toId)), [outgoing]);

  const discoverList = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allUsers
      .filter((u) => u.id !== user.uid && !u.isBanned)
      .filter((u) => !term || u.name?.toLowerCase().includes(term))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [allUsers, user.uid, search]);

  const friendsList = useMemo(
    () => allUsers.filter((u) => friendIds.has(u.id)),
    [allUsers, friendIds]
  );

  async function sendRequest(toUser) {
    await addDoc(collection(db, 'friendRequests'), {
      fromId: user.uid,
      fromName: profile?.name || user.displayName || 'Student',
      fromAvatar: profile?.avatarUrl || '',
      toId: toUser.id,
      toName: toUser.name || '',
      status: 'pending',
      createdAt: serverTimestamp()
    });
  }

  async function cancelRequest(requestId) {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  }

  async function acceptRequest(request) {
    const fid = friendshipId(user.uid, request.fromId);
    await setDoc(doc(db, 'friendships', fid), {
      users: [user.uid, request.fromId],
      createdAt: serverTimestamp()
    });
    await deleteDoc(doc(db, 'friendRequests', request.id));
  }

  async function declineRequest(requestId) {
    await deleteDoc(doc(db, 'friendRequests', requestId));
  }

  async function removeFriend(otherUid) {
    const confirmed = window.confirm('Remove this friend?');
    if (!confirmed) return;
    await deleteDoc(doc(db, 'friendships', friendshipId(user.uid, otherUid)));
  }

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto w-full">
      {/* Segmented control */}
      <div className="grid grid-cols-3 gap-1 bg-paper-100 dark:bg-ink-800 rounded-xl p-1 mb-4">
        {[
          { id: 'discover', label: 'Discover' },
          { id: 'requests', label: `Requests${incoming.length ? ` (${incoming.length})` : ''}` },
          { id: 'friends', label: `Friends (${friendsList.length})` }
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-paper-50 shadow-sm'
                : 'text-ink-600/60 dark:text-paper-100/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'discover' && (
        <>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search students…"
            aria-label="Search students"
            className="w-full mb-3 px-3 py-2.5 rounded-xl bg-paper-100 dark:bg-ink-800 text-sm outline-none focus:ring-2 focus:ring-signal-500"
          />
          <div className="space-y-2">
            {discoverList.map((u) => {
              const isFriend = friendIds.has(u.id);
              const isPending = outgoingIds.has(u.id);
              const outgoingReq = outgoing.find((r) => r.toId === u.id);
              return (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-3"
                >
                  <img
                    src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}`}
                    alt={`${u.name}'s avatar`}
                    className="w-10 h-10 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
                  />
                  <p className="flex-1 font-medium text-sm text-ink-900 dark:text-paper-50 truncate">
                    {u.name}
                  </p>
                  {isFriend ? (
                    <span className="text-xs font-medium text-mint-500 px-3 py-1.5">Friends</span>
                  ) : isPending ? (
                    <button
                      onClick={() => cancelRequest(outgoingReq.id)}
                      className="text-xs font-medium text-ink-600/60 dark:text-paper-100/50 px-3 py-1.5 rounded-lg bg-paper-100 dark:bg-ink-800"
                    >
                      Requested
                    </button>
                  ) : (
                    <button
                      onClick={() => sendRequest(u)}
                      aria-label={`Add ${u.name} as a friend`}
                      className="flex items-center gap-1.5 text-xs font-semibold text-white bg-signal-500 hover:bg-signal-600 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      Add
                    </button>
                  )}
                </div>
              );
            })}
            {discoverList.length === 0 && (
              <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-10">
                No students found.
              </p>
            )}
          </div>
        </>
      )}

      {tab === 'requests' && (
        <div className="space-y-2">
          {incoming.length === 0 && (
            <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-10">
              No pending friend requests.
            </p>
          )}
          {incoming.map((req) => (
            <div
              key={req.id}
              className="flex items-center gap-3 rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-3"
            >
              <img
                src={req.fromAvatar || `https://api.dicebear.com/7.x/notionists/svg?seed=${req.fromId}`}
                alt={`${req.fromName}'s avatar`}
                className="w-10 h-10 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
              />
              <p className="flex-1 font-medium text-sm text-ink-900 dark:text-paper-50 truncate">
                {req.fromName}
              </p>
              <button
                onClick={() => acceptRequest(req)}
                aria-label={`Accept ${req.fromName}'s request`}
                className="p-2 rounded-lg bg-mint-500/10 text-mint-500 hover:bg-mint-500/20 transition-colors"
              >
                <Check className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => declineRequest(req.id)}
                aria-label={`Decline ${req.fromName}'s request`}
                className="p-2 rounded-lg bg-danger-500/10 text-danger-500 hover:bg-danger-500/20 transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'friends' && (
        <div className="space-y-2">
          {friendsList.length === 0 && (
            <div className="flex flex-col items-center text-center py-14">
              <Users className="w-8 h-8 text-ink-600/30 dark:text-paper-100/20 mb-2" aria-hidden="true" />
              <p className="text-sm text-ink-600/50 dark:text-paper-100/40">
                No friends yet — check Discover to add some.
              </p>
            </div>
          )}
          {friendsList.map((u) => (
            <div
              key={u.id}
              className="flex items-center gap-3 rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-3"
            >
              <img
                src={u.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${u.id}`}
                alt={`${u.name}'s avatar`}
                className="w-10 h-10 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
              />
              <p className="flex-1 font-medium text-sm text-ink-900 dark:text-paper-50 truncate">
                {u.name}
              </p>
              <button
                onClick={() => onMessage?.(u)}
                aria-label={`Message ${u.name}`}
                className="flex items-center gap-1.5 text-xs font-medium text-signal-500 hover:bg-signal-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                Message
              </button>
              <button
                onClick={() => removeFriend(u.id)}
                aria-label={`Remove ${u.name} as a friend`}
                className="flex items-center gap-1.5 text-xs font-medium text-danger-500 hover:bg-danger-500/10 px-3 py-1.5 rounded-lg transition-colors"
              >
                <UserMinus className="w-3.5 h-3.5" aria-hidden="true" />
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
