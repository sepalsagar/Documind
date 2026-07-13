'use client';

import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  documentTitle: string;
  chunkCount: number;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  documentTitle,
  chunkCount,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md w-full flex flex-col gap-4 border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">warning</span>
            </div>
            <h3 className="text-base text-rose-600 font-bold">Delete Document?</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        <div className="bg-rose-50/60 border border-rose-100 rounded-xl p-3.5 text-slate-800">
          <p className="text-xs leading-relaxed">
            Are you sure you want to delete{' '}
            <span className="font-bold text-rose-600">&quot;{documentTitle}&quot;</span>?
          </p>
          <p className="font-mono text-[10.5px] text-slate-500 mt-1.5 leading-normal">
            This will permanently purge {chunkCount} vector embeddings, stored metadata, and clear the grounded context.
          </p>
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
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 text-xs font-semibold transition-colors shadow-sm shadow-rose-600/20"
          >
            Yes, Delete Document
          </button>
        </div>
      </div>
    </div>
  );
};
