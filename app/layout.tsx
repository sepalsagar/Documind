import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DocuMind — AI Document Assistant',
  description: 'Intelligent AI document assistant with semantic RAG retrieval, vector search, and source-grounded answers.',
  metadataBase: new URL(process.env.APP_URL || 'https://documind-zeta-fawn.vercel.app'),
  alternates: { canonical: '/' },
  openGraph: {
    title: 'DocuMind — AI Document Assistant',
    description: 'Upload PDFs, ask questions, and inspect answers against retrieved document passages.',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'DocuMind AI document assistant' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DocuMind — AI Document Assistant',
    description: 'Upload PDFs, ask questions, and inspect answers against retrieved document passages.',
  },
  icons: { icon: '/favicon.svg', shortcut: '/favicon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-[#f8fafc] text-slate-800 antialiased selection:bg-teal-500 selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
