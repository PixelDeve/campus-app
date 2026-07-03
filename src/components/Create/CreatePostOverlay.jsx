import { useRef, useState } from 'react';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ImagePlus, Loader2, Plus, X } from 'lucide-react';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { compressImage, getPreviewUrl } from '../../utils/imageCompression';
import { uploadToR2 } from '../../utils/r2Upload';

export default function CreatePostOverlay() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  function reset() {
    setText('');
    setImageFile(null);
    setPreviewUrl(null);
    setError('');
  }

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      // Compress client-side (max 1200px width, 70% JPEG quality) before preview/upload.
      const compressed = await compressImage(file);
      setImageFile(compressed);
      setPreviewUrl(getPreviewUrl(compressed));
    } catch (err) {
      setError('Could not process that image. Try a different file.');
    }
  }

  async function handlePost() {
    if (!text.trim() && !imageFile) {
      setError('Add some text or an image before posting.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      let imageUrl = null;
      if (imageFile) {
        imageUrl = await uploadToR2(imageFile, 'posts');
      }

      await addDoc(collection(db, 'posts'), {
        authorId: user.uid,
        authorName: profile?.name || user.displayName || 'Student',
        authorAvatar: profile?.avatarUrl || '',
        text: text.trim(),
        imageUrl,
        likeCount: 0,
        likedBy: [],
        commentCount: 0,
        flagged: false,
        flagCount: 0,
        flaggedBy: [],
        createdAt: serverTimestamp()
      });

      reset();
      setOpen(false);
    } catch (err) {
      setError('Failed to publish post. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Create new post"
        className="fixed bottom-24 right-5 z-30 w-14 h-14 rounded-full bg-signal-500 hover:bg-signal-600 text-white shadow-lg shadow-signal-500/30 flex items-center justify-center transition-transform active:scale-95"
      >
        <Plus className="w-6 h-6" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create a new post"
          className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-ink-950/50 backdrop-blur-sm px-0 sm:px-4"
        >
          <div className="w-full sm:max-w-lg bg-white dark:bg-ink-900 rounded-t-3xl sm:rounded-card shadow-cardDark p-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-ink-900 dark:text-paper-50">
                New post
              </h2>
              <button
                onClick={() => { setOpen(false); reset(); }}
                aria-label="Close"
                className="p-1.5 rounded-full text-ink-600/50 hover:bg-paper-100 dark:hover:bg-ink-800"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <label htmlFor="post-text" className="sr-only">Post text</label>
            <textarea
              id="post-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What's happening on campus?"
              rows={4}
              className="w-full resize-none rounded-xl bg-paper-100 dark:bg-ink-800 p-3 text-sm outline-none focus:ring-2 focus:ring-signal-500"
            />

            {previewUrl && (
              <div className="relative mt-3">
                <img
                  src={previewUrl}
                  alt="Selected upload preview"
                  className="w-full rounded-xl max-h-72 object-cover"
                />
                <button
                  onClick={() => { setImageFile(null); setPreviewUrl(null); }}
                  aria-label="Remove selected image"
                  className="absolute top-2 right-2 bg-ink-950/70 text-white rounded-full p-1.5"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {error && (
              <p role="alert" className="text-sm text-danger-500 mt-3">{error}</p>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach image"
                className="flex items-center gap-2 text-sm font-medium text-ink-700 dark:text-paper-100/80 hover:text-signal-500 transition-colors"
              >
                <ImagePlus className="w-5 h-5" aria-hidden="true" />
                Add photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                aria-hidden="true"
              />

              <button
                onClick={handlePost}
                disabled={busy}
                className="flex items-center gap-2 bg-signal-500 hover:bg-signal-600 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors"
              >
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
