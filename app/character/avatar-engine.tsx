'use client';

import React from 'react';
import type { CharacterAppearance, CharacterEquipment } from './types';

interface AvatarEngineProps {
  appearance: CharacterAppearance;
  equipment?: CharacterEquipment;
  size?: 'small' | 'medium' | 'large' | 'hero';
  showPedestal?: boolean;
  interactive?: boolean;
  className?: string;
}

const SKIN_COLORS: Record<string, { base: string; shadow: string; deepShadow: string; highlight: string; blush: string; earInner: string }> = {
  fair: {
    base: '#fed7aa',
    shadow: '#fba560',
    deepShadow: '#ea580c',
    highlight: '#fff7ed',
    blush: '#fb7185',
    earInner: '#f472b6',
  },
  sand: {
    base: '#f5cfab',
    shadow: '#e0a976',
    deepShadow: '#b46e34',
    highlight: '#fffbf5',
    blush: '#f87171',
    earInner: '#fb7185',
  },
  amber: {
    base: '#e8af78',
    shadow: '#c98344',
    deepShadow: '#9a531a',
    highlight: '#fde5cc',
    blush: '#f43f5e',
    earInner: '#e11d48',
  },
  honey: {
    base: '#d7945d',
    shadow: '#b66e34',
    deepShadow: '#854313',
    highlight: '#fad7b7',
    blush: '#e11d48',
    earInner: '#be123c',
  },
  olive: {
    base: '#b87c4c',
    shadow: '#94582a',
    deepShadow: '#6b3711',
    highlight: '#e4b690',
    blush: '#e11d48',
    earInner: '#9f1239',
  },
  walnut: {
    base: '#8c522a',
    shadow: '#6a3614',
    deepShadow: '#491e06',
    highlight: '#b77c53',
    blush: '#be123c',
    earInner: '#881337',
  },
  cocoa: {
    base: '#5a3118',
    shadow: '#3c1b09',
    deepShadow: '#220d03',
    highlight: '#814c2b',
    blush: '#9f1239',
    earInner: '#500724',
  },
  espresso: {
    base: '#3a1e0f',
    shadow: '#240f05',
    deepShadow: '#120601',
    highlight: '#5e351d',
    blush: '#881337',
    earInner: '#4c0519',
  },
};

