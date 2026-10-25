'use client';

import React from 'react';
import {
  UploadCloud,
  Search,
  Bell,
  Sparkles,
  ShieldCheck,
  Zap,
  Menu,
} from 'lucide-react';
import { useAuth } from './AuthContext';

interface HeaderProps {
  onOpenUpload: () => void;
  title?: string;
  breadcrumb?: string;
  onOpenMobileNav?: () => void;
}

export default function Header({
  onOpenUpload,
  title = 'Document Intelligence',
  breadcrumb = 'Workspace > Intelligence Hub',
  onOpenMobileNav,
}: HeaderProps) {
  const { user } = useAuth();

  return (
    <header
      id="top_app_header"
      className="h-16 shrink-0 bg-white border-b border-slate-200/80 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs"
    >
      {/* Left Breadcrumbs & Title & Mobile Toggle */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {onOpenMobileNav && (
          <button
            id="mobile_sidebar_toggle_btn"
            onClick={onOpenMobileNav}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            title="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
        )}
        <div>
          <div className="flex items-center space-x-2 text-[11px] font-mono uppercase tracking-wider text-slate-400">
            <span>DocuMind</span>
            <span>/</span>
            <span className="text-teal-600 font-semibold">{breadcrumb}</span>
          </div>
          <h1 className="text-base font-bold text-slate-900 tracking-tight">{title}</h1>
        </div>
      </div>

      {user?.isDemo && (
        <div className="absolute left-1/2 top-16 hidden -translate-x-1/2 items-center gap-3 rounded-b-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 shadow-sm lg:flex">
          <span>Demo workspace - data is deleted after 24 hours</span>
          <a href="/register" className="font-bold text-teal-700 hover:underline">Create a free account</a>
        </div>
      )}

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* System Online Status Badge */}
        <div
          id="system_status_pill"
          className="hidden md:flex items-center space-x-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-200/80 text-teal-800 text-xs font-medium"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
          </span>
          <span className="font-mono text-[11px] font-semibold">RAG Pipeline Active</span>
        </div>

        {/* Primary Upload CTA Button */}
        <button
          id="header_upload_cta_btn"
          onClick={onOpenUpload}
          className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <UploadCloud className="h-4 w-4" />
          <span>Upload Document</span>
        </button>

        {/* User initials circle */}
        <div
          id="header_user_avatar"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold font-mono"
        >
          {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DM'}
        </div>
      </div>
    </header>
  );
}
