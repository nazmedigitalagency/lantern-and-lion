'use client';

import Link from 'next/link';
import { CharacterAvatar } from '../character/components';
import type { CharacterAppearance, CharacterEquipment } from '../character/types';

export type TeenSidebarTab = 'home' | 'decision' | 'cases' | 'askword' | 'learn' | 'journey' | 'profile';
export type TeenSidebarItem = TeenSidebarTab | 'adventure' | 'stories' | 'arcade' | 'leagues';

type NavEntry = {
  id: TeenSidebarItem;
  icon: string;
  label: string;
  /** Real routed page (always a <Link>), vs. an in-dashboard tab. */
  href?: string;
};

const NAV_ENTRIES: NavEntry[] = [
  { id: 'home', icon: '🏠', label: 'Today' },
  { id: 'adventure', icon: '🗺️', label: 'Adventure', href: '/adventure' },
  { id: 'stories', icon: '📖', label: 'Stories', href: '/stories' },
  { id: 'arcade', icon: '🎮', label: 'Arcade', href: '/arcade' },
  { id: 'leagues', icon: '🏆', label: 'Leagues', href: '/leagues' },
  { id: 'decision', icon: '⚖️', label: 'Decision Lab' },
  { id: 'cases', icon: '🔍', label: 'Case Files' },
  { id: 'askword', icon: '⏱️', label: 'Ask the Word' },
  { id: 'learn', icon: '📚', label: 'Learn & Notes' },
  { id: 'journey', icon: '🧭', label: 'Journey' },
  { id: 'profile', icon: '🧑', label: 'Profile & PIN' },
];

export type TeenSidebarProps = {
  /** Which nav item to visually mark `.active`. Omit if none apply (e.g. the Character page). */
  activeItem?: TeenSidebarItem;
  /**
   * When provided, dashboard-internal tabs (home/decision/cases/askword/
   * learn/journey/profile) call this instead of navigating — for use
   * inside the dashboard itself, which already has that tab's content
   * mounted. When absent, those items render as links back to the
   * dashboard with a `?tab=` query param.
   */
  onTabSelect?: (tab: TeenSidebarTab) => void;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  /** Optional character summary footer card — omitted entirely if not supplied. */
  charAppearance?: CharacterAppearance;
  charEquipment?: CharacterEquipment;
  charDisplayName?: string;
  levelName?: string;
  points?: number;
};

export function TeenSidebar({
  activeItem,
  onTabSelect,
  mobileMenuOpen,
  onCloseMobileMenu,
  charAppearance,
  charEquipment,
  charDisplayName,
  levelName,
  points,
}: TeenSidebarProps) {
  const showCharacterCard = Boolean(charAppearance && charEquipment && charDisplayName);

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="teen-mobile-backdrop"
          onClick={onCloseMobileMenu}
          aria-hidden="true"
        />
      )}
      <aside className={`teen-sidebar ${mobileMenuOpen ? 'teen-sidebar-open' : ''}`}>
        <div className="teen-sidebar-mobile-head">
          <div className="teen-sidebar-mobile-title">
            <strong>Lion&rsquo;s Den Menu</strong>
          </div>
          <button
            type="button"
            className="teen-sidebar-close-btn"
            onClick={onCloseMobileMenu}
            aria-label="Close navigation"
          >
            ✕
          </button>
        </div>

        <nav className="teen-sidebar-nav" aria-label="Teen Dashboard Navigation">
        {NAV_ENTRIES.map((entry) => {
          const isActive = activeItem === entry.id;
          if (entry.href) {
            return (
              <Link
                key={entry.id}
                href={entry.href}
                className={`teen-nav-item ${isActive ? 'active' : ''}`}
                onClick={onCloseMobileMenu}
              >
                <span className="teen-nav-icon">{entry.icon}</span>
                <span>{entry.label}</span>
              </Link>
            );
          }

          const tab = entry.id as TeenSidebarTab;
          if (onTabSelect) {
            return (
              <button
                key={entry.id}
                type="button"
                className={`teen-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => { onTabSelect(tab); onCloseMobileMenu(); }}
              >
                <span className="teen-nav-icon">{entry.icon}</span>
                <span>{entry.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={entry.id}
              href={`/teen-dashboard?tab=${tab}`}
              className={`teen-nav-item ${isActive ? 'active' : ''}`}
              onClick={onCloseMobileMenu}
            >
              <span className="teen-nav-icon">{entry.icon}</span>
              <span>{entry.label}</span>
            </Link>
          );
        })}
      </nav>

      {showCharacterCard && (
        <div className="teen-sidebar-static-character">
          <Link href="/character" className="teen-static-character-link" onClick={onCloseMobileMenu}>
            <div className="teen-static-character-avatar">
              <CharacterAvatar appearance={charAppearance!} equipment={charEquipment!} size="small" showPedestal={false} />
            </div>
            <div className="teen-static-character-info">
              <p className="teen-char-kicker">⚔️ Character</p>
              <strong>{charDisplayName}</strong>
              {levelName && (
                <small>{levelName}{typeof points === 'number' ? ` · Lvl ${Math.floor(points / 100) + 1}` : ''}</small>
              )}
            </div>
          </Link>
        </div>
      )}
    </aside>
    </>
  );
}

export default TeenSidebar;
