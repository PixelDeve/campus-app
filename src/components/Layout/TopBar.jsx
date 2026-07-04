import { useState } from 'react';
import { GraduationCap, LogOut, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import EditProfileModal from '../Profile/EditProfileModal';

export default function TopBar({ activeTab, onNavigate }) {
  const { user, profile, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-ink-950/80 backdrop-blur-md border-b border-paper-200 dark:border-ink-700">
      <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-signal-500 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" aria-hidden="true" />
          </div>
          <span className="font-display font-semibold text-ink-900 dark:text-paper-50">
            Campus Feed
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setProfileOpen(true)}
            aria-label="Edit your profile"
            className="p-0.5 rounded-full hover:ring-2 hover:ring-signal-500 transition-all"
          >
            <img
              src={profile?.avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.uid}`}
              alt="Your profile"
              className="w-7 h-7 rounded-full object-cover bg-paper-100 dark:bg-ink-800"
            />
          </button>

          {profile?.isAdmin && (
            <button
              onClick={() => onNavigate(activeTab === 'admin' ? 'feed' : 'admin')}
              aria-label="Toggle admin panel"
              aria-pressed={activeTab === 'admin'}
              className={`p-2 rounded-full transition-colors ${
                activeTab === 'admin'
                  ? 'bg-signal-500 text-white'
                  : 'text-ink-600/60 dark:text-paper-100/50 hover:bg-paper-100 dark:hover:bg-ink-800'
              }`}
            >
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </button>
          )}

          <button
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-full text-ink-600/60 dark:text-paper-100/50 hover:bg-paper-100 dark:hover:bg-ink-800 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" aria-hidden="true" /> : <Moon className="w-5 h-5" aria-hidden="true" />}
          </button>

          <button
            onClick={logout}
            aria-label="Sign out"
            className="p-2 rounded-full text-ink-600/60 dark:text-paper-100/50 hover:bg-danger-500/10 hover:text-danger-500 transition-colors"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {profileOpen && <EditProfileModal onClose={() => setProfileOpen(false)} />}
    </header>
  );
}
