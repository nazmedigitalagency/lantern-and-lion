'use client';

import { useEffect, useRef } from 'react';

/**
 * Minimal shared dialog accessibility behavior: locks background
 * scroll, moves focus into the dialog on open, and closes on Escape.
 * Attach the returned ref to the dialog element (the one with
 * role="dialog" aria-modal="true").
 *
 * Not a full focus trap (Tab can still leave the dialog) — that
 * matches the level of most of this app's existing overlays. This
 * covers the two gaps that matter most for a modal that asserts
 * aria-modal="true": something happens on open, and Escape works.
 */
let openDialogCount = 0;

export function useDialogA11y<T extends HTMLElement>(isOpen: boolean, onClose: () => void) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isOpen) return;
    openDialogCount++;
    document.body.style.overflow = 'hidden';

    const focusable = ref.current?.querySelector<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    focusable?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKeyDown);

    return () => {
      openDialogCount = Math.max(0, openDialogCount - 1);
      if (openDialogCount === 0) {
        document.body.style.overflow = '';
      }
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  return ref;
}
