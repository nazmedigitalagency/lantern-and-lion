'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useActiveUser } from '../lib/session';

export type PublicNavId = 'curriculum' | 'safety' | 'churches' | 'multiplayer' | 'about' | 'blog';

interface SiteHeaderProps {
  activeNav?: PublicNavId;
  isHome?: boolean;
  actionVariant?: 'home' | 'cta';
  ctaText?: string;
  ctaHref?: string;
}

export default function SiteHeader({
  activeNav,
  isHome = false,
  actionVariant = isHome ? 'home' : 'cta',
  ctaText = 'Create account',
  ctaHref = '/parent-access',
}: SiteHeaderProps) {
  const { activeUser, hydrated, signOut } = useActiveUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [getStartedOpen, setGetStartedOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setUserDropdownOpen(false);
        setSignInOpen(false);
        setGetStartedOpen(false);
        setMenuOpen(false);
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
        setSignInOpen(false);
        setGetStartedOpen(false);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = () => {
    signOut();
    setUserDropdownOpen(false);
    setMenuOpen(false);
  };

  return (
    <header className="site-header" id="top" ref={headerRef}>
      <Link
        className="brand"
        href={isHome ? '#top' : '/'}
        aria-label="Lantern and Lion home"
      >
        <Image src="/lantern-lion-logo.png" alt="" width={58} height={58} priority />
        <span>
          <strong>Lantern &amp; Lion</strong>
          <small>{isHome ? 'The Lantern Club' : 'Bible play for growing minds'}</small>
        </span>
      </Link>

      {/* Desktop navigation */}
      <nav id="main-nav" aria-label="Main navigation">
        <Link className={activeNav === 'curriculum' ? 'active-nav' : ''} href="/curriculum">
          Curriculum
        </Link>
        <Link className={activeNav === 'safety' ? 'active-nav' : ''} href="/safety">
          Safety
        </Link>
        <Link className={activeNav === 'churches' ? 'active-nav' : ''} href="/churches">
          Churches &amp; Schools
        </Link>
        <Link className={activeNav === 'multiplayer' ? 'active-nav' : ''} href="/multiplayer">
          Team games
        </Link>
        <Link className={activeNav === 'about' ? 'active-nav' : ''} href="/about">
          Our Mission
        </Link>
      </nav>

      {/* Desktop actions */}
      <div className="header-actions">
        {hydrated && activeUser ? (
          <>
            <div className="user-profile-dropdown">
              <button
                type="button"
                className="user-profile-trigger"
                aria-expanded={userDropdownOpen}
                aria-haspopup="true"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <span className={`user-profile-avatar ${activeUser.avatarTone}`}>
                  {activeUser.avatarChar}
                </span>
                <div className="user-profile-text">
                  <strong>{activeUser.name}</strong>
                  <small>{activeUser.roleLabel}</small>
                </div>
                <span className={`signin-chevron ${userDropdownOpen ? 'open' : ''}`} aria-hidden="true" />
              </button>
              {userDropdownOpen && (
                <div className="user-profile-menu" role="menu">
                  <div className="user-menu-header">
                    <span className={`user-menu-avatar ${activeUser.avatarTone}`}>
                      {activeUser.avatarChar}
                    </span>
                    <div>
                      <strong>{activeUser.name}</strong>
                      <small>Signed in ({activeUser.roleLabel})</small>
                    </div>
                  </div>
                  <div className="user-menu-divider" />
                  <Link
                    role="menuitem"
                    className="user-menu-dashboard-link"
                    href={activeUser.dashboardUrl}
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <span>🚀</span>
                    <div>
                      <strong>Open {activeUser.roleLabel}</strong>
                      <small>Continue your journey</small>
                    </div>
                  </Link>
                  <div className="user-menu-divider" />
                  <button type="button" role="menuitem" className="user-menu-signout" onClick={handleSignOut}>
                    <span>🚪</span>
                    <div>
                      <strong>Sign out of {activeUser.name}</strong>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <Link className="button button-primary header-dashboard-btn" href={activeUser.dashboardUrl}>
              Dashboard →
            </Link>
          </>
        ) : (
          <>
            <div className="signin-dropdown">
              <button
                type="button"
                className="signin-trigger"
                aria-expanded={signInOpen}
                aria-haspopup="true"
                onClick={() => setSignInOpen(!signInOpen)}
              >
                Sign in
                <span className={`signin-chevron ${signInOpen ? 'open' : ''}`} aria-hidden="true" />
              </button>
              {signInOpen && (
                <div className="signin-menu" role="menu">
                  <Link role="menuitem" href="/child-access" onClick={() => setSignInOpen(false)}>
                    <span>C</span>
                    <div>
                      <strong>Child sign in</strong>
                      <small>Ages 5–12 · Username and 4-digit PIN</small>
                    </div>
                  </Link>
                  <Link role="menuitem" href="/teen-access" onClick={() => setSignInOpen(false)}>
                    <span>🦁</span>
                    <div>
                      <strong>Teen sign in</strong>
                      <small>Ages 13–17 · Lion’s Den</small>
                    </div>
                  </Link>
                  <Link role="menuitem" href="/parent-access" onClick={() => setSignInOpen(false)}>
                    <span>P</span>
                    <div>
                      <strong>Parent sign in</strong>
                      <small>Family dashboard &amp; controls</small>
                    </div>
                  </Link>
                  <Link role="menuitem" href="/teacher-access" onClick={() => setSignInOpen(false)}>
                    <span>T</span>
                    <div>
                      <strong>Teacher sign in</strong>
                      <small>Class &amp; lesson management</small>
                    </div>
                  </Link>
                </div>
              )}
            </div>
            {actionVariant === 'home' ? (
              <div className="getstarted-dropdown">
                <button
                  type="button"
                  className="getstarted-trigger"
                  aria-expanded={getStartedOpen}
                  aria-haspopup="true"
                  onClick={() => setGetStartedOpen(!getStartedOpen)}
                >
                  Get started
                  <span className={`signin-chevron ${getStartedOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                {getStartedOpen && (
                  <div className="getstarted-menu" role="menu">
                    <Link role="menuitem" className="child-opt" href="/family-setup" onClick={() => setGetStartedOpen(false)}>
                      <span>🏮</span>
                      <div>
                        <strong>Sign up your child</strong>
                        <small>Ages 5–12 · The Lantern Club</small>
                      </div>
                    </Link>
                    <Link role="menuitem" className="teen-opt" href="/family-setup" onClick={() => setGetStartedOpen(false)}>
                      <span>🦁</span>
                      <div>
                        <strong>Sign up your teen</strong>
                        <small>Ages 13–17 · Lion’s Den</small>
                      </div>
                    </Link>
                    <div className="getstarted-divider" />
                    <Link role="menuitem" className="getstarted-parent-link" href="/parent-access" onClick={() => setGetStartedOpen(false)}>
                      Create a parent account instead →
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <Link className="button button-coral" href={ctaHref}>
                {ctaText}
              </Link>
            )}
          </>
        )}
      </div>

      {/* Mobile hamburger button */}
      <button
        type="button"
        className="menu-button"
        aria-expanded={menuOpen}
        aria-controls="mobile-nav"
        onClick={() => {
          setMenuOpen(!menuOpen);
          setSignInOpen(false);
        }}
      >
        <span />
        <span />
        <span />
        <b className="sr-only">Menu</b>
      </button>

      {/* Mobile navigation drawer */}
      {menuOpen && (
        <div className="mobile-nav" id="mobile-nav" role="dialog" aria-label="Main menu">
          {hydrated && activeUser && (
            <div className="mobile-user-box">
              <span className={`user-profile-avatar ${activeUser.avatarTone}`}>{activeUser.avatarChar}</span>
              <div>
                <strong>{activeUser.name}</strong>
                <small>{activeUser.roleLabel} (Signed in)</small>
              </div>
            </div>
          )}
          <Link className={activeNav === 'curriculum' ? 'active-nav' : ''} href="/curriculum" onClick={() => setMenuOpen(false)}>
            Curriculum
          </Link>
          <Link className={activeNav === 'safety' ? 'active-nav' : ''} href="/safety" onClick={() => setMenuOpen(false)}>
            Safety
          </Link>
          <Link className={activeNav === 'churches' ? 'active-nav' : ''} href="/churches" onClick={() => setMenuOpen(false)}>
            Churches &amp; Schools
          </Link>
          <Link className={activeNav === 'multiplayer' ? 'active-nav' : ''} href="/multiplayer" onClick={() => setMenuOpen(false)}>
            Team games
          </Link>
          <Link className={activeNav === 'about' ? 'active-nav' : ''} href="/about" onClick={() => setMenuOpen(false)}>
            Our Mission
          </Link>

          {hydrated && activeUser ? (
            <div className="mobile-user-actions">
              <Link
                className="button button-primary mobile-create"
                href={activeUser.dashboardUrl}
                onClick={() => setMenuOpen(false)}
              >
                Open {activeUser.roleLabel} →
              </Link>
              <button type="button" className="mobile-signout-link" onClick={handleSignOut}>
                Sign out of {activeUser.name}
              </button>
            </div>
          ) : (
            <>
              <div className="mobile-signin">
                <button
                  type="button"
                  className="mobile-signin-trigger"
                  aria-expanded={signInOpen}
                  onClick={() => setSignInOpen(!signInOpen)}
                >
                  Sign in
                  <span className={`signin-chevron ${signInOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                {signInOpen && (
                  <div className="mobile-signin-submenu">
                    <Link href="/child-access" onClick={() => setMenuOpen(false)}>
                      Child sign in (5–12)
                    </Link>
                    <Link href="/teen-access" onClick={() => setMenuOpen(false)}>
                      Teen sign in (13–17)
                    </Link>
                    <Link href="/parent-access" onClick={() => setMenuOpen(false)}>
                      Parent sign in
                    </Link>
                    <Link href="/teacher-access" onClick={() => setMenuOpen(false)}>
                      Teacher sign in
                    </Link>
                  </div>
                )}
              </div>
              <div className="mobile-getstarted">
                <button
                  type="button"
                  className="mobile-signin-trigger"
                  aria-expanded={getStartedOpen}
                  onClick={() => setGetStartedOpen(!getStartedOpen)}
                >
                  Get started
                  <span className={`signin-chevron ${getStartedOpen ? 'open' : ''}`} aria-hidden="true" />
                </button>
                {getStartedOpen && (
                  <div className="mobile-signin-submenu">
                    <Link href="/family-setup" onClick={() => setMenuOpen(false)}>
                      Sign up your child (5–12)
                    </Link>
                    <Link href="/family-setup" onClick={() => setMenuOpen(false)}>
                      Sign up your teen (13–17)
                    </Link>
                    <Link href="/parent-access" onClick={() => setMenuOpen(false)}>
                      Create a parent account
                    </Link>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </header>
  );
}
