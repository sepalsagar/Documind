'use client';

import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Edit3,
  Trash2,
  Layers,
  RefreshCw,
  FolderOpen,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export interface DocumentItem {
  _id: string;
  userId: string;
  title: string;
  originalName: string;
  fileSize: number;
  pageCount: number;
  chunkCount: number;
  status: 'Ready' | 'Processing' | 'Failed';
  errorMessage?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface DashboardViewProps {
  view: 'dashboard' | 'documents';
  onOpenUpload: () => void;
  onOpenWorkspace: (doc: DocumentItem) => void;
  onRenameDoc: (doc: DocumentItem) => void;
  onDeleteDoc: (doc: DocumentItem) => void;
}

export default function DashboardView({
  view,
  onOpenUpload,
  onOpenWorkspace,
  onRenameDoc,
  onDeleteDoc,
}: DashboardViewProps) {
  const { user, token } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Ready' | 'Processing' | 'Failed'>('All');
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshInFlight = React.useRef(false);

  useEffect(() => {
    let ignore = false;
    const controller = new AbortController();

    fetch('/api/documents', {
      // The session is an HttpOnly cookie. Only add a bearer header when a
      // caller explicitly has one; `Bearer null` is neither useful nor safe.
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed'))))
      .then((data) => {
        if (!ignore) {
          setDocuments(data.documents || []);
          setLoadError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        console.error('Error fetching documents:', err);
        if (!ignore) {
          setLoadError('We could not load your documents. Check your connection and try again.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [token, refreshCount]);

  const handleRefresh = () => {
    if (refreshInFlight.current) return;
    refreshInFlight.current = true;
    setLoading(true);
    setRefreshCount((c) => c + 1);
    window.setTimeout(() => {
      refreshInFlight.current = false;
    }, 500);
  };

  const flagForReupload = async (doc: DocumentItem) => {
    const response = await fetch(`/api/documents/${doc._id}/reprocess`, { method: 'POST' });
    const data = await response.json();
    if (!response.ok) {
      setLoadError(data.error || 'We could not inspect this document.');
      return;
    }
    setLoadError(data.message || 'The document was flagged for re-upload.');
    handleRefresh();
  };

  // Filtered documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.originalName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || doc.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDocs = documents.length;
  const readyDocs = documents.filter((d) => d.status === 'Ready').length;
  const processingDocs = documents.filter((d) => d.status === 'Processing').length;

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (dateInput: string | Date) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Get greeting time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const isLibrary = view === 'documents';
  const indexedChunks = documents.reduce((total, doc) => total + doc.chunkCount, 0);
  const displayedDocuments = isLibrary ? filteredDocuments : documents.slice(0, 5);

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8 space-y-8 select-none">
      {/* Top Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isLibrary ? 'Document Library' : `${getGreeting()}, ${user?.name ? user.name.split(' ')[0] : 'Researcher'}`}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {isLibrary ? 'Manage your PDFs and open a document-specific workspace.' : 'Search and understand your documents with grounded retrieval.'}
          </p>
        </div>

        <button
          id="dashboard_upload_cta"
          onClick={onOpenUpload}
          className="inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-all cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Document</span>
        </button>
      </div>

      {loadError && (
        <div role="alert" className="flex items-center justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          <span>{loadError}</span>
          <button onClick={handleRefresh} className="shrink-0 font-semibold underline underline-offset-2">Try again</button>
        </div>
      )}

      {/* Metrics Row */}
      {!isLibrary && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Documents
            </span>
            <div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">
              {totalDocs}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Indexed in repository</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <FileText className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-teal-600">
              Ready for Q&A
            </span>
            <div className="mt-1 text-2xl font-extrabold text-teal-600 font-mono">
              {readyDocs}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Vector embeddings active</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Processing
            </span>
            <div className="mt-1 text-2xl font-extrabold text-slate-700 font-mono">
              {processingDocs}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">Ingesting and chunking</span>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60">
            <Clock className="h-5 w-5" />
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div><span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Indexed Chunks</span><div className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">{indexedChunks}</div><span className="text-xs text-slate-500 mt-1 block">Searchable passages</span></div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60"><Layers className="h-5 w-5" /></div>
        </div>
      </div>
      }

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/40">
          {!isLibrary && <div className="text-sm font-bold text-slate-900">Recent documents <span className="ml-2 text-xs font-normal text-slate-500">Your latest indexed files</span></div>}
          {/* Search Input */}
          {isLibrary && <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              id="document_search_input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search documents by title or filename..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>}

          {/* Status Filter Tabs */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
            {isLibrary &&
            (['All', 'Ready', 'Processing', 'Failed'] as const).map((st) => (
              <button
                key={st}
                id={`filter_tab_${st.toLowerCase()}`}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {st}
              </button>
            ))}

            <button
              id="refresh_documents_btn"
              onClick={handleRefresh}
              title="Refresh document list"
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Documents Table or Empty State */}
        {loading ? (
          <div aria-label="Loading documents" className="space-y-3 p-5">
            {[1, 2, 3].map((row) => <div key={row} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}
          </div>
        ) : displayedDocuments.length === 0 ? (
          <div id="documents_empty_state" className="py-16 px-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 mb-4">
              <FolderOpen className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Your document library is empty</h3>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              {searchQuery
                ? `No documents matching "${searchQuery}". Clear your search query or upload a new PDF.`
                : 'Upload your first PDF to generate semantic embeddings and start asking grounded questions.'}
            </p>
            <div className="mt-6">
              <button
                id="empty_state_upload_btn"
                onClick={onOpenUpload}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-6">Document</th>
                  <th className="py-3 px-4">Size & Pages</th>
                  <th className="py-3 px-4">Chunks</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Uploaded</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {displayedDocuments.map((doc) => {
                  return (
                    <tr
                      key={doc._id}
                      id={`doc_row_${doc._id}`}
                      className="group hover:bg-slate-50/80 transition-colors"
                    >
                      {/* Document Name */}
                      <td className="py-4 px-6">
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => onOpenWorkspace(doc)}
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 border border-teal-200/60 group-hover:bg-teal-100 transition-colors">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="overflow-hidden max-w-xs sm:max-w-sm">
                            <div className="font-semibold text-slate-900 truncate group-hover:text-teal-700 transition-colors">
                              {doc.title}
                            </div>
                            <div className="text-xs font-mono text-slate-500 truncate">
                              {doc.originalName}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Size & Pages */}
                      <td className="py-4 px-4 text-xs font-mono text-slate-600 whitespace-nowrap">
                        <div>{formatFileSize(doc.fileSize)}</div>
                        <div className="text-[11px] text-slate-500">{doc.pageCount} {doc.pageCount === 1 ? 'page' : 'pages'}</div>
                      </td>

                      {/* Chunks */}
                      <td className="py-4 px-4 text-xs font-mono whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          <Layers className="h-3 w-3 text-teal-600" />
                          <span>{doc.chunkCount} chunks</span>
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {doc.status === 'Ready' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                            <span>Ready</span>
                          </span>
                        )}
                        {doc.status === 'Processing' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            <span>Processing...</span>
                          </span>
                        )}
                        {doc.status === 'Failed' && (
                          <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle className="h-3.5 w-3.5" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>

                      {/* Upload Date */}
                      <td className="py-4 px-4 text-xs font-mono text-slate-500 whitespace-nowrap">
                        {formatDate(doc.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center space-x-1.5">
                          {doc.status === 'Ready' && (
                            <button
                              id={`reprocess_doc_btn_${doc._id}`}
                              onClick={() => flagForReupload(doc)}
                              title="Check for raw PDF extraction and flag for re-upload"
                              className="p-1.5 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            id={`open_workspace_btn_${doc._id}`}
                            onClick={() => onOpenWorkspace(doc)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
                          >
                            <span>Open</span>
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </button>

                          <button
                            id={`rename_doc_btn_${doc._id}`}
                            onClick={() => onRenameDoc(doc)}
                            title="Rename document"
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            id={`delete_doc_btn_${doc._id}`}
                            onClick={() => onDeleteDoc(doc)}
                            title="Delete document"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
