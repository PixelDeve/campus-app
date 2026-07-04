import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import LoginRegister from './components/Auth/LoginRegister';
import TopBar from './components/Layout/TopBar';
import BottomNav from './components/Layout/BottomNav';
import CampusFeed from './components/Feed/CampusFeed';
import LostFoundGrid from './components/LostFound/LostFoundGrid';
import CreatePostOverlay from './components/Create/CreatePostOverlay';
import AdminPanel from './components/Admin/AdminPanel';
import FriendsPage from './components/Friends/FriendsPage';
import EventsPage from './components/Events/EventsPage';
import ChatsPage from './components/Chat/ChatsPage';
import { Loader2 } from 'lucide-react';

export default function App() {
  const { user, profile, loading } = useAuth();
  const [tab, setTab] = useState('feed');
  const [pendingChatUser, setPendingChatUser] = useState(null);

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

  const showAdmin = tab === 'admin' && profile?.isAdmin;

  function handleMessageFriend(friendUser) {
    setPendingChatUser(friendUser);
    setTab('chats');
  }

  return (
    <div className="min-h-screen bg-paper-50 dark:bg-ink-950 pb-16">
      <TopBar activeTab={tab} onNavigate={setTab} />

      <main>
        {showAdmin && <AdminPanel />}
        {!showAdmin && tab === 'feed' && <CampusFeed />}
        {!showAdmin && tab === 'lostfound' && <LostFoundGrid />}
        {!showAdmin && tab === 'friends' && <FriendsPage onMessage={handleMessageFriend} />}
        {!showAdmin && tab === 'events' && <EventsPage />}
        {!showAdmin && tab === 'chats' && (
          <ChatsPage
            pendingChatUser={pendingChatUser}
            onConsumePendingChatUser={() => setPendingChatUser(null)}
          />
        )}
      </main>

      {!showAdmin && tab === 'feed' && <CreatePostOverlay />}
      <BottomNav activeTab={tab === 'admin' ? 'feed' : tab} onNavigate={setTab} />
    </div>
  );
}
