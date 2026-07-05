'use client';

import React from 'react';
import { UserProfile } from '@/lib/types';

interface SidebarProps {
  currentTab: 'dashboard' | 'documents' | 'workspace' | 'settings' | 'login';
  onNavigate: (tab: 'dashboard' | 'documents' | 'workspace' | 'settings' | 'login') => void;
  userProfile: UserProfile;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate, userProfile }) => {
  return (
    <aside
      id="main-sidebar"
      className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-slate-200/80 z-50 flex flex-col justify-between shadow-[0_2px_6px_0_rgba(0,0,0,0.03),0_1px_2px_0_rgba(0,0,0,0.02)] select-none"
    >
      <div className="flex flex-col">
        {/* Logo Header */}
        <div className="h-16 px-5 border-b border-slate-100 flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer"
            onClick={() => onNavigate('dashboard')}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <span className="material-symbols-outlined text-[18px]">psychology</span>
            </div>
            <span className="text-[17px] font-bold tracking-tight text-slate-900">DocuMind</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 font-mono text-[10px] font-bold tracking-wider border border-teal-200/60">
            v1.0 PRO
          </span>
        </div>

        {/* Section Label */}
        <div className="px-4 pt-4 pb-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Main Platform
          </span>
        </div>

        {/* Navigation items */}
        <nav className="flex flex-col gap-1 px-3">
          <button
            id="nav-dashboard-btn"
            onClick={() => onNavigate('dashboard')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              currentTab === 'dashboard'
                ? 'bg-[#319795] text-white shadow-sm shadow-teal-700/25 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentTab === 'dashboard' ? 'text-white' : 'text-slate-400'
              }`}
            >
              grid_view
            </span>
            <span>Dashboard</span>
          </button>

          <button
            id="nav-documents-btn"
            onClick={() => onNavigate('documents')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              currentTab === 'documents'
                ? 'bg-[#319795] text-white shadow-sm shadow-teal-700/25 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentTab === 'documents' ? 'text-white' : 'text-slate-400'
              }`}
            >
              description
            </span>
            <span>Documents</span>
          </button>

          <button
            id="nav-workspace-btn"
            onClick={() => onNavigate('workspace')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              currentTab === 'workspace'
                ? 'bg-[#319795] text-white shadow-sm shadow-teal-700/25 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentTab === 'workspace' ? 'text-white' : 'text-slate-400'
              }`}
            >
              splitscreen
            </span>
            <span>Workspace</span>
          </button>

          <button
            id="nav-settings-btn"
            onClick={() => onNavigate('settings')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
              currentTab === 'settings'
                ? 'bg-[#319795] text-white shadow-sm shadow-teal-700/25 font-semibold'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                currentTab === 'settings' ? 'text-white' : 'text-slate-400'
              }`}
            >
              settings
            </span>
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Bottom Area: Help Widget & Profile */}
      <div className="p-3 border-t border-slate-100 space-y-2.5">
        {/* Help Widget */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-teal-50 to-white border border-teal-100/80 relative overflow-hidden">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="material-symbols-outlined text-[16px] text-teal-600">help</span>
            <span className="text-[12px] font-bold text-slate-800">Need help?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight mb-2">
            Explore grounding methods, citation tags & embedding settings.
          </p>
          <button
            onClick={() => onNavigate('settings')}
            className="w-full py-1 text-center rounded-lg bg-white border border-teal-200/80 text-teal-700 hover:bg-teal-600 hover:text-white font-semibold text-[11px] transition-all shadow-xs"
          >
            Documentation
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60">
          <div
            className="flex items-center gap-2.5 min-w-0 cursor-pointer"
            onClick={() => onNavigate('settings')}
          >
            <div className="relative flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={userProfile.avatarUrl}
                alt={userProfile.name}
                className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-500 ring-2 ring-white"></span>
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-bold text-slate-900 truncate">{userProfile.name}</span>
              <span className="text-[10.5px] font-mono text-slate-400 truncate">
                {userProfile.email}
              </span>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            onClick={() => onNavigate('login')}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors flex items-center justify-center"
            title="Sign Out to Login View"
          >
            <span className="material-symbols-outlined text-[17px]">logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
