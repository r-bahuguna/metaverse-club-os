'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { PricingExplosion } from '@/components/ui/PricingExplosion';

const FADE_UP = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
};

export function Hero() {
    return (
        <section style={{
            height: '100dvh',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden', padding: '0 24px', textAlign: 'center'
        }}>
            {/* Fixed gradient background — pure CSS parallax, no JS needed */}
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                background: 'radial-gradient(circle at 50% 40%, rgba(192, 132, 252, 0.15) 0%, rgba(5,5,16,0) 60%)',
                zIndex: 0, pointerEvents: 'none'
            }} />

            {/* Content — simple fade-in, no scroll-linked transform */}
            <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
                <motion.div initial="hidden" animate="visible" variants={FADE_UP}>
                    <h1 style={{
                        fontSize: 'clamp(40px, 8vw, 84px)', fontWeight: 700, letterSpacing: '-0.04em',
                        lineHeight: 1.05, marginBottom: 24,
                        background: 'linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
                    }}>
                        Metaverse Club OS. <br /> The Ultimate Command Center.
                    </h1>
                    <p style={{ fontSize: 'clamp(16px, 2vw, 24px)', color: 'rgba(255,255,255,0.6)', maxWidth: 650, margin: '0 auto 40px', lineHeight: 1.5, fontWeight: 400 }}>
                        Purpose-built club management software for serious Second Life venue operators. Move from daily survival to market domination.
                    </p>
                    <button style={{
                        background: 'var(--text-primary)', color: 'var(--bg-void)',
                        padding: '16px 32px', borderRadius: 999, fontSize: 16, fontWeight: 600,
                        display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        transition: 'transform 0.2s', boxShadow: '0 0 40px rgba(255,255,255,0.2)'
                    }} onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}>
                        Explore the Demo <ChevronRight size={18} />
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

