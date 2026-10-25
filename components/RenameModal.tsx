'use client';

import React, { useState } from 'react';
import { Edit3, X, Loader2 } from 'lucide-react';
import { useAuth } from './AuthContext';

interface RenameModalProps {
  isOpen: boolean;
  document: { _id: string; title: string } | null;
  onClose: () => void;
  onSuccess: (updatedDoc: any) => void;
}

export default function RenameModal({
  isOpen,
  document: doc,
  onClose,
  onSuccess,
}: RenameModalProps) {
  const { token } = useAuth();
  const [title, setTitle] = useState(doc?.title || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync title when doc changes without triggering cascading effect
  const [prevDocId, setPrevDocId] = useState<string | null>(null);
  if (doc && doc._id !== prevDocId) {
    setPrevDocId(doc._id);
    setTitle(doc.title);
    setError(null);
  }

  if (!isOpen || !doc) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/documents/${doc._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to rename document.');
      }

      onSuccess(data.document);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error occurred while renaming document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="rename_modal_overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
      onClick={() => !loading && onClose()}
    >
      <div
        id="rename_modal_container"
        className="w-full max-w-md rounded-2xl bg-white border border-slate-200/80 shadow-2xl overflow-hidden transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200/60">
              <Edit3 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Rename document</h3>
              <p className="text-xs text-slate-500">Update the display title in your library</p>
            </div>
          </div>
          <button
            id="close_rename_modal_btn"
            disabled={loading}
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="document_title_input" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Document Title
              </label>
              <input
                id="document_title_input"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Annual Report 2026.pdf"
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                autoFocus
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <button
              id="cancel_rename_btn"
              type="button"
              disabled={loading}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="save_rename_btn"
              type="submit"
              disabled={loading || !title.trim()}
              className="inline-flex items-center space-x-2 px-5 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
