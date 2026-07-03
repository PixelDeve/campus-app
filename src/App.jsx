import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginRegister from './components/Auth/LoginRegister';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import CampusFeed from './components/Feed/CampusFeed';
import LostFoundGrid from './components/LostFound/LostFoundGrid';
import CreatePostOverlay from './components/Create/CreatePostOverlay';
import AdminPanel from './components/Admin/AdminPanel';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState('feed');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-50 dark:bg-ink-950">
        <Loader2 className="w-6 h-6 animate-spin text-signal-500" aria-hidden="true" />
      </div>
    );
  }

  if (!user) {
    return <LoginRegister />;
  }

  // Admin tab is only reachable if the user's profile doc has isAdmin: true.
  // Guard here as defense-in-depth (Firestore rules enforce the real boundary).
  const showAdmin = tab === 'admin' && profile?.isAdmin;

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pb-16">
      <TopBar activeTab={tab} onNavigate={setTab} />

      <main>
        {showAdmin && <AdminPanel />}
        {!showAdmin && tab === 'feed' && <CampusFeed />}
        {!showAdmin && tab === 'lostfound' && <LostFoundGrid />}
      </main>

      {!showAdmin && tab === 'feed' && <CreatePostOverlay />}
      <BottomNav activeTab={tab === 'admin' ? 'feed' : tab} onNavigate={setTab} />
    </div>
  );
}
