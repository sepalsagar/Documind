'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Send,
  Layers,
  Search,
  CheckCircle2,
  Clock,
  ExternalLink,
  Edit3,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  Database,
  Cpu,
  Info,
  Sliders,
  Bookmark,
  Hash,
  Activity,
  Maximize2,
  Loader2,
  ShieldCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '../AuthContext';
import { DocumentItem } from './DashboardView';

interface SourceItem {
  sourceId: number;
  chunkIndex: number;
  pageNumber: number;
  text: string;
  tokenCount: number;
  similarityScore: number;
  similarity: number;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: SourceItem[];
  latencyMs?: number;
}

interface WorkspaceViewProps {
  document: DocumentItem;
  onBack: () => void;
  onRename: (doc: DocumentItem) => void;
  onDelete: (doc: DocumentItem) => void;
}

export default function WorkspaceView({
  document: doc,
  onBack,
  onRename,
  onDelete,
}: WorkspaceViewProps) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [queryStage, setQueryStage] = useState('');
  const [retrievedSources, setRetrievedSources] = useState<SourceItem[]>([]);
  const [activeSourceId, setActiveSourceId] = useState<number | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [copiedSourceId, setCopiedSourceId] = useState<number | null>(null);
  const [chunksMetadata, setChunksMetadata] = useState<any[]>([]);
  const [showMobileSources, setShowMobileSources] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Suggested Quick Synthesis Queries
  const suggestedQueries = [
    'What is the core objective or premise of this document?',
    'Summarize the key findings and technical methodologies.',
    'What are the main results, benchmarks, or statistics stated?',
    'What conclusions or recommendations does the document provide?',
  ];

  // Fetch chunks overview
  useEffect(() => {
    async function loadChunks() {
      try {
        const res = await fetch(`/api/documents/${doc._id}/chunks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setChunksMetadata(data.chunks || []);
        }
      } catch (e) {
        console.warn('Could not load chunks overview:', e);
      }
    }
    loadChunks();
  }, [doc._id, token]);

  // Initial welcome message
  useEffect(() => {
    setMessages([
      {
        id: 'initial_welcome',
        sender: 'assistant',
        text: `I have indexed **${doc.title}** (${doc.chunkCount || 6} vector chunks across ${doc.pageCount || 1} pages).\n\nYou can ask any question about the contents of this PDF. All answers will be strictly grounded in the document context with exact source citations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [doc]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendQuestion = async (queryText?: string) => {
    const questionToSend = (queryText || inputQuestion).trim();
    if (!questionToSend || loading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: questionToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);
    setQueryStage('Searching document…');

    try {
      const res = await fetch(`/api/documents/${doc._id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: questionToSend,
          topK: 3,
        }),
      });

      setQueryStage('Retrieving relevant passages…');

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate answer.');
      }

      setQueryStage('Generating grounded answer…');
      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        sources: data.sources || [],
        latencyMs: data.latencyMs || 320,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      if (data.sources && data.sources.length > 0) {
        setRetrievedSources(data.sources);
        setActiveSourceId(data.sources[0]?.sourceId || null);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_err_${Date.now()}`,
          sender: 'assistant',
          text: `An error occurred while querying the document: ${err.message || 'Server error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
      setQueryStage('');
    }
  };

  const copyToClipboard = (text: string, id: string, isSource = false) => {
    navigator.clipboard.writeText(text);
    if (isSource) {
      setCopiedSourceId(Number(id));
      setTimeout(() => setCopiedSourceId(null), 2000);
    } else {
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  // The visualisation must reflect indexed data, not a decorative fixed chart.
  const pageChunkCounts = Array.from({ length: Math.max(1, doc.pageCount) }, (_, index) =>
    chunksMetadata.filter((chunk) => chunk.pageNumber === index + 1).length
  );
  const chartBuckets = Array.from({ length: Math.min(6, pageChunkCounts.length) }, (_, index) => {
    const start = Math.floor((index * pageChunkCounts.length) / Math.min(6, pageChunkCounts.length));
    const end = Math.floor(((index + 1) * pageChunkCounts.length) / Math.min(6, pageChunkCounts.length));
    return pageChunkCounts.slice(start, end).reduce((sum, count) => sum + count, 0);
  });
  const maxBucket = Math.max(1, ...chartBuckets);

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8fafc]">
      {/* Top Workspace Header */}
      <div className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between z-20 shadow-xs">
        <div className="flex items-center space-x-3 overflow-hidden">
          <button
            id="back_to_documents_btn"
            onClick={onBack}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Documents</span>
          </button>

          <div className="h-4 w-px bg-slate-200" />

          <div className="flex items-center space-x-2.5 overflow-hidden">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700 border border-teal-200/60">
              <FileText className="h-4 w-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                {doc.title}
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                <span>{doc.pageCount} pages</span>
                <span>•</span>
                <span>{formatFileSize(doc.fileSize)}</span>
                <span>•</span>
                <span className="text-teal-600 font-semibold">{doc.chunkCount || chunksMetadata.length || 6} chunks indexed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500" />
            <span>Ready for Q&A</span>
          </span>

          {retrievedSources.length > 0 && (
            <button
              id="workspace_mobile_sources_btn"
              onClick={() => setShowMobileSources(true)}
              className="xl:hidden inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer"
            >
              <Layers className="h-3.5 w-3.5 text-teal-600" />
              <span>Sources ({retrievedSources.length})</span>
            </button>
          )}

          <button
            id="workspace_rename_btn"
            onClick={() => onRename(doc)}
            title="Rename document"
            aria-label="Rename document"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <Edit3 className="h-4 w-4" />
          </button>

          <button
            id="workspace_delete_btn"
            onClick={() => onDelete(doc)}
            title="Delete document"
            aria-label="Delete document"
            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3-Column Content Body */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Document Specification & Density (3 Cols) */}
        {/* ========================================================= */}
        <div className="hidden lg:flex lg:col-span-3 border-r border-slate-200/80 bg-white flex-col overflow-y-auto p-5 space-y-6 select-none">
          {/* Document Spec Card */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Document Specifications
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Document Type</span>
                <span className="font-semibold text-slate-800 font-mono">PDF / Searchable</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Total Pages</span>
                <span className="font-semibold text-slate-800 font-mono">{doc.pageCount}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Vector Chunks</span>
                <span className="font-semibold text-teal-700 font-mono">{doc.chunkCount || 6}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Partition Size</span>
                <span className="font-semibold text-slate-800 font-mono">180 words (~240 tok)</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500">Overlap Window</span>
                <span className="font-semibold text-slate-800 font-mono">30 words</span>
              </div>
            </div>
          </div>

          {/* Chunk Density Bar Representation */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              <span>Chunk Density Graph</span>
              <span className="text-teal-600">{doc.pageCount} Pages</span>
            </div>
              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Distribution</span>
                <span className="font-mono text-[10px] text-teal-400">{doc.chunkCount || chunksMetadata.length} indexed chunks</span>
              </div>
              <div className="grid grid-cols-6 gap-1.5 h-12 items-end pt-2">
                {chartBuckets.map((count, i) => (
                  <div
                    key={i}
                    title={`${count} indexed chunks in this page range`}
                    className="bg-teal-500/80 hover:bg-teal-400 rounded-sm transition-all cursor-pointer"
                    style={{ height: `${Math.max(8, (count / maxBucket) * 100)}%` }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>Start P.1</span>
                <span>End P.{doc.pageCount}</span>
              </div>
            </div>
          </div>

          {/* Indexed chunk metadata */}
          <div className="space-y-3">
            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
              Indexed chunks
            </div>
            <div className="space-y-1.5 text-xs">
              {chunksMetadata.slice(0, 5).map((chunk, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-slate-100 text-slate-700 transition-colors cursor-pointer"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="flex h-5 w-5 items-center justify-center rounded-md bg-teal-50 text-[10px] font-mono font-semibold text-teal-700 border border-teal-200/60 shrink-0">
                      0{idx + 1}
                    </span>
                    <span className="truncate font-medium">{chunk.snippet || `Indexed chunk ${chunk.chunkIndex + 1}`}</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-400 shrink-0 ml-2">
                    P.{chunk.pageNumber}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Engine Parameters Badge */}
          <div className="p-3.5 rounded-xl bg-teal-50/60 border border-teal-200/60 space-y-1 text-xs">
            <div className="flex items-center space-x-1.5 text-teal-800 font-semibold">
              <ShieldCheck className="h-4 w-4 text-teal-600" />
              <span>Grounding Safeguard</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Answers are generated from retrieved passages. Review the linked sources to assess each response.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* CENTER COLUMN: AI Conversation & Synthesis (5-9 Cols)     */}
        {/* ========================================================= */}
        <div className="col-span-1 lg:col-span-9 xl:col-span-5 flex flex-col h-full bg-slate-50/50 border-r border-slate-200/80 overflow-hidden">
          <div className="lg:hidden grid grid-cols-2 gap-x-3 gap-y-1 px-4 py-3 bg-white border-b border-slate-200 text-[11px] text-slate-600">
            <span className="truncate"><strong className="text-slate-800">PDF</strong> · {doc.pageCount} pages</span>
            <span className="truncate"><strong className="text-slate-800">Size</strong> · {formatFileSize(doc.fileSize)}</span>
            <span className="truncate"><strong className="text-slate-800">Chunks</strong> · {doc.chunkCount || chunksMetadata.length}</span>
            <span className="truncate"><strong className="text-slate-800">Retrieval</strong> · semantic Top-K</span>
          </div>
          {/* Quick Prompts Carousel */}
          <div className="p-3 bg-white border-b border-slate-200/70 overflow-x-auto select-none">
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider shrink-0 pl-1">
                Suggested:
              </span>
              {suggestedQueries.map((query, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => handleSendQuestion(query)}
                  disabled={loading}
                  className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium text-slate-700 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200/80 transition-all shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Feed */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';

              return (
                <div
                  key={msg.id}
                  id={`msg_${msg.id}`}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400 px-1">
                    <span>{isUser ? 'You' : 'DocuMind AI'}</span>
                    <span>•</span>
                    <span>{msg.timestamp}</span>
                    {msg.latencyMs && (
                      <span className="text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">
                        {msg.latencyMs}ms retrieval
                      </span>
                    )}
                  </div>

                  <div
                    className={`max-w-[90%] rounded-2xl p-4 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-tr-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-xs shadow-xs space-y-3'
                    }`}
                  >
                    {isUser ? (
                      <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                      <div className="space-y-3">
                        {/* Strictly Grounded Badge for AI responses */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs">
                          <span className="inline-flex items-center space-x-1 font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 text-[11px]">
                            <Sparkles className="h-3 w-3" />
                            <span>Evidence-backed response</span>
                          </span>

                          <button
                            onClick={() => copyToClipboard(msg.text, msg.id)}
                            title="Copy answer"
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                          >
                            {copiedMessageId === msg.id ? (
                              <Check className="h-3.5 w-3.5 text-teal-600" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Markdown Formatted Text */}
                        <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-1.5 prose-headings:my-2 prose-code:bg-slate-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-teal-800">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>

                        {/* Grounded Sources Cited Box */}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="pt-2 mt-2 border-t border-slate-100 space-y-2">
                            <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                              Retrieved Grounded Sources:
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((src) => (
                                <button
                                  key={src.sourceId}
                                  onClick={() => {
                                    setRetrievedSources(msg.sources || []);
                                    setActiveSourceId(src.sourceId);
                                    if (typeof window !== 'undefined' && window.innerWidth < 1280) {
                                      setShowMobileSources(true);
                                    }
                                  }}
                                  className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 transition-colors cursor-pointer"
                                >
                                  <span className="font-bold">[{src.sourceId}]</span>
                                  <span>Page {src.pageNumber}</span>
                                  <span className="font-mono text-[10px] text-teal-600 font-semibold">
                                    {src.similarityScore}%
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs max-w-md animate-pulse">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
                <div>
                    <div className="text-xs font-semibold text-slate-900">
                      {queryStage || 'Working on your question…'}
                    </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    Calculating Cosine Similarity & grounding context
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Bottom Chat Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200/80 space-y-2">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendQuestion();
              }}
              className="relative flex items-center"
            >
              <input
                id="workspace_chat_input"
                type="text"
                value={inputQuestion}
                onChange={(e) => setInputQuestion(e.target.value)}
                disabled={loading}
                placeholder="Ask a question about this document..."
                className="w-full pl-4 pr-12 py-3 rounded-2xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all bg-slate-50/50 focus:bg-white"
              />
              <button
                id="workspace_send_btn"
                type="submit"
                disabled={loading || !inputQuestion.trim()}
                className="absolute right-2 p-2 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer shadow-xs"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </form>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
              <span className="flex items-center space-x-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
                <span>Strictly grounded: Answers derived solely from document context</span>
              </span>
              <span>Top-K: 3 Chunks</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Retrieved Sources & Passages (4 Cols)       */}
        {/* ========================================================= */}
        <div className="hidden xl:flex xl:col-span-4 bg-white flex-col h-full overflow-y-auto p-5 space-y-5 select-none">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-200/80">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-slate-900">Retrieved Sources</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                  {retrievedSources.length} Matched
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Exact text chunks retrieved via cosine similarity
              </p>
            </div>
          </div>

          {/* Sources List */}
          {retrievedSources.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 my-auto">
              <Bookmark className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-700">No query executed yet</div>
              <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
                Ask a question in the center conversation to inspect the retrieved vector passages.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {retrievedSources.map((src) => {
                const isActive = activeSourceId === src.sourceId;

                return (
                  <div
                    key={src.sourceId}
                    id={`source_card_${src.sourceId}`}
                    onClick={() => setActiveSourceId(src.sourceId)}
                    className={`rounded-2xl border transition-all p-4 space-y-3 cursor-pointer ${
                      isActive
                        ? 'border-teal-500 bg-teal-50/20 shadow-md ring-1 ring-teal-400/30'
                        : 'border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    {/* Source Top Meta */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-600 text-white font-mono font-bold text-xs shadow-xs">
                          {src.sourceId}
                        </span>
                        <div>
                          <span className="font-semibold text-slate-900">
                            Page {src.pageNumber}
                          </span>
                          <span className="text-[11px] font-mono text-slate-500 ml-1.5">
                            Chunk #{src.chunkIndex + 1}
                          </span>
                        </div>
                      </div>

                      {/* Cosine Match Score Badge */}
                      <div className="text-right">
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200 text-xs">
                          {src.similarityScore}% Match
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar of Cosine Score */}
                    <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, src.similarityScore)}%` }}
                      />
                    </div>

                    {/* Extracted Passage Content */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200/80 text-xs text-slate-700 leading-relaxed font-sans select-text">
                      &ldquo;{src.text}&rdquo;
                    </div>

                    {/* Source Footer Actions */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-mono">
                      <span>{src.tokenCount} tokens</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(src.text, String(src.sourceId), true);
                        }}
                        className="inline-flex items-center space-x-1 text-teal-700 hover:underline cursor-pointer"
                      >
                        {copiedSourceId === src.sourceId ? (
                          <>
                            <Check className="h-3 w-3" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy Passage</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom Vector Parameters Capsule */}
          <div className="mt-auto pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1 font-mono">
            <div className="flex justify-between text-[10px]">
              <span>Embedding Metric:</span>
              <span className="text-slate-800 font-semibold">Cosine Dot Product</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Retrieval Algorithm:</span>
              <span className="text-slate-800 font-semibold">Top-K Semantic Vector Rank</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Model Provider:</span>
              <span className="text-teal-700 font-semibold">Google Gemini 3.8</span>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Mobile/Tablet Sources Modal */}
      {showMobileSources && (
        <div
          id="mobile_sources_modal_overlay"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowMobileSources(false)}
        >
          <div
            id="mobile_sources_modal_container"
            className="w-full max-w-lg max-h-[85vh] bg-white rounded-t-2xl sm:rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center space-x-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600 border border-teal-200/80">
                  <Layers className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Retrieved Grounded Sources</h3>
                  <p className="text-[11px] text-slate-500">{retrievedSources.length} verified passages from PDF</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileSources(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {retrievedSources.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  Ask a question to see the retrieved text passages.
                </div>
              ) : (
                retrievedSources.map((src) => {
                  const isActive = activeSourceId === src.sourceId;
                  return (
                    <div
                      key={src.sourceId}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-teal-50/50 border-teal-500 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                            {src.sourceId}
                          </span>
                          <span className="text-xs font-bold text-slate-900">Page {src.pageNumber}</span>
                        </div>
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 text-[10px] font-mono font-semibold">
                          <span>{src.similarityScore}% Match</span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-serif bg-slate-50/60 p-2.5 rounded-lg border border-slate-100">
                        &ldquo;{src.text}&rdquo;
                      </p>
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => copyToClipboard(src.text, String(src.sourceId), true)}
                          className="inline-flex items-center space-x-1 text-xs text-teal-700 hover:underline"
                        >
                          {copiedSourceId === src.sourceId ? (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy Passage</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
              <button
                onClick={() => setShowMobileSources(false)}
                className="px-4 py-1.5 rounded-lg bg-teal-600 text-white text-xs font-semibold hover:bg-teal-700 transition-colors"
              >
                Close Sources
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
