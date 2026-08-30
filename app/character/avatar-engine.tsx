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
  amber: { base: '#f6c28b', shadow: '#e5a563', highlight: '#fed7aa', blush: '#f87171' },
  sand: { base: '#ecd1ad', shadow: '#d4b38b', highlight: '#fef3c7', blush: '#fb7185' },
  honey: { base: '#d9a066', shadow: '#b87b41', highlight: '#fcd34d', blush: '#f43f5e' },
  walnut: { base: '#9a5e35', shadow: '#78421d', highlight: '#bd7b4a', blush: '#e11d48' },
  cocoa: { base: '#5c3319', shadow: '#3f1f0a', highlight: '#7a4623', blush: '#be123c' },
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
  const special = equipment.special;

  const sizePixels = size === 'small' ? 72 : size === 'medium' ? 128 : size === 'large' ? 220 : 320;

  return (
    <div
      className={`ll-avatar-container ll-avatar-${size} ${className}`}
      style={{ width: sizePixels, height: sizePixels }}
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
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#1e293b" stopOpacity="0" />
          </radialGradient>

          {/* Pedestal Gradient */}
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#1e3a8a" />
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

          {/* Hair Gradient (Dark Brown to Warm Chestnut) */}
          <linearGradient id="hairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#290e02" />
          </linearGradient>

          {/* Lantern Light Glow */}
          <filter id="lanternGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Ambient Glow */}
        <circle cx="100" cy="110" r="85" fill="url(#avatarBackdropGlow)" />

        {/* Pedestal (optional base) */}
        {showPedestal && (
          <g className="ll-avatar-pedestal">
            <ellipse cx="100" cy="225" rx="65" ry="12" fill="#090d16" fillOpacity="0.6" />
            <ellipse cx="100" cy="220" rx="55" ry="9" fill="url(#pedestalGrad)" stroke="#38bdf8" strokeWidth="1.5" />
            <ellipse cx="100" cy="219" rx="46" ry="6" fill="#1e293b" />
          </g>
        )}

        {/* Special: Tomb Light Halo */}
        {special === 'tomb-light-halo' && (
          <g className="ll-avatar-tomb-halo" opacity="0.85">
            <circle cx="100" cy="70" r="45" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
            <path d="M100 20L100 30M100 110L100 120M50 70L60 70M140 70L150 70" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
            <path d="M65 35L72 42M128 98L135 105M65 105L72 98M128 42L135 35" stroke="#7dd3fc" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}

        {/* Character Base Body & Legs */}
        <g className="ll-avatar-body-group">
          {/* Shadow beneath feet */}
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
              {/* Swiftness Wings */}
              <path d="M72 195C75 192 80 193 81 197C78 198 75 198 72 195Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
              <path d="M128 195C125 192 120 193 119 197C122 198 125 198 128 195Z" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
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

          {/* Base Clothing: Tunics & Cloaks */}
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

          {/* Arms */}
          <g className="ll-avatar-arms">
            {/* Left Arm */}
            <path d="M72 114L54 144C52 147 54 152 58 152C61 152 64 149 68 142L82 120" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
            {/* Right Arm (Holding Lantern) */}
            <path d="M128 114L146 140C148 143 152 144 155 141C158 138 156 134 152 130L134 114" fill={skin.base} stroke={skin.shadow} strokeWidth="1.5" />
          </g>

          {/* Accessories: Pendant / Pins */}
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

          {accessory === 'lantern-charm' && (
            <g className="ll-avatar-lantern-charm">
              <rect x="74" y="154" width="8" height="12" rx="2" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
              <circle cx="78" cy="160" r="1.5" fill="#f97316" />
            </g>
          )}

          {/* Special: Manna Basket / Flame Badge */}
          {special === 'manna-basket-charm' && (
            <g className="ll-avatar-manna-basket">
              <path d="M60 148H72L70 162H62L60 148Z" fill="#d97706" stroke="#78350f" strokeWidth="1" />
              <circle cx="65" cy="147" r="2" fill="#ffffff" />
              <circle cx="68" cy="146" r="1.5" fill="#ffffff" />
            </g>
          )}

          {special === 'flame-of-faith-badge' && (
            <g className="ll-avatar-flame-badge">
              <path d="M112 120H122V130C122 134 117 137 117 137C117 137 112 134 112 130V120Z" fill="#1e293b" stroke="#d97706" strokeWidth="1" />
              <circle cx="117" cy="128" r="2" fill="#ef4444" />
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
          <path d="M79 55C83 53 89 54 91 56" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M121 55C117 53 111 54 109 56" stroke="#290e02" strokeWidth="2.5" strokeLinecap="round" />

          {/* Expressive Eyes */}
          <g className="ll-avatar-eyes">
            {faceExpression === 'calm' ? (
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
            ) : (
              <>
                {/* Anime / Cartoon Sparkle Eyes */}
                <ellipse cx="85" cy="65" rx="5" ry="5.5" fill="#1e293b" />
                <circle cx="83.5" cy="63" r="2" fill="#ffffff" />
                <circle cx="86.5" cy="66.5" r="1" fill="#ffffff" />

                <ellipse cx="115" cy="65" rx="5" ry="5.5" fill="#1e293b" />
                <circle cx="113.5" cy="63" r="2" fill="#ffffff" />
                <circle cx="116.5" cy="66.5" r="1" fill="#ffffff" />
              </>
            )}
          </g>

          {/* Nose */}
          <path d="M100 66V73C100 74 98 75 97 75" stroke={skin.shadow} strokeWidth="2" strokeLinecap="round" />

          {/* Mouth */}
          {faceExpression === 'grin' && (
            <path d="M89 79C89 87 111 87 111 79Z" fill="#be123c" stroke="#881337" strokeWidth="1.5" />
          )}
          {faceExpression === 'smile' && (
            <path d="M91 80C94 85 106 85 109 80" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          )}
          {faceExpression === 'calm' && (
            <path d="M93 81C97 83 103 83 107 81" stroke="#881337" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          )}
          {faceExpression === 'wonder' && (
            <ellipse cx="100" cy="82" rx="4" ry="5" fill="#881337" stroke="#4c0519" strokeWidth="1.5" />
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
              {/* Highlight Curls */}
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
              {/* Braided strands */}
              <rect x="66" y="44" width="6" height="52" rx="3" fill="#3b1d06" />
              <rect x="74" y="46" width="6" height="56" rx="3" fill="#290e02" />
              <rect x="120" y="46" width="6" height="56" rx="3" fill="#290e02" />
              <rect x="128" y="44" width="6" height="52" rx="3" fill="#3b1d06" />
              {/* Golden Beads */}
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

        {/* Floating Lantern in Adventurer's Right Hand */}
        <g className="ll-avatar-lantern" transform="translate(150, 126)">
          <path d="M12 0V8" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M4 8H20L17 12H7L4 8Z" fill="#78350f" />
          <rect x="5" y="12" width="14" height="18" rx="2" fill="#fef08a" stroke="#d97706" strokeWidth="1.8" />
          {/* Flame inside */}
          <circle cx="12" cy="21" r="9" fill="#f59e0b" fillOpacity="0.4" filter="url(#lanternGlow)" />
          <path d="M12 16C12 16 9 20 9 22C9 23.6 10.3 25 12 25C13.7 25 15 23.6 15 22C15 20 12 16 12 16Z" fill="#f97316" />
          <circle cx="12" cy="22" r="1.5" fill="#ffffff" />
          <rect x="3" y="30" width="18" height="4" rx="1.5" fill="#78350f" />
        </g>

        {/* Companions */}
        {special === 'lost-sheep-companion' && (
          <g className="ll-avatar-companion-sheep" transform="translate(20, 160)">
            <circle cx="16" cy="24" r="9" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="26" cy="24" r="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="21" cy="18" r="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />
            <ellipse cx="32" cy="18" rx="6.5" ry="5.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="1.5" />
            <circle cx="34" cy="17" r="1.2" fill="#1e293b" />
            <rect x="14" y="32" width="2.5" height="8" rx="1" fill="#475569" />
            <rect x="25" y="32" width="2.5" height="8" rx="1" fill="#475569" />
          </g>
        )}

        {(special === 'lion-companion' || (!special && size === 'hero')) && (
          <g className="ll-avatar-companion-lion" transform="translate(18, 155)">
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
      </svg>
    </div>
  );
}
