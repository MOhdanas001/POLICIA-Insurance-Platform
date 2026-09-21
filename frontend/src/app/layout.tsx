import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Policia — Policy & Claims Management Platform',
  description: 'Enterprise Policy & Claims Management Platform with Gemini AI hybrid tool calling and RAG architecture.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-cream-100 text-charcoal antialiased">
        {children}
      </body>
    </html>
  );
}
