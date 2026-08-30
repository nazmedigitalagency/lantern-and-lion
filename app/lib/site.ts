/**
 * Canonical production origin. Set NEXT_PUBLIC_SITE_URL in Vercel once a
 * custom domain is attached; until then this falls back to the known
 * production Vercel URL rather than the per-deployment VERCEL_URL, so
 * preview deployments never become the canonical origin.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://lanternandlion.vercel.app';
