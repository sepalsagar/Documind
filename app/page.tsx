import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, BrainCircuit, CheckCircle2, FileText, Github, MessageSquareText, Search, ShieldCheck } from 'lucide-react';
import LandingSessionControls from '@/components/LandingSessionControls';
import LandingThemeToggle from '@/components/LandingThemeToggle';

export const metadata: Metadata = {
  title: 'DocuMind - Document answers with sources',
  description: 'Ask questions about your PDFs and verify every answer against its source pages.',
  alternates: { canonical: '/' },
};

const steps = [
  ['01', 'Add a document', 'Upload a text-based PDF to your private library.'],
  ['02', 'Ask a question', 'Use everyday language to explore the material.'],
  ['03', 'Check the evidence', 'Open the exact passages and pages behind the answer.'],
];

export default function LandingPage() {
  return (
    <main className="landing-page min-h-screen overflow-hidden bg-[#f7f4ee] text-[#1f1b16]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org', '@type': 'SoftwareApplication', name: 'DocuMind', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
        description: 'Source-grounded PDF question answering with page-level citations.', url: 'https://documind-zeta-fawn.vercel.app',
      }) }} />
      <nav className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="DocuMind home"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1f6f66] text-white"><BrainCircuit className="h-[18px] w-[18px]" /></span><span className="text-[17px] font-semibold tracking-[-0.02em]">DocuMind</span></Link>
        <div className="flex items-center gap-3"><LandingThemeToggle /><LandingSessionControls location="header" /></div>
      </nav>
      <section className="mx-auto grid max-w-[1440px] gap-12 px-6 pb-20 pt-16 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:px-10 lg:pb-28 lg:pt-24">
        <div className="max-w-xl">
          <p className="text-sm font-medium text-[#1f6f66]">Answers you can trace</p>
          <h1 className="mt-5 text-[clamp(3rem,5.6vw,5.25rem)] font-medium leading-[0.98] tracking-[-0.045em] text-[#1f1b16]">Read less.<br />Know where it came from.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#5e554a]">DocuMind turns a question about your PDF into an answer linked to the passages that support it.</p>
          <div className="mt-9 flex flex-wrap items-center gap-3"><Link href="/register" className="inline-flex h-12 items-center gap-2 rounded-lg bg-[#1f1b16] px-5 text-sm font-medium text-white transition-colors hover:bg-[#3b342c] active:scale-[.98]">Create an account <ArrowRight className="h-4 w-4" /></Link><Link href="/login" className="inline-flex h-12 items-center rounded-lg border border-[#1f1b16]/15 px-5 text-sm font-medium text-[#1f1b16] transition-colors hover:bg-[#efe9df]">Sign in</Link><LandingSessionControls location="hero" /></div>
          <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#5e554a]"><span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#1f6f66]" /> Private document access</span><span className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#1f6f66]" /> Page-level citations</span></div>
        </div>
        <div className="relative mx-auto w-full max-w-2xl rounded-2xl border border-[#1f1b16]/12 bg-[#fdfbf7] p-3 shadow-[0_18px_45px_rgba(57,46,31,.10)]"><div className="rounded-xl border border-[#1f1b16]/10 bg-white"><div className="flex items-center justify-between border-b border-[#1f1b16]/10 px-5 py-4"><div className="flex items-center gap-3"><span className="flex h-8 w-8 items-center justify-center rounded-md bg-[#e2f0ec] text-[#1f6f66]"><FileText className="h-4 w-4" /></span><div><p className="text-sm font-medium">Research synthesis.pdf</p><p className="text-xs text-[#7b7266]">24 pages indexed</p></div></div><span className="font-mono text-xs text-[#1f6f66]">ready</span></div><div className="grid gap-0 md:grid-cols-[1.1fr_.9fr]"><div className="p-6 md:border-r md:border-[#1f1b16]/10"><p className="text-xs text-[#7b7266]">Question</p><p className="mt-2 text-xl font-medium leading-7 tracking-[-0.02em]">Which findings should shape our next experiment?</p><div className="mt-7 border-l-2 border-[#1f6f66] pl-4"><p className="text-xs text-[#7b7266]">Answer</p><p className="mt-2 text-sm leading-6 text-[#3b342c]">The report prioritizes retention at day 14 and recommends testing a guided first session before changing the pricing model.</p></div></div><div className="bg-[#f7f4ee] p-6"><p className="text-xs text-[#7b7266]">Evidence</p><div className="mt-4 space-y-3">{[['Page 7', 'Retention falls after the second week'], ['Page 12', 'Guided setup increased repeat use'], ['Page 18', 'Pricing needs a separate cohort']].map(([page, quote]) => <div key={page} className="rounded-lg border border-[#1f1b16]/10 bg-white p-3"><p className="font-mono text-xs text-[#1f6f66]">{page}</p><p className="mt-1 text-xs leading-5 text-[#5e554a]">{quote}</p></div>)}</div></div></div></div></div>
      </section>
      <section className="border-y border-[#1f1b16]/10 bg-[#efe9df] px-6 py-20 lg:px-10"><div className="mx-auto max-w-[1440px]"><p className="text-sm font-medium text-[#1f6f66]">A shorter path to the source</p><div className="mt-10 grid gap-10 md:grid-cols-3">{steps.map(([number, title, description]) => <div key={number} className="border-t border-[#1f1b16]/15 pt-4"><span className="font-mono text-xs text-[#7b7266]">{number}</span><h2 className="mt-5 text-xl font-medium tracking-[-0.02em]">{title}</h2><p className="mt-2 max-w-xs text-sm leading-6 text-[#5e554a]">{description}</p></div>)}</div></div></section>
      <section className="mx-auto max-w-[1440px] px-6 py-20 lg:px-10"><div className="grid gap-8 md:grid-cols-3">{[[Search, 'Search by meaning', 'Find the passages related to an idea, even when they use different words.'], [MessageSquareText, 'Keep the thread', 'Ask follow-up questions in the context of a single document.'], [ShieldCheck, 'Inspect every answer', 'Review the retrieved text and page number before you rely on it.']].map(([Icon, title, description]) => <div key={title as string} className="border-t border-[#1f1b16]/15 pt-5"><Icon className="h-5 w-5 text-[#1f6f66]" /><h2 className="mt-6 text-lg font-medium">{title as string}</h2><p className="mt-2 text-sm leading-6 text-[#5e554a]">{description as string}</p></div>)}</div></section>
      <footer className="border-t border-[#1f1b16]/10 px-6 py-7 lg:px-10"><div className="mx-auto flex max-w-[1440px] flex-col gap-3 text-sm text-[#7b7266] sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} DocuMind</span><div className="flex gap-5"><a href="https://github.com/sepalsagar/Documind" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#1f1b16]"><Github className="h-4 w-4" /> GitHub</a><a href="https://www.sepalsagar.me" target="_blank" rel="noreferrer" className="hover:text-[#1f1b16]">Portfolio</a></div></div></footer>
    </main>
  );
}
