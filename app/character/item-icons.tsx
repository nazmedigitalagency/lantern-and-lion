'use client';

import React from 'react';

/**
 * Dedicated vector illustration component for all inventory items,
 * equipment slots, and companions in Lion & Lantern.
 */
export function ItemIllustration({
  itemId,
  size = 48,
  className = '',
}: {
  itemId: string;
  size?: number;
  className?: string;
}) {
  const s = size;

  switch (itemId) {
    // ── Headwear ──────────────────────────────────────────────────
    case 'starter-cap':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#2d3748" fillOpacity="0.08" />
          <path d="M14 36C14 23 22 16 32 16C42 16 50 23 50 36H14Z" fill="#3b82f6" stroke="#1e3a8a" strokeWidth="2.5" />
          <path d="M10 36C10 36 20 34 32 34C44 34 54 36 54 36C54 39 46 42 32 42C18 42 10 39 10 36Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2" />
          <circle cx="32" cy="16" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
          <path d="M26 26L32 20L38 26" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );

    case 'scouts-hood':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#047857" fillOpacity="0.08" />
          <path d="M16 46C14 32 20 14 32 12C44 14 50 32 48 46C42 44 36 43 32 43C28 43 22 44 16 46Z" fill="#059669" stroke="#064e3b" strokeWidth="2.5" />
          <path d="M22 28C22 28 26 38 32 38C38 38 42 28 42 28" stroke="#10b981" strokeWidth="2" fill="none" />
          <circle cx="32" cy="46" r="3" fill="#f59e0b" />
          <path d="M30 46H34V52L32 54L30 52V46Z" fill="#d97706" />
        </svg>
      );

    case 'kingdom-crown':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#f59e0b" fillOpacity="0.1" />
          <path d="M14 42L18 20L26 32L32 16L38 32L46 20L50 42H14Z" fill="url(#crownGrad)" stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M14 42H50V46C50 47.1 49.1 48 48 48H16C14.9 48 14 47.1 14 46V42Z" fill="#d97706" stroke="#b45309" strokeWidth="2" />
          <circle cx="32" cy="16" r="2.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
          <circle cx="18" cy="20" r="2" fill="#3b82f6" />
          <circle cx="46" cy="20" r="2" fill="#3b82f6" />
          <circle cx="32" cy="36" r="2.5" fill="#10b981" />
          <circle cx="24" cy="45" r="1.5" fill="#ffffff" />
          <circle cx="32" cy="45" r="1.5" fill="#ffffff" />
          <circle cx="40" cy="45" r="1.5" fill="#ffffff" />
          <defs>
            <linearGradient id="crownGrad" x1="14" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      );

    case 'guardian-halo':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#fbbf24" fillOpacity="0.12" />
          <ellipse cx="32" cy="32" rx="22" ry="9" stroke="url(#haloGrad)" strokeWidth="5" fill="none" />
          <ellipse cx="32" cy="32" rx="22" ry="9" stroke="#ffffff" strokeWidth="2" fill="none" strokeDasharray="6 3" />
          <path d="M32 14L34 22L42 24L34 26L32 34L30 26L22 24L30 22L32 14Z" fill="#ffffff" />
          <defs>
            <linearGradient id="haloGrad" x1="10" y1="23" x2="54" y2="41" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#fbbf24" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      );

    // ── Clothing ──────────────────────────────────────────────────
    case 'starter-tunic':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#3b82f6" fillOpacity="0.08" />
          <path d="M22 16L12 26L18 32L22 28V50H42V28L46 32L52 26L42 16H22Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M28 16C28 20 36 20 36 16" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <path d="M22 36H42" stroke="#e0f2fe" strokeWidth="3" />
          <rect x="30" y="34" width="4" height="6" fill="#f59e0b" rx="1" />
        </svg>
      );

    case 'wilderness-cloak':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#92400e" fillOpacity="0.08" />
          <path d="M20 18C14 26 12 40 14 52C22 51 42 51 50 52C52 40 50 26 44 18H20Z" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
          <path d="M24 18C28 24 36 24 40 18" fill="#92400e" stroke="#451a03" strokeWidth="2" />
          <circle cx="32" cy="24" r="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <path d="M32 28V48" stroke="#522408" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );

    case 'silver-robe':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#64748b" fillOpacity="0.08" />
          <path d="M20 16L10 28L17 33L21 28V52H43V28L47 33L54 28L44 16H20Z" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M22 16L32 30L42 16" stroke="#3b82f6" strokeWidth="2.5" fill="none" />
          <path d="M21 38H43" stroke="#3b82f6" strokeWidth="3" />
          <path d="M32 38V52" stroke="#60a5fa" strokeWidth="2" />
        </svg>
      );

    case 'golden-cloak':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#fef08a" fillOpacity="0.15" />
          <path d="M18 16C12 28 10 42 12 52C22 51 42 51 52 52C54 42 52 28 46 16H18Z" fill="url(#goldCloak)" stroke="#d97706" strokeWidth="2.5" />
          <path d="M24 16L32 26L40 16" stroke="#ffffff" strokeWidth="2.5" fill="none" />
          <circle cx="32" cy="27" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
          <path d="M16 48C24 45 40 45 48 48" stroke="#ffffff" strokeWidth="2" />
          <defs>
            <linearGradient id="goldCloak" x1="12" y1="16" x2="52" y2="52" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fde047" />
              <stop offset="1" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
        </svg>
      );

    // ── Shoes ─────────────────────────────────────────────────────
    case 'starter-sandals':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#78350f" fillOpacity="0.08" />
          <path d="M14 44C14 38 20 36 24 36C28 36 29 40 29 46C29 49 26 50 20 50C16 50 14 47 14 44Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <path d="M16 40C20 40 25 43 27 45" stroke="#451a03" strokeWidth="2" />
          <path d="M18 45C22 45 26 47 28 49" stroke="#451a03" strokeWidth="2" />
          <path d="M35 46C35 40 36 36 40 36C44 36 50 38 50 44C50 47 48 50 44 50C38 50 35 49 35 46Z" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <path d="M37 45C39 43 44 40 48 40" stroke="#451a03" strokeWidth="2" />
          <path d="M36 49C38 47 42 45 46 45" stroke="#451a03" strokeWidth="2" />
        </svg>
      );

    case 'adventurers-boots':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#451a03" fillOpacity="0.08" />
          <path d="M16 22H26V40L31 42V48H14C14 48 14 36 16 22Z" fill="#522408" stroke="#331405" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M38 22H48V40L53 42V48H36C36 48 36 36 38 22Z" fill="#522408" stroke="#331405" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M18 28H24M18 34H24M40 28H46M40 34H46" stroke="#d97706" strokeWidth="2" strokeLinecap="round" />
          <path d="M13 48H32M35 48H54" stroke="#1c0a02" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );

    case 'runners-sandals':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#0284c7" fillOpacity="0.08" />
          <path d="M14 44C14 38 20 34 26 34C28 34 30 38 30 46C30 50 26 50 20 50C16 50 14 47 14 44Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <path d="M34 46C34 38 36 34 38 34C44 34 50 38 50 44C50 47 48 50 44 50C38 50 34 50 34 46Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
          <path d="M12 36L18 32M32 36L38 32" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M10 40L15 37M30 40L35 37" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
          <path d="M26 30C28 24 34 22 36 24C34 26 30 28 26 30Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
        </svg>
      );

    // ── Accessories ───────────────────────────────────────────────
    case 'garden-leaf-pin':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#10b981" fillOpacity="0.1" />
          <path d="M18 46C18 46 22 20 46 18C46 18 44 44 18 46Z" fill="#10b981" stroke="#047857" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M18 46C26 38 36 28 46 18" stroke="#ecfdf5" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M28 36L34 38M34 28L40 30" stroke="#ecfdf5" strokeWidth="2" strokeLinecap="round" />
          <circle cx="18" cy="46" r="3" fill="#f59e0b" />
        </svg>
      );

    case 'shepherd-sling':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#78350f" fillOpacity="0.08" />
          <path d="M16 20C18 36 26 46 32 46C38 46 46 36 48 20" stroke="#92400e" strokeWidth="3" strokeLinecap="round" fill="none" />
          <ellipse cx="32" cy="46" rx="9" ry="6" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          <circle cx="32" cy="44" r="4" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
          <circle cx="16" cy="20" r="3" fill="#b45309" />
          <circle cx="48" cy="20" r="3" fill="#b45309" />
        </svg>
      );

    case 'lantern-charm':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#f59e0b" fillOpacity="0.12" />
          <path d="M32 10V18" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          <path d="M22 18H42L38 24H26L22 18Z" fill="#92400e" stroke="#78350f" strokeWidth="2" />
          <rect x="24" y="24" width="16" height="22" rx="3" fill="#fef08a" stroke="#d97706" strokeWidth="2.5" />
          <path d="M32 29C32 29 28 34 28 37C28 39.2 29.8 41 32 41C34.2 41 36 39.2 36 37C36 34 32 29 32 29Z" fill="#f97316" />
          <circle cx="32" cy="37" r="2" fill="#ffffff" />
          <rect x="22" y="46" width="20" height="6" rx="2" fill="#92400e" stroke="#78350f" strokeWidth="2" />
          <circle cx="32" cy="35" r="14" fill="#f59e0b" fillOpacity="0.2" />
        </svg>
      );

    case 'cross-pendant':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#3b82f6" fillOpacity="0.08" />
          <path d="M20 12C24 22 30 26 32 28C34 26 40 22 44 12" stroke="#d97706" strokeWidth="2" strokeDasharray="3 2" fill="none" />
          <path d="M30 26H34V50H30V26Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <path d="M22 32H42V36H22V32Z" fill="#fbbf24" stroke="#b45309" strokeWidth="2" />
          <circle cx="32" cy="34" r="2.5" fill="#ef4444" />
        </svg>
      );

    // ── Special & Companions ──────────────────────────────────────
    case 'manna-basket-charm':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#f59e0b" fillOpacity="0.08" />
          <path d="M20 28C20 20 44 20 44 28" stroke="#b45309" strokeWidth="2.5" fill="none" />
          <path d="M16 28H48L44 48H20L16 28Z" fill="#d97706" stroke="#92400e" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M16 34H48M18 41H46" stroke="#b45309" strokeWidth="2" />
          <circle cx="28" cy="27" r="3.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="36" cy="26" r="3" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="32" cy="24" r="2.5" fill="#fef08a" />
        </svg>
      );

    case 'lost-sheep-companion':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#10b981" fillOpacity="0.1" />
          <circle cx="24" cy="34" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="36" cy="34" r="11" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="30" cy="28" r="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <circle cx="28" cy="40" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
          <ellipse cx="44" cy="28" rx="8" ry="7" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
          <ellipse cx="44" cy="20" rx="3" ry="5" fill="#f472b6" stroke="#94a3b8" strokeWidth="1.5" transform="rotate(25 44 20)" />
          <circle cx="47" cy="27" r="1.5" fill="#1e293b" />
          <circle cx="50" cy="30" r="1" fill="#f472b6" />
          <rect x="22" y="44" width="3" height="10" rx="1.5" fill="#475569" />
          <rect x="36" y="44" width="3" height="10" rx="1.5" fill="#475569" />
          <circle cx="24" cy="22" r="2" fill="#fbbf24" />
        </svg>
      );

    case 'lion-companion':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#f59e0b" fillOpacity="0.15" />
          <circle cx="32" cy="32" r="20" fill="#b45309" stroke="#78350f" strokeWidth="2" />
          <circle cx="32" cy="14" r="5" fill="#d97706" />
          <circle cx="48" cy="24" r="5" fill="#d97706" />
          <circle cx="48" cy="40" r="5" fill="#d97706" />
          <circle cx="32" cy="50" r="5" fill="#d97706" />
          <circle cx="16" cy="40" r="5" fill="#d97706" />
          <circle cx="16" cy="24" r="5" fill="#d97706" />
          <circle cx="32" cy="33" r="13" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="22" cy="20" r="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="42" cy="20" r="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
          <circle cx="27" cy="30" r="2.5" fill="#1e293b" />
          <circle cx="28" cy="29" r="0.8" fill="#ffffff" />
          <circle cx="37" cy="30" r="2.5" fill="#1e293b" />
          <circle cx="38" cy="29" r="0.8" fill="#ffffff" />
          <ellipse cx="32" cy="38" rx="5" ry="4" fill="#fef3c7" />
          <path d="M30 36H34L32 39L30 36Z" fill="#78350f" />
          <path d="M32 39V41M30 41C31 42 33 42 34 41" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );

    case 'tomb-light-halo':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#38bdf8" fillOpacity="0.12" />
          <path d="M32 8V18M32 46V56M8 32H18M46 32H56M15 15L22 22M42 42L49 49M15 49L22 42M42 22L49 15" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="32" cy="32" r="12" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
          <circle cx="32" cy="32" r="6" fill="#7dd3fc" />
        </svg>
      );

    case 'flame-of-faith-badge':
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="30" fill="#ef4444" fillOpacity="0.1" />
          <path d="M18 16H46V36C46 44 32 52 32 52C32 52 18 44 18 36V16Z" fill="#1e293b" stroke="#d97706" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M32 20C32 20 24 28 24 34C24 38.4 27.6 42 32 42C36.4 42 40 38.4 40 34C40 28 32 20 32 20Z" fill="url(#faithFlame)" />
          <circle cx="32" cy="35" r="3" fill="#ffffff" />
          <defs>
            <linearGradient id="faithFlame" x1="24" y1="20" x2="40" y2="42" gradientUnits="userSpaceOnUse">
              <stop stopColor="#fef08a" />
              <stop offset="0.5" stopColor="#f97316" />
              <stop offset="1" stopColor="#dc2626" />
            </linearGradient>
          </defs>
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox="0 0 64 64" fill="none" className={className}>
          <circle cx="32" cy="32" r="28" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
          <path d="M32 20V44M20 32H44" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
        </svg>
      );
  }
}
