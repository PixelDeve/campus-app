import { useState } from 'react';
import { GraduationCap, KeyRound, Loader2, Mail, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function LoginRegister() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ name: '', email: '', password: '', inviteCode: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'login') {
        await login({ email: form.email, password: form.password });
      } else {
        await register(form);
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-paper-50 dark:bg-ink-950 px-4 py-10">
      <div className="w-full max-w-md">
        {/* Brand mark */}
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-signal-500 flex items-center justify-center shadow-card">
            <GraduationCap className="w-5 h-5 text-white" aria-hidden="true" />
          </div>
          <span className="font-display font-semibold text-xl text-ink-900 dark:text-paper-50">
            Campus Feed
          </span>
        </div>

        {/* Split-card: tab switcher on top, form below */}
        <div className="rounded-card bg-white dark:bg-ink-900 shadow-card dark:shadow-cardDark overflow-hidden border border-paper-200 dark:border-ink-700">
          <div className="grid grid-cols-2" role="tablist" aria-label="Authentication mode">
            <button
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => { setMode('login'); setError(''); }}
              className={`py-4 text-sm font-semibold transition-colors ${
                mode === 'login'
                  ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-paper-50'
                  : 'bg-paper-100 dark:bg-ink-800 text-ink-600/60 dark:text-paper-100/50'
              }`}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => { setMode('register'); setError(''); }}
              className={`py-4 text-sm font-semibold transition-colors ${
                mode === 'register'
                  ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-paper-50'
                  : 'bg-paper-100 dark:bg-ink-800 text-ink-600/60 dark:text-paper-100/50'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'register' && (
              <Field label="Full name" icon={User}>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Jordan Lee"
                  aria-label="Full name"
                  className="input"
                />
              </Field>
            )}

            <Field label="School Gmail address" icon={Mail}>
              <input
                required
                type="email"
                value={form.email}
                onChange={update('email')}
                placeholder="you@gmail.com"
                aria-label="Gmail address"
                className="input"
              />
            </Field>

            <Field label="Password" icon={KeyRound}>
              <input
                required
                type="password"
                minLength={6}
                value={form.password}
                onChange={update('password')}
                placeholder="••••••••"
                aria-label="Password"
                className="input"
              />
            </Field>

            {mode === 'register' && (
              <Field label="School Invite Code" icon={GraduationCap}>
                <input
                  required
                  type="text"
                  value={form.inviteCode}
                  onChange={update('inviteCode')}
                  placeholder="Ask a staff member"
                  aria-label="School invite code"
                  className="input"
                />
              </Field>
            )}

            {error && (
              <p role="alert" className="text-sm text-danger-500 bg-danger-500/10 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-600/60 dark:text-paper-100/40 mt-6">
          Only current students with a valid invite code can join.
        </p>
      </div>

      {/* Local input styling, scoped via Tailwind's @apply through a style tag would
          require a CSS file; instead we compose classes inline via the .input utility below. */}
      <style>{`
        .input {
          width: 100%;
          padding: 0.7rem 0.9rem 0.7rem 2.5rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(228 233 241);
          background: transparent;
          font-size: 0.9rem;
          outline: none;
        }
        .dark .input { border-color: #2A3450; color: #F1F4F9; }
        .input:focus { border-color: #FF6B2C; }
      `}</style>
    </div>
  );
}

function Field({ label, icon: Icon, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1.5 block">
        {label}
      </span>
      <div className="relative">
        <Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ink-600/40 dark:text-paper-100/40" aria-hidden="true" />
        {children}
      </div>
    </label>
  );
}
