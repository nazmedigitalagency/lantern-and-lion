'use client';

import React from 'react';
import type { SeasonCertificate } from './types';
import { LEAGUE_TIERS } from './config';

interface CertificateModalProps {
  certificate: SeasonCertificate;
  onClose: () => void;
}

export function CertificateModal({ certificate, onClose }: CertificateModalProps) {
  const tier = LEAGUE_TIERS[certificate.tier] || LEAGUE_TIERS.bronze;

  return (
    <div className="help-overlay" role="presentation" onClick={onClose}>
      <div
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cert-title"
        style={{
          maxWidth: '620px',
          width: '95%',
          background: '#ffffff',
          color: '#0f172a',
          padding: '2.5rem 2rem',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
          border: `3px solid ${tier.badgeTone}`,
          textAlign: 'center',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            border: '2px dashed #cbd5e1',
            borderRadius: '12px',
            padding: '2rem 1.5rem',
            background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)',
          }}
        >
          {/* Header Emblem */}
          <div style={{ fontSize: '2.75rem', marginBottom: '0.5rem' }}>{tier.emoji}</div>
          <p
            style={{
              fontSize: '0.85rem',
              fontWeight: 800,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#64748b',
              margin: '0 0 0.5rem 0',
            }}
          >
            Lantern &amp; Lion · Bible Learning Platform
          </p>
          <h2
            id="cert-title"
            style={{
              fontSize: '1.8rem',
              fontWeight: 900,
              color: '#0f172a',
              margin: '0 0 1rem 0',
              fontFamily: 'var(--font-heading, inherit)',
            }}
          >
            Certificate of Achievement
          </h2>

          <p style={{ fontSize: '0.95rem', color: '#64748b', margin: '0.5rem 0' }}>
            This certifies that
          </p>

          <h3
            style={{
              fontSize: '1.75rem',
              fontWeight: 900,
              color: '#b45309',
              margin: '0.5rem 0 1rem 0',
              borderBottom: '2px solid #fde68a',
              display: 'inline-block',
              paddingBottom: '0.25rem',
            }}
          >
            {certificate.recipientName}
          </h3>

          <p style={{ fontSize: '0.95rem', color: '#475569', lineHeight: 1.6, margin: '0.75rem 0' }}>
            has faithfully completed <strong>{certificate.seasonName}</strong>, demonstrating dedication,
            Scripture learning, and steady perseverance.
          </p>

          {/* Stats Badge Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: '0.75rem',
              margin: '1.5rem 0',
              padding: '1rem',
              background: '#f1f5f9',
              borderRadius: '10px',
            }}
          >
            <div>
              <small style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Final Tier</small>
              <strong style={{ fontSize: '1.1rem', color: tier.badgeTone }}>{tier.name}</strong>
            </div>
            <div>
              <small style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Final Rank</small>
              <strong style={{ fontSize: '1.1rem', color: '#0f172a' }}>#{certificate.finalRank}</strong>
            </div>
            <div>
              <small style={{ display: 'block', fontSize: '0.75rem', color: '#64748b' }}>Seasonal XP</small>
              <strong style={{ fontSize: '1.1rem', color: '#047857' }}>⭐ {certificate.totalSeasonXp.toLocaleString()}</strong>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.75rem',
              color: '#94a3b8',
              marginTop: '1.5rem',
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1rem',
            }}
          >
            <span>Verified: {certificate.verificationCode}</span>
            <span>Completed: {new Date(certificate.completedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
          <button
            type="button"
            className="button button-primary"
            onClick={() => window.print()}
          >
            🖨️ Print Certificate
          </button>
          <button
            type="button"
            className="button button-secondary"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
