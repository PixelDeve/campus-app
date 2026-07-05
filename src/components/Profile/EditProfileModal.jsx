import { useRef, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { updateProfile as updateAuthProfile } from 'firebase/auth';
import { Camera, Loader2, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { compressImage, getPreviewUrl } from '../../utils/imageCompression';
import { uploadToR2 } from '../../utils/r2Upload';

export default function EditProfileModal({ onClose }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [studentClass, setStudentClass] = useState(profile?.studentClass || '');
  const [section, setSection] = useState(profile?.section || '');
  const [roll, setRoll] = useState(profile?.roll || '');
  const [group, setGroup] = useState(profile?.group || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const compressed = await compressImage(file);
      setAvatarFile(compressed);
      setPreviewUrl(getPreviewUrl(compressed));
    } catch {
      setError('Could not process that image. Try a different file.');
    }
  }

  async function handleSave() {
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let avatarUrl = profile?.avatarUrl || '';
      if (avatarFile) {
        avatarUrl = await uploadToR2(avatarFile, 'avatars');
      }

      await updateDoc(doc(db, 'users', user.uid), {
        name: name.trim(),
        bio: bio.trim(),
        studentClass: studentClass.trim(),
        section: section.trim(),
        roll: roll.trim(),
        group: group.trim(),
        avatarUrl
      });

      // Keep Firebase Auth's displayName in sync too (used as a fallback
      // in a couple of places if the Firestore profile hasn't loaded yet).
      await updateAuthProfile(user, { displayName: name.trim() });

      onClose();
    } catch (err) {
      setError('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit profile"
      className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-950/50 backdrop-blur-sm"
    >
      <div className="w-full sm:max-w-md bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-card p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
            Edit profile
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-ink-600/50 hover:bg-paper-100 dark:hover:bg-ink-800"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Avatar picker */}
        <div className="flex justify-center mb-5">
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label="Change profile photo"
            className="relative group"
          >
            <img
              src={previewUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${user?.uid}`}
              alt="Profile avatar preview"
              className="w-20 h-20 rounded-full object-cover bg-paper-100 dark:bg-ink-800 border-2 border-paper-200 dark:border-ink-700"
            />
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-signal-500 flex items-center justify-center border-2 border-white dark:border-ink-900">
              <Camera className="w-3.5 h-3.5 text-white" aria-hidden="true" />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        {/* Class / Section / Roll — three fields side by side to save vertical space */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div>
            <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
              Class
            </label>
            <input
              type="text"
              value={studentClass}
              onChange={(e) => setStudentClass(e.target.value)}
              placeholder="10"
              className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
              Section
            </label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="A"
              className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
              Roll
            </label>
            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="12"
              className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500"
            />
          </div>
        </div>

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Group <span className="text-ink-600/40 dark:text-paper-100/30">(optional)</span>
        </label>
        <input
          type="text"
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          placeholder="Science / Commerce / Arts…"
          className="w-full rounded-xl bg-paper-100 dark:bg-ink-800 px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-3"
        />

        <label className="text-xs font-medium text-ink-600/70 dark:text-paper-100/60 mb-1 block">
          Bio
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          placeholder="A short line about yourself…"
          maxLength={150}
          className="w-full resize-none rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none focus:ring-2 focus:ring-signal-500 mb-1"
        />
        <p className="text-xs text-ink-600/40 dark:text-paper-100/30 text-right mb-3">
          {bio.length}/150
        </p>

        {error && (
          <p role="alert" className="text-sm text-danger-500 mb-3">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
          Save changes
        </button>

        <p className="text-xs text-ink-600/50 dark:text-paper-100/40 text-center mt-3">
          Note: existing posts keep the name/photo you had when you posted them.
        </p>
      </div>
    </div>
  );
}
