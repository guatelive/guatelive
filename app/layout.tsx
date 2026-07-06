import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import { Header } from '@/components/layout/header';
import { SITE_URL } from '@/lib/site-config';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'GuateLive',
  description: 'Descubrí los mejores planes en Guatemala',
  alternates: { canonical: SITE_URL },
  verification: { google: 'Rw4muM7Z1ReeAaA841zXB3kpCAGWdSfkiKaRZ3E5hSU' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}