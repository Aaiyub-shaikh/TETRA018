import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import BackgroundGrid from '@/components/common/BackgroundGrid';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Invexa AI — Invoice Risk Scanner & Auditor',
  description:
    'Detect duplicate invoices, GST inconsistencies, ledger mismatches, and compliance anomalies in seconds using enterprise-grade AI risk detection.',
  icons: {
    icon: '/favicon.jpeg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased h-full relative`}
      >
        {/* Mandatory grid background */}
        <BackgroundGrid />
        <div className="relative min-h-screen w-full">{children}</div>
      </body>
    </html>
  );
}
