'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  Sparkles,
  Zap,
  FileText,
  Search,
  Database,
  Layers,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface LoginViewProps {
  onSwitchToRegister: () => void;
}

export default function LoginView({ onSwitchToRegister }: LoginViewProps) {
  const { login, demo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    if (!res.success) {
      setError(res.error || 'Invalid email or password.');
    }
    setLoading(false);
  };

  const handleDemoSignIn = async () => {
    setLoading(true);
    setError(null);
    const res = await demo();
    if (!res.success) setError(res.error || 'Unable to start the demo.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-white">
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
          {/* Brand header */}
          <div className="flex items-center space-x-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-900/20 ring-1 ring-teal-400/30">
              <BrainCircuit className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">DocuMind</span>
                <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">
                  v1.0
                </span>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Your documents, intelligently searchable.
            </h1>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Upload PDFs, ask questions, and get answers strictly grounded in the content you provide.
            </p>
          </div>

          {error && (
            <div
              id="login_error_alert"
              className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start space-x-2.5"
            >
              <Lock className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="login_email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
              >
                Work Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login_email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex.chen@documind.ai"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="login_password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => {}}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="login_password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
                />
                <button
                  id="toggle_password_btn"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center space-x-2 text-xs text-slate-600 cursor-pointer">
                <input
                  id="remember_me_checkbox"
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Remember for 30 days</span>
              </label>
            </div>

            <button
              id="login_submit_btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign in to DocuMind</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Button */}
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button
              id="quick_demo_login_btn"
              type="button"
              onClick={handleDemoSignIn}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-center space-x-2 transition-colors cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>Try the demo without signing up</span>
            </button>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button
              id="switch_to_register_btn"
              onClick={onSwitchToRegister}
              className="text-teal-600 font-semibold hover:underline cursor-pointer"
            >
              Create one
            </button>
          </div>
        </div>

        {/* Right Column: Visual Product Feature Showcase */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-7 text-slate-100 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-5 border-b border-slate-800 text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-teal-400 animate-pulse" />
                <span className="text-teal-400 font-semibold uppercase tracking-wider">
                  Live RAG Retrieval Preview
                </span>
              </div>
              <span>DocuMind Indexer</span>
            </div>

            {/* Document preview card */}
            <div className="mt-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-900/60 text-teal-400 border border-teal-700/60">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-200">
                      Attention_Is_All_You_Need.pdf
                    </div>
                    <div className="text-[11px] font-mono text-slate-400">
                      15 pages • 2.84 MB • 6 vector chunks
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-mono font-semibold rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Ready
                </span>
              </div>

              {/* User Query Simulation */}
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <Search className="h-3.5 w-3.5 text-teal-400" />
                  <span className="text-slate-300 font-medium">User Prompt:</span>
                </div>
                <div className="text-sm font-medium text-slate-100 pl-5 border-l-2 border-teal-500">
                  &ldquo;What is the formula used for Scaled Dot-Product Attention?&rdquo;
                </div>
              </div>

              {/* Retrieved Source Snippet & Grounded Answer */}
              <div className="p-4 rounded-2xl bg-teal-950/30 border border-teal-800/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-teal-400">
                  <div className="flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Grounded Answer (Gemini)</span>
                  </div>
                  <span className="bg-teal-900/80 px-2 py-0.5 rounded text-[10px] text-teal-300 border border-teal-700">
                    Cosine Sim: 0.942
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Scaled Dot-Product Attention is computed on a set of queries packed into matrix Q,
                  with keys K and values V packed into matrices as{' '}
                  <span className="font-mono bg-teal-950 px-1.5 py-0.5 rounded text-teal-300 border border-teal-800/60">
                    Attention(Q, K, V) = softmax(QK^T / √d_k)V
                  </span>{' '}
                  <span className="text-teal-400 font-bold">[1]</span>.
                </p>
              </div>
            </div>

            {/* Metrics footer */}
            <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold text-teal-400 font-mono">99.8%</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                  Grounding Precision
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-white font-mono">&lt; 350ms</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                  Vector Retrieval
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-teal-400 font-mono">Zero</div>
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">
                  Hallucinations
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Document Ownership</div>
                <div className="text-[11px] text-slate-500">Strict user isolation & JWT auth</div>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">Actual Source Citations</div>
                <div className="text-[11px] text-slate-500">Verified chunk attribution</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
