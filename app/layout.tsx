import type { Metadata } from 'next';
import { Fredoka, Nunito_Sans } from 'next/font/google';
import './globals.css';

const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], display: 'swap' });
const nunito = Nunito_Sans({ variable: '--font-nunito', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  title: 'Lantern & Lion | Bible play for growing minds',
  description: 'Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
  icons: { icon: '/lantern-lion-logo.png' },
  openGraph: {
    title: 'Lantern & Lion',
    description: 'Bible play for growing minds.',
    type: 'website',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Lantern & Lion, Bible play for growing minds' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lantern & Lion',
    description: 'Bible play for growing minds.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${fredoka.variable} ${nunito.variable}`}>{children}</body></html>;
}