export function IllustratedAvatar({
  appearance,
  equipment = {},
  size = 'large',
  showPedestal = false,
  className = '',
}: AvatarEngineProps) {
  const skin = SKIN_COLORS[appearance.skinTone] || SKIN_COLORS.honey;
  const hairStyle = appearance.hairStyle || 'curls';
  const faceExpression = appearance.face || 'smile';

  const headwear = equipment.headwear;
  const clothing = equipment.clothing || 'starter-tunic';
  const shoes = equipment.shoes || 'starter-sandals';
  const accessory = equipment.accessory;
  const backpack = equipment.backpack || 'starter-satchel';
  const lantern = equipment.lantern || 'starter-lantern';
  const pet = equipment.pet;
  const emote = equipment.emote;
  const special = equipment.special;

  const sizePixels = size === 'small' ? 72 : size === 'medium' ? 128 : size === 'large' ? 220 : 320;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`ll-avatar-container ll-avatar-${size} ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
      role="img"
      aria-label={`Pixar-style character avatar with ${hairStyle} hair, ${clothing}, and ${lantern}`}
    >
      <svg
        viewBox="0 0 200 240"
        className="ll-avatar-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Pixar 3D Skin Volumetric Gradients */}
          <radialGradient id={`pixarHeadSkin_${uniqueId}`} cx="45%" cy="38%" r="65%">
            <stop offset="0%" stopColor={skin.highlight} />
            <stop offset="55%" stopColor={skin.base} />
            <stop offset="90%" stopColor={skin.shadow} />
            <stop offset="100%" stopColor={skin.deepShadow} />
          </radialGradient>

          <radialGradient id={`pixarNoseHighlight_${uniqueId}`} cx="38%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="60%" stopColor={skin.highlight} stopOpacity="0.4" />
            <stop offset="100%" stopColor={skin.base} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`pixarCheekGlow_${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={skin.blush} stopOpacity="0.55" />
            <stop offset="65%" stopColor={skin.blush} stopOpacity="0.25" />
            <stop offset="100%" stopColor={skin.base} stopOpacity="0" />
          </radialGradient>

          {/* Pixar Expressive 3D Eyes Gradients */}
          <linearGradient id={`pixarEyeWhiteGrad_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="25%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>

          <radialGradient id={`pixarIrisGrad_${uniqueId}`} cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="35%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#0369a1" />
            <stop offset="95%" stopColor="#082f49" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          <radialGradient id={`pixarIrisWarmGrad_${uniqueId}`} cx="45%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="40%" stopColor="#d97706" />
            <stop offset="75%" stopColor="#92400e" />
            <stop offset="95%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#1c0a00" />
          </radialGradient>

          {/* Pixar 3D Hair Sculpt Gradients */}
          <linearGradient id={`pixarHairBase_${uniqueId}`} x1="20%" y1="0%" x2="80%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="30%" stopColor="#451a03" />
            <stop offset="85%" stopColor="#290e02" />
            <stop offset="100%" stopColor="#170601" />
          </linearGradient>

          <linearGradient id={`pixarHairGloss_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0" />
            <stop offset="45%" stopColor="#fbbf24" stopOpacity="0.55" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.75" />
            <stop offset="75%" stopColor="#f59e0b" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </linearGradient>

          {/* Clothing & Fabric Gradients */}
          <linearGradient id={`pixarTunicGrad_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="40%" stopColor="#0284c7" />
            <stop offset="80%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>

          <linearGradient id={`pixarGoldFabGrad_${uniqueId}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>

          <linearGradient id={`pixarSilverFabGrad_${uniqueId}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#cbd5e1" />
            <stop offset="80%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          <linearGradient id={`pixarGreenHoodieGrad_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="40%" stopColor="#059669" />
            <stop offset="85%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Pedestal Stage 3D Gradient */}
          <radialGradient id={`pixarPedestalTop_${uniqueId}`} cx="50%" cy="30%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          <linearGradient id={`pixarPedestalRim_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="50%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* Ambient Pixar Light Backdrop */}
          <radialGradient id={`pixarBackdropGlow_${uniqueId}`} cx="50%" cy="40%" r="52%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#60a5fa" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          </radialGradient>

          {/* Drop Shadows and Ambient Occlusion Filters */}
          <filter id={`pixarSoftShadow_${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
            <feOffset dx="0" dy="3" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id={`pixarLanternGlow_${uniqueId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Ambient Warm Key Light */}
        <circle cx="100" cy="110" r="92" fill={`url(#pixarBackdropGlow_${uniqueId})`} />

        {/* 3D Adventure Pedestal / Hologram Platform */}
        {showPedestal && (
          <g className="ll-avatar-pedestal">
            {/* Outer Drop Shadow */}
            <ellipse cx="100" cy="226" rx="68" ry="14" fill="#030712" fillOpacity="0.45" />
            {/* Base Ring Tier 1 */}
            <ellipse cx="100" cy="222" rx="58" ry="11" fill="#0f172a" stroke="#1e293b" strokeWidth="1.5" />
            {/* Illuminated Center Tier 2 */}
            <ellipse cx="100" cy="219" rx="50" ry="8.5" fill={`url(#pixarPedestalTop_${uniqueId})`} stroke={`url(#pixarPedestalRim_${uniqueId})`} strokeWidth="2" />
            {/* Inner Crystal Disc */}
            <ellipse cx="100" cy="218" rx="42" ry="6" fill="#1e293b" />
            <ellipse cx="100" cy="217.5" rx="34" ry="4" fill="#38bdf8" fillOpacity="0.25" />
            <ellipse cx="100" cy="217" rx="18" ry="2" fill="#e0f2fe" fillOpacity="0.45" />
          </g>
        )}

        {/* Special Aura: Guardian Halo / Wings */}
        {(special === 'tomb-light-halo' || backpack === 'celestial-wings-pack') && (
          <g className="ll-avatar-celestial-aura">
            {backpack === 'celestial-wings-pack' && (
              <g className="ll-avatar-wings" opacity="0.88">
                <path d="M68 116C36 80 14 105 26 148C42 142 58 132 68 116Z" fill={`url(#pixarGoldFabGrad_${uniqueId})`} stroke="#b45309" strokeWidth="1.5" />
                <path d="M132 116C164 80 186 105 174 148C158 142 142 132 132 116Z" fill={`url(#pixarGoldFabGrad_${uniqueId})`} stroke="#b45309" strokeWidth="1.5" />
              </g>
            )}
            <circle cx="100" cy="70" r="50" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="5 5" fill="none" opacity="0.75" />
            <path d="M100 16L100 26M100 114L100 124M46 70L56 70M144 70L154 70" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 3D Backpack Layer (Behind Character Body) */}
        {backpack === 'explorer-backpack' && (
          <g className="ll-avatar-backpack-explorer" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <rect x="62" y="108" width="76" height="66" rx="14" fill="#047857" stroke="#064e3b" strokeWidth="2" />
            <rect x="66" y="100" width="68" height="14" rx="6" fill="#d97706" stroke="#92400e" strokeWidth="1.5" />
            <rect x="94" y="112" width="12" height="6" rx="2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
          </g>
        )}

        {backpack === 'scrolls-backpack' && (
          <g className="ll-avatar-backpack-scrolls" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <rect x="64" y="110" width="72" height="62" rx="12" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            {/* Parchment Rolls */}
            <ellipse cx="70" cy="106" rx="7" ry="14" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
            <ellipse cx="130" cy="106" rx="7" ry="14" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
          </g>
        )}

        {/* ── 3D CHARACTER BODY GROUP ── */}
        <g className="ll-avatar-body-group">
          {/* Ambient Floor Shadow under Feet */}
          <ellipse cx="100" cy="214" rx="40" ry="7" fill="#000000" fillOpacity="0.3" />

          {/* 3D Volumetric Legs with Shading */}
          <rect x="82" y="162" width="16" height="44" rx="7" fill={skin.shadow} />
          <rect x="83.5" y="163" width="7" height="38" rx="3.5" fill={skin.base} opacity="0.8" />
          <rect x="102" y="162" width="16" height="44" rx="7" fill={skin.shadow} />
          <rect x="103.5" y="163" width="7" height="38" rx="3.5" fill={skin.base} opacity="0.8" />

          {/* ── 3D Sculpted Shoes ── */}
          {shoes === 'adventurers-boots' && (
            <g className="ll-avatar-shoes-boots">
              <path d="M78 186H100V208C100 213 96 215 91 215H74C72 215 71 213 72 210L78 186Z" fill="#54280b" stroke="#291102" strokeWidth="2" />
              <path d="M80 188H92V202H80V188Z" fill="#78350f" opacity="0.6" />
              <path d="M100 186H122L128 210C129 213 128 215 126 215H109C104 215 100 213 100 208V186Z" fill="#54280b" stroke="#291102" strokeWidth="2" />
              <path d="M102 188H114V202H102V188Z" fill="#78350f" opacity="0.6" />
              {/* Golden Boot Buckles */}
              <rect x="78" y="194" width="22" height="3.5" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
              <rect x="100" y="194" width="22" height="3.5" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            </g>
          )}

          {shoes === 'runners-sandals' && (
            <g className="ll-avatar-shoes-runners">
              <path d="M79 196H100V213H75L79 196Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
              <path d="M100 196H121L125 213H100V196Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
              {/* Golden Wings On Heel */}
              <path d="M70 192C74 188 80 190 81 195C78 196 74 196 70 192Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
              <path d="M130 192C126 188 120 190 119 195C122 196 126 196 130 192Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
            </g>
          )}

          {shoes === 'high-top-sneakers' && (
            <g className="ll-avatar-shoes-sneakers">
              <path d="M77 190H99V213C99 215 95 215 90 215H73L77 190Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
              <path d="M101 190H123L127 215H110C105 215 101 215 101 213V190Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
              {/* Rubber Soles & Toe Caps */}
              <rect x="73" y="211" width="26" height="5" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
              <rect x="101" y="211" width="26" height="5" rx="2" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            </g>
          )}

          {(shoes === 'starter-sandals' || !shoes) && (
            <g className="ll-avatar-shoes-sandals">
              <rect x="79" y="206" width="20" height="7" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
              <rect x="101" y="206" width="20" height="7" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.5" />
              {/* Crossed Leather Straps */}
              <path d="M81 198L97 209M97 198L81 209" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
              <path d="M103 198L119 209M119 198L103 209" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {/* 3D Neck & Chest Occlusion */}
          <rect x="89" y="94" width="22" height="22" rx="6" fill={skin.deepShadow} />
          <rect x="91" y="95" width="18" height="20" rx="5" fill={skin.shadow} />

          {/* ── 3D Pixar Styled Clothing & Tunics ── */}
          {clothing === 'golden-cloak' && (
            <g className="ll-avatar-clothing-gold" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M66 110L58 178C58 183 142 183 142 178L134 110H66Z" fill={`url(#pixarGoldFabGrad_${uniqueId})`} stroke="#b45309" strokeWidth="2.5" />
              <path d="M80 108L100 136L120 108" stroke="#ffffff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="138" r="5.5" fill="#ef4444" stroke="#991b1b" strokeWidth="2" />
              <rect x="70" y="152" width="60" height="7" rx="2" fill="#b45309" />
              <rect x="94" y="150" width="12" height="11" rx="2.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
            </g>
          )}

          {clothing === 'silver-robe' && (
            <g className="ll-avatar-clothing-silver" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M66 110L60 176C60 181 140 181 140 176L134 110H66Z" fill={`url(#pixarSilverFabGrad_${uniqueId})`} stroke="#64748b" strokeWidth="2.5" />
              <path d="M82 108L100 134L118 108" stroke="#38bdf8" strokeWidth="3.5" fill="none" strokeLinecap="round" />
              <rect x="70" y="150" width="60" height="7" rx="2" fill="#0284c7" />
              <rect x="94" y="148" width="12" height="11" rx="2.5" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
            </g>
          )}

          {clothing === 'explorer-hoodie' && (
            <g className="ll-avatar-clothing-hoodie" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M68 110L62 174C62 178 138 178 138 174L132 110H68Z" fill={`url(#pixarGreenHoodieGrad_${uniqueId})`} stroke="#064e3b" strokeWidth="2.5" />
              {/* Kangaroo Pocket */}
              <rect x="76" y="144" width="48" height="20" rx="6" fill="#047857" stroke="#064e3b" strokeWidth="1.5" />
              <path d="M96 110V134" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {clothing === 'denim-jacket' && (
            <g className="ll-avatar-clothing-denim" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M68 110L62 172H138L132 110H68Z" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2.5" />
              <path d="M82 110L100 132L118 110" fill="#f8fafc" />
              <rect x="74" y="126" width="16" height="12" rx="3" fill="#1e3a8a" />
              <rect x="110" y="126" width="16" height="12" rx="3" fill="#1e3a8a" />
            </g>
          )}

          {clothing === 'scripture-tee' && (
            <g className="ll-avatar-clothing-tee" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M70 110L64 170H136L130 110H70Z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="2.5" />
              <circle cx="100" cy="138" r="9" fill="#f59e0b" />
              <path d="M100 132L100 144M94 138L106 138" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {clothing === 'wilderness-cloak' && (
            <g className="ll-avatar-clothing-wilderness" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M66 110L56 178C56 183 144 183 144 178L134 110H66Z" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
              <path d="M84 108C90 124 110 124 116 108" fill="#92400e" stroke="#451a03" strokeWidth="2" />
              <circle cx="100" cy="125" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              <rect x="72" y="154" width="56" height="6" fill="#451a03" />
            </g>
          )}

          {(clothing === 'starter-tunic' || !clothing) && (
            <g className="ll-avatar-clothing-starter" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M68 110L62 174C62 178 138 178 138 174L132 110H68Z" fill={`url(#pixarTunicGrad_${uniqueId})`} stroke="#0369a1" strokeWidth="2.5" />
              {/* White Collar Hem */}
              <path d="M86 108C86 122 114 122 114 108" stroke="#f0f9ff" strokeWidth="3.5" strokeLinecap="round" />
              {/* Belt & Gold Buckle */}
              <rect x="70" y="148" width="60" height="7" fill="#0369a1" rx="2" />
              <rect x="94" y="145" width="12" height="13" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              <rect x="97" y="148" width="6" height="7" rx="1.5" fill="#0369a1" />
            </g>
          )}

          {/* ── 3D Sculpted Pixar Arms & Poses ── */}
          <g className="ll-avatar-arms">
            {emote === 'emote-wave' ? (
              // Friendly waving hand
              <>
                <path d="M70 114L46 88C43 84 38 88 40 92L62 124" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="43" cy="85" r="6.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <path d="M130 114L150 142C152 145 156 146 159 143C162 140 160 136 156 132L136 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
              </>
            ) : emote === 'emote-prayer' ? (
              // Respectful prayer pose
              <>
                <path d="M70 114L94 138C96 140 104 140 106 138L130 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2.5" />
                <circle cx="100" cy="140" r="7.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            ) : emote === 'emote-victory' || emote === 'emote-celebrate' ? (
              // Celebratory victory arms raised
              <>
                <path d="M70 114L46 78C44 74 39 76 41 82L64 122" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="43" cy="74" r="6" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <path d="M130 114L154 78C156 74 161 76 159 82L136 122" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="157" cy="74" r="6" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            ) : (
              // Natural friendly adventurer pose with 3D hands
              <>
                <path d="M70 114L50 146C48 149 50 155 55 155C58 155 62 152 66 144L80 120" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="53" cy="151" r="5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.2" />
                <path d="M130 114L150 142C152 145 156 146 159 143C162 140 160 136 156 132L136 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="156" cy="143" r="5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.2" />
              </>
            )}
          </g>

          {/* 3D Leather Satchel Across Chest */}
          {backpack === 'starter-satchel' && (
            <g className="ll-avatar-satchel" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M68 112L126 162" stroke="#54280b" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M68 112L126 162" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
              {/* Satchel Bag */}
              <rect x="114" y="152" width="18" height="16" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="1.8" />
              <path d="M114 156H132" stroke="#451a03" strokeWidth="1.5" />
              <circle cx="123" cy="161" r="2.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            </g>
          )}

          {accessory === 'cross-pendant' && (
            <g className="ll-avatar-cross">
              <path d="M90 112C94 124 100 128 100 130C100 128 106 124 110 112" stroke="#f59e0b" strokeWidth="1.8" fill="none" />
              <path d="M97 128H103V145H97V128ZM92 133H108V137H92V133Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" filter={`url(#pixarSoftShadow_${uniqueId})`} />
            </g>
          )}

          {accessory === 'garden-leaf-pin' && (
            <g className="ll-avatar-leaf-pin">
              <path d="M82 120C82 120 87 110 97 112C97 112 96 122 82 120Z" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
              <circle cx="82" cy="120" r="2" fill="#f59e0b" />
            </g>
          )}

          {accessory === 'shepherd-sling' && (
            <g className="ll-avatar-sling">
              <path d="M76 114L124 164" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
              <circle cx="126" cy="166" r="6" fill="#94a3b8" stroke="#475569" strokeWidth="1.8" />
            </g>
          )}

          {accessory === 'scripture-band' && (
            <g className="ll-avatar-scripture-band">
              <rect x="52" y="144" width="7" height="9" rx="2" fill="#78350f" stroke="#fbbf24" strokeWidth="1.2" />
            </g>
          )}
        </g>

        {/* ── 3D SCULPTED PIXAR HEAD & EXPRESSIVE FACE ── */}
        <g className="ll-avatar-head-group">
          {/* Volumetric Ears with Lobe Depth */}
          <g className="ll-avatar-ears">
            <circle cx="68" cy="74" r="8" fill={skin.base} stroke={skin.deepShadow} strokeWidth="1.5" />
            <circle cx="68" cy="74" r="4.5" fill={skin.earInner} opacity="0.65" />
            <circle cx="132" cy="74" r="8" fill={skin.base} stroke={skin.deepShadow} strokeWidth="1.5" />
            <circle cx="132" cy="74" r="4.5" fill={skin.earInner} opacity="0.65" />
          </g>

          {/* 3D Pixar Head Shape with Volumetric Curvature */}
          <path
            d="M70 65C70 38 80 26 100 26C120 26 130 38 130 65C130 90 120 100 100 100C80 100 70 90 70 65Z"
            fill={`url(#pixarHeadSkin_${uniqueId})`}
            stroke={skin.deepShadow}
            strokeWidth="1.8"
            filter={`url(#pixarSoftShadow_${uniqueId})`}
          />

          {/* Forehead 3D Light Specular Curve */}
          <ellipse cx="100" cy="44" rx="22" ry="12" fill={skin.highlight} fillOpacity="0.55" />

          {/* Rosy Pixar Cheeks */}
          <circle cx="78" cy="76" r="8" fill={`url(#pixarCheekGlow_${uniqueId})`} />
          <circle cx="122" cy="76" r="8" fill={`url(#pixarCheekGlow_${uniqueId})`} />

          {/* Eyebrows with Pixar Shape & Expressions */}
          <g className="ll-avatar-eyebrows">
            {faceExpression === 'thinking' ? (
              <>
                <path d="M76 52C82 48 90 51 93 54" stroke="#290e02" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M124 56C118 54 110 52 107 50" stroke="#290e02" strokeWidth="3.5" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M76 54C82 50 90 51 93 54" stroke="#290e02" strokeWidth="3.5" strokeLinecap="round" />
                <path d="M124 54C118 50 110 51 107 54" stroke="#290e02" strokeWidth="3.5" strokeLinecap="round" />
                {/* Eyebrow Highlight Specular */}
                <path d="M78 53C83 50 88 51 90 53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
                <path d="M122 53C117 50 112 51 110 53" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
              </>
            )}
          </g>

          {/* ── Expressive Pixar Eyes ── */}
          <g className="ll-avatar-eyes">
            {faceExpression === 'calm' || faceExpression === 'thinking' ? (
              <>
                {/* Closed content eyes */}
                <path d="M77 66C82 72 90 72 94 66" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                <path d="M106 66C110 72 118 72 123 66" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
              </>
            ) : faceExpression === 'victory' ? (
              <>
                {/* Winking playful eye */}
                <path d="M77 66C82 72 90 72 94 66" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" fill="none" />
                {/* Right Big Sparkle Eye */}
                <ellipse cx="114" cy="65" rx="7.5" ry="8.5" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="114" cy="65" r="5.8" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="3.2" fill="#020617" />
                {/* Pixar Dual Catchlights */}
                <circle cx="112" cy="62.5" r="2.4" fill="#ffffff" />
                <circle cx="116" cy="67" r="1.3" fill="#e0f2fe" />
              </>
            ) : faceExpression === 'wonder' ? (
              <>
                {/* Wide Starry Eyes */}
                <ellipse cx="86" cy="65" rx="8.5" ry="9.5" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="86" cy="65" r="6.8" fill={`url(#pixarIrisWarmGrad_${uniqueId})`} />
                <circle cx="86" cy="65" r="3.8" fill="#020617" />
                <circle cx="83.5" cy="62" r="2.8" fill="#ffffff" />
                <circle cx="88.5" cy="67" r="1.5" fill="#fef08a" />

                <ellipse cx="114" cy="65" rx="8.5" ry="9.5" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="114" cy="65" r="6.8" fill={`url(#pixarIrisWarmGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="3.8" fill="#020617" />
                <circle cx="111.5" cy="62" r="2.8" fill="#ffffff" />
                <circle cx="116.5" cy="67" r="1.5" fill="#fef08a" />
              </>
            ) : (
              <>
                {/* Standard Signature Pixar 3D Big Luminous Eyes */}
                <ellipse cx="86" cy="65" rx="7.5" ry="8.5" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="86" cy="65" r="5.8" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="86" cy="65" r="3.2" fill="#020617" />
                {/* Pixar Dual Catchlights */}
                <circle cx="84" cy="62.5" r="2.4" fill="#ffffff" />
                <circle cx="88" cy="67" r="1.3" fill="#e0f2fe" />

                <ellipse cx="114" cy="65" rx="7.5" ry="8.5" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="1.8" />
                <circle cx="114" cy="65" r="5.8" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="3.2" fill="#020617" />
                {/* Pixar Dual Catchlights */}
                <circle cx="112" cy="62.5" r="2.4" fill="#ffffff" />
                <circle cx="116" cy="67" r="1.3" fill="#e0f2fe" />
              </>
            )}

            {/* Eyelid crease line above eyes */}
            <path d="M78 58C82 56 89 56 93 58" stroke={skin.deepShadow} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
            <path d="M107 58C111 56 118 56 122 58" stroke={skin.deepShadow} strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          </g>

          {/* Glasses */}
          {accessory === 'scholar-glasses' && (
            <g className="ll-avatar-glasses" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <circle cx="86" cy="65" r="10.5" stroke="#f59e0b" strokeWidth="2.5" fill="#e0f2fe" fillOpacity="0.2" />
              <circle cx="114" cy="65" r="10.5" stroke="#f59e0b" strokeWidth="2.5" fill="#e0f2fe" fillOpacity="0.2" />
              <path d="M96.5 65H103.5" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* 3D Cute Button Nose */}
          <g className="ll-avatar-nose">
            <ellipse cx="100" cy="73" rx="5" ry="3.5" fill={skin.shadow} />
            <ellipse cx="100" cy="72" rx="4" ry="3" fill={skin.base} />
            <circle cx="99" cy="71" r="2" fill={`url(#pixarNoseHighlight_${uniqueId})`} />
            {/* Subtle Nostril Curves */}
            <path d="M96 74C97.5 75.5 102.5 75.5 104 74" stroke={skin.deepShadow} strokeWidth="1.5" strokeLinecap="round" fill="none" />
          </g>

          {/* 3D Pixar Smiling Mouth */}
          <g className="ll-avatar-mouth">
            {faceExpression === 'grin' || faceExpression === 'celebrating' ? (
              <g>
                <path d="M88 78C88 88 112 88 112 78Z" fill="#9f1239" stroke="#4c0519" strokeWidth="2" />
                {/* Upper White Teeth */}
                <path d="M90 78C90 82 110 82 110 78Z" fill="#ffffff" />
                {/* Tongue */}
                <ellipse cx="100" cy="85" rx="6" ry="3" fill="#fb7185" />
              </g>
            ) : faceExpression === 'wonder' ? (
              <ellipse cx="100" cy="82" rx="4.5" ry="6" fill="#881337" stroke="#4c0519" strokeWidth="2" />
            ) : (
              <g>
                <path d="M90 80C94 86 106 86 110 80" stroke="#881337" strokeWidth="3" strokeLinecap="round" fill="none" />
                {/* Cute Corner Dimple Dots */}
                <circle cx="89" cy="79" r="1" fill="#881337" />
                <circle cx="111" cy="79" r="1" fill="#881337" />
              </g>
            )}
          </g>
        </g>

        {/* ── 3D SCULPTED PIXAR HAIR SYSTEM ── */}
        <g className="ll-avatar-hair-group" filter={`url(#pixarSoftShadow_${uniqueId})`}>
          {hairStyle === 'curls' && (
            <g className="ll-hair-curls">
              <circle cx="72" cy="38" r="14" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="87" cy="26" r="15" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="102" cy="23" r="16" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="117" cy="26" r="15" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="128" cy="38" r="14" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="66" cy="52" r="11" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="134" cy="52" r="11" fill={`url(#pixarHairBase_${uniqueId})`} />

              {/* Glossy Curl Highlights */}
              <ellipse cx="88" cy="23" rx="7" ry="4" fill={`url(#pixarHairGloss_${uniqueId})`} />
              <ellipse cx="104" cy="20" rx="8" ry="4.5" fill={`url(#pixarHairGloss_${uniqueId})`} />
              <ellipse cx="118" cy="23" rx="7" ry="4" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'waves' && (
            <g className="ll-hair-waves">
              <path
                d="M66 56C62 34 76 18 100 18C124 18 138 34 134 56C140 68 142 88 138 96C134 88 130 80 130 66C126 38 116 30 100 30C84 30 74 38 70 66C70 80 66 88 62 96C58 88 60 68 66 56Z"
                fill={`url(#pixarHairBase_${uniqueId})`}
                stroke="#170601"
                strokeWidth="1.5"
              />
              <path d="M82 26C92 22 108 22 118 26" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" />
            </g>
          )}

          {hairStyle === 'braids' && (
            <g className="ll-hair-braids">
              <path d="M70 44C70 24 82 20 100 20C118 20 130 24 130 44C130 48 70 48 70 44Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              {/* Textured Braids with Golden Ring Clasps */}
              <rect x="64" y="44" width="7" height="54" rx="3.5" fill="#3b1d06" stroke="#170601" strokeWidth="1" />
              <rect x="73" y="46" width="7" height="58" rx="3.5" fill="#290e02" stroke="#170601" strokeWidth="1" />
              <rect x="120" y="46" width="7" height="58" rx="3.5" fill="#290e02" stroke="#170601" strokeWidth="1" />
              <rect x="129" y="44" width="7" height="54" rx="3.5" fill="#3b1d06" stroke="#170601" strokeWidth="1" />
              {/* Golden Beads */}
              <circle cx="67.5" cy="94" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
              <circle cx="76.5" cy="100" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
              <circle cx="123.5" cy="100" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
              <circle cx="132.5" cy="94" r="3.2" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
            </g>
          )}

          {hairStyle === 'short' && (
            <g className="ll-hair-short">
              <path
                d="M69 52C68 30 80 20 100 20C120 20 132 30 131 52C127 42 118 34 100 34C82 34 73 42 69 52Z"
                fill={`url(#pixarHairBase_${uniqueId})`}
                stroke="#170601"
                strokeWidth="1.5"
              />
              <path d="M84 28C94 24 106 24 116 28" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            </g>
          )}

          {hairStyle === 'coils' && (
            <g className="ll-hair-coils">
              <path d="M66 48C64 26 76 16 100 16C124 16 136 26 134 48C128 36 118 28 100 28C82 28 72 36 66 48Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="78" cy="24" r="7.5" fill="#3b1d06" />
              <circle cx="94" cy="20" r="8.5" fill="#290e02" />
              <circle cx="106" cy="20" r="8.5" fill="#3b1d06" />
              <circle cx="122" cy="24" r="7.5" fill="#290e02" />
              <ellipse cx="100" cy="18" rx="14" ry="4" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'afro' && (
            <g className="ll-hair-afro">
              <circle cx="100" cy="46" r="42" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="68" cy="54" r="16" fill="#3b1d06" />
              <circle cx="132" cy="54" r="16" fill="#3b1d06" />
              <ellipse cx="100" cy="22" rx="20" ry="8" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'ponytail' && (
            <g className="ll-hair-ponytail">
              <path d="M69 52C68 30 80 20 100 20C120 20 132 30 131 52C127 42 118 34 100 34C82 34 73 42 69 52Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              {/* High Bouncy Ponytail with Golden Scrunchie */}
              <circle cx="130" cy="24" r="6" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" />
              <path d="M132 24C150 26 156 50 148 72C144 62 136 46 132 24Z" fill={`url(#pixarHairBase_${uniqueId})`} stroke="#170601" strokeWidth="1.5" />
              <path d="M136 32C144 42 146 54 144 64" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
            </g>
          )}

          {hairStyle === 'fade' && (
            <g className="ll-hair-fade">
              <path d="M72 46C72 28 82 22 100 22C118 22 128 28 128 46C124 38 116 32 100 32C84 32 76 38 72 46Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="86" cy="26" r="6.5" fill="#3b1d06" />
              <circle cx="100" cy="23" r="7.5" fill="#290e02" />
              <circle cx="114" cy="26" r="6.5" fill="#3b1d06" />
              <ellipse cx="100" cy="22" rx="14" ry="3" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}
        </g>

        {/* ── 3D Headwear Overlay ── */}
        {headwear === 'kingdom-crown' && (
          <g className="ll-avatar-crown" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path d="M70 38L76 14L88 28L100 8L112 28L124 14L130 38H70Z" fill={`url(#pixarGoldFabGrad_${uniqueId})`} stroke="#b45309" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Jewels */}
            <circle cx="100" cy="8" r="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
            <circle cx="76" cy="14" r="3.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
            <circle cx="124" cy="14" r="3.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
            <rect x="70" y="36" width="60" height="6" rx="2" fill="#b45309" />
          </g>
        )}

        {headwear === 'guardian-halo' && (
          <g className="ll-avatar-halo">
            <ellipse cx="100" cy="14" rx="38" ry="11" stroke={`url(#pixarGoldFabGrad_${uniqueId})`} strokeWidth="4.5" fill="none" filter="drop-shadow(0 0 6px #fbbf24)" />
            <ellipse cx="100" cy="14" rx="38" ry="11" stroke="#ffffff" strokeWidth="2" fill="none" strokeDasharray="8 5" />
          </g>
        )}

        {headwear === 'starter-cap' && (
          <g className="ll-avatar-cap" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path d="M68 44C68 24 80 18 100 18C120 18 132 24 132 44H68Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.5" />
            <path d="M62 44C62 44 78 40 100 40C122 40 138 44 138 44C138 49 124 53 100 53C76 53 62 49 62 44Z" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="2" />
            <circle cx="100" cy="18" r="3.5" fill="#fbbf24" />
          </g>
        )}

        {headwear === 'scouts-hood' && (
          <g className="ll-avatar-hood" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path d="M64 56C60 28 74 14 100 14C126 14 140 28 136 56C130 50 118 45 100 45C82 45 70 50 64 56Z" fill="#059669" stroke="#064e3b" strokeWidth="2.5" />
            <circle cx="100" cy="45" r="3.5" fill="#fbbf24" />
          </g>
        )}

        {/* ── 3D FLOATING / HANDHELD LANTERN ── */}
        <g className="ll-avatar-lantern" transform="translate(150, 122)">
          {/* Top Brass Handle */}
          <path d="M12 -2V7" stroke="#b45309" strokeWidth="3" strokeLinecap="round" />
          {/* Cap Roof */}
          <path d="M2 7H22L18 12H6L2 7Z" fill={lantern === 'golden-lantern' ? `url(#pixarGoldFabGrad_${uniqueId})` : '#78350f'} stroke="#451a03" strokeWidth="1.5" />
          {/* Glass Chamber with Ambient Golden Glow */}
          <rect
            x="4"
            y="12"
            width="16"
            height="20"
            rx="3"
            fill={lantern === 'celestial-fire-lantern' ? '#dbeafe' : '#fef08a'}
            stroke={lantern === 'golden-lantern' ? '#b45309' : '#d97706'}
            strokeWidth="2"
          />
          {/* Floating Flame Glow */}
          <circle
            cx="12"
            cy="22"
            r="10"
            fill={lantern === 'celestial-fire-lantern' ? '#3b82f6' : '#f59e0b'}
            fillOpacity="0.55"
            filter={`url(#pixarLanternGlow_${uniqueId})`}
          />
          {/* Dancing Flame Core */}
          <path
            d="M12 16C12 16 8.5 20.5 8.5 23C8.5 24.9 10.1 26.5 12 26.5C13.9 26.5 15.5 24.9 15.5 23C15.5 20.5 12 16 12 16Z"
            fill={lantern === 'celestial-fire-lantern' ? '#60a5fa' : '#f97316'}
          />
          <circle cx="12" cy="23.5" r="2" fill="#ffffff" />
          {/* Heavy Base Foot */}
          <rect x="2" y="32" width="20" height="5" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
        </g>

        {/* ── 3D PIXAR PET COMPANIONS ── */}
        {pet === 'lost-sheep-companion' && (
          <g className="ll-avatar-companion-sheep" transform="translate(14, 150)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            {/* Puffy 3D Wool Tufts */}
            <circle cx="16" cy="24" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="28" cy="24" r="11" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="22" cy="16" r="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            {/* Cute Face & Big Eyes */}
            <ellipse cx="34" cy="18" rx="7.5" ry="6.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.5" />
            <circle cx="36" cy="17" r="1.8" fill="#1e293b" />
            <circle cx="35.3" cy="16.2" r="0.8" fill="#ffffff" />
            {/* Legs */}
            <rect x="14" y="33" width="3.5" height="9" rx="1.5" fill="#475569" />
            <rect x="26" y="33" width="3.5" height="9" rx="1.5" fill="#475569" />
          </g>
        )}

        {(pet === 'lion-cub-pet' || (!pet && size === 'hero')) && (
          <g className="ll-avatar-companion-lion" transform="translate(14, 146)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            {/* Fluffy Pixar Mane */}
            <circle cx="22" cy="24" r="17" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            {/* Cute Head */}
            <circle cx="22" cy="25" r="12" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            {/* Ears */}
            <circle cx="12" cy="14" r="4.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <circle cx="12" cy="14" r="2.2" fill="#fef3c7" />
            <circle cx="32" cy="14" r="4.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <circle cx="32" cy="14" r="2.2" fill="#fef3c7" />
            {/* Big Shiny Pixar Cub Eyes */}
            <circle cx="18" cy="23" r="2.8" fill="#1e293b" />
            <circle cx="17.2" cy="22.2" r="1.2" fill="#ffffff" />
            <circle cx="26" cy="23" r="2.8" fill="#1e293b" />
            <circle cx="25.2" cy="22.2" r="1.2" fill="#ffffff" />
            {/* Muzzle & Nose */}
            <ellipse cx="22" cy="29" rx="4.5" ry="3.2" fill="#fef3c7" />
            <polygon points="22,27 20,29 24,29" fill="#78350f" />
          </g>
        )}

        {pet === 'peace-dove-pet' && (
          <g className="ll-avatar-companion-dove" transform="translate(18, 138)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <ellipse cx="22" cy="22" rx="14" ry="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />
            <circle cx="32" cy="17" r="6.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />
            <circle cx="33.5" cy="15.5" r="1.8" fill="#1e293b" />
            <circle cx="33" cy="15" r="0.8" fill="#ffffff" />
            <path d="M38 17L44 19.5L38 22Z" fill="#f59e0b" stroke="#d97706" strokeWidth="0.8" />
            {/* Green Olive Sprig */}
            <path d="M40 20C44 18 48 18 52 15" stroke="#047857" strokeWidth="1.8" strokeLinecap="round" />
            <ellipse cx="48" cy="16" rx="2.5" ry="1.5" fill="#10b981" />
          </g>
        )}

        {pet === 'desert-eagle-pet' && (
          <g className="ll-avatar-companion-eagle" transform="translate(16, 136)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <ellipse cx="22" cy="24" rx="12" ry="16" fill="#78350f" stroke="#451a03" strokeWidth="1.8" />
            <circle cx="22" cy="13" r="7.5" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
            <circle cx="24.5" cy="11.5" r="1.8" fill="#1e293b" />
            <path d="M26 13L34 15.5L26 18Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          </g>
        )}
      </svg>
    </div>
  );
}
