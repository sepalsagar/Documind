'use client';

import React, { useState } from 'react';
import {
  BrainCircuit,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  User,
  Mail,
  Lock,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../AuthContext';

interface RegisterViewProps {
  onSwitchToLogin: () => void;
}

export default function RegisterView({ onSwitchToLogin }: RegisterViewProps) {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your work email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await register(name, email, password, confirmPassword);
    if (!res.success) {
      setError(res.error || 'Failed to create account.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-teal-500 selection:text-white">
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 sm:p-10">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-white shadow-md shadow-teal-900/20 ring-1 ring-teal-400/30">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-extrabold text-slate-900 font-sans tracking-tight">DocuMind</span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-semibold rounded bg-teal-50 text-teal-700 border border-teal-200">
              v1.0
            </span>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create your account
          </h1>
          <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
            Start uploading PDFs, creating embeddings, and asking grounded questions with AI.
          </p>
        </div>

        {error && (
          <div
            id="register_error_alert"
            className="mb-5 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-800 flex items-start space-x-2.5"
          >
            <Lock className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="register_name"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="h-4 w-4" />
              </div>
              <input
                id="register_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Chen"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="register_email"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Work Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="register_email"
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
            <label
              htmlFor="register_password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="register_password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="register_confirm_password"
              className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="register_confirm_password"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-hidden focus:ring-2 focus:ring-teal-500/20 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500 pt-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-teal-600" />
            <span>Passwords are hashed with bcrypt.</span>
          </div>

          <button
            id="register_submit_btn"
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 active:bg-teal-800 shadow-sm transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create DocuMind Account</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <button
            id="switch_to_login_btn"
            onClick={onSwitchToLogin}
            className="text-teal-600 font-semibold hover:underline cursor-pointer"
          >
            Sign in
          </button>
        </div>
      </div>
    </div>
  );
}
