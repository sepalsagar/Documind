'use client';

import React, { useState } from 'react';

interface RenameModalProps {
  isOpen: boolean;
  initialTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
}

export const RenameModal: React.FC<RenameModalProps> = ({
  isOpen,
  initialTitle,
  onClose,
  onRename,
}) => {
  if (!isOpen) return null;

  return (
    <RenameModalContent
      initialTitle={initialTitle}
      onClose={onClose}
      onRename={onRename}
    />
  );
};

const RenameModalContent: React.FC<{
  initialTitle: string;
  onClose: () => void;
  onRename: (newTitle: string) => void;
}> = ({ initialTitle, onClose, onRename }) => {
  const [title, setTitle] = useState(initialTitle);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onRename(title.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200 text-[#319795] flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">edit_note</span>
            </div>
            <h3 className="text-base text-slate-900 font-bold">Rename Document</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          Updating the file title updates the associated semantic indices and citation identifiers.
        </p>

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700">Document Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:border-teal-500 focus:bg-white transition-all shadow-2xs"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#319795] hover:bg-teal-700 text-white text-xs font-semibold transition-colors shadow-sm shadow-teal-700/20"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
