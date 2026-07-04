import { useEffect, useMemo, useState } from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { Calendar, Clock, MapPin, Plus, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

function formatDateTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

const STATUS_STYLES = {
  pending: 'bg-signal-500/10 text-signal-500',
  rejected: 'bg-danger-500/10 text-danger-500',
  approved: 'bg-mint-500/10 text-mint-500'
};

export default function EventsPage() {
  const { user, profile } = useAuth();
  const [approvedEvents, setApprovedEvents] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [tab, setTab] = useState('upcoming'); // 'upcoming' | 'mine'
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const unsubApproved = onSnapshot(
      query(collection(db, 'events'), where('status', '==', 'approved')),
      (snap) => setApprovedEvents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsubMine = onSnapshot(
      query(collection(db, 'events'), where('createdBy', '==', user.uid)),
      (snap) => setMySubmissions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => {
      unsubApproved();
      unsubMine();
    };
  }, [user.uid]);

  const sortedApproved = useMemo(
    () => [...approvedEvents].sort((a, b) => new Date(a.startTime) - new Date(b.startTime)),
    [approvedEvents]
  );
  const sortedMine = useMemo(
    () => [...mySubmissions].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [mySubmissions]
  );

  async function cancelSubmission(eventId) {
    const confirmed = window.confirm('Cancel this event submission?');
    if (!confirmed) return;
    await deleteDoc(doc(db, 'events', eventId));
  }

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
          Campus Events
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-signal-500"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Propose event
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 bg-paper-100 dark:bg-ink-800 rounded-xl p-1 mb-4">
        <button
          onClick={() => setTab('upcoming')}
          aria-pressed={tab === 'upcoming'}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'upcoming'
              ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-paper-50 shadow-sm'
              : 'text-ink-600/60 dark:text-paper-100/50'
          }`}
        >
          Upcoming
        </button>
        <button
          onClick={() => setTab('mine')}
          aria-pressed={tab === 'mine'}
          className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'mine'
              ? 'bg-white dark:bg-ink-900 text-ink-900 dark:text-paper-50 shadow-sm'
              : 'text-ink-600/60 dark:text-paper-100/50'
          }`}
        >
          My submissions
        </button>
      </div>

      {tab === 'upcoming' && (
        <div className="space-y-3">
          {sortedApproved.length === 0 && (
            <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-14">
              No upcoming events yet.
            </p>
          )}
          {sortedApproved.map((event) => (
            <div
              key={event.id}
              className="rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-4"
            >
              <h3 className="font-display font-semibold text-ink-900 dark:text-paper-50">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm text-ink-800/90 dark:text-paper-100/80 mt-1">
                  {event.description}
                </p>
              )}
              <div className="flex flex-col gap-1 mt-2 text-xs text-ink-600/60 dark:text-paper-100/50">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDateTime(event.startTime)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" aria-hidden="true" />
                    {event.location}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'mine' && (
        <div className="space-y-3">
          {sortedMine.length === 0 && (
            <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-14">
              You haven't proposed any events yet.
            </p>
          )}
          {sortedMine.map((event) => (
            <div
              key={event.id}
              className="rounded-card bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-display font-semibold text-ink-900 dark:text-paper-50">
                  {event.title}
                </h3>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_STYLES[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2 text-xs text-ink-600/60 dark:text-paper-100/50">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                  {formatDateTime(event.startTime)}
                </span>
              </div>
              {event.status === 'pending' && (
                <button
                  onClick={() => cancelSubmission(event.id)}
                  className="mt-2 text-xs font-medium text-danger-500"
                >
                  Cancel submission
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <ProposeEventForm user={user} profile={profile} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ProposeEventForm({ user, profile, onClose }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startTime, setStartTime] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim() || !startTime) {
      setError('Title and date/time are both required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await addDoc(collection(db, 'events'), {
        title: title.trim(),
        description: description.trim(),
        location: location.trim(),
        startTime: new Date(startTime).toISOString(),
        createdBy: user.uid,
        createdByName: profile?.name || user.displayName || 'Student',
        status: 'pending',
        createdAt: serverTimestamp()
      });
      onClose();
    } catch {
      setError('Failed to submit event. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Propose a new event"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-950/50 backdrop-blur-sm"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-card p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
            Propose an event
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-ink-600/50">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Event title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Spring Talent Show"
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="What's happening, who's invited…"
          className="w-full resize-none rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Location
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Main Auditorium"
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
          Date & time
        </label>
        <input
          type="datetime-local"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <p className="text-xs text-ink-600/50 dark:text-paper-100/40 mb-3">
          Your event will be reviewed by an admin before it appears publicly.
        </p>

        {error && <p role="alert" className="text-sm text-danger-500 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl"
        >
          {busy ? 'Submitting…' : 'Submit for approval'}
        </button>
      </form>
    </div>
  );
}
