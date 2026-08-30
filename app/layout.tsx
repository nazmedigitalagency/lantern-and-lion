import type { Metadata } from 'next';
import { Fredoka, Nunito_Sans } from 'next/font/google';
import './globals.css';
import MotionController from './motion-controller';
import { SITE_URL } from './lib/site';

const fredoka = Fredoka({ variable: '--font-fredoka', subsets: ['latin'], display: 'swap' });
const nunito = Nunito_Sans({ variable: '--font-nunito', subsets: ['latin'], display: 'swap' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Lantern & Lion | Bible play for growing minds',
    template: '%s',
  },
  description: 'Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
  applicationName: 'Lantern & Lion',
  icons: { icon: '/favicon.svg', shortcut: '/lantern-lion-logo.png', apple: '/lantern-lion-logo.png' },
  openGraph: {
    siteName: 'Lantern & Lion',
    title: 'Lantern & Lion',
    description: 'Bible play for growing minds.',
    type: 'website',
    locale: 'en_US',
    images: [{ url: '/og.png', width: 1731, height: 909, alt: 'Lantern & Lion, Bible play for growing minds' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lantern & Lion',
    description: 'Bible play for growing minds.',
    images: ['/og.png'],
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Lantern & Lion',
  url: SITE_URL,
  logo: `${SITE_URL}/lantern-lion-logo.png`,
  description: 'Safe Bible stories, games and real-life choices for children and teens, with parents close by.',
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Lantern & Lion',
  url: SITE_URL,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${nunito.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <MotionController />
        {children}
      </body>
    </html>
  );
}
