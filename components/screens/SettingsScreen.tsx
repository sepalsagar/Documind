'use client';

import React, { useState } from 'react';
import { UserProfile } from '@/lib/types';

interface SettingsScreenProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  userProfile,
  onUpdateProfile,
  onLogout,
}) => {
  const [fullName, setFullName] = useState(userProfile.name);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [themePref, setThemePref] = useState<'light' | 'dark' | 'system'>('light');
  const [chunkSize, setChunkSize] = useState(500);
  const [activeSection, setActiveSection] = useState<'account' | 'preferences' | 'system' | 'about' | 'danger'>('account');

  const handleSaveName = () => {
    onUpdateProfile({ name: fullName });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleChangeAvatar = () => {
    const avatars = [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB2zPhNMYU6BYl5njWPy3NQ65Kw0t0GUMAQhp0LnGhHSbmSQsGjaZS8F-JZs5fj1Wxum6P1tWDNZREDlFEN35HjA0bdNBNO-QTuiWk7mgGBsuQBkCMNlpz5sXcmGrug2DvfUXYaATDXvrrdBD7q6-SniUNAd-dpqArkiB22zco_Xpb82v21HLjYfD7POsLQl3asMf2VMi_Ig0wAJRJac7SZbiEzhtoIyTxfruswf1QqDIjyA1EBd8K4Sw',
      'https://picsum.photos/seed/alexrivera2/200/200',
      'https://picsum.photos/seed/architect/200/200',
    ];
    const nextIdx = (avatars.indexOf(userProfile.avatarUrl || '') + 1) % avatars.length;
    onUpdateProfile({ avatarUrl: avatars[nextIdx] });
  };

  const handleConfirmDelete = () => {
    if (
      window.confirm(
        'Are you sure you want to delete your DocuMind account? All semantic index embeddings and ingested documents will be permanently eradicated.'
      )
    ) {
      alert('Account deletion scheduled. A verification token has been dispatched to ' + userProfile.email);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-6xl mx-auto px-6 lg:px-10 py-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pb-6 mb-6 gap-4 border-b border-slate-200">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-teal-700 font-mono text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-teal-600 inline-block"></span>
            <span>Configuration Matrix</span>
          </div>
          <h1 className="text-[28px] text-slate-900 tracking-tight font-bold">Settings</h1>
          <p className="text-sm text-slate-500">
            Manage your account preferences and application configuration.
          </p>
        </div>

        {/* Status / Quick Indicator */}
        <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-lg border border-slate-200 shadow-xs self-start md:self-auto">
          <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
          <span className="text-[12px] text-slate-500 font-medium">
            Sync Node:{' '}
            <span className="font-mono text-[11px] text-slate-800 font-semibold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              us-east-cluster-04
            </span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Navigation Rail (Anchors) */}
        <nav className="hidden lg:flex lg:col-span-3 flex-col gap-1.5 sticky top-24">
          <span className="font-mono text-[11px] uppercase text-slate-400 font-semibold tracking-wider px-3 mb-1">
            Categories
          </span>

          <button
            onClick={() => setActiveSection('account')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13.5px] transition-colors text-left ${
              activeSection === 'account'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[19px] text-teal-600">
                account_circle
              </span>
              <span>Account Profile</span>
            </span>
            <span className="font-mono text-[11px] text-teal-700 bg-teal-100/70 px-1.5 py-0.5 rounded font-bold">
              01
            </span>
          </button>

          <button
            onClick={() => setActiveSection('preferences')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13.5px] transition-colors text-left ${
              activeSection === 'preferences'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[19px] text-slate-400">tune</span>
              <span>Application</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">02</span>
          </button>

          <button
            onClick={() => setActiveSection('system')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13.5px] transition-colors text-left ${
              activeSection === 'system'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[19px] text-slate-400">memory</span>
              <span>Engine Specs</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">03</span>
          </button>

          <button
            onClick={() => setActiveSection('about')}
            className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[13.5px] transition-colors text-left ${
              activeSection === 'about'
                ? 'bg-teal-50 text-teal-800 border border-teal-200/80 font-semibold shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent font-medium'
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[19px] text-slate-400">info</span>
              <span>About DocuMind</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">04</span>
          </button>

          <button
            onClick={() => setActiveSection('danger')}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50/80 border border-transparent text-[13.5px] font-medium transition-colors mt-2 text-left"
          >
            <span className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-[19px] text-rose-500">shield</span>
              <span>Danger Zone</span>
            </span>
            <span className="font-mono text-[11px] text-rose-500 bg-rose-100 px-1.5 py-0.5 rounded font-bold">
              05
            </span>
          </button>

          {/* Telemetry Card */}
          <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-slate-600 font-semibold">Embedding Cache</span>
              <span className="font-mono text-[11px] text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded font-bold">
                Optimal
              </span>
            </div>
            {(() => {
              const usage = userProfile.embeddingUsage || { used: 420000, total: 1000000 };
              const percent = Math.round((usage.used / usage.total) * 100);
              return (
                <>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/70">
                    <div
                      className="bg-teal-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-500">
                      {(usage.used / 1000).toFixed(0)}k / {(usage.total / 1000000).toFixed(1)}M tokens used
                    </span>
                    <span className="font-mono text-[11px] text-teal-700 font-semibold">
                      {percent}%
                    </span>
                  </div>
                </>
              );
            })()}
          </div>
        </nav>

        {/* Main Settings Canvas */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {/* 1. Account Profile Card */}
          <section
            id="account"
            className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md font-bold tracking-wide">
                  SEC-01
                </span>
                <h2 className="text-[18px] text-slate-900 font-bold">Account Credentials</h2>
              </div>
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                Identity Provider:{' '}
                <span className="text-slate-700 font-semibold">
                  {userProfile.identityProvider}
                </span>
              </span>
            </div>

            {/* Avatar Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={userProfile.avatarUrl}
                    alt="User Profile Portrait"
                    className="w-16 h-16 rounded-xl object-cover shadow-sm ring-2 ring-white"
                  />
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-teal-500 ring-2 ring-white"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[16px] text-slate-900 font-bold">{userProfile.name}</span>
                  <span className="font-mono text-[12px] text-slate-500 font-medium">
                    {userProfile.title}
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    JPG, PNG or WEBP under 4MB
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleChangeAvatar}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[13px] font-semibold rounded-lg transition-all shadow-2xs active:scale-[0.99] flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px] text-slate-500">
                  photo_camera
                </span>
                <span>Change avatar</span>
              </button>
            </div>

            {/* Fields Container */}
            <div className="grid grid-cols-1 gap-5 pt-1">
              {/* Full Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-1/3">
                  <label className="text-[13.5px] text-slate-800 font-semibold block">
                    Full Name
                  </label>
                  <span className="text-[12px] text-slate-500">
                    Shown on generated knowledge graphs
                  </span>
                </div>
                <div className="w-full sm:w-2/3 flex items-center gap-2.5">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-10 px-3.5 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-teal-500 rounded-lg text-[13.5px] text-slate-900 outline-none transition-all shadow-2xs focus:ring-2 focus:ring-teal-500/10"
                  />
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm shadow-teal-700/20 active:scale-[0.99] flex items-center gap-1.5 flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {savedSuccess ? 'done_all' : 'check'}
                    </span>
                    <span>{savedSuccess ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>

              {/* Email Address */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-1/3">
                  <label className="text-[13.5px] text-slate-800 font-semibold block">
                    Email Address
                  </label>
                  <span className="text-[12px] text-slate-500">
                    Primary system communications
                  </span>
                </div>
                <div className="w-full sm:w-2/3 flex items-center gap-2.5">
                  <div className="relative w-full">
                    <input
                      type="email"
                      value={userProfile.email}
                      readOnly
                      className="w-full h-10 px-3.5 pr-24 bg-slate-50 border border-slate-200 text-[13.5px] text-slate-700 rounded-lg outline-none cursor-default font-medium"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 border border-teal-200/80 text-teal-700 font-mono text-[11px] font-semibold">
                      <span className="material-symbols-outlined text-[13px] text-teal-600">
                        verified
                      </span>
                      <span>Verified</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="w-full sm:w-1/3">
                  <label className="text-[13.5px] text-slate-800 font-semibold block">
                    Password
                  </label>
                  <span className="font-mono text-[11.5px] text-slate-500">Updated 2 weeks ago</span>
                </div>
                <div className="w-full sm:w-2/3 flex items-center justify-between gap-2.5">
                  <span className="font-mono text-[13px] text-slate-700 tracking-widest px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex-1">
                    ••••••••••••••••
                  </span>
                  <button
                    type="button"
                    onClick={() => alert('Password reset verification dispatched to ' + userProfile.email)}
                    className="h-10 px-4 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm shadow-teal-700/20 active:scale-[0.99] whitespace-nowrap"
                  >
                    Change password
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 2. Application Preferences Section */}
          <section
            id="preferences"
            className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md font-bold tracking-wide">
                  SEC-02
                </span>
                <h2 className="text-[18px] text-slate-900 font-bold">
                  Application &amp; Visual Preferences
                </h2>
              </div>
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                UI Client <span className="text-slate-700 font-semibold">v2.4</span>
              </span>
            </div>

            {/* Theme Radio Card Selector */}
            <div className="flex flex-col gap-2">
              <label className="text-[13.5px] text-slate-800 font-semibold">Visual Appearance</label>
              <p className="text-[12.5px] text-slate-500 mb-1">
                Select your preferred chrome contrast and workspace canvas illumination.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" id="theme-selector">
                {/* Light */}
                <label
                  onClick={() => setThemePref('light')}
                  className={`relative flex flex-col p-4 rounded-xl cursor-pointer transition-all shadow-2xs ${
                    themePref === 'light'
                      ? 'bg-teal-50/40 border-2 border-teal-600'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-teal-200 flex items-center justify-center text-teal-700 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">light_mode</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        themePref === 'light'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                    </div>
                  </div>
                  <span className="text-[14.5px] text-slate-900 font-bold">Light</span>
                  <span className="text-[12px] text-slate-500 mt-0.5">
                    High clarity, daytime contrast
                  </span>
                </label>

                {/* Dark */}
                <label
                  onClick={() => setThemePref('dark')}
                  className={`relative flex flex-col p-4 rounded-xl cursor-pointer transition-all shadow-2xs ${
                    themePref === 'dark'
                      ? 'bg-teal-50/40 border-2 border-teal-600'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-slate-200 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">dark_mode</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        themePref === 'dark'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                    </div>
                  </div>
                  <span className="text-[14.5px] text-slate-800 font-bold">Dark</span>
                  <span className="text-[12px] text-slate-500 mt-0.5">
                    Low glare, focus lighting
                  </span>
                </label>

                {/* System default */}
                <label
                  onClick={() => setThemePref('system')}
                  className={`relative flex flex-col p-4 rounded-xl cursor-pointer transition-all shadow-2xs ${
                    themePref === 'system'
                      ? 'bg-teal-50/40 border-2 border-teal-600'
                      : 'bg-slate-50 border-2 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-2xs">
                      <span className="material-symbols-outlined text-[19px]">
                        desktop_windows
                      </span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                        themePref === 'system'
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-200 text-transparent'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[11px] font-bold">check</span>
                    </div>
                  </div>
                  <span className="text-[14.5px] text-slate-800 font-bold">System default</span>
                  <span className="text-[12px] text-slate-500 mt-0.5">
                    Matches OS environment settings
                  </span>
                </label>
              </div>
            </div>

            {/* Processing Preferences */}
            <div className="pt-4 border-t border-slate-100 flex flex-col gap-3" id="system">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-[13.5px] text-slate-800 font-semibold block">
                    Document Processing Pipeline
                  </label>
                  <p className="text-[12px] text-slate-500">
                    Settings governing chunk segmentation and vector database indexing.
                  </p>
                </div>
                <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200/90 px-2.5 py-0.5 rounded-md font-semibold">
                  Pipeline: RAG-Fast-v3
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                {/* Chunk Size Spec */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-teal-700">
                        splitscreen
                      </span>
                      <span className="text-[13px] text-slate-900 font-semibold">
                        Chunk Partition Size
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-700 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded shadow-2xs">
                      Tokens
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-[26px] text-teal-700 tracking-tight font-extrabold">
                      {chunkSize}
                    </span>
                    <span className="text-[12px] text-slate-500 font-medium">
                      Default tokens / block
                    </span>
                  </div>

                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    Optimal trade-off for technical legal briefs, balance sheets, and API
                    documentation.
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="font-mono text-[11px] text-slate-500">
                      Overlap window: 50 tokens
                    </span>
                    <button
                      type="button"
                      onClick={() => setChunkSize(chunkSize === 500 ? 750 : 500)}
                      className="text-[12px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-0.5"
                    >
                      <span>Modify</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </button>
                  </div>
                </div>

                {/* Embedding Model Spec */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[18px] text-teal-700">
                        hub
                      </span>
                      <span className="text-[13px] text-slate-900 font-semibold">
                        Embedding Model
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-teal-700 bg-teal-50 border border-teal-200/80 px-2 py-0.5 rounded font-bold">
                      Production
                    </span>
                  </div>

                  <div>
                    <span className="text-[14.5px] text-slate-900 block font-bold">
                      OpenAI text-embedding-3-small
                    </span>
                    <span className="font-mono text-[11.5px] text-teal-700 font-medium">
                      (Default Active)
                    </span>
                  </div>

                  <p className="text-[12.5px] text-slate-600 leading-relaxed">
                    1536-dimension vectors with cosine similarity matching via Atlas Vector Search.
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                    <span className="font-mono text-[11px] text-slate-500">
                      Latency: ~28ms avg
                    </span>
                    <button
                      type="button"
                      onClick={() => alert('Switched to Gemini text-embedding-004 with 768 dimensions')}
                      className="text-[12px] text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-0.5"
                    >
                      <span>Switch model</span>
                      <span className="material-symbols-outlined text-[14px]">tune</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 3. About DocuMind */}
          <section
            id="about"
            className="p-6 sm:p-7 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-teal-800 bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-md font-bold tracking-wide">
                  SEC-03
                </span>
                <h2 className="text-[18px] text-slate-900 font-bold">About Platform</h2>
              </div>
              <span className="font-mono text-[11px] text-slate-500 font-medium">
                Release Channel: <span className="text-teal-700 font-semibold">Stable</span>
              </span>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-teal-700/20 flex-shrink-0">
                  <span className="material-symbols-outlined text-[24px]">dataset</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[18px] text-slate-900 font-bold tracking-tight">
                      DocuMind
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-teal-600 text-white font-mono text-[11px] font-bold">
                      v1.0.0
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">(Build 2026.09)</span>
                  </div>
                  <p className="text-[13.5px] text-slate-600 max-w-2xl leading-relaxed">
                    AI-powered document understanding with grounded retrieval. Built with Next.js,
                    TypeScript, and vector embeddings.
                  </p>
                </div>
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('DocuMind API Specs: REST Endpoints at /api/rag and /api/embeddings');
                }}
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-between group shadow-2xs hover:border-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-teal-700">
                    menu_book
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-slate-900 font-semibold group-hover:text-teal-700 transition-colors">
                      API Documentation
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      REST &amp; SDK endpoints
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('GitHub repo: documind-core/main');
                }}
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-between group shadow-2xs hover:border-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-teal-700">code</span>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-slate-900 font-semibold group-hover:text-teal-700 transition-colors">
                      GitHub Repository
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      documind-core/main
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                  open_in_new
                </span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Privacy certification: SOC2 Type II Certified, zero vector retention option enabled.');
                }}
                className="p-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center justify-between group shadow-2xs hover:border-slate-300"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[20px] text-teal-700">
                    privacy_tip
                  </span>
                  <div className="flex flex-col">
                    <span className="text-[13px] text-slate-900 font-semibold group-hover:text-teal-700 transition-colors">
                      Privacy &amp; Security
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      SOC2 Type II &amp; GDPR
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </a>
            </div>
          </section>

          {/* 4. Danger Zone & Session Security */}
          <section
            id="danger-zone"
            className="p-6 sm:p-7 rounded-xl bg-white border border-rose-200/80 shadow-sm flex flex-col gap-5"
          >
            <div className="flex items-center justify-between pb-4 border-b border-rose-100">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-[11px] text-rose-700 px-2.5 py-0.5 rounded-md bg-rose-50 border border-rose-200 font-bold tracking-wide">
                  SEC-04
                </span>
                <h2 className="text-[18px] text-rose-700 font-bold">
                  Danger Zone &amp; Access Revocation
                </h2>
              </div>
              <span className="font-mono text-[11px] text-rose-600 font-semibold">
                Irreversible Operations
              </span>
            </div>

            <div className="flex flex-col gap-3.5">
              {/* Terminate Sessions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[13.5px] text-slate-900 font-semibold">
                    Active Session Management
                  </span>
                  <span className="text-[12px] text-slate-500">
                    Revoke all active JSON Web Tokens across mobile, CLI tools, and web panels.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[13px] font-semibold rounded-lg transition-all shadow-2xs active:scale-[0.99] whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-500">
                    logout
                  </span>
                  <span>Log out of all sessions</span>
                </button>
              </div>

              {/* Delete Account */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-rose-50/50 border border-rose-200 gap-3">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-rose-600">
                      warning
                    </span>
                    <span className="text-[13.5px] text-rose-700 font-bold">Delete Account</span>
                  </div>
                  <span className="text-[12px] text-slate-600 max-w-xl">
                    Permanently purge your account, all associated vector collections, ingested PDFs,
                    and AI synthesis history. This action cannot be reversed.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[13px] font-semibold rounded-lg transition-all shadow-sm shadow-rose-600/20 active:scale-[0.99] whitespace-nowrap self-start sm:self-auto flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">delete_forever</span>
                  <span>Delete Account</span>
                </button>
              </div>
            </div>
          </section>

          {/* Footer Micro-bar */}
          <div className="flex items-center justify-between py-3 text-slate-400 font-mono text-[11px] border-t border-slate-200">
            <span>DocuMind Semantic Core v1.0.0</span>
            <div className="flex items-center gap-3">
              <span className="hover:text-slate-600 cursor-pointer">Status: 99.98% uptime</span>
              <span>•</span>
              <span className="hover:text-slate-600 cursor-pointer">Security Protocol TLS 1.3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
