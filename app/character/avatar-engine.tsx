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

const SKIN_COLORS: Record<
  string,
  {
    base: string;
    shadow: string;
    deepShadow: string;
    highlight: string;
    warmth: string;
    blush: string;
    earInner: string;
  }
> = {
  fair: {
    base: '#fde0c2',
    shadow: '#f5b584',
    deepShadow: '#d97736',
    highlight: '#fff8f2',
    warmth: '#fb923c',
    blush: '#fb7185',
    earInner: '#f472b6',
  },
  sand: {
    base: '#f3cba5',
    shadow: '#dba06c',
    deepShadow: '#b0652a',
    highlight: '#fff5ea',
    warmth: '#ea580c',
    blush: '#f87171',
    earInner: '#fb7185',
  },
  amber: {
    base: '#e4a76c',
    shadow: '#c07b3b',
    deepShadow: '#8f4915',
    highlight: '#fce3c8',
    warmth: '#d97706',
    blush: '#f43f5e',
    earInner: '#e11d48',
  },
  honey: {
    base: '#d18c52',
    shadow: '#ac632a',
    deepShadow: '#7a380e',
    highlight: '#f8d2ad',
    warmth: '#b45309',
    blush: '#e11d48',
    earInner: '#be123c',
  },
  olive: {
    base: '#b37443',
    shadow: '#8d4c1f',
    deepShadow: '#612e0b',
    highlight: '#deb088',
    warmth: '#9a3412',
    blush: '#e11d48',
    earInner: '#9f1239',
  },
  walnut: {
    base: '#874c24',
    shadow: '#632f0e',
    deepShadow: '#3e1703',
    highlight: '#b3764b',
    warmth: '#7c2d12',
    blush: '#be123c',
    earInner: '#881337',
  },
  cocoa: {
    base: '#572c14',
    shadow: '#381605',
    deepShadow: '#1c0801',
    highlight: '#7e4726',
    warmth: '#451a03',
    blush: '#9f1239',
    earInner: '#500724',
  },
  espresso: {
    base: '#371a0c',
    shadow: '#200b03',
    deepShadow: '#0d0300',
    highlight: '#5a3118',
    warmth: '#290e02',
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

  const sizePixels = size === 'small' ? 76 : size === 'medium' ? 136 : size === 'large' ? 240 : 340;
  const uniqueId = React.useId().replace(/:/g, '');

  return (
    <div
      className={`ll-avatar-container ll-avatar-${size} ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
      role="img"
      aria-label={`Pixar-style 3D character avatar with ${hairStyle} hair, ${clothing}, and ${lantern}`}
    >
      <svg
        viewBox="0 0 200 240"
        className="ll-avatar-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* ── PIXAR PROCEDURAL SURFACE TEXTURES ── */}
          {/* Fabric Weave Texture Filter */}
          <filter id={`pixarFabricTex_${uniqueId}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="3" result="fabricNoise" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.14 0"
              in="fabricNoise"
              result="fabricAlpha"
            />
            <feBlend in="SourceGraphic" in2="fabricAlpha" mode="multiply" />
          </filter>

          {/* Leather Grain Texture Filter */}
          <filter id={`pixarLeatherTex_${uniqueId}`} x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.38" numOctaves="3" result="leatherNoise" />
            <feColorMatrix
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0"
              in="leatherNoise"
              result="leatherAlpha"
            />
            <feBlend in="SourceGraphic" in2="leatherAlpha" mode="multiply" />
          </filter>

          {/* ── 3D VOLUMETRIC STUDIO LIGHTING & SSS GRADIENTS ── */}
          {/* Subsurface Scattering (SSS) 3D Skin Volumetric Gradient */}
          <radialGradient id={`pixarHeadSkin_${uniqueId}`} cx="40%" cy="34%" r="66%">
            <stop offset="0%" stopColor={skin.highlight} />
            <stop offset="42%" stopColor={skin.base} />
            <stop offset="68%" stopColor={skin.warmth} stopOpacity="0.75" />
            <stop offset="86%" stopColor={skin.shadow} />
            <stop offset="100%" stopColor={skin.deepShadow} />
          </radialGradient>

          {/* Golden Rim Light Accent */}
          <linearGradient id={`pixarRimGrad_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
            <stop offset="25%" stopColor="#fde047" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="100%" stopColor="#67e8f9" stopOpacity="0.3" />
          </linearGradient>

          {/* 3D Button Nose Volumetric Specular */}
          <radialGradient id={`pixarNoseHighlight_${uniqueId}`} cx="36%" cy="28%" r="48%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
            <stop offset="50%" stopColor={skin.highlight} stopOpacity="0.5" />
            <stop offset="100%" stopColor={skin.base} stopOpacity="0" />
          </radialGradient>

          {/* Rosy Pixar Cheek SSS Blush Glow */}
          <radialGradient id={`pixarCheekGlow_${uniqueId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={skin.blush} stopOpacity="0.65" />
            <stop offset="55%" stopColor={skin.blush} stopOpacity="0.3" />
            <stop offset="100%" stopColor={skin.base} stopOpacity="0" />
          </radialGradient>

          {/* ── EXPRESSIVE 3D SOULFUL PIXAR EYES ── */}
          {/* Spherical Eye White with Ambient Eyelid Shadow */}
          <linearGradient id={`pixarEyeWhiteGrad_${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="18%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>

          {/* Vivid Textured 3D Iris Gradient (Ocean Sapphire) */}
          <radialGradient id={`pixarIrisGrad_${uniqueId}`} cx="45%" cy="38%" r="56%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="28%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#075985" />
            <stop offset="100%" stopColor="#031d33" />
          </radialGradient>

          {/* Warm Amber Honey Iris Gradient */}
          <radialGradient id={`pixarIrisWarmGrad_${uniqueId}`} cx="45%" cy="38%" r="56%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="30%" stopColor="#fbbf24" />
            <stop offset="65%" stopColor="#d97706" />
            <stop offset="88%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#331404" />
          </radialGradient>

          {/* ── 3D VOLUMETRIC SCULPTED HAIR GRADIENTS ── */}
          <linearGradient id={`pixarHairBase_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#632b0a" />
            <stop offset="35%" stopColor="#451a03" />
            <stop offset="75%" stopColor="#250901" />
            <stop offset="100%" stopColor="#120400" />
          </linearGradient>

          <linearGradient id={`pixarHairGloss_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b45309" stopOpacity="0" />
            <stop offset="38%" stopColor="#fde047" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="72%" stopColor="#fbbf24" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#b45309" stopOpacity="0" />
          </linearGradient>

          {/* ── 3D TEXTURED CLOTHING & GEAR GRADIENTS ── */}
          {/* Royal Blue Tunic with Dimensional Weave */}
          <linearGradient id={`pixarTunicGrad_${uniqueId}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="32%" stopColor="#0284c7" />
            <stop offset="72%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#074768" />
          </linearGradient>

          {/* Gold Mantle / Crown Metallic Shimmer */}
          <linearGradient id={`pixarGoldFabGrad_${uniqueId}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Silver Linen Robe */}
          <linearGradient id={`pixarSilverFabGrad_${uniqueId}`} x1="10%" y1="0%" x2="90%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="40%" stopColor="#e2e8f0" />
            <stop offset="75%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Emerald Explorer Hoodie Fleece */}
          <linearGradient id={`pixarGreenHoodieGrad_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="75%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>

          {/* Denim Jacket Texture */}
          <linearGradient id={`pixarDenimGrad_${uniqueId}`} x1="15%" y1="0%" x2="85%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="35%" stopColor="#2563eb" />
            <stop offset="75%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#172554" />
          </linearGradient>

          {/* ── 3D HOLOGRAPHIC PEDESTAL ── */}
          <radialGradient id={`pixarPedestalTop_${uniqueId}`} cx="50%" cy="32%" r="50%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#0b132b" />
          </radialGradient>

          <linearGradient id={`pixarPedestalRim_${uniqueId}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0369a1" />
            <stop offset="50%" stopColor="#a5f3fc" />
            <stop offset="100%" stopColor="#0369a1" />
          </linearGradient>

          {/* ── AMBIENT ENVIRONMENT LIGHTING & GLOW ── */}
          <radialGradient id={`pixarBackdropGlow_${uniqueId}`} cx="50%" cy="38%" r="56%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.5" />
            <stop offset="48%" stopColor="#38bdf8" stopOpacity="0.2" />
            <stop offset="85%" stopColor="#1e293b" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>

          {/* Soft Directional Ambient Shadow Filter */}
          <filter id={`pixarSoftShadow_${uniqueId}`} x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="3.5" />
            <feOffset dx="0" dy="4" result="offsetblur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.38" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Luminous Lantern Volumetric Bloom */}
          <filter id={`pixarLanternGlow_${uniqueId}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── AMBIENT STUDIO KEY LIGHT BACKDROP ── */}
        <circle cx="100" cy="110" r="94" fill={`url(#pixarBackdropGlow_${uniqueId})`} />

        {/* ── 3D HOLOGRAPHIC ADVENTURE PEDESTAL ── */}
        {showPedestal && (
          <g className="ll-avatar-pedestal">
            {/* Ambient Contact Shadow */}
            <ellipse cx="100" cy="227" rx="72" ry="15" fill="#020617" fillOpacity="0.5" />
            {/* Base Tier 1 */}
            <ellipse cx="100" cy="223" rx="62" ry="12" fill="#0f172a" stroke="#1e293b" strokeWidth="1.8" />
            {/* Tier 2 Hologram Rim */}
            <ellipse
              cx="100"
              cy="219"
              rx="54"
              ry="9.5"
              fill={`url(#pixarPedestalTop_${uniqueId})`}
              stroke={`url(#pixarPedestalRim_${uniqueId})`}
              strokeWidth="2.2"
            />
            {/* Energy Discs */}
            <ellipse cx="100" cy="218" rx="44" ry="6.5" fill="#0f172a" />
            <ellipse cx="100" cy="217.5" rx="36" ry="4.5" fill="#38bdf8" fillOpacity="0.35" />
            <ellipse cx="100" cy="217" rx="20" ry="2.5" fill="#e0f2fe" fillOpacity="0.6" />
          </g>
        )}

        {/* ── SPECIAL CELESTIAL HALO / WINGS ── */}
        {(special === 'tomb-light-halo' || backpack === 'celestial-wings-pack') && (
          <g className="ll-avatar-celestial-aura">
            {backpack === 'celestial-wings-pack' && (
              <g className="ll-avatar-wings" opacity="0.92">
                <path
                  d="M66 116C32 78 12 104 24 148C40 142 56 132 66 116Z"
                  fill={`url(#pixarGoldFabGrad_${uniqueId})`}
                  stroke="#b45309"
                  strokeWidth="1.8"
                  filter={`url(#pixarSoftShadow_${uniqueId})`}
                />
                <path
                  d="M134 116C168 78 188 104 176 148C160 142 144 132 134 116Z"
                  fill={`url(#pixarGoldFabGrad_${uniqueId})`}
                  stroke="#b45309"
                  strokeWidth="1.8"
                  filter={`url(#pixarSoftShadow_${uniqueId})`}
                />
              </g>
            )}
            <circle cx="100" cy="70" r="52" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="6 6" fill="none" opacity="0.8" />
            <path d="M100 14L100 24M100 116L100 126M44 70L54 70M146 70L156 70" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* ── 3D BACKPACK (Behind Body) ── */}
        {backpack === 'explorer-backpack' && (
          <g className="ll-avatar-backpack-explorer" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <rect x="60" y="106" width="80" height="70" rx="16" fill="#047857" stroke="#064e3b" strokeWidth="2.2" filter={`url(#pixarFabricTex_${uniqueId})`} />
            <rect x="64" y="98" width="72" height="15" rx="7" fill="#d97706" stroke="#92400e" strokeWidth="1.8" />
            <rect x="93" y="110" width="14" height="7" rx="2.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1" />
          </g>
        )}

        {backpack === 'scrolls-backpack' && (
          <g className="ll-avatar-backpack-scrolls" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <rect x="62" y="108" width="76" height="66" rx="14" fill="#78350f" stroke="#451a03" strokeWidth="2.2" filter={`url(#pixarLeatherTex_${uniqueId})`} />
            <ellipse cx="68" cy="104" rx="8" ry="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
            <ellipse cx="132" cy="104" rx="8" ry="15" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" />
          </g>
        )}

        {/* ── 3D CHARACTER BODY GROUP ── */}
        <g className="ll-avatar-body-group">
          {/* Contact Floor Shadow Under Feet */}
          <ellipse cx="100" cy="214" rx="42" ry="7.5" fill="#000000" fillOpacity="0.35" />

          {/* 3D Volumetric Legs with Shading */}
          <rect x="81" y="160" width="17" height="46" rx="8" fill={skin.shadow} />
          <rect x="82.5" y="161" width="8" height="40" rx="4" fill={skin.base} opacity="0.85" />
          <rect x="102" y="160" width="17" height="46" rx="8" fill={skin.shadow} />
          <rect x="103.5" y="161" width="8" height="40" rx="4" fill={skin.base} opacity="0.85" />

          {/* ── 3D SCULPTED SHOES ── */}
          {shoes === 'adventurers-boots' && (
            <g className="ll-avatar-shoes-boots" filter={`url(#pixarLeatherTex_${uniqueId})`}>
              <path d="M76 184H100V208C100 214 96 216 90 216H73C71 216 70 214 71 211L76 184Z" fill="#54280b" stroke="#291102" strokeWidth="2.2" />
              <path d="M79 186H91V202H79V186Z" fill="#78350f" opacity="0.75" />
              <path d="M100 184H124L129 211C130 214 129 216 127 216H110C104 216 100 214 100 208V184Z" fill="#54280b" stroke="#291102" strokeWidth="2.2" />
              <path d="M101 186H113V202H101V186Z" fill="#78350f" opacity="0.75" />
              {/* Golden Boot Buckles */}
              <rect x="76" y="193" width="24" height="4" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              <rect x="100" y="193" width="24" height="4" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
              {/* Heavy Rubber Outsoles */}
              <rect x="70" y="213" width="31" height="4.5" rx="2" fill="#170601" />
              <rect x="99" y="213" width="31" height="4.5" rx="2" fill="#170601" />
            </g>
          )}

          {shoes === 'runners-sandals' && (
            <g className="ll-avatar-shoes-runners">
              <path d="M78 194H100V213H74L78 194Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2.2" />
              <path d="M100 194H122L126 213H100V194Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2.2" />
              {/* Golden Hermes/Gospel Wings */}
              <path d="M68 190C73 185 80 187 81 193C77 194 72 194 68 190Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.4" />
              <path d="M132 190C127 185 120 187 119 193C123 194 128 194 132 190Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1.4" />
            </g>
          )}

          {shoes === 'high-top-sneakers' && (
            <g className="ll-avatar-shoes-sneakers">
              <path d="M76 188H99V213C99 216 95 216 90 216H72L76 188Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2.2" />
              <path d="M101 188H124L128 216H110C105 216 101 216 101 213V188Z" fill="#ef4444" stroke="#991b1b" strokeWidth="2.2" />
              {/* Rubber Soles & Toe Caps */}
              <rect x="71" y="210" width="28" height="6" rx="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              <rect x="101" y="210" width="28" height="6" rx="2.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
              {/* White Laces */}
              <path d="M80 192H94M80 198H94M80 204H94" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <path d="M106 192H120M106 198H120M106 204H120" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {(shoes === 'starter-sandals' || !shoes) && (
            <g className="ll-avatar-shoes-sandals">
              <rect x="78" y="205" width="22" height="8" rx="3.5" fill="#92400e" stroke="#451a03" strokeWidth="1.8" />
              <rect x="100" y="205" width="22" height="8" rx="3.5" fill="#92400e" stroke="#451a03" strokeWidth="1.8" />
              {/* Crossed Leather Straps with Shading */}
              <path d="M80 197L98 209M98 197L80 209" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M102 197L120 209M120 197L102 209" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
            </g>
          )}

          {/* 3D Volumetric Neck with Occlusion Shadow */}
          <rect x="88" y="93" width="24" height="24" rx="7" fill={skin.deepShadow} />
          <rect x="90" y="94" width="20" height="22" rx="6" fill={skin.shadow} />

          {/* ── 3D PIXAR CLOTHING WITH FABRIC WEAVE TEXTURES ── */}
          {clothing === 'golden-cloak' && (
            <g className="ll-avatar-clothing-gold" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M64 110L56 178C56 184 144 184 144 178L136 110H64Z"
                fill={`url(#pixarGoldFabGrad_${uniqueId})`}
                stroke="#b45309"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              <path d="M78 108L100 138L122 108" stroke="#ffffff" strokeWidth="4" fill="none" strokeLinecap="round" />
              <circle cx="100" cy="140" r="6" fill="#ef4444" stroke="#991b1b" strokeWidth="2.2" />
              <rect x="68" y="152" width="64" height="8" rx="2.5" fill="#b45309" />
              <rect x="93" y="150" width="14" height="12" rx="3" fill="#fde047" stroke="#b45309" strokeWidth="1.8" />
            </g>
          )}

          {clothing === 'silver-robe' && (
            <g className="ll-avatar-clothing-silver" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M64 110L58 176C58 182 142 182 142 176L136 110H64Z"
                fill={`url(#pixarSilverFabGrad_${uniqueId})`}
                stroke="#64748b"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              <path d="M80 108L100 136L120 108" stroke="#38bdf8" strokeWidth="4" fill="none" strokeLinecap="round" />
              <rect x="68" y="150" width="64" height="8" rx="2.5" fill="#0284c7" />
              <rect x="93" y="148" width="14" height="12" rx="3" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
            </g>
          )}

          {clothing === 'explorer-hoodie' && (
            <g className="ll-avatar-clothing-hoodie" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M66 110L60 174C60 179 140 179 140 174L134 110H66Z"
                fill={`url(#pixarGreenHoodieGrad_${uniqueId})`}
                stroke="#064e3b"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              {/* Kangaroo Pocket */}
              <rect x="74" y="142" width="52" height="22" rx="7" fill="#047857" stroke="#064e3b" strokeWidth="1.8" />
              {/* Zipper Track & Pull */}
              <path d="M100 110V142" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" />
              <circle cx="100" cy="143" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {clothing === 'denim-jacket' && (
            <g className="ll-avatar-clothing-denim" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M66 110L60 172H140L134 110H66Z"
                fill={`url(#pixarDenimGrad_${uniqueId})`}
                stroke="#172554"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              {/* White Inner Tee */}
              <path d="M82 110L100 134L118 110" fill="#f8fafc" />
              {/* Denim Flap Pockets */}
              <rect x="72" y="125" width="18" height="14" rx="3.5" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
              <rect x="110" y="125" width="18" height="14" rx="3.5" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
              {/* Brass Buttons */}
              <circle cx="81" cy="128" r="1.5" fill="#fbbf24" />
              <circle cx="119" cy="128" r="1.5" fill="#fbbf24" />
              <circle cx="100" cy="145" r="2" fill="#fbbf24" />
              <circle cx="100" cy="158" r="2" fill="#fbbf24" />
            </g>
          )}

          {clothing === 'scripture-tee' && (
            <g className="ll-avatar-clothing-tee" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M68 110L62 170H138L132 110H68Z"
                fill="#f8fafc"
                stroke="#94a3b8"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              <circle cx="100" cy="138" r="10" fill="#f59e0b" />
              <path d="M100 131L100 145M93 138L107 138" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            </g>
          )}

          {clothing === 'wilderness-cloak' && (
            <g className="ll-avatar-clothing-wilderness" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M64 110L54 178C54 184 146 184 146 178L136 110H64Z"
                fill="#78350f"
                stroke="#451a03"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              <path d="M82 108C88 126 112 126 118 108" fill="#92400e" stroke="#451a03" strokeWidth="2.2" />
              <circle cx="100" cy="126" r="5.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.8" />
              <rect x="70" y="154" width="60" height="7" fill="#451a03" />
            </g>
          )}

          {(clothing === 'starter-tunic' || !clothing) && (
            <g className="ll-avatar-clothing-starter" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path
                d="M66 110L60 174C60 179 140 179 140 174L134 110H66Z"
                fill={`url(#pixarTunicGrad_${uniqueId})`}
                stroke="#0369a1"
                strokeWidth="2.8"
                filter={`url(#pixarFabricTex_${uniqueId})`}
              />
              {/* White Collar Hem */}
              <path d="M84 108C84 124 116 124 116 108" stroke="#f0f9ff" strokeWidth="4" strokeLinecap="round" />
              {/* Belt & Heavy Gold Buckle */}
              <rect x="68" y="148" width="64" height="8" fill="#0369a1" rx="2.5" />
              <rect x="93" y="144" width="14" height="15" rx="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.8" />
              <rect x="96" y="147.5" width="8" height="8" rx="2" fill="#0369a1" />
            </g>
          )}

          {/* ── 3D SCULPTED PIXAR ARMS & POSES ── */}
          <g className="ll-avatar-arms">
            {emote === 'emote-wave' ? (
              <>
                {/* Waving Right Hand */}
                <path d="M68 114L44 86C41 82 36 86 38 90L60 124" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
                <circle cx="41" cy="83" r="7.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.8" />
                {/* Fingers wave */}
                <circle cx="36" cy="79" r="3.2" fill={skin.base} />
                <circle cx="41" cy="76" r="3.2" fill={skin.base} />
                <circle cx="46" cy="79" r="3.2" fill={skin.base} />
                <path d="M132 114L152 142C154 145 158 146 161 143C164 140 162 136 158 132L138 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
              </>
            ) : emote === 'emote-prayer' ? (
              <>
                <path d="M68 114L93 138C95 140 105 140 107 138L132 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2.8" />
                <circle cx="100" cy="140" r="8.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.8" />
              </>
            ) : emote === 'emote-victory' || emote === 'emote-celebrate' ? (
              <>
                <path d="M68 114L44 76C42 72 37 74 39 80L62 122" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
                <circle cx="41" cy="72" r="7" fill={skin.base} stroke={skin.shadow} strokeWidth="1.8" />
                <path d="M132 114L156 76C158 72 163 74 161 80L138 122" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
                <circle cx="159" cy="72" r="7" fill={skin.base} stroke={skin.shadow} strokeWidth="1.8" />
              </>
            ) : (
              <>
                {/* Natural Confident Adventurer Pose with 3D Hands */}
                <path d="M68 114L48 146C46 149 48 155 53 155C56 155 60 152 64 144L78 120" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
                <circle cx="51" cy="151" r="5.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <path d="M132 114L152 142C154 145 158 146 161 143C164 140 162 136 158 132L138 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2.2" />
                <circle cx="158" cy="143" r="5.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            )}
          </g>

          {/* 3D Leather Satchel Across Chest */}
          {backpack === 'starter-satchel' && (
            <g className="ll-avatar-satchel" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <path d="M66 112L128 162" stroke="#451a03" strokeWidth="4.2" strokeLinecap="round" />
              <path d="M66 112L128 162" stroke="#92400e" strokeWidth="2.4" strokeLinecap="round" />
              {/* Satchel Bag with Leather Grain */}
              <rect x="112" y="150" width="22" height="19" rx="5" fill="#78350f" stroke="#451a03" strokeWidth="2" filter={`url(#pixarLeatherTex_${uniqueId})`} />
              <path d="M112 155H134" stroke="#451a03" strokeWidth="1.8" />
              <circle cx="123" cy="161" r="2.8" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
            </g>
          )}

          {accessory === 'cross-pendant' && (
            <g className="ll-avatar-cross">
              <path d="M88 112C93 126 100 130 100 132C100 130 107 126 112 112" stroke="#f59e0b" strokeWidth="2.2" fill="none" />
              <path d="M97 128H103V146H97V128ZM91 133H109V138H91V133Z" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5" filter={`url(#pixarSoftShadow_${uniqueId})`} />
            </g>
          )}

          {accessory === 'garden-leaf-pin' && (
            <g className="ll-avatar-leaf-pin">
              <path d="M80 120C80 120 86 108 98 111C98 111 96 123 80 120Z" fill="#10b981" stroke="#047857" strokeWidth="1.8" />
              <circle cx="80" cy="120" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {accessory === 'shepherd-sling' && (
            <g className="ll-avatar-sling">
              <path d="M74 114L126 166" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="128" cy="168" r="7" fill="#94a3b8" stroke="#475569" strokeWidth="2.2" />
            </g>
          )}

          {accessory === 'scripture-band' && (
            <g className="ll-avatar-scripture-band">
              <rect x="50" y="144" width="8" height="10" rx="2.5" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
            </g>
          )}
        </g>

        {/* ── 3D SCULPTED PIXAR HEAD & EXPRESSIVE FACE ── */}
        <g className="ll-avatar-head-group">
          {/* Volumetric 3D Ears with Depth */}
          <g className="ll-avatar-ears">
            <circle cx="67" cy="74" r="8.5" fill={skin.base} stroke={skin.deepShadow} strokeWidth="1.8" />
            <circle cx="67" cy="74" r="5" fill={skin.earInner} opacity="0.75" />
            <circle cx="133" cy="74" r="8.5" fill={skin.base} stroke={skin.deepShadow} strokeWidth="1.8" />
            <circle cx="133" cy="74" r="5" fill={skin.earInner} opacity="0.75" />
          </g>

          {/* 3D Pixar Head Shape with Smooth Jaw & Forehead */}
          <path
            d="M68 65C68 36 78 24 100 24C122 24 132 36 132 65C132 91 121 101 100 101C79 101 68 91 68 65Z"
            fill={`url(#pixarHeadSkin_${uniqueId})`}
            stroke={skin.deepShadow}
            strokeWidth="2"
            filter={`url(#pixarSoftShadow_${uniqueId})`}
          />

          {/* Forehead Specular Curvature */}
          <ellipse cx="100" cy="43" rx="24" ry="13" fill={skin.highlight} fillOpacity="0.6" />

          {/* Rosy Pixar Cheeks */}
          <circle cx="77" cy="76" r="9" fill={`url(#pixarCheekGlow_${uniqueId})`} />
          <circle cx="123" cy="76" r="9" fill={`url(#pixarCheekGlow_${uniqueId})`} />

          {/* Eyebrows with Pixar Shape & Expressions */}
          <g className="ll-avatar-eyebrows">
            {faceExpression === 'thinking' ? (
              <>
                <path d="M75 51C81 46 90 50 94 53" stroke="#290e02" strokeWidth="4" strokeLinecap="round" />
                <path d="M125 55C119 53 110 51 106 49" stroke="#290e02" strokeWidth="4" strokeLinecap="round" />
              </>
            ) : (
              <>
                <path d="M75 53C81 49 90 50 94 53" stroke="#290e02" strokeWidth="4" strokeLinecap="round" />
                <path d="M125 53C119 49 110 50 106 53" stroke="#290e02" strokeWidth="4" strokeLinecap="round" />
                {/* Specular Brow Highlight */}
                <path d="M77 52C82 49 88 50 91 52" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
                <path d="M123 52C118 49 112 50 109 52" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" opacity="0.65" />
              </>
            )}
          </g>

          {/* ── EXPRESSIVE 3D SOULFUL PIXAR EYES ── */}
          <g className="ll-avatar-eyes">
            {faceExpression === 'calm' || faceExpression === 'thinking' ? (
              <>
                <path d="M76 66C81 73 91 73 95 66" stroke="#0f172a" strokeWidth="3.8" strokeLinecap="round" fill="none" />
                <path d="M105 66C109 73 119 73 124 66" stroke="#0f172a" strokeWidth="3.8" strokeLinecap="round" fill="none" />
              </>
            ) : faceExpression === 'victory' ? (
              <>
                {/* Winking Left Eye */}
                <path d="M76 66C81 73 91 73 95 66" stroke="#0f172a" strokeWidth="3.8" strokeLinecap="round" fill="none" />
                {/* Right Big Luminous Pixar Eye */}
                <ellipse cx="114" cy="65" rx="8" ry="9" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="2" />
                <circle cx="114" cy="65" r="6.2" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="3.4" fill="#020617" />
                {/* Dual Catchlights */}
                <circle cx="111.5" cy="62" r="2.7" fill="#ffffff" />
                <circle cx="116.5" cy="67" r="1.4" fill="#e0f2fe" />
              </>
            ) : faceExpression === 'wonder' ? (
              <>
                {/* Wide Starry Eyes */}
                <ellipse cx="86" cy="65" rx="9" ry="10" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="2" />
                <circle cx="86" cy="65" r="7.2" fill={`url(#pixarIrisWarmGrad_${uniqueId})`} />
                <circle cx="86" cy="65" r="4" fill="#020617" />
                <circle cx="83" cy="62" r="3" fill="#ffffff" />
                <circle cx="89" cy="67.5" r="1.6" fill="#fef08a" />

                <ellipse cx="114" cy="65" rx="9" ry="10" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="2" />
                <circle cx="114" cy="65" r="7.2" fill={`url(#pixarIrisWarmGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="4" fill="#020617" />
                <circle cx="111" cy="62" r="3" fill="#ffffff" />
                <circle cx="117" cy="67.5" r="1.6" fill="#fef08a" />
              </>
            ) : (
              <>
                {/* Standard Signature Pixar 3D Big Luminous Eyes */}
                <ellipse cx="86" cy="65" rx="8" ry="9" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="2" />
                <circle cx="86" cy="65" r="6.2" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="86" cy="65" r="3.4" fill="#020617" />
                <circle cx="83.5" cy="62" r="2.7" fill="#ffffff" />
                <circle cx="88.5" cy="67" r="1.4" fill="#e0f2fe" />

                <ellipse cx="114" cy="65" rx="8" ry="9" fill={`url(#pixarEyeWhiteGrad_${uniqueId})`} stroke="#1e293b" strokeWidth="2" />
                <circle cx="114" cy="65" r="6.2" fill={`url(#pixarIrisGrad_${uniqueId})`} />
                <circle cx="114" cy="65" r="3.4" fill="#020617" />
                <circle cx="111.5" cy="62" r="2.7" fill="#ffffff" />
                <circle cx="116.5" cy="67" r="1.4" fill="#e0f2fe" />
              </>
            )}

            {/* Dimensional Eyelid Crease */}
            <path d="M77 57C82 55 89 55 94 57" stroke={skin.deepShadow} strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
            <path d="M106 57C111 55 118 55 123 57" stroke={skin.deepShadow} strokeWidth="1.5" strokeLinecap="round" opacity="0.65" />
          </g>

          {/* Glasses */}
          {accessory === 'scholar-glasses' && (
            <g className="ll-avatar-glasses" filter={`url(#pixarSoftShadow_${uniqueId})`}>
              <circle cx="86" cy="65" r="11" stroke="#f59e0b" strokeWidth="2.8" fill="#e0f2fe" fillOpacity="0.25" />
              <circle cx="114" cy="65" r="11" stroke="#f59e0b" strokeWidth="2.8" fill="#e0f2fe" fillOpacity="0.25" />
              <path d="M97 65H103" stroke="#f59e0b" strokeWidth="2.8" strokeLinecap="round" />
            </g>
          )}

          {/* 3D Cute Button Nose */}
          <g className="ll-avatar-nose">
            <ellipse cx="100" cy="74" rx="5.5" ry="4" fill={skin.shadow} />
            <ellipse cx="100" cy="73" rx="4.5" ry="3.2" fill={skin.base} />
            <circle cx="99" cy="72" r="2.2" fill={`url(#pixarNoseHighlight_${uniqueId})`} />
            <path d="M96 74.5C97.5 76 102.5 76 104 74.5" stroke={skin.deepShadow} strokeWidth="1.6" strokeLinecap="round" fill="none" />
          </g>

          {/* 3D Pixar Expressive Mouth */}
          <g className="ll-avatar-mouth">
            {faceExpression === 'grin' || faceExpression === 'celebrating' ? (
              <g>
                <path d="M87 78C87 89 113 89 113 78Z" fill="#9f1239" stroke="#4c0519" strokeWidth="2.2" />
                {/* Upper White Teeth */}
                <path d="M89 78C89 82.5 111 82.5 111 78Z" fill="#ffffff" />
                {/* Cute Tongue */}
                <ellipse cx="100" cy="85.5" rx="6.5" ry="3.5" fill="#fb7185" />
              </g>
            ) : faceExpression === 'wonder' ? (
              <ellipse cx="100" cy="82" rx="5" ry="6.5" fill="#881337" stroke="#4c0519" strokeWidth="2.2" />
            ) : (
              <g>
                <path d="M89 80C94 87 106 87 111 80" stroke="#881337" strokeWidth="3.4" strokeLinecap="round" fill="none" />
                {/* Corner Dimples */}
                <circle cx="88" cy="79" r="1.2" fill="#881337" />
                <circle cx="112" cy="79" r="1.2" fill="#881337" />
              </g>
            )}
          </g>
        </g>

        {/* ── 3D SCULPTED PIXAR HAIR SYSTEM ── */}
        <g className="ll-avatar-hair-group" filter={`url(#pixarSoftShadow_${uniqueId})`}>
          {hairStyle === 'curls' && (
            <g className="ll-hair-curls">
              <circle cx="71" cy="38" r="15" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="86" cy="25" r="16" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="102" cy="22" r="17" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="118" cy="25" r="16" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="129" cy="38" r="15" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="65" cy="52" r="12" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="135" cy="52" r="12" fill={`url(#pixarHairBase_${uniqueId})`} />

              {/* Glossy Curl Highlights */}
              <ellipse cx="87" cy="22" rx="8" ry="4.5" fill={`url(#pixarHairGloss_${uniqueId})`} />
              <ellipse cx="103" cy="19" rx="9" ry="5" fill={`url(#pixarHairGloss_${uniqueId})`} />
              <ellipse cx="119" cy="22" rx="8" ry="4.5" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'waves' && (
            <g className="ll-hair-waves">
              <path
                d="M65 56C61 32 75 16 100 16C125 16 139 32 135 56C141 68 143 88 139 96C135 88 131 80 131 66C127 38 117 28 100 28C83 28 73 38 69 66C69 80 65 88 61 96C57 88 59 68 65 56Z"
                fill={`url(#pixarHairBase_${uniqueId})`}
                stroke="#170601"
                strokeWidth="1.8"
              />
              <path d="M80 24C92 20 108 20 120 24" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.75" />
            </g>
          )}

          {hairStyle === 'braids' && (
            <g className="ll-hair-braids">
              <path d="M69 44C69 23 81 19 100 19C119 19 131 23 131 44C131 48 69 48 69 44Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              {/* Textured Braids with Golden Ring Beads */}
              <rect x="63" y="44" width="8" height="56" rx="4" fill="#3b1d06" stroke="#170601" strokeWidth="1.2" />
              <rect x="72" y="46" width="8" height="60" rx="4" fill="#290e02" stroke="#170601" strokeWidth="1.2" />
              <rect x="120" y="46" width="8" height="60" rx="4" fill="#290e02" stroke="#170601" strokeWidth="1.2" />
              <rect x="129" y="44" width="8" height="56" rx="4" fill="#3b1d06" stroke="#170601" strokeWidth="1.2" />
              {/* Golden Beads */}
              <circle cx="67" cy="95" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="76" cy="101" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="124" cy="101" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="133" cy="95" r="3.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
            </g>
          )}

          {hairStyle === 'short' && (
            <g className="ll-hair-short">
              <path
                d="M68 52C67 28 79 18 100 18C121 18 133 28 132 52C128 42 119 33 100 33C81 33 72 42 68 52Z"
                fill={`url(#pixarHairBase_${uniqueId})`}
                stroke="#170601"
                strokeWidth="1.8"
              />
              <path d="M83 26C93 22 107 22 117 26" stroke="#fbbf24" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
            </g>
          )}

          {hairStyle === 'coils' && (
            <g className="ll-hair-coils">
              <path d="M65 48C63 24 75 14 100 14C125 14 137 24 135 48C129 36 119 26 100 26C81 26 71 36 65 48Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="77" cy="22" r="8.5" fill="#3b1d06" />
              <circle cx="94" cy="18" r="9.5" fill="#290e02" />
              <circle cx="106" cy="18" r="9.5" fill="#3b1d06" />
              <circle cx="123" cy="22" r="8.5" fill="#290e02" />
              <ellipse cx="100" cy="16" rx="16" ry="4.5" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'afro' && (
            <g className="ll-hair-afro">
              <circle cx="100" cy="45" r="44" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="66" cy="53" r="17" fill="#3b1d06" />
              <circle cx="134" cy="53" r="17" fill="#3b1d06" />
              <ellipse cx="100" cy="20" rx="22" ry="9" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}

          {hairStyle === 'ponytail' && (
            <g className="ll-hair-ponytail">
              <path d="M68 52C67 28 79 18 100 18C121 18 133 28 132 52C128 42 119 33 100 33C81 33 72 42 68 52Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              {/* High Bouncy Ponytail with Golden Scrunchie */}
              <circle cx="131" cy="23" r="7" fill="#fbbf24" stroke="#b45309" strokeWidth="1.8" />
              <path d="M133 23C152 25 158 52 149 74C145 64 137 46 133 23Z" fill={`url(#pixarHairBase_${uniqueId})`} stroke="#170601" strokeWidth="1.8" />
              <path d="M137 31C145 42 147 55 145 65" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
            </g>
          )}

          {hairStyle === 'fade' && (
            <g className="ll-hair-fade">
              <path d="M71 46C71 26 81 20 100 20C119 20 129 26 129 46C125 38 117 30 100 30C83 30 75 38 71 46Z" fill={`url(#pixarHairBase_${uniqueId})`} />
              <circle cx="85" cy="24" r="7.5" fill="#3b1d06" />
              <circle cx="100" cy="21" r="8.5" fill="#290e02" />
              <circle cx="115" cy="24" r="7.5" fill="#3b1d06" />
              <ellipse cx="100" cy="20" rx="15" ry="3.5" fill={`url(#pixarHairGloss_${uniqueId})`} />
            </g>
          )}
        </g>

        {/* ── 3D HEADWEAR OVERLAY ── */}
        {headwear === 'kingdom-crown' && (
          <g className="ll-avatar-crown" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path
              d="M68 38L75 12L88 27L100 6L112 27L125 12L132 38H68Z"
              fill={`url(#pixarGoldFabGrad_${uniqueId})`}
              stroke="#b45309"
              strokeWidth="2.8"
              strokeLinejoin="round"
            />
            {/* Jewels */}
            <circle cx="100" cy="6" r="5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.8" />
            <circle cx="75" cy="12" r="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <circle cx="125" cy="12" r="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <rect x="68" y="36" width="64" height="7" rx="2.5" fill="#b45309" />
          </g>
        )}

        {headwear === 'guardian-halo' && (
          <g className="ll-avatar-halo">
            <ellipse cx="100" cy="13" rx="40" ry="12" stroke={`url(#pixarGoldFabGrad_${uniqueId})`} strokeWidth="5" fill="none" filter="drop-shadow(0 0 8px #fbbf24)" />
            <ellipse cx="100" cy="13" rx="40" ry="12" stroke="#ffffff" strokeWidth="2.2" fill="none" strokeDasharray="9 5" />
          </g>
        )}

        {headwear === 'starter-cap' && (
          <g className="ll-avatar-cap" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path d="M66 44C66 22 79 16 100 16C121 16 134 22 134 44H66Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2.8" filter={`url(#pixarFabricTex_${uniqueId})`} />
            <path d="M60 44C60 44 77 39 100 39C123 39 140 44 140 44C140 50 125 54 100 54C75 54 60 50 60 44Z" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="2.2" />
            <circle cx="100" cy="16" r="4" fill="#fbbf24" />
          </g>
        )}

        {headwear === 'scouts-hood' && (
          <g className="ll-avatar-hood" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <path d="M62 56C58 26 73 12 100 12C127 12 142 26 138 56C131 49 119 44 100 44C81 44 69 49 62 56Z" fill="#059669" stroke="#064e3b" strokeWidth="2.8" filter={`url(#pixarFabricTex_${uniqueId})`} />
            <circle cx="100" cy="44" r="4" fill="#fbbf24" />
          </g>
        )}

        {/* ── 3D FLOATING / HANDHELD VOLUMETRIC LANTERN ── */}
        <g className="ll-avatar-lantern" transform="translate(150, 120)">
          {/* Top Brass Handle */}
          <path d="M12 -4V6" stroke="#b45309" strokeWidth="3.2" strokeLinecap="round" />
          {/* Cap Roof */}
          <path d="M1 6H23L19 12H5L1 6Z" fill={lantern === 'golden-lantern' ? `url(#pixarGoldFabGrad_${uniqueId})` : '#78350f'} stroke="#451a03" strokeWidth="1.8" />
          {/* Glass Chamber with Ambient Golden Glow */}
          <rect
            x="3"
            y="12"
            width="18"
            height="22"
            rx="3.5"
            fill={lantern === 'celestial-fire-lantern' ? '#dbeafe' : '#fef08a'}
            stroke={lantern === 'golden-lantern' ? '#b45309' : '#d97706'}
            strokeWidth="2.2"
          />
          {/* Floating Flame Glow */}
          <circle
            cx="12"
            cy="23"
            r="11"
            fill={lantern === 'celestial-fire-lantern' ? '#3b82f6' : '#f59e0b'}
            fillOpacity="0.6"
            filter={`url(#pixarLanternGlow_${uniqueId})`}
          />
          {/* Dancing Flame Core */}
          <path
            d="M12 16C12 16 8 21 8 24C8 26.2 9.8 28 12 28C14.2 28 16 26.2 16 24C16 21 12 16 12 16Z"
            fill={lantern === 'celestial-fire-lantern' ? '#60a5fa' : '#f97316'}
          />
          <circle cx="12" cy="24.5" r="2.2" fill="#ffffff" />
          {/* Heavy Base Foot */}
          <rect x="1" y="34" width="22" height="6" rx="2.5" fill="#78350f" stroke="#451a03" strokeWidth="1.8" />
        </g>

        {/* ── 3D PIXAR COMPANIONS (PETS) ── */}
        {pet === 'lost-sheep-companion' && (
          <g className="ll-avatar-companion-sheep" transform="translate(12, 148)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            {/* Puffy 3D Wool Tufts */}
            <circle cx="15" cy="24" r="11" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.2" />
            <circle cx="28" cy="24" r="12" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.2" />
            <circle cx="21" cy="15" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.2" />
            {/* Cute Face & Big Eyes */}
            <ellipse cx="35" cy="18" rx="8" ry="7" fill="#fed7aa" stroke="#ea580c" strokeWidth="1.8" />
            <circle cx="37" cy="17" r="2" fill="#1e293b" />
            <circle cx="36.2" cy="16" r="0.9" fill="#ffffff" />
            {/* Legs */}
            <rect x="13" y="34" width="4" height="10" rx="2" fill="#475569" />
            <rect x="27" y="34" width="4" height="10" rx="2" fill="#475569" />
          </g>
        )}

        {(pet === 'lion-cub-pet' || (!pet && size === 'hero')) && (
          <g className="ll-avatar-companion-lion" transform="translate(12, 144)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            {/* Fluffy Pixar Mane */}
            <circle cx="23" cy="24" r="18" fill="#b45309" stroke="#78350f" strokeWidth="2.2" />
            {/* Cute Head */}
            <circle cx="23" cy="25" r="13" fill="#f59e0b" stroke="#b45309" strokeWidth="1.8" />
            {/* Ears */}
            <circle cx="12" cy="13" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
            <circle cx="12" cy="13" r="2.5" fill="#fef3c7" />
            <circle cx="34" cy="13" r="5" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
            <circle cx="34" cy="13" r="2.5" fill="#fef3c7" />
            {/* Big Shiny Pixar Cub Eyes */}
            <circle cx="18" cy="23" r="3.2" fill="#1e293b" />
            <circle cx="17" cy="22" r="1.4" fill="#ffffff" />
            <circle cx="28" cy="23" r="3.2" fill="#1e293b" />
            <circle cx="27" cy="22" r="1.4" fill="#ffffff" />
            {/* Muzzle & Button Nose */}
            <ellipse cx="23" cy="30" rx="5" ry="3.5" fill="#fef3c7" />
            <polygon points="23,28 21,30 25,30" fill="#78350f" />
          </g>
        )}

        {pet === 'peace-dove-pet' && (
          <g className="ll-avatar-companion-dove" transform="translate(16, 136)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <ellipse cx="22" cy="22" rx="15" ry="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="33" cy="16" r="7.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="35" cy="15" r="2" fill="#1e293b" />
            <circle cx="34.3" cy="14.2" r="0.9" fill="#ffffff" />
            <path d="M40 16L47 19L40 22Z" fill="#f59e0b" stroke="#d97706" strokeWidth="1" />
            {/* Green Olive Sprig */}
            <path d="M42 19C46 17 50 17 54 14" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="50" cy="15" rx="3" ry="1.8" fill="#10b981" />
          </g>
        )}

        {pet === 'desert-eagle-pet' && (
          <g className="ll-avatar-companion-eagle" transform="translate(14, 134)" filter={`url(#pixarSoftShadow_${uniqueId})`}>
            <ellipse cx="23" cy="24" rx="13" ry="17" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <circle cx="23" cy="13" r="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.8" />
            <circle cx="26" cy="11.5" r="2" fill="#1e293b" />
            <path d="M28 13L36 16L28 19Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
          </g>
        )}
      </svg>
    </div>
  );
}
