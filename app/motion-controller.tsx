'use client';

import { useEffect } from 'react';

const revealSelectors = [
  '.section-heading', '.steps article', '.activity-card', '.age-copy', '.age-cards article', '.safety-intro', '.safety-grid article', '.parent-panel', '.parent-copy', '.quote-grid blockquote', '.join-section > *',
  '.onboarding-card > *', '.access-story-copy > *', '.access-form-wrap > *', '.family-step-card > *', '.child-form-card > *', '.child-list-panel > *',
  '.child-welcome > *', '.continue-card', '.today-plan', '.dashboard-activity-grid article', '.verse-strip > *', '.progress-overview article', '.progress-path',
  '.parent-page-title > *', '.parent-metric-grid article', '.parent-overview-grid > *', '.recent-learning', '.single-child-report', '.assignment-builder', '.message-layout', '.parent-settings-card'
].join(',');

function launchConfetti(source: Element) {
  const rect = source.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.className = 'motion-confetti';
  burst.style.left = `${Math.min(window.innerWidth - 50, Math.max(50, rect.left + rect.width / 2))}px`;
  burst.style.top = `${Math.max(70, rect.top + Math.min(rect.height / 2, 100))}px`;
  const colours = ['#f5c451', '#168c7a', '#f05a67', '#102a43', '#e7f4fa'];
  for (let index = 0; index < 18; index += 1) {
    const piece = document.createElement('i');
    piece.style.setProperty('--confetti-x', `${(index % 2 ? 1 : -1) * (28 + (index * 17) % 105)}px`);
    piece.style.setProperty('--confetti-y', `${65 + (index * 13) % 90}px`);
    piece.style.setProperty('--confetti-r', `${120 + index * 37}deg`);
    piece.style.setProperty('--confetti-delay', `${(index % 5) * 25}ms`);
    piece.style.background = colours[index % colours.length];
    burst.appendChild(piece);
  }
  document.body.appendChild(burst);
  window.setTimeout(() => burst.remove(), 1200);
}

export default function MotionController() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    document.documentElement.classList.add('motion-ready');

    const revealItems = Array.from(document.querySelectorAll<HTMLElement>(revealSelectors));
    revealItems.forEach((item, index) => {
      item.classList.add('motion-reveal');
      item.style.setProperty('--reveal-delay', `${Math.min(index % 4, 3) * 55}ms`);
    });
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.classList.add('motion-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -35px' });
    revealItems.forEach((item) => observer.observe(item));

    const seenSuccess = new WeakSet<Element>();
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll('.game-success,.onboarding-success,.dashboard-toast,.parent-dashboard-toast,.family-check,.access-success-mark').forEach((item) => {
        if (!seenSuccess.has(item)) { seenSuccess.add(item); launchConfetti(item); }
      });
      document.querySelectorAll('.game-note,.onboarding-try,.family-error,.access-error').forEach((item) => {
        if (!item.classList.contains('motion-wrong')) {
          item.classList.add('motion-wrong');
          const focused = document.activeElement as HTMLElement | null;
          const target = focused && focused !== document.body ? focused : item.closest<HTMLElement>('.game-card,.onboarding-card,.access-form,.child-profile-form');
          target?.classList.add('motion-jiggle');
          window.setTimeout(() => target?.classList.remove('motion-jiggle'), 450);
        }
      });
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    const onLinkClick = (event: MouseEvent) => {
      const link = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href]');
      if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank' || link.href.startsWith('mailto:') || link.href.startsWith('tel:')) return;
      const target = new URL(link.href, window.location.href);
      if (target.origin !== window.location.origin || (target.pathname === window.location.pathname && target.hash)) return;
      const loader = document.createElement('div');
      loader.className = 'page-loader'; loader.setAttribute('role', 'status'); loader.setAttribute('aria-live', 'polite'); loader.innerHTML = '<span></span><b class="sr-only">Opening the next page</b>';
      document.body.appendChild(loader);
      window.setTimeout(() => loader.remove(), 1800);
    };
    document.addEventListener('click', onLinkClick);
    return () => { observer.disconnect(); mutationObserver.disconnect(); document.removeEventListener('click', onLinkClick); document.documentElement.classList.remove('motion-ready'); };
  }, []);
  return null;
}