export function NightlifeParadox() {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-80px' });

    return (
        <section style={{ padding: '120px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.div
                ref={ref}
                initial={{ opacity: 0, y: 60 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxWidth: 1200, margin: '0 auto' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 60, alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 600, marginBottom: 24, lineHeight: 1.1 }}>Bridging the gap between aesthetic glamour and operational grind.</h2>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 24 }}>
                            Your club might look incredible to guests — but behind the scenes you're probably managing 64+ event hours a week through Discord DMs, Google Sheets, and gut instinct. Double bookings happen. Tips go untracked. The management team burns out.
                        </p>
                        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
                            Metaverse Club OS eradicates all of that. One platform replaces the chaos — and gives your team back 40+ hours a month they were wasting on admin.
                        </p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, x: 40 }}
                        animate={isInView ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        style={{ padding: 'clamp(24px, 4vw, 40px)', background: 'rgba(0,0,0,0.3)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {[
                                ['Fragmented Sheets', 'Centralised Cloud'],
                                ['Double-Bookings', 'Algorithmic Matching'],
                                ['Manual Tip Splitting', 'Real-Time Tracking'],
                                ['Reactive Firefighting', 'Proactive VIP Building'],
                            ].map(([old, now], i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: i < 3 ? 20 : 0, borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>{old}</span>
                                    <span style={{ color: i === 3 ? 'var(--neon-cyan)' : 'var(--neon-purple)', fontWeight: 600 }}>{now}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </motion.div>
        </section>
    );
}



export function PricingSection() {
    const [isExplosionOpen, setIsExplosionOpen] = useState(false);
    const [discountApplied, setDiscountApplied] = useState(false);

    useEffect(() => {
        const handle = () => setDiscountApplied(true);
        window.addEventListener('mc:claim-discount', handle);
        return () => window.removeEventListener('mc:claim-discount', handle);
    }, []);

    /* CSS keyframes injected once */
    const PRICE_KF = `
        @keyframes mc-strike { from { width: 0; } to { width: 100%; } }
        @keyframes mc-fade-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes mc-fade-out { from { opacity: 1; } to { opacity: 0.3; } }
    `;

    const pricingRef = useRef(null);
    const pricingInView = useInView(pricingRef, { once: true, margin: '-100px' });

    return (
        <section id="pricing" style={{ padding: '120px 24px', background: 'var(--bg-elevated)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <style>{PRICE_KF}</style>
            <PricingExplosion isOpen={isExplosionOpen} onClose={() => setIsExplosionOpen(false)} />

            <motion.div
                ref={pricingRef}
                initial={{ opacity: 0, y: 50, scale: 0.97 }}
                animate={pricingInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}
            >
                <h2 style={{ fontSize: 48, fontWeight: 700, marginBottom: 24 }}>Operational Sovereignty.</h2>
                <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.6)', marginBottom: 80, maxWidth: 600, margin: '0 auto 80px' }}>
                    Recapture 40+ hours per month. The software pays for itself in the first 72 hours of utilization.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 40, textAlign: 'left' }}>
                    {/* Main Pricing */}
                    <div style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%)', padding: 48, borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ fontSize: 14, color: 'var(--neon-purple)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Comprehensive Enterprise Setup</div>

                        {/* Animated price block */}
                        <div style={{ marginBottom: 8, minHeight: 80, position: 'relative' }}>
                            {/* Original $1,000 — strikes through then fades when discount applied */}
                            <div style={{
                                fontSize: 64, fontWeight: 700, lineHeight: 1,
                                position: 'relative', display: 'inline-block',
                                animation: discountApplied ? 'mc-fade-out 0.6s ease 0.4s both' : 'none',
                            }}>
                                $1,000
                                {discountApplied && (
                                    <span style={{
                                        position: 'absolute', top: '50%', left: 0,
                                        height: 3, background: '#f87171',
                                        borderRadius: 2,
                                        animation: 'mc-strike 0.45s ease 0.05s both',
                                        width: '100%',
                                    }} />
                                )}
                            </div>

                            {/* Discounted $700 — slides in after strike */}
                            {discountApplied && (
                                <div style={{
                                    display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 8,
                                    animation: 'mc-fade-up 0.5s ease 0.7s both',
                                }}>
                                    <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: '#86efac' }}>$700</span>
                                    <span style={{
                                        fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase',
                                        color: 'rgba(134,239,172,0.7)', fontWeight: 600, paddingBottom: 4,
                                    }}>launch price</span>
                                </div>
                            )}
                        </div>

                        {/* Throbbing discount badge — draws attention to click */}
                        {!discountApplied && (
                            <button
                                onClick={() => setDiscountApplied(true)}
                                style={{
                                    background: 'rgba(134,239,172,0.08)',
                                    border: '1px solid rgba(134,239,172,0.3)',
                                    borderRadius: 999,
                                    padding: '8px 20px',
                                    marginBottom: 12, cursor: 'pointer',
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    animation: 'mc-throb 2s ease-in-out infinite',
                                    transition: 'background 0.15s',
                                }}
                                onMouseOver={e => { e.currentTarget.style.background = 'rgba(134,239,172,0.16)'; e.currentTarget.style.animationPlayState = 'paused'; }}
                                onMouseOut={e => { e.currentTarget.style.background = 'rgba(134,239,172,0.08)'; e.currentTarget.style.animationPlayState = 'running'; }}
                            >
                                <span style={{
                                    width: 8, height: 8, borderRadius: '50%',
                                    background: '#86efac',
                                    boxShadow: '0 0 6px rgba(134,239,172,0.6)',
                                    flexShrink: 0,
                                }} />
                                <span style={{
                                    fontSize: 12, letterSpacing: '0.04em',
                                    color: '#86efac', fontWeight: 600,
                                }}>
                                    30% off — tap to reveal launch price
                                </span>
                            </button>
                        )}
                        <div style={{ color: 'rgba(255,255,255,0.4)', marginBottom: 32, fontSize: 14 }}>One-time architectural deployment.</div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {['Your own Google Cloud database & hosting', 'Smart Scheduling Engine initialization', 'Custom branding & Discord channel integration', 'Full platform deployment for your club'].map(item => (
                                <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'var(--text-primary)' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--neon-purple)' }} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <div style={{ marginTop: 40, paddingTop: 32, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                            <div style={{ fontSize: 24, fontWeight: 600 }}>$30 <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>/ mo</span></div>
                            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4 }}>Retainer for cloud hosting & feature updates.</div>
                        </div>

                        <button
                            onClick={() => setIsExplosionOpen(true)}
                            style={{
                                marginTop: 32, padding: '16px 24px', background: 'rgba(255,255,255,0.05)',
                                color: 'white', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                                cursor: 'pointer', width: '100%', fontSize: 16, fontWeight: 600,
                                transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                        >
                            <span>View Full Breakdown</span>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    {/* Goodwill Bonuses */}
                    <div style={{ padding: 48, borderRadius: 32, border: '1px solid rgba(0,240,255,0.2)', background: 'rgba(0,240,255,0.02)' }}>
                        <div style={{ fontSize: 14, color: 'var(--neon-cyan)', fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 16 }}>Included Executive Bonuses</div>
                        <div style={{ fontSize: 32, fontWeight: 600, marginBottom: 16, lineHeight: 1.2 }}>The Complete <br />Venue Ecosystem</div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 32 }}>We eliminate purchase hesitation by offering a fully integrated asset stack, complimentary.</div>
                        <ul style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {['Bespoke 3D Mesh DJ Board Assets', 'Smart Tip Jars with Milestone Tracking', 'Custom LSL Data Pipelines (In-World to Dashboard)', 'Professional Discord Server Overhaul'].map(item => (
                                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, color: 'var(--text-primary)' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--neon-cyan)', marginTop: 8 }} />
                                    <span style={{ lineHeight: 1.5 }}>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </motion.div>
        </section>
    );
}

