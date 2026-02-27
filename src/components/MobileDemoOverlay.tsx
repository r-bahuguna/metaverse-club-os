'use client';

import React, { useState, useEffect } from 'react';

/**
 * MobileDemoOverlay — On mobile (≤768px), blurs the demo with a "Tap for mobile demo"
 * overlay. Tapping enters fullscreen demo mode with an easy exit button.
 * On desktop, renders children normally with no overlay.
 */

const OVERLAY_STYLES = `
@media (min-width: 769px) {
    .mc-demo-overlay { display: none !important; }
    .mc-demo-container { filter: none !important; pointer-events: auto !important; }
}
`;

export function MobileDemoOverlay({ children }: { children: React.ReactNode }) {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // Fullscreen mode — the demo takes over the screen
    if (isFullscreen) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                zIndex: 99999, background: 'var(--bg-void)',
                display: 'flex', flexDirection: 'column',
                overflow: 'hidden',
            }}>
                {/* Exit bar */}
                <div style={{
                    padding: '10px 16px', background: 'rgba(0,0,0,0.6)',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexShrink: 0,
                }}>
                    <span style={{
                        fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)',
                        letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                        Live Demo — Mobile View
                    </span>
                    <button
                        onClick={() => setIsFullscreen(false)}
                        style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            borderRadius: 8, padding: '6px 14px',
                            color: 'white', fontSize: 13, fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'background 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                        onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                    >
                        ✕ Exit Demo
                    </button>
                </div>
                {/* Demo content */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    {children}
                </div>
            </div>
        );
    }

    return (
        <>
            <style>{OVERLAY_STYLES}</style>
            <div style={{ position: 'relative' }}>
                {/* Blurred demo — only on mobile */}
                <div
                    className="mc-demo-container"
                    style={{
                        filter: isMobile ? 'blur(6px) brightness(0.6)' : 'none',
                        pointerEvents: isMobile ? 'none' : 'auto',
                        transition: 'filter 0.3s ease',
                    }}
                >
                    {children}
                </div>

                {/* Tap overlay — only on mobile */}
                {isMobile && (
                    <div
                        className="mc-demo-overlay"
                        onClick={() => setIsFullscreen(true)}
                        style={{
                            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', zIndex: 10,
                            gap: 16,
                        }}
                    >
                        <div style={{
                            width: 64, height: 64, borderRadius: 20,
                            background: 'rgba(255,255,255,0.08)',
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 28,
                        }}>
                            📱
                        </div>
                        <div style={{
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 16, padding: '16px 28px',
                            textAlign: 'center',
                        }}>
                            <div style={{
                                fontSize: 16, fontWeight: 700, color: 'white',
                                marginBottom: 4,
                            }}>
                                Tap for Mobile Demo
                            </div>
                            <div style={{
                                fontSize: 13, color: 'rgba(255,255,255,0.5)',
                            }}>
                                Experience the full interactive dashboard
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
