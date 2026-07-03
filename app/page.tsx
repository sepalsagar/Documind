'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { LoginScreen } from '@/components/screens/LoginScreen';
import { DashboardScreen } from '@/components/screens/DashboardScreen';
import { WorkspaceScreen } from '@/components/screens/WorkspaceScreen';
import { SettingsScreen } from '@/components/screens/SettingsScreen';
import { UploadModal } from '@/components/modals/UploadModal';
import { RenameModal } from '@/components/modals/RenameModal';
import { DeleteModal } from '@/components/modals/DeleteModal';
import { defaultUserProfile } from '@/lib/mock-data';
import { DocumentItem, GroundingMessage, UserProfile } from '@/lib/types';

export default function Home() {
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'documents' | 'workspace' | 'settings' | 'login'
  >('dashboard');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);
  const [messages, setMessages] = useState<GroundingMessage[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(defaultUserProfile);
  const [globalSearch, setGlobalSearch] = useState('');

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  // Quick switch banner for screen showcase
  const [showScreenSwitcher, setShowScreenSwitcher] = useState(true);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        const docs: DocumentItem[] = data.documents || [];
        setDocuments(docs);
        if (docs.length > 0) {
          setActiveDoc((prev) => {
            if (prev) {
              const stillExists = docs.find((d) => d.id === prev.id);
              return stillExists || docs[0];
            }
            return docs[0];
          });
        } else {
          setActiveDoc(null);
        }
      } else if (res.status === 401) {
        setAuthStatus('unauthenticated');
        setCurrentTab('login');
      }
    } catch {
      // Network error or server unavailable
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const initAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (ignore) return;
        if (res.ok) {
          const data = await res.json();
          if (ignore) return;
          if (data.user) {
            setUserProfile((prev) => ({
              ...prev,
              name: data.user.name || prev.name,
              email: data.user.email || prev.email,
            }));
          }
          setAuthStatus('authenticated');
          const docsRes = await fetch('/api/documents');
          if (ignore) return;
          if (docsRes.ok) {
            const docData = await docsRes.json();
            const docs: DocumentItem[] = docData.documents || [];
            setDocuments(docs);
            if (docs.length > 0) {
              setActiveDoc(docs[0]);
            } else {
              setActiveDoc(null);
            }
          }
        } else {
          setAuthStatus('unauthenticated');
          setCurrentTab('login');
        }
      } catch {
        if (!ignore) {
          setAuthStatus('unauthenticated');
          setCurrentTab('login');
        }
      }
    };

    void initAuth();

    return () => {
      ignore = true;
    };
  }, []);

  const handleOpenDocument = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentTab('workspace');
  };

  const handleSendMessage = async (query: string) => {
    if (!activeDoc) return;

    const userMsgId = `usr-${Date.now()}`;
    const userMsg: GroundingMessage = {
      id: userMsgId,
      sender: 'user',
      authorName: userProfile.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query,
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      const response = await fetch('/api/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          documentId: activeDoc.id,
          topK: 5,
        }),
      });

      if (!response.ok) {
        throw new Error('API query failed');
      }

      const data = await response.json();

      const aiMsg: GroundingMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        authorName: 'DocuMind Intelligence',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: data.answer,
        citations: (data.sources || []).map((source: { id: number; chunkId: string; pageStart: number; pageEnd: number; chunkIndex: number; text: string; similarity: number }) => ({
          id: source.id,
          label: String(source.id),
          chunkId: source.chunkId,
          sourceText: `Page ${source.pageStart}: ${source.text}`,
          pageNumber: source.pageStart,
          pageEnd: source.pageEnd,
          chunkIndex: source.chunkIndex,
          similarity: source.similarity,
        })),
        retrievalTime: 'Grounded retrieval',
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const errorMsg: GroundingMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        authorName: 'DocuMind Intelligence',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        content: 'Unable to answer this question right now. Please try again.',
        citations: [],
        retrievalTime: 'Request failed',
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  const handleUploadComplete = async (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev.filter((d) => d.id !== newDoc.id)]);
    setActiveDoc(newDoc);
    await fetchDocuments();
  };

  const handleConfirmRename = async (newTitle: string) => {
    if (!renameTarget) return;
    try {
      const res = await fetch(`/api/documents/${renameTarget.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle }),
      });

      if (res.ok) {
        const data = await res.json();
        const updated = data.document;
        setDocuments((prev) =>
          prev.map((d) => (d.id === renameTarget.id ? { ...d, title: updated.title } : d))
        );
        if (activeDoc?.id === renameTarget.id) {
          setActiveDoc((prev) => (prev ? { ...prev, title: updated.title } : null));
        }
      }
    } catch {
      // ignore
    } finally {
      setRenameTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/documents/${deleteTarget.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const remaining = documents.filter((d) => d.id !== deleteTarget.id);
        setDocuments(remaining);
        if (activeDoc?.id === deleteTarget.id) {
          setActiveDoc(remaining.length > 0 ? remaining[0] : null);
        }
      }
    } catch {
      // ignore
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    setAuthStatus('unauthenticated');
    setCurrentTab('login');
    setDocuments([]);
    setActiveDoc(null);
  };

  const getBreadcrumbs = () => {
    switch (currentTab) {
      case 'dashboard':
        return ['DocuMind', 'Dashboard'];
      case 'documents':
        return ['DocuMind', 'Documents', 'Index Repository'];
      case 'workspace':
        return ['DocuMind', 'Workspace', activeDoc?.title || 'Document Workspace'];
      case 'settings':
        return ['DocuMind', 'Settings', 'Configuration'];
      case 'login':
        return ['DocuMind', 'Authentication'];
      default:
        return ['DocuMind'];
    }
  };

  // Loading state while verifying auth cookie
  if (authStatus === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/20 animate-pulse">
            <span className="material-symbols-outlined text-[24px]">auto_stories</span>
          </div>
          <span className="text-xs font-semibold text-slate-500 tracking-wide font-mono">
            Initializing DocuMind Core...
          </span>
        </div>
      </div>
    );
  }

  // When unauthenticated or in Login view
  if (authStatus === 'unauthenticated' || currentTab === 'login') {
    return (
      <div className="relative min-h-screen">
        <LoginScreen
          onLoginSuccess={(user) => {
            if (user) {
              setUserProfile((prev) => ({
                ...prev,
                name: user.name || prev.name,
                email: user.email || prev.email,
              }));
            }
            setAuthStatus('authenticated');
            setCurrentTab('dashboard');
            fetchDocuments();
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-['Plus_Jakarta_Sans',sans-serif] flex">
      {/* Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        userProfile={userProfile}
      />

      {/* Main App Container */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <Header
          pageTitle={
            currentTab === 'dashboard'
              ? 'Dashboard'
              : currentTab === 'workspace'
              ? 'Intelligence Hub'
              : currentTab === 'settings'
              ? 'Settings'
              : 'Documents'
          }
          breadcrumbs={getBreadcrumbs()}
          userProfile={userProfile}
          searchQuery={globalSearch}
          onSearchChange={setGlobalSearch}
          onNavigate={setCurrentTab}
        />

        {/* Dynamic Screen Showcase Floating Bar */}
        {showScreenSwitcher && (
          <div className="fixed bottom-4 right-6 z-50 bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-700 shadow-2xl flex items-center gap-2 text-xs">
            <span className="text-teal-300 font-bold uppercase tracking-wider text-[10px]">
              Screens:
            </span>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              1. Dashboard
            </button>
            <button
              onClick={() => setCurrentTab('workspace')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                currentTab === 'workspace'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              2. Workspace / RAG
            </button>
            <button
              onClick={() => setCurrentTab('settings')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                currentTab === 'settings'
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              3. Settings
            </button>
            <button
              onClick={handleLogout}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:bg-slate-800 font-semibold transition-all"
            >
              4. Log Out
            </button>
            <button
              onClick={() => setShowScreenSwitcher(false)}
              className="ml-1 p-1 text-slate-400 hover:text-white"
              title="Close switcher"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <main className="pt-16 flex-1 flex flex-col">
          {currentTab === 'dashboard' || currentTab === 'documents' ? (
            <DashboardScreen
              documents={documents}
              userProfile={userProfile}
              onOpenDocument={handleOpenDocument}
              onOpenUploadModal={() => setIsUploadOpen(true)}
              onRequestRename={(doc) => setRenameTarget(doc)}
              onRequestDelete={(doc) => setDeleteTarget(doc)}
            />
          ) : currentTab === 'workspace' ? (
            <WorkspaceScreen
              document={activeDoc}
              userProfile={userProfile}
              messages={messages}
              onSendMessage={handleSendMessage}
              onNavigateBack={() => setCurrentTab('dashboard')}
              onRequestRename={(doc) => setRenameTarget(doc)}
              onRequestDelete={(doc) => setDeleteTarget(doc)}
            />
          ) : (
            <SettingsScreen
              userProfile={userProfile}
              onUpdateProfile={(updated) => setUserProfile((prev) => ({ ...prev, ...updated }))}
              onLogout={handleLogout}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadComplete={handleUploadComplete}
      />

      <RenameModal
        isOpen={!!renameTarget}
        initialTitle={renameTarget?.title || ''}
        onClose={() => setRenameTarget(null)}
        onRename={handleConfirmRename}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        documentTitle={deleteTarget?.title || ''}
        chunkCount={deleteTarget?.chunkCount || 0}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