export function ActionForm() {
    const [status, setStatus] = React.useState('');

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const name = formData.get('name') as string;
        const decision = formData.get('decision') as string;
        const comments = formData.get('comments') as string;

        setStatus('Submitting...');

        try {
            const color = decision === 'accept' ? 0x4ade80 : 0xfbbf24;
            const title = decision === 'accept'
                ? `🎉 PROPOSAL ACCEPTED: ${name}`
                : `💬 PROPOSAL REBUTTAL: ${name}`;

            const payload = {
                embeds: [
                    {
                        title,
                        color,
                        fields: [
                            { name: "Name/SL Name", value: name || "Unknown", inline: true },
                            { name: "Decision", value: decision, inline: true },
                            { name: "Comments", value: comments || "None provided.", inline: false }
                        ],
                        timestamp: new Date().toISOString()
                    }
                ]
            };

            const webhookUrl = "https://discord.com/api/webhooks/1476119251851935744/lyEo_1o-ntE7D66OgAUgjMJ9xttIHpuch2wsiU3HqyGOjRPknaZseQZ4JbcG5FUZU7W_";

            await fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            setStatus('Sent! We will connect via Discord shortly.');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            setStatus('Failed to send. Please reach out manually.');
        }
    }

    const ctaRef = useRef(null);
    const ctaInView = useInView(ctaRef, { once: true, margin: '-80px' });

    return (
        <motion.section
            id="cta"
            ref={ctaRef}
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            style={{ padding: '120px 24px', textAlign: 'center' }}
        >
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 600, marginBottom: 24 }}>Ready to get started?</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 60 }}>The era of manual spreadsheets is over. Let us know you are interested and we will take it from here.</p>

            <form onSubmit={handleSubmit} style={{ maxWidth: 500, margin: '0 auto', background: 'rgba(255,255,255,0.02)', padding: 'clamp(24px, 5vw, 40px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)', boxSizing: 'border-box' }}>
                <input type="text" name="name" placeholder="Your Name / SL Name" required style={{ width: '100%', padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: 16, fontSize: 16 }} />
                <select name="decision" required style={{ width: '100%', padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: 16, fontSize: 16, appearance: 'none' }}>
                    <option value="" disabled selected>Select an option...</option>
                    <option value="accept">Yes, Let's build this.</option>
                    <option value="rebuttal">I have questions / Let's negotiate.</option>
                </select>
                <textarea name="comments" placeholder="Comments or Questions..." rows={4} style={{ width: '100%', padding: '16px 20px', borderRadius: 12, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', marginBottom: 24, fontSize: 16, resize: 'vertical' }} />

                <button type="submit" disabled={status === 'Submitting...'} style={{ width: '100%', padding: '16px', borderRadius: 12, background: 'var(--neon-purple)', color: 'white', fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
                    {status || 'Submit Response'}
                </button>
            </form>
        </motion.section>
    );
}
