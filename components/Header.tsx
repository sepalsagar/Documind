'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';

interface HeaderProps {
  pageTitle: string;
  breadcrumbs: string[];
  userProfile: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNavigate: (tab: 'dashboard' | 'documents' | 'workspace' | 'settings' | 'login') => void;
}

export const Header: React.FC<HeaderProps> = ({
  pageTitle,
  breadcrumbs,
  userProfile,
  searchQuery,
  onSearchChange,
  onNavigate,
}) => {
  return (
    <header
      id="global-top-header"
      className="fixed top-0 left-64 right-0 h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 flex items-center justify-between"
    >
      {/* Left: Breadcrumbs & System Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <span
                className={
                  idx === breadcrumbs.length - 1
                    ? 'text-slate-900 font-semibold'
                    : 'hover:text-slate-700 cursor-pointer transition-colors'
                }
                onClick={() => {
                  if (crumb.toLowerCase() === 'dashboard') onNavigate('dashboard');
                  if (crumb.toLowerCase() === 'documents') onNavigate('documents');
                  if (crumb.toLowerCase() === 'workspace') onNavigate('workspace');
                }}
              >
                {crumb}
              </span>
              {idx < breadcrumbs.length - 1 && (
                <span className="material-symbols-outlined text-[12px] text-slate-300">
                  chevron_right
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 ml-3 px-2.5 py-1 rounded-full bg-teal-50 border border-teal-200/70 text-teal-700 text-[11px] font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
          <span>System Online</span>
        </div>
      </div>

      {/* Right: Search, Notifications, Help, User Avatar */}
      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center bg-slate-50 hover:bg-white px-3 py-1.5 rounded-xl border border-slate-200 w-64 focus-within:bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
          <span className="material-symbols-outlined text-[17px] text-slate-400 mr-2">search</span>
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search semantic chunks..."
            className="bg-transparent border-none text-xs text-slate-700 focus:outline-none w-full placeholder:text-slate-400"
          />
          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white rounded border border-slate-200 text-slate-400 font-semibold shadow-2xs">
            ⌘K
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="notifications-btn"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[19px]">notifications</span>
          </button>
          <button
            id="help-btn"
            onClick={() => onNavigate('settings')}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            title="Help & System Info"
          >
            <span className="material-symbols-outlined text-[19px]">help_outline</span>
          </button>
        </div>

        <div className="h-5 w-px bg-slate-200 mx-1"></div>

        <div
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 cursor-pointer group"
          title="Account Settings"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={userProfile.avatarUrl}
            alt={userProfile.name}
            className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 group-hover:ring-teal-500 transition-all"
          />
        </div>
      </div>
    </header>
  );
};
