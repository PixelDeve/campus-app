import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { MapPin, Plus, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { compressImage, getPreviewUrl } from '../../utils/imageCompression';
import { uploadToR2 } from '../../utils/r2Upload';

const LOCATIONS = ['All locations', 'Library', 'Cafeteria', 'Gym', 'Science Wing', 'Parking Lot', 'Other'];

function formatDate(timestamp) {
  if (!timestamp?.toDate) return '';
  return timestamp.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function LostFoundGrid() {
  const { user, profile } = useAuth();
  const [items, setItems] = useState(null);
  const [locationFilter, setLocationFilter] = useState('All locations');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'lostFound'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    if (!items) return [];
    if (locationFilter === 'All locations') return items;
    return items.filter((i) => i.location === locationFilter);
  }, [items, locationFilter]);

  return (
    <div className="px-4 py-4 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
          Lost &amp; Found
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-signal-500"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          Report item
        </button>
      </div>

      {/* Location filter chips */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-3 -mx-4 px-4">
        {LOCATIONS.map((loc) => (
          <button
            key={loc}
            onClick={() => setLocationFilter(loc)}
            aria-pressed={locationFilter === loc}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              locationFilter === loc
                ? 'bg-signal-500 border-signal-500 text-white'
                : 'border-paper-200 dark:border-ink-700 text-ink-700 dark:text-paper-100/70'
            }`}
          >
            {loc}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink-600/50 dark:text-paper-100/40 text-center py-16">
          {items === null ? 'Loading…' : 'No items found for this filter.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filtered.map((item) => (
            <figure
              key={item.id}
              className="rounded-card overflow-hidden bg-white dark:bg-ink-900 border border-paper-200 dark:border-ink-700 shadow-card dark:shadow-cardDark"
            >
              <img
                src={item.imageUrl}
                alt={item.description}
                loading="lazy"
                className="w-full h-32 object-cover bg-paper-100 dark:bg-ink-800"
              />
              <figcaption className="p-2.5">
                <p className="text-xs font-semibold text-ink-900 dark:text-paper-50 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center gap-1 mt-1.5 text-[0.7rem] text-ink-600/60 dark:text-paper-100/50">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {item.location} · {formatDate(item.createdAt)}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      )}

      {showForm && (
        <ReportItemForm user={user} profile={profile} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ReportItemForm({ user, profile, onClose }) {
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState(LOCATIONS[1]);
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setPreviewUrl(getPreviewUrl(compressed));
    } catch {
      setError('Could not process that image.');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!imageFile || !description.trim()) {
      setError('A photo and description are both required.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const imageUrl = await uploadToR2(imageFile, 'lostfound');
      await addDoc(collection(db, 'lostFound'), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || 'Student',
        description: description.trim(),
        location,
        imageUrl,
        createdAt: serverTimestamp()
      });
      onClose();
    } catch {
      setError('Failed to submit. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Report a lost or found item"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-950/50 backdrop-blur-sm"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-card p-5 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
            Report an item
          </h3>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 text-ink-600/50">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Blue water bottle with stickers…"
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Location found/lost
        </label>
        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none mb-3"
        >
          {LOCATIONS.filter((l) => l !== 'All locations').map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Photo
        </label>
        <input type="file" accept="image/*" onChange={handleFileSelect} className="text-xs mb-3" />

        {previewUrl && (
          <img src={previewUrl} alt="Item preview" className="w-full rounded-xl max-h-48 object-cover mb-3" />
        )}

        {error && <p role="alert" className="text-sm text-danger-500 mb-3">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl"
        >
          {busy ? 'Submitting…' : 'Submit report'}
        </button>
      </form>
    </div>
  );
}
