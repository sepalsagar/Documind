import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Github,
  MessageSquareText,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import DemoButton from '@/components/DemoButton';

export const metadata: Metadata = {
  title: 'DocuMind — AI Document Assistant',
  description: 'Intelligent AI document assistant with semantic RAG retrieval, vector search, and source-grounded answers.',
  alternates: { canonical: '/' },
};

const steps = [
  ['01', 'Upload a PDF', 'Add a text-based PDF to your private document library.'],
  ['02', 'Extract the text', 'DocuMind parses pages and prepares them for search.'],
  ['03', 'Build semantic context', 'Your document is chunked and embedded for retrieval.'],
  ['04', 'Ask naturally', 'Ask a question in plain English from the workspace.'],
  ['05', 'Verify the answer', 'Review the answer alongside page-level citations.'],
];

export default async function LandingPage() {
  const token = (await cookies()).get('documind_token')?.value;
  if (token && verifyToken(token)) {
    redirect('/app');
  }

  return (
    <main className="min-h-screen overflow-hidden bg-slate-950 text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'DocuMind',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: 'Source-grounded PDF question answering with page-level citations.',
        url: 'https://documind-zeta-fawn.vercel.app',
      }) }} />
      <section className="relative isolate">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,_rgba(20,184,166,0.22),_transparent_38%),radial-gradient(circle_at_20%_20%,_rgba(14,165,233,0.12),_transparent_32%)]" />
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="DocuMind home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20">
              <BrainCircuit className="h-5 w-5" aria-hidden="true" />
            </span>
            <span className="text-xl font-extrabold tracking-tight">DocuMind</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white">Sign in</Link>
            <Link href="/register" className="rounded-lg bg-teal-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-teal-300">Sign up</Link>
          </div>
        </nav>

        <div className="mx-auto grid max-w-7xl gap-16 px-6 pb-24 pt-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:pb-32 lg:pt-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Source-grounded document intelligence
            </div>
            <h1 className="max-w-3xl text-5xl font-extrabold tracking-tight sm:text-6xl">Understand every page of your PDFs.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              Upload a PDF, ask questions in plain English, get answers that point to the exact page.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-teal-400 px-5 py-3.5 text-sm font-bold text-slate-950 hover:bg-teal-300">
                Start for free <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/login" className="rounded-xl border border-slate-700 px-5 py-3.5 text-sm font-bold text-white hover:border-slate-500">Sign in</Link>
              <DemoButton className="inline-flex items-center gap-2 rounded-xl border border-teal-400/40 px-5 py-3.5 text-sm font-bold text-teal-200 hover:bg-teal-400/10" />
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-teal-400" aria-hidden="true" /> Private per-user document access</span>
              <span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-teal-400" aria-hidden="true" /> Page-level sources</span>
            </div>
          </div>
          <div className="rounded-3xl border border-slate-700/80 bg-slate-900/80 p-5 shadow-2xl shadow-teal-950/30">
            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-5">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
                <FileText className="h-5 w-5 text-teal-400" aria-hidden="true" />
                <div><p className="text-sm font-semibold">research-notes.pdf</p><p className="text-xs text-slate-500">Ready to query</p></div>
              </div>
              <div className="py-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-400">Question</p>
                <p className="mt-2 text-lg font-semibold">What are the key findings?</p>
                <div className="mt-6 rounded-xl border border-teal-400/20 bg-teal-400/5 p-4 text-sm leading-6 text-slate-300">
                  The report identifies three key findings, supported by evidence from pages 4, 7, and 12.
                </div>
                <p className="mt-4 text-xs text-slate-500">Sources · Page 4 · Page 7 · Page 12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/50 px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-400">How it works</p>
          <div className="mt-10 grid gap-8 md:grid-cols-5">
            {steps.map(([number, title, description]) => (
              <div key={number}><span className="text-sm font-mono text-slate-500">{number}</span><h2 className="mt-3 text-lg font-bold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            [Search, 'Semantic retrieval', 'Find relevant passages by meaning, not only exact keywords.'],
            [MessageSquareText, 'Grounded answers', 'Ask questions naturally and get responses based on your document context.'],
            [ShieldCheck, 'Inspectable sources', 'See the retrieved passages and page numbers behind each answer.'],
          ].map(([Icon, title, description]) => (
            <div key={title as string} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6"><Icon className="h-6 w-6 text-teal-400" aria-hidden="true" /><h2 className="mt-5 text-lg font-bold">{title as string}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description as string}</p></div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-800 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DocuMind</span>
          <div className="flex gap-5"><a href="https://github.com/sepalsagar/Documind" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Github className="h-4 w-4" aria-hidden="true" /> GitHub</a><a href="https://sepalsagar.me" target="_blank" rel="noreferrer" className="hover:text-white">Portfolio</a></div>
        </div>
      </footer>
    </main>
  );
}
