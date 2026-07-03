import { Search, Home } from 'lucide-react';

const TABS = [
  { id: 'feed', label: 'Feed', icon: Home },
  { id: 'lostfound', label: 'Lost & Found', icon: Search }
];

export default function BottomNav({ activeTab, onNavigate }) {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 inset-x-0 z-20 bg-white/90 dark:bg-ink-950/90 backdrop-blur-md border-t border-paper-200 dark:border-ink-700 pb-[env(safe-area-inset-bottom)]"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={activeTab === id ? 'page' : undefined}
            className={`flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium transition-colors ${
              activeTab === id
                ? 'text-signal-500'
                : 'text-ink-600/50 dark:text-paper-100/40'
            }`}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </nav>
  );
}
