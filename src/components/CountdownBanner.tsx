'use client';

import React, { useState, useEffect } from 'react';

/**
 * CountdownBanner — sticky top bar with 72-hour rolling countdown.
 * On mobile, stacks to a compact two-row layout.
 */

const OFFER_DURATION_MS = 72 * 60 * 60 * 1000;

function getOrInitExpiry(): number {
    if (typeof window === 'undefined') return Date.now() + OFFER_DURATION_MS;
    const stored = sessionStorage.getItem('mc_offer_expiry');
    if (stored) return parseInt(stored, 10);
    const expiry = Date.now() + OFFER_DURATION_MS;
    sessionStorage.setItem('mc_offer_expiry', String(expiry));
    return expiry;
}

export const DISCOUNT_EVENT = 'mc:claim-discount';

const BANNER_STYLES = `
@keyframes mc-neon-pulse {
    0%   { box-shadow: 0 0 0px rgba(134,239,172,0); border-color: rgba(134,239,172,0.35); }
    50%  { box-shadow: 0 0 14px rgba(134,239,172,0.35), 0 0 4px rgba(134,239,172,0.2); border-color: rgba(134,239,172,0.8); }
    100% { box-shadow: 0 0 0px rgba(134,239,172,0); border-color: rgba(134,239,172,0.35); }
}
@media (max-width: 640px) {
    .mc-banner-inner { flex-direction: column; gap: 8px !important; padding: 8px 16px !important; text-align: center; }
    .mc-banner-left { flex-wrap: wrap; justify-content: center; gap: 8px !important; }
    .mc-banner-left > span { font-size: 12px !important; }
    .mc-banner-left > div { font-size: 10px !important; }
    .mc-banner-timer { order: 0; }
    .mc-banner-timer > div { padding: 3px 7px !important; font-size: 14px !important; min-width: 32px !important; }
    .mc-banner-right { width: 100%; justify-content: center; }
    .mc-banner-right > button:first-child { flex: 1; max-width: 240px; font-size: 12px !important; padding: 6px 14px !important; }
}
`;

export function CountdownBanner() {
    const [timeLeft, setTimeLeft] = useState({ h: 71, m: 59, s: 59 });
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        const expiry = getOrInitExpiry();
        const tick = () => {
            const remaining = expiry - Date.now();
            if (remaining <= 0) { setTimeLeft({ h: 0, m: 0, s: 0 }); return; }
            const totalSecs = Math.floor(remaining / 1000);
            setTimeLeft({
                h: Math.floor(totalSecs / 3600),
                m: Math.floor((totalSecs % 3600) / 60),
                s: totalSecs % 60,
            });
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    if (!visible) return null;

    const pad = (n: number) => String(n).padStart(2, '0');

    const handleClaim = (e: React.MouseEvent) => {
        e.preventDefault();
        const pricingEl = document.getElementById('pricing');
        if (pricingEl) pricingEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.dispatchEvent(new CustomEvent(DISCOUNT_EVENT));
        setTimeout(() => {
            const ctaEl = document.getElementById('cta');
            if (ctaEl) {
                ctaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                const select = ctaEl.querySelector('select[name="decision"]') as HTMLSelectElement;
                if (select) select.value = 'accept';
            }
        }, 1800);
    };

    return (
        <>
            <style>{BANNER_STYLES}</style>
            <div className="mc-banner-inner" style={{
                position: 'sticky', top: 0, zIndex: 9999, width: '100%',
                background: 'rgba(8, 8, 18, 0.93)',
                backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '9px 28px', gap: 16, flexWrap: 'wrap',
            }}>
                {/* Left — text */}
                <div className="mc-banner-left" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        padding: '2px 10px', borderRadius: 999,
                        fontSize: 11, fontWeight: 500,
                        color: 'rgba(255,255,255,0.55)',
                        letterSpacing: '0.05em', textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}>
                        Launch Pricing
                    </div>
                    <span style={{ fontWeight: 500, fontSize: 13, color: 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }}>
                        Save <span style={{ color: '#86efac', fontWeight: 650 }}>30%</span> — pay $700 instead of $1,000
                    </span>
                </div>

                {/* Center — countdown */}
                <div className="mc-banner-timer" style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: '"SF Mono", "Fira Mono", monospace' }}>
                    {[pad(timeLeft.h), pad(timeLeft.m), pad(timeLeft.s)].map((unit, i) => (
                        <React.Fragment key={i}>
                            <div style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: 7, padding: '4px 9px',
                                fontSize: 17, fontWeight: 600, color: 'rgba(255,255,255,0.85)',
                                minWidth: 38, textAlign: 'center', letterSpacing: '0.04em',
                            }}>
                                {unit}
                            </div>
                            {i < 2 && <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 600, fontSize: 16 }}>:</span>}
                        </React.Fragment>
                    ))}
                </div>

                {/* Right — CTA + dismiss */}
                <div className="mc-banner-right" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <button
                        onClick={handleClaim}
                        style={{
                            background: 'rgba(134,239,172,0.06)',
                            border: '1px solid rgba(134,239,172,0.35)',
                            color: '#86efac',
                            padding: '7px 18px', borderRadius: 8,
                            fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', whiteSpace: 'nowrap',
                            letterSpacing: '0.01em',
                            animation: 'mc-neon-pulse 2.4s ease-in-out infinite',
                            transition: 'background 0.18s ease',
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(134,239,172,0.14)';
                            e.currentTarget.style.animationPlayState = 'paused';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(134,239,172,0.06)';
                            e.currentTarget.style.animationPlayState = 'running';
                        }}
                    >
                        Claim $700 offer ›
                    </button>
                    <button
                        onClick={() => setVisible(false)}
                        title="Dismiss"
                        style={{
                            background: 'none', border: 'none',
                            color: 'rgba(255,255,255,0.2)', cursor: 'pointer',
                            fontSize: 17, lineHeight: 1, padding: 4,
                            transition: 'color 0.15s',
                        }}
                        onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.5)')}
                        onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
                    >
                        ✕
                    </button>
                </div>
            </div>
        </>
    );
}
