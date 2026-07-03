import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { Check, Search, ShieldAlert, ShieldCheck, Trash2, Users } from 'lucide-react';
import { db } from '../../firebase/config';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [inviteCode, setInviteCode] = useState('');
  const [inviteSaved, setInviteSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) =>
      setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubPosts = onSnapshot(collection(db, 'posts'), (snap) =>
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubFlagged = onSnapshot(
      query(collection(db, 'posts'), where('flagged', '==', true)),
      (snap) => setFlaggedPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubConfig = onSnapshot(doc(db, 'config', 'inviteCode'), (snap) => {
      if (snap.exists()) setInviteCode(snap.data().value || '');
    });
    return () => {
      unsubUsers();
      unsubPosts();
      unsubFlagged();
      unsubConfig();
    };
  }, []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return users;
    return users.filter(
      (u) => u.name?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  async function toggleUserField(userId, field, currentValue) {
    await updateDoc(doc(db, 'users', userId), { [field]: !currentValue });
  }

  async function keepPost(postId) {
    await updateDoc(doc(db, 'posts', postId), { flagged: false, flagCount: 0, flaggedBy: [] });
  }

  async function deletePost(postId) {
    await deleteDoc(doc(db, 'posts', postId));
  }

  async function saveInviteCode() {
    await setDoc(doc(db, 'config', 'inviteCode'), { value: inviteCode.trim() });
    setInviteSaved(true);
    setTimeout(() => setInviteSaved(false), 2000);
  }

  return (
    <div className="px-4 py-5 max-w-3xl mx-auto w-full space-y-8">
      <h1 className="font-display font-semibold text-xl text-ink-900 dark:text-paper-50">
        Admin panel
      </h1>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total users" value={users.length} icon={Users} />
        <StatCard label="Total posts" value={posts.length} icon={ShieldCheck} />
        <StatCard label="Flagged" value={flaggedPosts.length} icon={ShieldAlert} accent />
      </div>

      {/* Live flagged feed */}
      <section>
        <h2 className="font-display font-semibold text-base text-ink-900 dark:text-paper-50 mb-3">
          Flagged content
        </h2>
        {flaggedPosts.length === 0 ? (
          <p className="text-sm text-ink-600/50 dark:text-paper-100/40">Nothing flagged right now.</p>
        ) : (
          <div className="space-y-3">
            {flaggedPosts.map((post) => (
              <div
                key={post.id}
                className="rounded-card border border-paper-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-4"
              >
                <p className="text-xs text-ink-600/60 dark:text-paper-100/50 mb-1">
                  {post.authorName} · {post.flagCount || 1} flag(s)
                </p>
                {post.text && (
                  <p className="text-sm text-ink-800 dark:text-paper-100/90 mb-2">{post.text}</p>
                )}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Flagged post attachment"
                    className="w-full max-h-48 object-cover rounded-lg mb-2"
                  />
                )}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => keepPost(post.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-mint-500/10 text-mint-500 px-3 py-2 rounded-lg hover:bg-mint-500/20 transition-colors"
                  >
                    <Check className="w-4 h-4" aria-hidden="true" />
                    Keep post / Ignore flag
                  </button>
                  <button
                    onClick={() => deletePost(post.id)}
                    className="flex items-center gap-1.5 text-sm font-semibold bg-danger-500/10 text-danger-500 px-3 py-2 rounded-lg hover:bg-danger-500/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                    Delete post
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invite code control */}
      <section>
        <h2 className="font-display font-semibold text-base text-ink-900 dark:text-paper-50 mb-3">
          School invite code
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            aria-label="Active school invite code"
            className="flex-1 rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500"
          />
          <button
            onClick={saveInviteCode}
            className="bg-signal-500 hover:bg-signal-600 text-white font-semibold text-sm px-4 rounded-xl"
          >
            {inviteSaved ? 'Saved' : 'Save'}
          </button>
        </div>
      </section>

      {/* User management console */}
      <section>
        <h2 className="font-display font-semibold text-base text-ink-900 dark:text-paper-50 mb-3">
          User management
        </h2>
        <div className="relative mb-3">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/40" aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-paper-100 dark:bg-ink-800 text-sm outline-none"
          />
        </div>

        <div className="overflow-x-auto rounded-card border border-paper-200 dark:border-ink-700">
          <table className="w-full text-sm">
            <thead className="bg-paper-100 dark:bg-ink-800 text-left text-xs text-ink-600/60 dark:text-paper-100/50">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Admin</th>
                <th className="px-3 py-2 font-medium">Banned</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t border-paper-200 dark:border-ink-700">
                  <td className="px-3 py-2 font-medium text-ink-900 dark:text-paper-50 whitespace-nowrap">
                    {u.name}
                  </td>
                  <td className="px-3 py-2 text-ink-600/70 dark:text-paper-100/60 whitespace-nowrap">
                    {u.email}
                  </td>
                  <td className="px-3 py-2">
                    <ToggleSwitch
                      checked={!!u.isAdmin}
                      onChange={() => toggleUserField(u.id, 'isAdmin', u.isAdmin)}
                      label={`Toggle admin status for ${u.name}`}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <ToggleSwitch
                      checked={!!u.isBanned}
                      onChange={() => toggleUserField(u.id, 'isBanned', u.isBanned)}
                      label={`Toggle banned status for ${u.name}`}
                      danger
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="rounded-card border border-paper-200 dark:border-ink-700 bg-white dark:bg-ink-900 p-4">
      <Icon className={`w-4 h-4 mb-2 ${accent ? 'text-danger-500' : 'text-signal-500'}`} aria-hidden="true" />
      <p className="text-2xl font-display font-semibold text-ink-900 dark:text-paper-50">{value}</p>
      <p className="text-xs text-ink-600/60 dark:text-paper-100/50">{label}</p>
    </div>
  );
}

function ToggleSwitch({ checked, onChange, label, danger }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`w-10 h-6 rounded-full relative transition-colors ${
        checked ? (danger ? 'bg-danger-500' : 'bg-mint-500') : 'bg-paper-200 dark:bg-ink-700'
      }`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
