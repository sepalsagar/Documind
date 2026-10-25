'use client';

import React from 'react';
import {
  BrainCircuit,
  LayoutDashboard,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Sparkles,
  Database,
  Cpu,
  ChevronRight,
  X,
} from 'lucide-react';
import { useAuth } from './AuthContext';

export type NavView = 'dashboard' | 'documents' | 'workspace' | 'settings';

interface SidebarProps {
  currentView: NavView;
  onNavigate: (view: NavView) => void;
  selectedDocId?: string | null;
  selectedDocTitle?: string | null;
  isOpenOnMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  currentView,
  onNavigate,
  selectedDocId,
  selectedDocTitle,
  isOpenOnMobile = false,
  onCloseMobile,
}: SidebarProps) {
  const { user, logout } = useAuth();

  const handleNavClick = (view: NavView) => {
    onNavigate(view);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItems = [
    { id: 'dashboard' as NavView, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents' as NavView, label: 'Documents', icon: FileText },
    {
      id: 'workspace' as NavView,
      label: 'Workspace',
      icon: MessageSquare,
      badge: selectedDocTitle ? 'Active' : undefined,
    },
    { id: 'settings' as NavView, label: 'Settings', icon: Settings },
  ];

  const sidebarContent = (
    <aside
      id="app_sidebar"
      className="w-64 shrink-0 bg-slate-900 text-slate-200 border-r border-slate-800 flex flex-col justify-between h-screen select-none"
    >
      {/* Top section */}
      <div>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800/80">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-900/30 ring-1 ring-teal-400/30">
              <BrainCircuit className="h-5 w-5" />
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight text-white font-sans">DocuMind</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded-md bg-teal-950/80 text-teal-400 border border-teal-800/60">
                v1.0
              </span>
            </div>
          </div>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Current Active Workspace Indicator if selected */}
        {selectedDocId && (
          <div className="px-4 pt-4 pb-1">
            <div
              id="active_workspace_banner"
              onClick={() => handleNavClick('workspace')}
              className="group flex items-center justify-between p-2.5 rounded-xl bg-slate-800/70 hover:bg-slate-800 border border-teal-500/30 cursor-pointer transition-all"
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-teal-900/50 text-teal-400 border border-teal-700/50">
                  <FileText className="h-3.5 w-3.5" />
                </div>
                <div className="overflow-hidden">
                  <div className="text-[10px] font-medium text-teal-400 uppercase tracking-wider">
                    Current Doc
                  </div>
                  <div className="text-xs font-semibold text-slate-100 truncate max-w-[130px]">
                    {selectedDocTitle || 'Untitled.pdf'}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          </div>
        )}

        {/* Navigation Items */}
        <nav className="px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-300">
            Platform
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            // `currentView` is the single source of truth.  In particular, the
            // dashboard is not a document-library sub-state: showing both as
            // active was misleading and made keyboard navigation ambiguous.
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                id={`nav_link_${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold'
                    : 'text-slate-200 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? 'text-teal-400' : 'text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Technical Architecture Info Box */}
        <div className="px-4 py-3 mx-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center space-x-1.5">
              <Sparkles className="h-3.5 w-3.5 text-teal-400" />
              <span className="font-semibold text-slate-300">RAG Engine</span>
            </span>
            <span className="font-mono text-[10px] text-teal-400">Grounded</span>
          </div>
          <div className="text-[11px] text-slate-300 leading-relaxed">
            Cosine Similarity vector search with Gemini generative citations.
          </div>
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800/60 transition-colors">
          <div
            className="flex items-center space-x-3 cursor-pointer overflow-hidden"
            onClick={() => handleNavClick('settings')}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 font-semibold text-sm text-teal-300 shadow-inner">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DM'}
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-slate-200 truncate">
                {user?.name || 'Researcher'}
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate">
                {user?.email || 'user@documind.ai'}
              </div>
            </div>
          </div>

          <button
            id="sidebar_logout_btn"
            onClick={() => logout()}
            title="Sign out"
            aria-label="Sign out"
            className="p-2 text-slate-300 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile Drawer */}
      {isOpenOnMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 flex">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
