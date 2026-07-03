import { useEffect, useState } from 'react';
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/config';
import PostCard from './PostCard';

export default function CampusFeed() {
  const [posts, setPosts] = useState(null); // null = loading

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  if (posts === null) {
    return (
      <div className="space-y-4 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-card h-40 bg-paper-100 dark:bg-ink-800 animate-pulse" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center px-6 py-20">
        <p className="font-display text-lg font-semibold text-ink-900 dark:text-paper-50">
          The feed is quiet.
        </p>
        <p className="text-sm text-ink-600/60 dark:text-paper-100/50 mt-1">
          Tap the + button to share the first post.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 px-4 py-4 max-w-xl mx-auto w-full">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
