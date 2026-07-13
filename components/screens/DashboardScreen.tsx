'use client';

import React, { useState } from 'react';
import { DocumentItem, UserProfile } from '@/lib/types';

interface DashboardScreenProps {
  documents: DocumentItem[];
  userProfile: UserProfile;
  onOpenDocument: (doc: DocumentItem) => void;
  onOpenUploadModal: () => void;
  onRequestRename: (doc: DocumentItem) => void;
  onRequestDelete: (doc: DocumentItem) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  documents,
  userProfile,
  onOpenDocument,
  onOpenUploadModal,
  onRequestRename,
  onRequestDelete,
}) => {
  const [filter, setFilter] = useState<'All' | 'Ready' | 'Processing' | 'Failed'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEmptyStateForced, setShowEmptyStateForced] = useState(false);

  const readyCount = documents.filter((d) => d.status === 'Ready').length;
  const processingCount = documents.filter((d) => d.status === 'Processing').length;
  const failedCount = documents.filter((d) => d.status === 'Failed').length;
  const totalChunks = documents.reduce((acc, curr) => acc + (curr.chunkCount || 0), 0);

  const filteredDocs = documents.filter((doc) => {
    if (filter === 'Ready' && doc.status !== 'Ready') return false;
    if (filter === 'Processing' && doc.status !== 'Processing') return false;
    if (filter === 'Failed' && doc.status !== 'Failed') return false;
    if (
      searchQuery.trim() &&
      !doc.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !doc.filename.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const isEmpty = showEmptyStateForced || documents.length === 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header Bar with Contextual Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <span className="text-[26px] text-slate-900 tracking-tight font-extrabold">
              Good morning, {userProfile.name.split(' ')[0]}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200/80">
              {userProfile.tier}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Search and understand your documents with high-precision semantic AI.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="toggle-empty-view-btn"
            onClick={() => setShowEmptyStateForced(!showEmptyStateForced)}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-2 shadow-xs border border-slate-200/80"
          >
            <span className="material-symbols-outlined text-[18px] text-slate-500">
              {showEmptyStateForced ? 'table_view' : 'visibility'}
            </span>
            <span>{showEmptyStateForced ? 'View Document List' : 'View Empty State'}</span>
          </button>

          <button
            id="upload-doc-cta-btn"
            onClick={onOpenUploadModal}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-teal-600/25 active:scale-95"
          >
            <span className="material-symbols-outlined text-[19px]">upload_file</span>
            <span>+ Upload document</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat Card 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Documents
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {documents.length} Total
              </span>
              <span className="text-xs font-bold text-teal-600">+55%</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Full semantic index
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/30">
            <span className="material-symbols-outlined text-[24px]">folder_open</span>
          </div>
        </div>

        {/* Stat Card 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Active &amp; Ready
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {readyCount} Ready
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span> Active
              </span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              {totalChunks} vector chunks
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-500 text-white flex items-center justify-center shadow-md shadow-teal-500/30">
            <span className="material-symbols-outlined text-[24px]">check_circle</span>
          </div>
        </div>

        {/* Stat Card 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-slate-100/90 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              In Pipeline
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-800 tracking-tight">
                {processingCount} Processing
              </span>
              <span className="text-xs font-bold text-amber-600">65%</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400 mt-1 block">
              Extracting embeddings
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-800 text-white flex items-center justify-center shadow-md shadow-slate-900/20">
            <span className="material-symbols-outlined text-[24px] animate-spin">sync</span>
          </div>
        </div>
      </div>

      {/* Active Documents Content Area or Empty State */}
      {isEmpty ? (
        <div
          id="documents-empty-state"
          className="bg-white rounded-2xl p-10 text-center shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 max-w-2xl mx-auto w-full space-y-4 my-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 text-teal-600 flex items-center justify-center mx-auto shadow-sm">
            <span className="material-symbols-outlined text-[36px]">library_add</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xl text-slate-800 font-bold">Your document library is empty</h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              Upload your first PDF to start asking questions, extracting key citations, and generating synthesis.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={onOpenUploadModal}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs inline-flex items-center gap-2 shadow-md shadow-teal-600/25 transition-all font-bold"
            >
              <span className="material-symbols-outlined text-[20px]">upload_file</span>
              <span>Upload PDF</span>
            </button>
          </div>
        </div>
      ) : (
        <div id="documents-filled-state" className="space-y-4">
          {/* Section Header and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg text-slate-800 tracking-tight font-bold">Your documents</h2>
              <span className="font-mono text-[11px] text-teal-700 bg-teal-50 border border-teal-200/70 px-2.5 py-0.5 rounded-full font-semibold">
                vRAG Ingestion
              </span>
            </div>

            {/* Controls: Search & Segmented Filter Pills */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative min-w-[260px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-400 pointer-events-none">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search documents..."
                  className="w-full pl-9 pr-3.5 py-2 bg-white rounded-xl text-slate-800 border border-slate-200/80 text-xs shadow-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex items-center bg-slate-100/90 p-1 rounded-xl border border-slate-200/60 gap-1 overflow-x-auto">
                <button
                  onClick={() => setFilter('All')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${
                    filter === 'All'
                      ? 'bg-white text-slate-800 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  All ({documents.length})
                </button>
                <button
                  onClick={() => setFilter('Ready')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${
                    filter === 'Ready'
                      ? 'bg-white text-slate-800 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  Ready ({readyCount})
                </button>
                <button
                  onClick={() => setFilter('Processing')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${
                    filter === 'Processing'
                      ? 'bg-white text-slate-800 font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 font-semibold'
                  }`}
                >
                  Processing ({processingCount})
                </button>
                <button
                  onClick={() => setFilter('Failed')}
                  className={`px-3 py-1.5 rounded-lg text-[12px] transition-all whitespace-nowrap ${
                    filter === 'Failed'
                      ? 'bg-white text-slate-800 font-bold shadow-xs'
                      : 'text-slate-400 hover:text-slate-600 font-semibold opacity-60'
                  }`}
                >
                  Failed ({failedCount})
                </button>
              </div>
            </div>
          </div>

          {/* Document Table Card */}
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.03)] border border-slate-100/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-100 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="py-3.5 px-6">Document</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Uploaded</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Indexing Details</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((doc) => {
                    const isProcessing = doc.status === 'Processing';
                    return (
                      <tr
                        key={doc.id}
                        className={`transition-colors group ${
                          isProcessing ? 'hover:bg-slate-50/60 bg-slate-50/20' : 'hover:bg-slate-50/60'
                        }`}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 transition-all shadow-xs ${
                                isProcessing
                                  ? 'bg-slate-100 border border-slate-200/70 text-teal-700'
                                  : 'bg-teal-50 border border-teal-100/80 text-teal-600 group-hover:bg-teal-500 group-hover:text-white'
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[20px] ${
                                  isProcessing ? 'animate-spin text-teal-600' : ''
                                }`}
                              >
                                {isProcessing ? 'sync' : 'picture_as_pdf'}
                              </span>
                            </div>
                            <div className="min-w-0 max-w-sm">
                              <button
                                onClick={() => !isProcessing && onOpenDocument(doc)}
                                disabled={isProcessing}
                                className={`text-left text-sm font-bold truncate block transition-colors ${
                                  isProcessing
                                    ? 'text-slate-800 cursor-default'
                                    : 'text-slate-800 group-hover:text-teal-600'
                                }`}
                              >
                                {doc.title}
                              </button>
                              <span className="font-mono text-[11px] text-slate-400 truncate block mt-0.5">
                                {doc.filename}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap hidden sm:table-cell text-xs text-slate-500 font-medium">
                          {doc.uploadDate}
                        </td>

                        <td className="py-4 px-4 hidden md:table-cell">
                          {isProcessing ? (
                            <div className="w-36">
                              <div className="flex justify-between font-mono text-[11px] text-slate-600 font-semibold mb-1">
                                <span>Embedding</span>
                                <span className="text-teal-600 font-bold">{doc.progress || 65}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200/60">
                                <div
                                  className="bg-gradient-to-r from-teal-500 to-teal-400 h-1.5 rounded-full transition-all duration-500"
                                  style={{ width: `${doc.progress || 65}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 font-mono text-xs text-slate-500">
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 font-medium">
                                {doc.pageCount} pages
                              </span>
                              <span className="text-slate-300">•</span>
                              <span className="px-2 py-0.5 rounded-md bg-teal-50 border border-teal-100 font-bold text-teal-700">
                                {doc.chunkCount} chunks
                              </span>
                            </div>
                          )}
                        </td>

                        <td className="py-4 px-4 whitespace-nowrap">
                          {isProcessing ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/70 text-slate-700 text-[11px] font-semibold">
                              <span className="material-symbols-outlined text-[13px] animate-spin text-teal-600">
                                progress_activity
                              </span>
                              Extracting text... {doc.progress || 65}%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/60 text-teal-700 text-[11px] font-bold">
                              <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                              Ready
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isProcessing ? (
                              <>
                                <button
                                  disabled
                                  className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-400 text-xs font-medium opacity-60 cursor-not-allowed"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => onRequestDelete(doc)}
                                  className="px-3.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => onOpenDocument(doc)}
                                  className="px-3.5 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-xs shadow-teal-600/20"
                                >
                                  Open
                                </button>
                                <button
                                  onClick={() => onRequestRename(doc)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                  title="Rename"
                                >
                                  <span className="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button
                                  onClick={() => onRequestDelete(doc)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                                  title="Delete"
                                >
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
