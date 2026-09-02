import type { Metadata } from 'next';
import { Playfair_Display, Inter, Bricolage_Grotesque } from 'next/font/google';
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
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

// Home v2: tipografía display para títulos/logo/números destacados —
// ver design_handoff_home_v2/README.md
const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['400', '500', '600', '700', '800'],
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
    <html lang="es" className={`${inter.variable} ${playfair.variable} ${bricolage.variable}`}>
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}