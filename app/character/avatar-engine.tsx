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

const SKIN_COLORS: Record<string, { base: string; shadow: string; highlight: string; blush: string }> = {
  fair: { base: '#fde68a', shadow: '#fcd34d', highlight: '#fef3c7', blush: '#fda4af' },
  sand: { base: '#ecd1ad', shadow: '#d4b38b', highlight: '#fef3c7', blush: '#fb7185' },
  amber: { base: '#f6c28b', shadow: '#e5a563', highlight: '#fed7aa', blush: '#f87171' },
  honey: { base: '#d9a066', shadow: '#b87b41', highlight: '#fcd34d', blush: '#f43f5e' },
  olive: { base: '#bf8654', shadow: '#9c663b', highlight: '#deb887', blush: '#e11d48' },
  walnut: { base: '#9a5e35', shadow: '#78421d', highlight: '#bd7b4a', blush: '#be123c' },
  cocoa: { base: '#5c3319', shadow: '#3f1f0a', highlight: '#7a4623', blush: '#9f1239' },
  espresso: { base: '#381e0b', shadow: '#221004', highlight: '#543015', blush: '#881337' },
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

  return (
    <div
      className={`ll-avatar-container ll-avatar-${size} ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
      role="img"
      aria-label={`Character avatar with ${hairStyle} hair, ${clothing}, and ${lantern}`}
    >
      <svg
        viewBox="0 0 200 240"
        className="ll-avatar-svg"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial glow around character */}
          <radialGradient id="avatarBackdropGlow" cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          </radialGradient>

          {/* Pedestal Gradient */}
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="50%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Gold Gradient */}
          <linearGradient id="avatarGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Silver Gradient */}
          <linearGradient id="avatarSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>

          {/* Celestial Fire Gradient */}
          <linearGradient id="celestialFireGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>

          {/* Hair Gradient */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#290e02" />
          </linearGradient>

          {/* Lantern Light Glow */}
          <filter id="lanternGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="100" cy="110" r="88" fill="url(#avatarBackdropGlow)" />

        {/* Pedestal */}
        {showPedestal && (
          <g className="ll-avatar-pedestal">
            <ellipse cx="100" cy="225" rx="65" ry="12" fill="#090d16" fillOpacity="0.6" />
            <ellipse cx="100" cy="220" rx="55" ry="9" fill="url(#pedestalGrad)" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="100" cy="219" rx="46" ry="6" fill="#1e293b" />
          </g>
        )}

        {/* Special Aura: Tomb Sunrise / Guardian Aura */}
        {(special === 'tomb-light-halo' || backpack === 'celestial-wings-pack') && (
          <g className="ll-avatar-celestial-aura" opacity="0.9">
            {/* Radiant Wings */}
            {backpack === 'celestial-wings-pack' && (
              <g className="ll-avatar-wings">
                <path d="M70 120C40 90 20 110 30 150C45 145 60 135 70 120Z" fill="url(#avatarGoldGrad)" opacity="0.8" />
                <path d="M130 120C160 90 180 110 170 150C155 145 140 135 130 120Z" fill="url(#avatarGoldGrad)" opacity="0.8" />
              </g>
            )}
            <circle cx="100" cy="70" r="48" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M100 18L100 28M100 112L100 122M48 70L58 70M142 70L152 70" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Backpack Layer (behind body) */}
        {backpack === 'explorer-backpack' && (
          <g className="ll-avatar-backpack-explorer">
            <rect x="64" y="112" width="72" height="62" rx="10" fill="#065f46" stroke="#047857" strokeWidth="2" />
            <rect x="68" y="104" width="64" height="12" rx="4" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />
            <path d="M72 130H128" stroke="#047857" strokeWidth="2" />
          </g>
        )}

        {backpack === 'scrolls-backpack' && (
          <g className="ll-avatar-backpack-scrolls">
            <rect x="66" y="114" width="68" height="58" rx="8" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <ellipse cx="72" cy="110" rx="6" ry="12" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
            <ellipse cx="128" cy="110" rx="6" ry="12" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
          </g>
        )}

        {/* Character Base Body & Legs */}
        <g className="ll-avatar-body-group">
          {/* Floor Shadow */}
          <ellipse cx="100" cy="216" rx="42" ry="7" fill="#000000" fillOpacity="0.25" />

          {/* Legs */}
          <rect x="83" y="165" width="14" height="42" rx="6" fill={skin.shadow} />
          <rect x="103" y="165" width="14" height="42" rx="6" fill={skin.shadow} />

          {/* Shoes Layer */}
          {shoes === 'adventurers-boots' && (
            <g className="ll-avatar-shoes-boots">
              <path d="M80 188H99V210C99 214 96 216 92 216H76C74 216 73 214 74 212L80 188Z" fill="#522408" stroke="#331405" strokeWidth="1.5" />
              <path d="M101 188H120L126 212C127 214 126 216 124 216H108C104 216 101 214 101 210V188Z" fill="#522408" stroke="#331405" strokeWidth="1.5" />
              <rect x="80" y="196" width="19" height="2" fill="#d97706" />
              <rect x="101" y="196" width="19" height="2" fill="#d97706" />
            </g>
          )}

          {shoes === 'runners-sandals' && (
            <g className="ll-avatar-shoes-runners">
              <path d="M81 198H99V214H77L81 198Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
              <path d="M101 198H119L123 214H101V198Z" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
              <path d="M72 195C75 192 80 193 81 197C78 198 75 198 72 195Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              <path d="M128 195C125 192 120 193 119 197C122 198 125 198 128 195Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
            </g>
          )}

          {shoes === 'high-top-sneakers' && (
            <g className="ll-avatar-shoes-sneakers">
              <path d="M79 192H99V214C99 216 95 216 90 216H75L79 192Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
              <path d="M101 192H121L125 216H110C105 216 101 216 101 214V192Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
              <rect x="75" y="212" width="24" height="4" rx="1" fill="#ffffff" />
              <rect x="101" y="212" width="24" height="4" rx="1" fill="#ffffff" />
            </g>
          )}

          {(shoes === 'starter-sandals' || !shoes) && (
            <g className="ll-avatar-shoes-sandals">
              <rect x="81" y="208" width="18" height="6" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
              <rect x="101" y="208" width="18" height="6" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
              <path d="M83 200L97 210M97 200L83 210" stroke="#78350f" strokeWidth="1.5" />
              <path d="M103 200L117 210M117 200L103 210" stroke="#78350f" strokeWidth="1.5" />
            </g>
          )}

          {/* Main Torso & Neck */}
          <rect x="91" y="96" width="18" height="18" rx="4" fill={skin.shadow} />

          {/* Base Clothing: Tunics, Hoodies, Cloaks */}
          {clothing === 'golden-cloak' && (
            <g className="ll-avatar-clothing-gold">
              <path d="M68 112L62 178C62 182 138 182 138 178L132 112H68Z" fill="url(#avatarGoldGrad)" stroke="#b45309" strokeWidth="2" />
              <path d="M84 108L100 134L116 108" stroke="#ffffff" strokeWidth="3" fill="none" />
              <circle cx="100" cy="136" r="4.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
              <rect x="74" y="152" width="52" height="6" fill="#b45309" />
            </g>
          )}

          {clothing === 'silver-robe' && (
            <g className="ll-avatar-clothing-silver">
              <path d="M68 112L64 176C64 180 136 180 136 176L132 112H68Z" fill="url(#avatarSilverGrad)" stroke="#64748b" strokeWidth="2" />
              <path d="M84 108L100 132L116 108" stroke="#3b82f6" strokeWidth="3" fill="none" />
              <rect x="72" y="150" width="56" height="6" fill="#3b82f6" rx="2" />
            </g>
          )}

          {clothing === 'explorer-hoodie' && (
            <g className="ll-avatar-clothing-hoodie">
              <path d="M70 112L66 174C66 177 134 177 134 174L130 112H70Z" fill="#047857" stroke="#065f46" strokeWidth="2" />
              {/* Kangaroo Pocket */}
              <rect x="80" y="146" width="40" height="18" rx="4" fill="#065f46" />
              <path d="M96 112V136" stroke="#f59e0b" strokeWidth="2" />
            </g>
          )}

          {clothing === 'denim-jacket' && (
            <g className="ll-avatar-clothing-denim">
              <path d="M70 112L66 172H134L130 112H70Z" fill="#1e40af" stroke="#1e3a8a" strokeWidth="2" />
              <path d="M84 112L100 132L116 112" fill="#e2e8f0" />
              <rect x="76" y="128" width="14" height="10" rx="2" fill="#1e3a8a" />
              <rect x="110" y="128" width="14" height="10" rx="2" fill="#1e3a8a" />
            </g>
          )}

          {clothing === 'scripture-tee' && (
            <g className="ll-avatar-clothing-tee">
              <path d="M72 112L68 170H132L128 112H72Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="100" cy="138" r="8" fill="#f59e0b" />
              <path d="M100 133L100 143M95 138L105 138" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {clothing === 'wilderness-cloak' && (
            <g className="ll-avatar-clothing-wilderness">
              <path d="M68 112L60 178C60 182 140 182 140 178L132 112H68Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
              <path d="M86 110C92 122 108 122 114 110" fill="#92400e" stroke="#451a03" strokeWidth="2" />
              <circle cx="100" cy="124" r="4" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
              <rect x="76" y="154" width="48" height="5" fill="#451a03" />
            </g>
          )}

          {(clothing === 'starter-tunic' || !clothing) && (
            <g className="ll-avatar-clothing-starter">
              <path d="M72 112L68 174C68 177 132 177 132 174L128 112H72Z" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />
              <path d="M90 110C90 120 110 120 110 110" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
              <rect x="74" y="148" width="52" height="6" fill="#0369a1" rx="1" />
              <rect x="96" y="146" width="8" height="10" rx="1.5" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            </g>
          )}

          {/* Arms and Poses */}
          <g className="ll-avatar-arms">
            {emote === 'emote-wave' ? (
              // Waving pose
              <>
                <path d="M72 114L50 90C47 87 42 90 44 94L64 122" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <circle cx="48" cy="88" r="5" fill={skin.base} />
                <path d="M128 114L146 140C148 143 152 144 155 141C158 138 156 134 152 130L134 114" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            ) : emote === 'emote-prayer' ? (
              // Folded hands prayer pose
              <>
                <path d="M72 114L94 136C96 138 104 138 106 136L128 114" fill={skin.base} stroke={skin.shadow} strokeWidth="2" />
                <circle cx="100" cy="138" r="6" fill={skin.base} stroke={skin.shadow} strokeWidth="1.2" />
              </>
            ) : emote === 'emote-victory' || emote === 'emote-celebrate' ? (
              // Victory celebratory pose
              <>
                <path d="M72 114L50 82C48 78 44 80 46 85L66 120" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <path d="M128 114L150 82C152 78 156 80 154 85L134 120" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            ) : (
              // Standard adventurer pose
              <>
                <path d="M72 114L54 144C52 147 54 152 58 152C61 152 64 149 68 142L82 120" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
                <path d="M128 114L146 140C148 143 152 144 155 141C158 138 156 134 152 130L134 114" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
              </>
            )}
          </g>

          {/* Cross / Satchel / Pockets */}
          {backpack === 'starter-satchel' && (
            <g className="ll-avatar-satchel">
              <path d="M70 114L124 160" stroke="#78350f" strokeWidth="2.5" />
              <rect x="114" y="152" width="16" height="14" rx="3" fill="#92400e" stroke="#451a03" strokeWidth="1.2" />
              <circle cx="122" cy="159" r="1.5" fill="#f59e0b" />
            </g>
          )}

          {accessory === 'cross-pendant' && (
            <g className="ll-avatar-cross">
              <path d="M92 112C96 122 100 126 100 128C100 126 104 122 108 112" stroke="#d97706" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
              <path d="M98 128H102V142H98V128ZM94 132H106V135H94V132Z" fill="#fbbf24" stroke="#b45309" strokeWidth="0.8" />
            </g>
          )}

          {accessory === 'garden-leaf-pin' && (
            <g className="ll-avatar-leaf-pin">
              <path d="M84 122C84 122 88 114 96 116C96 116 95 124 84 122Z" fill="#10b981" stroke="#047857" strokeWidth="1" />
              <circle cx="84" cy="122" r="1.5" fill="#f59e0b" />
            </g>
          )}

          {accessory === 'shepherd-sling' && (
            <g className="ll-avatar-sling">
              <path d="M78 116L122 162" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="124" cy="164" r="5" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
            </g>
          )}

          {accessory === 'scripture-band' && (
            <g className="ll-avatar-scripture-band">
              <rect x="54" y="146" width="6" height="8" rx="1.5" fill="#92400e" stroke="#f59e0b" strokeWidth="0.8" />
            </g>
          )}
        </g>

        {/* Head Layer (Face, Skin, Features) */}
        <g className="ll-avatar-head-group">
          {/* Neck Shadow */}
          <ellipse cx="100" cy="100" rx="14" ry="6" fill={skin.shadow} />

          {/* Ears */}
          <circle cx="69" cy="74" r="6.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.2" />
          <circle cx="69" cy="74" r="3" fill={skin.shadow} />
          <circle cx="131" cy="74" r="6.5" fill={skin.base} stroke={skin.shadow} strokeWidth="1.2" />
          <circle cx="131" cy="74" r="3" fill={skin.shadow} />

          {/* Head Base */}
          <path
            d="M72 65C72 40 82 28 100 28C118 28 128 40 128 65C128 88 118 98 100 98C82 98 72 88 72 65Z"
            fill={skin.base}
            stroke={skin.shadow}
            strokeWidth="1.5"
          />

          {/* Soft Highlight on Forehead */}
          <ellipse cx="100" cy="46" rx="18" ry="10" fill={skin.highlight} fillOpacity="0.4" />

          {/* Rosy Cheeks */}
          <ellipse cx="80" cy="74" rx="5" ry="3.5" fill={skin.blush} fillOpacity="0.35" />
          <ellipse cx="120" cy="74" rx="5" ry="3.5" fill={skin.blush} fillOpacity="0.35" />

          {/* Eyebrows */}
          {faceExpression === 'thinking' ? (
            <>
              <path d="M79 53C83 51 89 53 91 55" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M121 57C117 56 111 55 109 54" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M79 55C83 53 89 54 91 56" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M121 55C117 53 111 54 109 56" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />
            </>
          )}

          {/* Expressive Eyes */}
          <g className="ll-avatar-eyes">
            {faceExpression === 'calm' || faceExpression === 'thinking' ? (
              <>
                <path d="M79 66C82 70 88 70 91 66" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <path d="M109 66C112 70 118 70 121 66" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </>
            ) : faceExpression === 'wonder' ? (
              <>
                <circle cx="85" cy="65" r="6" fill="#1e293b" />
                <circle cx="83.5" cy="63" r="2.2" fill="#ffffff" />
                <circle cx="86.5" cy="66" r="1.2" fill="#ffffff" />
                <circle cx="115" cy="65" r="6" fill="#1e293b" />
                <circle cx="113.5" cy="63" r="2.2" fill="#ffffff" />
                <circle cx="116.5" cy="66" r="1.2" fill="#ffffff" />
              </>
            ) : faceExpression === 'victory' ? (
              <>
                {/* Winking eye + sparkle eye */}
                <path d="M79 66C82 70 88 70 91 66" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <ellipse cx="115" cy="65" rx="5.5" ry="6" fill="#1e293b" />
                <circle cx="113.5" cy="63" r="2" fill="#ffffff" />
                <circle cx="116.5" cy="66.5" r="1" fill="#ffffff" />
              </>
            ) : (
              <>
                {/* Sparkle Eyes */}
                <ellipse cx="85" cy="65" rx="5" ry="5.5" fill="#1e293b" />
                <circle cx="83.5" cy="63" r="2" fill="#ffffff" />
                <circle cx="86.5" cy="66.5" r="1" fill="#ffffff" />

                <ellipse cx="115" cy="65" rx="5" ry="5.5" fill="#1e293b" />
                <circle cx="113.5" cy="63" r="2" fill="#ffffff" />
                <circle cx="116.5" cy="66.5" r="1" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Glasses */}
          {accessory === 'scholar-glasses' && (
            <g className="ll-avatar-glasses">
              <circle cx="85" cy="65" r="9" stroke="#d97706" strokeWidth="1.8" fill="none" />
              <circle cx="115" cy="65" r="9" stroke="#d97706" strokeWidth="1.8" fill="none" />
              <path d="M94 65H106" stroke="#d97706" strokeWidth="1.8" />
            </g>
          )}

          {/* Nose */}
          <path d="M100 66V73C100 74 98 75 97 75" stroke={skin.shadow} strokeWidth="2" strokeLinecap="round" />

          {/* Mouth */}
          {faceExpression === 'grin' || faceExpression === 'celebrating' ? (
            <path d="M89 78C89 87 111 87 111 78Z" fill="#be123c" stroke="#881337" strokeWidth="1.5" />
          ) : faceExpression === 'smile' || faceExpression === 'victory' ? (
            <path d="M91 80C94 85 106 85 109 80" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          ) : faceExpression === 'wonder' ? (
            <ellipse cx="100" cy="82" rx="4" ry="5" fill="#881337" stroke="#4c0519" strokeWidth="1.5" />
          ) : (
            <path d="M93 81C97 83 103 83 107 81" stroke="#881337" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          )}
        </g>

        {/* Hair Styles */}
        <g className="ll-avatar-hair-group">
          {hairStyle === 'curls' && (
            <g className="ll-hair-curls">
              <circle cx="74" cy="40" r="12" fill="url(#hairGrad)" />
              <circle cx="88" cy="28" r="13" fill="url(#hairGrad)" />
              <circle cx="102" cy="25" r="14" fill="url(#hairGrad)" />
              <circle cx="116" cy="28" r="13" fill="url(#hairGrad)" />
              <circle cx="126" cy="40" r="12" fill="url(#hairGrad)" />
              <circle cx="68" cy="54" r="10" fill="url(#hairGrad)" />
              <circle cx="132" cy="54" r="10" fill="url(#hairGrad)" />
              <circle cx="94" cy="33" r="5" fill="#78350f" fillOpacity="0.6" />
              <circle cx="110" cy="34" r="5" fill="#78350f" fillOpacity="0.6" />
            </g>
          )}

          {hairStyle === 'waves' && (
            <g className="ll-hair-waves">
              <path d="M68 56C64 36 78 20 100 20C122 20 136 36 132 56C138 68 140 85 136 94C132 86 128 78 128 66C124 40 114 32 100 32C86 32 76 40 72 66C72 78 68 86 64 94C60 85 62 68 68 56Z" fill="url(#hairGrad)" />
              <path d="M84 28C92 24 108 24 116 28" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {hairStyle === 'braids' && (
            <g className="ll-hair-braids">
              <path d="M72 45C72 26 84 22 100 22C116 22 128 26 128 45C128 48 72 48 72 45Z" fill="url(#hairGrad)" />
              <rect x="66" y="44" width="6" height="52" rx="3" fill="#3b1d06" />
              <rect x="74" y="46" width="6" height="56" rx="3" fill="#290e02" />
              <rect x="120" y="46" width="6" height="56" rx="3" fill="#290e02" />
              <rect x="128" y="44" width="6" height="52" rx="3" fill="#3b1d06" />
              <circle cx="69" cy="92" r="2.5" fill="#f59e0b" />
              <circle cx="77" cy="98" r="2.5" fill="#f59e0b" />
              <circle cx="123" cy="98" r="2.5" fill="#f59e0b" />
              <circle cx="131" cy="92" r="2.5" fill="#f59e0b" />
            </g>
          )}

          {hairStyle === 'short' && (
            <g className="ll-hair-short">
              <path d="M71 52C70 32 82 23 100 23C118 23 130 32 129 52C126 44 118 36 100 36C82 36 74 44 71 52Z" fill="url(#hairGrad)" />
              <path d="M85 32C94 28 106 28 115 32" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}

          {hairStyle === 'coils' && (
            <g className="ll-hair-coils">
              <path d="M68 48C66 28 78 18 100 18C122 18 134 28 132 48C126 38 116 30 100 30C84 30 74 38 68 48Z" fill="url(#hairGrad)" />
              <circle cx="80" cy="26" r="6" fill="#3b1d06" />
              <circle cx="94" cy="22" r="7" fill="#290e02" />
              <circle cx="106" cy="22" r="7" fill="#3b1d06" />
              <circle cx="120" cy="26" r="6" fill="#290e02" />
            </g>
          )}

          {hairStyle === 'afro' && (
            <g className="ll-hair-afro">
              <circle cx="100" cy="48" r="38" fill="url(#hairGrad)" />
              <circle cx="70" cy="54" r="14" fill="#3b1d06" />
              <circle cx="130" cy="54" r="14" fill="#3b1d06" />
            </g>
          )}

          {hairStyle === 'ponytail' && (
            <g className="ll-hair-ponytail">
              <path d="M71 52C70 32 82 23 100 23C118 23 130 32 129 52C126 44 118 36 100 36C82 36 74 44 71 52Z" fill="url(#hairGrad)" />
              {/* High Ponytail Tail */}
              <circle cx="128" cy="26" r="5" fill="#f59e0b" />
              <path d="M130 26C145 28 150 48 144 68C140 60 134 46 130 26Z" fill="url(#hairGrad)" />
            </g>
          )}

          {hairStyle === 'fade' && (
            <g className="ll-hair-fade">
              <path d="M74 46C74 30 84 24 100 24C116 24 126 30 126 46C122 40 114 34 100 34C86 34 78 40 74 46Z" fill="url(#hairGrad)" />
              <circle cx="88" cy="27" r="5" fill="#3b1d06" />
              <circle cx="100" cy="25" r="6" fill="#290e02" />
              <circle cx="112" cy="27" r="5" fill="#3b1d06" />
            </g>
          )}
        </g>

        {/* Headwear Overlay */}
        {headwear === 'kingdom-crown' && (
          <g className="ll-avatar-crown">
            <path d="M72 40L78 18L88 30L100 12L112 30L122 18L128 40H72Z" fill="url(#avatarGoldGrad)" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
            <circle cx="100" cy="12" r="3.5" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            <circle cx="78" cy="18" r="2.5" fill="#3b82f6" />
            <circle cx="122" cy="18" r="2.5" fill="#3b82f6" />
            <rect x="72" y="38" width="56" height="5" fill="#b45309" rx="1" />
          </g>
        )}

        {headwear === 'guardian-halo' && (
          <g className="ll-avatar-halo">
            <ellipse cx="100" cy="16" rx="36" ry="10" stroke="url(#avatarGoldGrad)" strokeWidth="4" fill="none" filter="drop-shadow(0 0 4px #fbbf24)" />
            <ellipse cx="100" cy="16" rx="36" ry="10" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeDasharray="6 4" />
          </g>
        )}

        {headwear === 'starter-cap' && (
          <g className="ll-avatar-cap">
            <path d="M70 46C70 28 82 22 100 22C118 22 130 28 130 46H70Z" fill="#2563eb" stroke="#1e3a8a" strokeWidth="2" />
            <path d="M64 46C64 46 80 43 100 43C120 43 136 46 136 46C136 50 122 54 100 54C78 54 64 50 64 46Z" fill="#1d4ed8" stroke="#1e3a8a" strokeWidth="1.5" />
            <circle cx="100" cy="22" r="3" fill="#fbbf24" />
          </g>
        )}

        {headwear === 'scouts-hood' && (
          <g className="ll-avatar-hood">
            <path d="M66 56C62 30 76 18 100 18C124 18 138 30 134 56C128 50 118 46 100 46C82 46 72 50 66 56Z" fill="#059669" stroke="#064e3b" strokeWidth="2" />
            <circle cx="100" cy="46" r="3" fill="#f59e0b" />
          </g>
        )}

        {/* Handheld or Floating Lantern */}
        <g className="ll-avatar-lantern" transform="translate(150, 126)">
          <path d="M12 0V8" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 8H20L17 12H7L4 8Z" fill={lantern === 'golden-lantern' ? 'url(#avatarGoldGrad)' : '#78350f'} />
          <rect
            x="5"
            y="12"
            width="14"
            height="18"
            rx="2"
            fill={lantern === 'celestial-fire-lantern' ? '#dbeafe' : '#fef08a'}
            stroke={lantern === 'golden-lantern' ? '#b45309' : '#d97706'}
            strokeWidth="1.8"
          />
          {/* Flame inside */}
          <circle
            cx="12"
            cy="21"
            r="9"
            fill={lantern === 'celestial-fire-lantern' ? '#3b82f6' : '#f59e0b'}
            fillOpacity="0.45"
            filter="url(#lanternGlow)"
          />
          <path
            d="M12 16C12 16 9 20 9 22C9 23.6 10.3 25 12 25C13.7 25 15 23.6 15 22C15 20 12 16 12 16Z"
            fill={lantern === 'celestial-fire-lantern' ? '#60a5fa' : '#f97316'}
          />
          <circle cx="12" cy="22" r="1.5" fill="#ffffff" />
          <rect x="3" y="30" width="18" height="4" rx="1.5" fill="#78350f" />
        </g>

        {/* Companions & Pets */}
        {pet === 'lost-sheep-companion' && (
          <g className="ll-avatar-companion-sheep" transform="translate(16, 155)">
            <circle cx="16" cy="24" r="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="26" cy="24" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="21" cy="18" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <ellipse cx="32" cy="18" rx="6.5" ry="5.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="34" cy="17" r="1.2" fill="#1e293b" />
            <rect x="14" y="32" width="2.5" height="8" rx="1" fill="#475569" />
            <rect x="25" y="32" width="2.5" height="8" rx="1" fill="#475569" />
          </g>
        )}

        {(pet === 'lion-cub-pet' || (!pet && size === 'hero')) && (
          <g className="ll-avatar-companion-lion" transform="translate(16, 152)">
            <circle cx="20" cy="22" r="15" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="20" cy="23" r="10" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
            <circle cx="12" cy="13" r="3" fill="#f59e0b" />
            <circle cx="28" cy="13" r="3" fill="#f59e0b" />
            <circle cx="16" cy="21" r="1.8" fill="#1e293b" />
            <circle cx="24" cy="21" r="1.8" fill="#1e293b" />
            <ellipse cx="20" cy="27" rx="3.5" ry="2.5" fill="#fef3c7" />
            <circle cx="20" cy="26" r="1" fill="#78350f" />
          </g>
        )}

        {pet === 'peace-dove-pet' && (
          <g className="ll-avatar-companion-dove" transform="translate(20, 140)">
            <ellipse cx="20" cy="20" rx="12" ry="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="28" cy="16" r="5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />
            <circle cx="29" cy="15" r="1" fill="#1e293b" />
            <path d="M33 16L37 18L33 20Z" fill="#f59e0b" />
            {/* Olive sprig */}
            <path d="M35 18C38 16 42 16 45 14" stroke="#047857" strokeWidth="1.2" />
            <ellipse cx="42" cy="15" rx="2" ry="1" fill="#10b981" />
          </g>
        )}

        {pet === 'desert-eagle-pet' && (
          <g className="ll-avatar-companion-eagle" transform="translate(18, 140)">
            <ellipse cx="20" cy="22" rx="10" ry="14" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
            <circle cx="20" cy="12" r="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
            <path d="M22 12L28 14L22 16Z" fill="#f59e0b" />
          </g>
        )}
      </svg>
    </div>
  );
}
