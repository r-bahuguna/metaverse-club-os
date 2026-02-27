'use client';

import React from 'react';
import { Hero, NightlifeParadox, PricingSection, ActionForm } from '@/components/PitchSections';
import { FeatureCarousel } from '@/components/FeatureCarousel';
import InteractiveDashboard from '@/components/InteractiveDashboard';
import { RoleProvider } from '@/hooks/useRole';
import { MobileDemoOverlay } from '@/components/MobileDemoOverlay';

export default function ProposalLandingPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg-void)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}>

      {/* 1. Hero */}
      <Hero />

      {/* 2. The Problem & Solution */}
      <NightlifeParadox />

      {/* 3. Feature Carousel */}
      <FeatureCarousel />

      {/* 4. Interactive Demo */}
      <section id="demo" style={{ padding: '120px 24px', background: 'var(--bg-surface)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 600, marginBottom: 16 }}>The Live Experience.</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 18, maxWidth: 600, margin: '0 auto' }}>
              Try the live dashboard below. Use the role toggles to see exactly how the platform adapts for each team member.
            </p>
            <div style={{
              marginTop: 24,
              padding: '12px 24px',
              background: 'rgba(192, 132, 252, 0.06)',
              border: '1px solid rgba(192, 132, 252, 0.2)',
              borderRadius: 12,
              display: 'inline-block',
              maxWidth: 720
            }}>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, margin: 0 }}>
                <span style={{ color: '#c084fc', fontWeight: 600, marginRight: 6 }}>Demo Notice:</span>
                This interactive preview is optimized for desktop displays to provide a conceptual overview. To experience the fully functional, production-ready platform tailored to your venue, please request your personalized 7-day trial below.
              </p>
            </div>
          </div>

          <RoleProvider>
            <MobileDemoOverlay>
              <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24, padding: 4, background: 'rgba(0,0,0,0.5)', overflow: 'hidden', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}>
                <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-void)', position: 'relative' }}>
                  <InteractiveDashboard />
                </div>
              </div>
            </MobileDemoOverlay>
          </RoleProvider>
        </div>
      </section>

      {/* 5. Pricing & Offer */}
      <PricingSection />

      {/* 6. Action / Close */}
      <ActionForm />

    </main>
  );
}
