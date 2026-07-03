import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-plus-jakarta-sans',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  title: 'DocuMind - Semantic Document Intelligence',
  description:
    'Intelligent semantic document search and grounded RAG platform for PDFs with citations and vector embeddings.',
  openGraph: {
    title: 'DocuMind - Semantic Document Intelligence',
    description:
      'Intelligent semantic document search and grounded RAG platform for PDFs with citations and vector embeddings.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DocuMind - Semantic Document Intelligence',
    description:
      'Intelligent semantic document search and grounded RAG platform for PDFs with citations and vector embeddings.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} ${jetbrainsMono.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="font-sans antialiased selection:bg-teal-500 selection:text-white"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
