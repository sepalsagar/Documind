'use client';

import React, { useState } from 'react';
import {
  User,
  Shield,
  Sliders,
  Database,
  Cpu,
  LogOut,
  Trash2,
  Check,
  Save,
  AlertTriangle,
  Info,
  Key,
  Mail,
  Sparkles,
  Layers,
  Lock,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

export default function SettingsView() {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'engine' | 'about' | 'danger'>('profile');

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Engine preferences
  const [chunkSize, setChunkSize] = useState('180');
  const [overlapWindow, setOverlapWindow] = useState('30');
  const [topK, setTopK] = useState('3');
  const [temperature, setTemperature] = useState('0.1');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser({ name });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8fafc] p-8 select-none">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Settings & Preferences</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage your account credentials, vector retrieval parameters, and application preferences.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 p-1 bg-slate-200/60 rounded-xl max-w-lg border border-slate-200">
          {[
            { id: 'profile' as const, label: 'Account Profile', icon: User },
            { id: 'engine' as const, label: 'RAG Engine Specs', icon: Sliders },
            { id: 'about' as const, label: 'About DocuMind', icon: Info },
            { id: 'danger' as const, label: 'Danger Zone', icon: AlertTriangle },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`settings_tab_${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: Account Profile */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div className="flex items-center space-x-4 pb-6 border-b border-slate-100">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 text-white font-bold text-xl font-mono shadow-md">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DM'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{user?.name || 'Researcher'}</h3>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <span className="text-xs font-mono text-slate-500">{user?.email}</span>
                  </div>
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs font-semibold text-teal-800 flex items-center space-x-2">
                  <Check className="h-4 w-4 text-teal-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                      Email Address (Locked)
                    </label>
                    <input
                      type="email"
                      value={user?.email || 'user@documind.ai'}
                      disabled
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 cursor-not-allowed font-mono"
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>Save Profile</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RAG Engine Specs */}
        {/* ========================================================= */}
        {activeTab === 'engine' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">RAG Ingestion & Vector Parameters</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure text partitioning, cosine metric thresholds, and model hyperparameters.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Chunk Partition Size
                  </label>
                  <select
                    value={chunkSize}
                    onChange={(e) => setChunkSize(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  >
                    <option value="120">120 words (~160 tokens) - High Precision</option>
                    <option value="180">180 words (~240 tokens) - Optimal Balanced (Default)</option>
                    <option value="300">300 words (~400 tokens) - Broad Context</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Controls maximum token length per vector passage.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Overlap Window
                  </label>
                  <select
                    value={overlapWindow}
                    onChange={(e) => setOverlapWindow(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  >
                    <option value="15">15 words - Minimal Overlap</option>
                    <option value="30">30 words - Standard Sliding Window (Default)</option>
                    <option value="50">50 words - Deep Continuity</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Preserves sentence continuity between adjacent chunk boundaries.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Top-K Retrieval Count
                  </label>
                  <select
                    value={topK}
                    onChange={(e) => setTopK(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  >
                    <option value="2">Top 2 Chunks</option>
                    <option value="3">Top 3 Chunks (Recommended)</option>
                    <option value="5">Top 5 Chunks (Comprehensive)</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Number of highest scoring passages provided to Gemini.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Generation Temperature
                  </label>
                  <input
                    type="text"
                    value={temperature}
                    disabled
                    className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-100 text-xs font-mono text-slate-600 cursor-not-allowed"
                  />
                  <p className="text-[11px] text-slate-500">
                    Kept low to encourage concise, context-constrained answers; retrieved passages remain visible for review.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: About Platform */}
        {/* ========================================================= */}
        {activeTab === 'about' && (
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-6">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">DocuMind RAG Architecture</h3>
                <p className="text-xs text-slate-500">Full-Stack AI Document Assistant</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
              <p>
                DocuMind is an AI Document Assistant designed for document-grounded retrieval and
                evidence-backed Q&A. Built with Next.js, React, Tailwind CSS,
                MongoDB, and Google Gemini.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-900 mb-1">RAG Pipeline</div>
                  <div>PDF Parse → Window Chunking → Vector Embeddings → Cosine Similarity → Grounded Gemini Generation.</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <div className="font-semibold text-slate-900 mb-1">Security & Isolation</div>
                  <div>Document ownership enforced on every route. User data strictly isolated by JWT credentials.</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: Danger Zone */}
        {/* ========================================================= */}
        {activeTab === 'danger' && (
          <div className="p-6 rounded-2xl bg-white border border-rose-200/80 shadow-xs space-y-6">
            <div className="flex items-center space-x-3 text-rose-700">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-base font-bold">Danger Zone</h3>
            </div>

            <div className="space-y-4 divide-y divide-slate-100 text-sm">
              <div className="flex items-center justify-between pt-3">
                <div>
                  <div className="font-semibold text-slate-900">Sign Out of All Sessions</div>
                  <div className="text-xs text-slate-500">
                    Terminates your active JWT session cookie and local token.
                  </div>
                </div>
                <button
                  onClick={() => logout()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
