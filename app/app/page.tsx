'use client';

import React, { useState } from 'react';
import { AuthProvider, useAuth } from '@/components/AuthContext';
import Sidebar, { NavView } from '@/components/Sidebar';
import Header from '@/components/Header';
import LoginView from '@/components/views/LoginView';
import RegisterView from '@/components/views/RegisterView';
import DashboardView, { DocumentItem } from '@/components/views/DashboardView';
import WorkspaceView from '@/components/views/WorkspaceView';
import SettingsView from '@/components/views/SettingsView';
import UploadModal from '@/components/UploadModal';
import RenameModal from '@/components/RenameModal';
import DeleteModal from '@/components/DeleteModal';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [currentView, setCurrentView] = useState<NavView>('dashboard');

  // Active Workspace Document
  const [activeDoc, setActiveDoc] = useState<DocumentItem | null>(null);

  // Modals
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [renameDoc, setRenameDoc] = useState<DocumentItem | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentItem | null>(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Refresh trigger counter for dashboard updates
  const [refreshKey, setRefreshKey] = useState(0);

  if (loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#f8fafc] text-slate-700 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        <span className="text-xs font-mono font-medium">Initializing DocuMind...</span>
      </div>
    );
  }

  // If user is not authenticated, show Auth views
  if (!user) {
    if (authMode === 'register') {
      return <RegisterView onSwitchToLogin={() => setAuthMode('login')} />;
    }
    return <LoginView onSwitchToRegister={() => setAuthMode('register')} />;
  }

  // Handle opening workspace
  const handleOpenWorkspace = (doc: DocumentItem) => {
    setActiveDoc(doc);
    setCurrentView('workspace');
    setIsMobileNavOpen(false);
  };

  // Handle document upload success
  const handleUploadSuccess = (newDoc: DocumentItem) => {
    setActiveDoc(newDoc);
    setRefreshKey((prev) => prev + 1);
    setCurrentView('workspace');
    setIsMobileNavOpen(false);
  };

  // Handle document rename success
  const handleRenameSuccess = (updatedDoc: DocumentItem) => {
    if (activeDoc && activeDoc._id === updatedDoc._id) {
      setActiveDoc(updatedDoc);
    }
    setRefreshKey((prev) => prev + 1);
  };

  // Handle document delete success
  const handleDeleteSuccess = (deletedId: string) => {
    if (activeDoc && activeDoc._id === deletedId) {
      setActiveDoc(null);
      setCurrentView('dashboard');
    }
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#f8fafc]">
      {/* App Sidebar */}
      <Sidebar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'workspace' && !activeDoc) {
            setCurrentView('dashboard');
          } else {
            setCurrentView(view);
          }
          setIsMobileNavOpen(false);
        }}
        selectedDocId={activeDoc?._id}
        selectedDocTitle={activeDoc?.title}
        isOpenOnMobile={isMobileNavOpen}
        onCloseMobile={() => setIsMobileNavOpen(false)}
      />

      {/* Main Content Layout */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Render Header only if not in Workspace (Workspace has its own specialized header) */}
        {currentView !== 'workspace' && (
          <Header
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenMobileNav={() => setIsMobileNavOpen(true)}
            title={currentView === 'dashboard' ? 'Dashboard Overview' : currentView === 'documents' ? 'Document Library' : 'Settings'}
            breadcrumb={currentView === 'dashboard' ? 'Overview' : currentView === 'documents' ? 'Library' : 'Settings'}
          />
        )}

        {/* View Switcher */}
        {currentView === 'dashboard' || currentView === 'documents' ? (
          <DashboardView
            key={refreshKey}
            view={currentView}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenWorkspace={handleOpenWorkspace}
            onRenameDoc={(doc) => setRenameDoc(doc)}
            onDeleteDoc={(doc) => setDeleteDoc(doc)}
          />
        ) : currentView === 'workspace' && activeDoc ? (
          <WorkspaceView
            document={activeDoc}
            onBack={() => setCurrentView('documents')}
            onRename={(doc) => setRenameDoc(doc)}
            onDelete={(doc) => setDeleteDoc(doc)}
          />
        ) : currentView === 'settings' ? (
          <SettingsView />
        ) : (
          <DashboardView
            key={refreshKey}
            view="dashboard"
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenWorkspace={handleOpenWorkspace}
            onRenameDoc={(doc) => setRenameDoc(doc)}
            onDeleteDoc={(doc) => setDeleteDoc(doc)}
          />
        )}
      </div>

      {/* Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={!!renameDoc}
        document={renameDoc}
        onClose={() => setRenameDoc(null)}
        onSuccess={handleRenameSuccess}
      />

      {/* Delete Modal */}
      <DeleteModal
        isOpen={!!deleteDoc}
        document={deleteDoc}
        onClose={() => setDeleteDoc(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
