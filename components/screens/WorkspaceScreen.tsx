'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DocumentItem, GroundingMessage, UserProfile, DocumentChunk } from '@/lib/types';

interface WorkspaceScreenProps {
  document: DocumentItem | null;
  userProfile: UserProfile;
  messages: GroundingMessage[];
  onSendMessage: (query: string) => Promise<void>;
  onNavigateBack: () => void;
  onRequestRename: (doc: DocumentItem) => void;
  onRequestDelete: (doc: DocumentItem) => void;
}

export const WorkspaceScreen: React.FC<WorkspaceScreenProps> = ({
  document: doc,
  userProfile,
  messages,
  onSendMessage,
  onNavigateBack,
  onRequestRename,
  onRequestDelete,
}) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [selectedDensityBar, setSelectedDensityBar] = useState<number | null>(0);
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [isLoadingChunks, setIsLoadingChunks] = useState<boolean>(true);
  const [chunkError, setChunkError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!doc?.id) return;
    let ignore = false;

    fetch(`/api/documents/${doc.id}/chunks`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'Failed to retrieve document chunks');
        }
        return res.json();
      })
      .then((data) => {
        if (ignore) return;
        const retrievedChunks: DocumentChunk[] = data.chunks || [];
        setChunks(retrievedChunks);
        setIsLoadingChunks(false);
      })
      .catch((err) => {
        if (ignore) return;
        setChunkError(err?.message || 'Error loading document chunks');
        setIsLoadingChunks(false);
      });

    return () => {
      ignore = true;
    };
  }, [doc?.id]);

  // Derive real sections from extracted chunks grouped by page
  const sections = React.useMemo(() => {
    if (chunks.length === 0) return [];
    const pageMap = new Map<number, number>();
    for (const c of chunks) {
      pageMap.set(c.pageNumber, (pageMap.get(c.pageNumber) || 0) + 1);
    }
    const sortedPages = Array.from(pageMap.keys()).sort((a, b) => a - b);
    return sortedPages.map((pageNum) => ({
      id: `sec-page-${pageNum}`,
      title: `Page ${pageNum} Content`,
      pageRange: `Page ${pageNum}`,
      chunkCount: pageMap.get(pageNum) || 1,
      pageNumber: pageNum,
    }));
  }, [chunks]);

  const activeSectionId = selectedSectionId || (sections.length > 0 ? sections[0].id : '');

  // Calculate real chunk density per page
  const densityBars = React.useMemo(() => {
    if (chunks.length === 0) return [0];
    const maxPage = Math.max(...chunks.map((c) => c.pageNumber), doc?.pageCount || 1);
    const barCount = Math.min(Math.max(maxPage, 1), 12);
    const bars = new Array(barCount).fill(0);
    for (const c of chunks) {
      const p = Math.min(Math.max(0, c.pageNumber - 1), barCount - 1);
      bars[p]++;
    }
    return bars;
  }, [chunks, doc?.pageCount]);

  // The source panel follows the most recent grounded response. Before a query it
  // continues to show the document's indexed chunks for browsing.
  const displayedChunks = React.useMemo(() => {
    const latestAssistant = [...messages].reverse().find((message) => message.sender === 'assistant');
    const citations = latestAssistant?.citations || [];
    const citedIds = citations.map((citation) => citation.chunkId);
    if (!citedIds.length) return chunks;
    return citedIds.map((id) => {
      const chunk = chunks.find((item) => item.id === id);
      const citation = citations.find((item) => item.chunkId === id);
      return chunk ? { ...chunk, similarityMatch: citation?.similarity ?? 0 } : undefined;
    }).filter((chunk): chunk is DocumentChunk => Boolean(chunk));
  }, [chunks, messages]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSubmitting]);

  if (!doc) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center mb-3">
          <span className="material-symbols-outlined text-[24px]">description</span>
        </div>
        <h3 className="text-base font-bold text-slate-800">No document selected</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
          Select or upload a document from your library to open the semantic workspace.
        </p>
        <button
          onClick={onNavigateBack}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const quickQueries = [
    'What is the main objective of this paper?',
    'Summarize the methodology.',
    'What are the key findings?',
    'Explain the conclusion in simple terms.',
  ];

  const handleQuickQuery = async (query: string) => {
    setInputQuery(query);
    setIsSubmitting(true);
    await onSendMessage(query);
    setIsSubmitting(false);
    setInputQuery('');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isSubmitting) return;

    const query = inputQuery.trim();
    setInputQuery('');
    setIsSubmitting(true);
    await onSendMessage(query);
    setIsSubmitting(false);
  };

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Workspace Document Context Header */}
      <div className="w-full bg-white px-6 py-3.5 border-b border-slate-200/80 shadow-[0_2px_6px_0_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <button
            onClick={onNavigateBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-teal-600 transition-colors group pr-2"
          >
            <span className="material-symbols-outlined text-[16px] group-hover:-translate-x-0.5 transition-transform">
              arrow_back
            </span>
            <span>Documents</span>
          </button>

          <div className="h-4 w-px bg-slate-200 hidden sm:block"></div>

          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-200/80 text-[#319795] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <span className="material-symbols-outlined text-[20px]">description</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <h1 className="text-sm md:text-base text-slate-900 truncate font-bold tracking-tight">
                  {doc.title}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-mono text-[11px] font-semibold border border-teal-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                  <span>{doc.status}</span>
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-400 truncate">
                {doc.pageCount} Pages • {doc.chunkCount} Chunks • Vectorized {doc.uploadDate} • {doc.embeddingModel}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={() => onRequestRename(doc)}
            className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200/90 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px] text-slate-500">edit</span>
            <span>Rename</span>
          </button>
          <button
            onClick={() => onRequestDelete(doc)}
            className="px-3 py-1.5 rounded-lg bg-rose-50/70 hover:bg-rose-100 text-rose-600 text-xs font-semibold border border-rose-200/80 shadow-2xs transition-all flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[15px] text-rose-500">delete</span>
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* 3-Column Studio Workspace Grid */}
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5 p-5 flex-1 items-start">
        {/* LEFT PANEL: Document Metadata & Structural Index (Col 3) */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          {/* Document Spec Card */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Document Spec
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-medium border border-slate-200/60">
                PDF-v1.7
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide block">
                  Pages
                </span>
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  {doc.pageCount}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide block">
                  Size
                </span>
                <span className="text-lg font-bold text-slate-900 tracking-tight">
                  {doc.fileSize}
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide block">
                  Embeddings
                </span>
                <span className="font-mono text-xs text-teal-600 font-bold block truncate">
                  Indexed ({doc.chunkCount})
                </span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wide block">
                  Model
                </span>
                <span className="font-mono text-xs text-slate-700 font-medium block truncate">
                  {doc.embeddingModel || 'semantic-embedding-v1'}
                </span>
              </div>
            </div>

            {/* Visual Chunk Density Chart */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex justify-between items-center text-slate-500 font-mono text-[11px] mb-2">
                <span>Chunk Density / Page</span>
                <span className="text-teal-600 font-semibold">
                  Avg {(chunks.length / Math.max(1, doc.pageCount)).toFixed(1)} ch/p
                </span>
              </div>
              <div className="h-10 w-full bg-slate-50 rounded-xl border border-slate-200/60 flex items-end justify-between gap-1.5 px-3 py-2">
                {densityBars.map((val, idx) => {
                  const isActiveBar = selectedDensityBar === idx;
                  const isHighDensity = val >= 5;
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDensityBar(idx)}
                      style={{ height: `${Math.min(100, val * 16 + 12)}%` }}
                      className={`w-full rounded-xs transition-all cursor-pointer ${
                        isActiveBar
                          ? 'bg-[#319795] shadow-xs'
                          : isHighDensity
                          ? 'bg-teal-400 hover:bg-[#319795]'
                          : 'bg-teal-100 hover:bg-teal-200'
                      }`}
                      title={`Page ${idx + 1}: ${val} chunks`}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          {/* Document Sections Index */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="flex items-center justify-between pb-2.5 mb-1 border-b border-slate-100">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                Semantic Sections
              </span>
              <span className="font-mono text-[10px] text-slate-400 font-medium">
                {sections.length} nodes
              </span>
            </div>

            <div className="flex flex-col gap-1 pt-1">
              {sections.map((sec) => {
                const isActive = activeSectionId === sec.id;
                if (isActive) {
                  return (
                    <div
                      key={sec.id}
                      className="w-full p-2.5 rounded-xl bg-teal-50/70 border border-teal-200 flex items-start justify-between relative overflow-hidden shadow-2xs"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#319795]"></div>
                      <div className="min-w-0 pl-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-teal-900 truncate">
                            {sec.title}
                          </span>
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                        </div>
                        <span className="font-mono text-[10px] text-teal-700 font-medium">
                          {sec.pageRange} • Active in RAG Query
                        </span>
                      </div>
                      <span className="font-mono text-[9px] font-bold bg-[#319795] text-white px-2 py-0.5 rounded shadow-2xs tracking-wider uppercase">
                        Active
                      </span>
                    </div>
                  );
                }

                return (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSectionId(sec.id)}
                    className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-start justify-between group border border-transparent hover:border-slate-200/60"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-700 truncate group-hover:text-teal-700 transition-colors">
                        {sec.title}
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">
                        {sec.pageRange} • {sec.chunkCount} chunks
                      </span>
                    </div>
                    <span className="material-symbols-outlined text-[15px] text-slate-300 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-teal-600">verified</span>
                  <span className="font-mono text-[10px] text-slate-600 font-medium">
                    Similarity cache synced
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 font-semibold">0.02ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL: Grounded Answer Canvas & Chat (Col 5) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Query Prompts Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
              Quick Synthesis Queries
            </span>
            <div className="flex flex-wrap gap-1.5">
              {quickQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickQuery(q)}
                  disabled={isSubmitting}
                  className="text-left px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 text-slate-700 text-xs font-medium border border-slate-200/70 transition-all active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Grounding Session Thread Container */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex flex-col gap-5">
            {/* Timestamp Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px bg-slate-200 flex-1"></div>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                Grounding Session Started
              </span>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>

            {/* Message Stream */}
            <div
              ref={chatScrollRef}
              className="flex flex-col gap-4 max-h-[480px] overflow-y-auto pr-1 no-scrollbar"
            >
              {messages.map((msg) => {
                if (msg.sender === 'user') {
                  return (
                    <div key={msg.id} className="flex justify-end w-full">
                      <div className="max-w-[88%] bg-[#0f766e] text-white rounded-2xl rounded-tr-sm p-4 shadow-sm shadow-teal-900/20">
                        <div className="flex items-center justify-between gap-4 mb-1.5">
                          <span className="text-xs text-teal-100 font-semibold">
                            {msg.authorName || userProfile.name}
                          </span>
                          <span className="font-mono text-[10px] text-teal-200">{msg.timestamp}</span>
                        </div>
                        <p className="text-xs md:text-sm text-white leading-relaxed font-normal">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex items-start gap-3 w-full">
                    <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center flex-shrink-0 text-teal-700 shadow-2xs">
                      <span className="material-symbols-outlined text-[18px]">neurology</span>
                    </div>

                    <div className="flex-1 bg-slate-50/80 border border-slate-200/80 rounded-2xl rounded-tl-sm p-4.5">
                      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-slate-200/60">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {msg.authorName || 'DocuMind Intelligence'}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-teal-100/70 text-teal-800 border border-teal-200 font-mono text-[10px] font-semibold">
                            Strictly Grounded
                          </span>
                        </div>
                        <span className="font-mono text-[11px] text-slate-400">
                          {msg.retrievalTime || '0.48s retrieval'}
                        </span>
                      </div>

                      {/* Content with parsed citations */}
                      <div className="space-y-3 text-xs md:text-sm text-slate-700 leading-relaxed font-normal whitespace-pre-wrap">
                        {msg.content}
                      </div>

                      {/* Inline Grounded Sources cited in this turn */}
                      {msg.citations && msg.citations.length > 0 && (
                        <div className="mt-4 pt-3 bg-white rounded-xl p-3 border border-slate-200/70 shadow-2xs">
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="material-symbols-outlined text-[15px] text-[#319795]">
                              verified
                            </span>
                            <span className="text-xs font-bold text-slate-800">
                              Grounded Sources Cited
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row flex-wrap gap-1.5">
                            {msg.citations.map((cite) => (
                              <button
                                key={cite.id}
                                onClick={() => {
                                  setHighlightedSourceId(cite.chunkId);
                                  setSelectedSectionId(`sec-page-${cite.pageNumber}`);
                                }}
                                className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] transition-all flex items-center gap-1.5 truncate max-w-xs text-left ${
                                  highlightedSourceId === cite.chunkId
                                    ? 'bg-teal-100 border-teal-400 text-teal-900 shadow-xs'
                                    : 'bg-slate-50 hover:bg-teal-50 text-slate-700 border-slate-200/80 hover:border-teal-200'
                                }`}
                              >
                                <span className="font-bold text-[#319795]">[{cite.id}]</span>
                                <span className="truncate">{cite.sourceText}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Response Footer Telemetry */}
                      <div className="flex items-center justify-between mt-3 pt-2 text-slate-400 font-mono text-[11px]">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(msg.content)}
                            className="hover:text-teal-700 transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[15px]">content_copy</span>
                            <span>Copy</span>
                          </button>
                          <span>•</span>
                          <button className="hover:text-teal-700 transition-colors">
                            <span className="material-symbols-outlined text-[15px]">thumb_up</span>
                          </button>
                          <button className="hover:text-rose-600 transition-colors">
                            <span className="material-symbols-outlined text-[15px]">thumb_down</span>
                          </button>
                        </div>
                        <span className="flex items-center gap-1 text-teal-700 font-medium">
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                          Source-isolated vector lookup
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isSubmitting && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-teal-50/60 border border-teal-200/70 text-teal-900 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[18px] animate-spin text-teal-600">
                    progress_activity
                  </span>
                  <span>Performing vector lookup & generating grounded synthesis...</span>
                </div>
              )}
            </div>

            {/* CHAT INPUT BAR */}
            <div className="pt-2">
              <form
                onSubmit={handleFormSubmit}
                className="bg-white rounded-2xl border border-slate-200 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] p-2 flex flex-col gap-1.5 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-50 transition-all"
              >
                <div className="flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-[#319795] text-[20px]">
                    smart_toy
                  </span>
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder="Ask a question about this document..."
                    disabled={isSubmitting}
                    className="w-full py-2 bg-transparent text-slate-800 text-xs md:text-sm focus:outline-none placeholder:text-slate-400 font-normal"
                  />
                  <button
                    type="submit"
                    disabled={!inputQuery.trim() || isSubmitting}
                    className="w-9 h-9 rounded-xl bg-[#319795] hover:bg-teal-700 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 shadow-sm shadow-teal-700/25"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </button>
                </div>

                <div className="flex items-center justify-between px-2 pt-1.5 border-t border-slate-100">
                  <span className="font-mono text-[10px] text-slate-400">
                    Strict citation grounding enabled • Hallucination safeguard active
                  </span>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-teal-700 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
                    <span>Ready • {doc.chunkCount} chunks</span>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: RAG Sources Inspection Panel (Col 4) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Panel Header Card */}
          <div className="bg-white rounded-2xl p-4.5 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                  Retrieved Sources
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#319795] text-white font-mono text-[10px] font-bold shadow-2xs">
                  {displayedChunks.length}
                </span>
              </div>
              <p className="font-mono text-[11px] text-slate-400 mt-0.5">
                Matched via Vector Cosine Similarity
              </p>
            </div>
            <button
              className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition-colors border border-slate-200/60"
              title="Filter Chunks"
            >
              <span className="material-symbols-outlined text-[17px]">tune</span>
            </button>
          </div>

          {/* LOADING STATE */}
          {isLoadingChunks && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs flex flex-col items-center justify-center text-center">
              <span className="material-symbols-outlined text-[28px] animate-spin text-teal-600 mb-2">
                progress_activity
              </span>
              <p className="text-xs font-bold text-slate-800">Loading document chunks...</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Fetching vectorized text from database
              </p>
            </div>
          )}

          {/* ERROR STATE */}
          {chunkError && !isLoadingChunks && (
            <div className="bg-white rounded-2xl p-5 border border-rose-200 shadow-xs flex items-start gap-3 text-rose-700">
              <span className="material-symbols-outlined text-[20px] text-rose-500 shrink-0">
                error
              </span>
              <div>
                <p className="text-xs font-bold">Failed to load chunks</p>
                <p className="text-[11px] text-rose-600 mt-0.5">{chunkError}</p>
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {!isLoadingChunks && !chunkError && chunks.length === 0 && (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 flex items-center justify-center mb-2.5">
                <span className="material-symbols-outlined text-[20px]">layers_clear</span>
              </div>
              <p className="text-xs font-bold text-slate-800">No chunks available</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                {doc.status === 'Processing' || doc.rawStatus === 'processing'
                  ? 'Document is currently being processed and vectorized.'
                  : doc.status === 'Failed' || doc.rawStatus === 'failed'
                  ? `Ingestion failed: ${doc.errorMessage || 'Unable to extract chunks.'}`
                  : 'No text chunks could be extracted from this PDF.'}
              </p>
            </div>
          )}

          {/* CHUNK SOURCE CARDS */}
          {!isLoadingChunks &&
            displayedChunks.map((chunk, idx) => {
              const isHighlighted = highlightedSourceId === chunk.id;
              const matchPercent = Math.round((chunk.similarityMatch || 0.95) * 100);
              const textContent = chunk.content || (chunk as any).text || '';

              return (
                <div
                  key={chunk.id}
                  id={chunk.id}
                  className={`bg-white rounded-2xl p-4.5 border transition-all relative overflow-hidden ${
                    isHighlighted
                      ? 'border-teal-500 ring-2 ring-teal-500/20 shadow-md bg-teal-50/20'
                      : 'border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-[#319795] text-white font-mono text-[11px] flex items-center justify-center font-bold shadow-2xs">
                        {idx + 1}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-slate-900">
                          Page {chunk.pageNumber} • Chunk #{chunk.chunkNumber || idx + 1}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          Tokens: {chunk.tokens || Math.round((chunk as any).wordCount * 1.3) || 120} • Pos: {chunk.positionPercent || Math.round(((idx + 1) / displayedChunks.length) * 100)}%
                        </span>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 font-mono text-[11px] font-bold border border-teal-200/80">
                      {matchPercent}% Match
                    </span>
                  </div>

                  {/* Similarity Meter */}
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-500 to-[#319795] h-1.5 rounded-full transition-all"
                      style={{ width: `${matchPercent}%` }}
                    ></div>
                  </div>

                  {/* Chunk Content */}
                  <div className="bg-slate-50 rounded-xl p-3 text-xs leading-relaxed text-slate-700 border border-slate-200/60 font-normal whitespace-pre-wrap max-h-56 overflow-y-auto">
                    {textContent}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2 text-slate-400 font-mono text-[10px] border-t border-slate-100">
                    <span className="flex items-center gap-1 text-slate-600">
                      <span className="material-symbols-outlined text-[13px] text-teal-600">
                        auto_stories
                      </span>
                      <span>Page {chunk.pageNumber}</span>
                    </span>
                    <button
                      onClick={() => {
                        setSelectedSectionId(`sec-page-${chunk.pageNumber}`);
                        setHighlightedSourceId(chunk.id);
                      }}
                      className="hover:text-teal-700 text-slate-700 transition-colors flex items-center gap-0.5 font-bold"
                    >
                      <span>Focus section</span>
                      <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                    </button>
                  </div>
                </div>
              );
            })}

          {/* Bottom Metric Capsule */}
          <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.04),0_8px_10px_-6px_rgba(0,0,0,0.02)] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center text-[#319795]">
                <span className="material-symbols-outlined text-[16px]">hub</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-900">Index Parameters</span>
                <span className="font-mono text-[10px] text-slate-400">HNSW M=16 ef=64</span>
              </div>
            </div>
            <span className="font-mono text-[11px] bg-slate-50 border border-slate-200/70 px-2.5 py-0.5 rounded-md text-slate-700 font-bold">
              Top-K: 3
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
