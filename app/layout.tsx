import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

import { ProvidersAndLayout } from './ProvidersAndLayout';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

const mondwest = localFont({
  src: [
    {
      path: '../public/fonts/PPMondwest-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/PPMondwest-Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-mondwest-reg',
});

export const metadata: Metadata = {
  title: 'Walrus Photo Booth',
  description: 'Walrus Photo Booth',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${mondwest.variable} antialiased`}
      >
        <ProvidersAndLayout>{children}</ProvidersAndLayout>
        <Analytics />
      </body>
    </html>
  );
}
