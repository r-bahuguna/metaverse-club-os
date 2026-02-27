'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Calendar, Zap, Activity, Lock, Server, ShieldCheck, Smartphone, FileText, BarChart3 } from 'lucide-react';

const FEATURES = [
    {
        icon: Calendar, color: 'var(--neon-purple)', bg: 'rgba(192,132,252,0.08)',
        title: "Smart Auto-Roster",
        subtitle: "Your Scheduling Is Done",
        desc: "The Rostering Engine reads your staff's availability and builds a conflict-free shift calendar in seconds. No double bookings. No forgotten slots.",
    },
    {
        icon: Zap, color: 'var(--neon-cyan)', bg: 'rgba(0,240,255,0.06)',
        title: "Real-Time Tip Tracking",
        subtitle: "Every L$ accounted for",
        desc: "See exactly how much your club, DJs, and Hosts earned — live, tonight. Every tip captured the moment it lands. No more 2AM payout reconstruction.",
    },
    {
        icon: Activity, color: 'var(--neon-pink)', bg: 'rgba(255,107,157,0.06)',
        title: "Staff Presence Tracking",
        subtitle: "Dashboard & Discord activity",
        desc: "Know who is active on the dashboard or in your Discord — and who went quiet mid-shift. Heartbeat engine tracks web presence in real time.",
    },
    {
        icon: Lock, color: 'var(--neon-green)', bg: 'rgba(74,222,128,0.06)',
        title: "Role-Based Access",
        subtitle: "Right people, right data",
        desc: "Owners see everything. DJs and Hosts see only their own shifts and tips. Fully automatic — no one stumbles into financials or management settings.",
    },
    {
        icon: Server, color: '#facc15', bg: 'rgba(250,204,21,0.06)',
        title: "Zero-Loss Architecture",
        subtitle: "Two databases, zero gaps",
        desc: "Fast Firestore for the live dashboard, strict PostgreSQL for every transaction. Even during SL lag spikes, your money data is never lost.",
    },
    {
        icon: ShieldCheck, color: '#818cf8', bg: 'rgba(129,140,248,0.06)',
        title: "Fraud Protection",
        subtitle: "Cryptographic verification",
        desc: "Every data packet from Second Life is cryptographically verified. No fake tips, no spoofed traffic, no griefers messing with your numbers.",
    },
    {
        icon: Smartphone, color: '#fb7185', bg: 'rgba(251,113,133,0.06)',
        title: "Works on Any Phone",
        subtitle: "No app needed",
        desc: "DJs and Hosts confirm shifts, check schedules, and request changes from their phone. One tap. Less missed confirmations, less chasing.",
    },
    {
        icon: FileText, color: '#a5b4fc', bg: 'rgba(165,180,252,0.06)',
        title: "Web-Based Hiring",
        subtitle: "No notecards required",
        desc: "Candidates apply via a web form — timezone, voice, specialties — and the application posts to a role-restricted channel in your Discord server.",
    },
    {
        icon: BarChart3, color: '#34d399', bg: 'rgba(52,211,153,0.06)',
        title: "Crowd & Revenue Analytics",
        subtitle: "Know what's working",
        desc: "Track peak hours, top DJs, best event themes — plus crowd behaviour: when guests arrive, how long they stay, which nights draw big spenders.",
    },
];

const AUTO_INTERVAL = 5000;
const SWIPE_THRESHOLD = 50;

const CAROUSEL_CSS = `
@keyframes mc-slide-title {
    0% { opacity: 0; transform: translateX(40px); }
    100% { opacity: 1; transform: translateX(0); }
}
@keyframes mc-expand-card {
    0% { opacity: 0; max-height: 0; transform: translateY(-8px); }
    100% { opacity: 1; max-height: 300px; transform: translateY(0); }
}
.mc-carousel-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: rgba(255,255,255,0.15); border: none;
    cursor: pointer; transition: all 0.3s ease; padding: 0;
}
.mc-carousel-dot.active {
    background: rgba(255,255,255,0.8);
    width: 24px; border-radius: 4px;
}
`;

export function FeatureCarousel() {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);
    const [isPaused, setIsPaused] = useState(false);
    const [epoch, setEpoch] = useState(0); // bumped on manual interaction to reset timer
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const resetTimer = useCallback(() => setEpoch(e => e + 1), []);

    const goTo = useCallback((idx: number) => {
        setDirection(idx > current ? 1 : -1);
        setCurrent(idx);
        resetTimer();
    }, [current, resetTimer]);

    const next = useCallback(() => {
        setDirection(1);
        setCurrent(prev => (prev + 1) % FEATURES.length);
    }, []);

    const prev = useCallback(() => {
        setDirection(-1);
        setCurrent(prev => (prev - 1 + FEATURES.length) % FEATURES.length);
    }, []);

    const manualNext = useCallback(() => { next(); resetTimer(); }, [next, resetTimer]);
    const manualPrev = useCallback(() => { prev(); resetTimer(); }, [prev, resetTimer]);

    // Auto-advance — resets whenever epoch changes (manual interaction)
    useEffect(() => {
        if (isPaused) return;
        timerRef.current = setInterval(next, AUTO_INTERVAL);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [next, isPaused, epoch]);

    // Swipe handling
    const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x < -SWIPE_THRESHOLD) { next(); resetTimer(); }
        else if (info.offset.x > SWIPE_THRESHOLD) { prev(); resetTimer(); }
    };

    const f = FEATURES[current];
    const Icon = f.icon;

    const variants = {
        enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0, scale: 0.95 }),
        center: { x: 0, opacity: 1, scale: 1 },
        exit: (d: number) => ({ x: d > 0 ? -300 : 300, opacity: 0, scale: 0.95 }),
    };

    return (
        <section style={{ padding: '120px 24px', overflow: 'hidden' }}>
            <style>{CAROUSEL_CSS}</style>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                <h2 style={{
                    fontSize: 'clamp(28px, 5vw, 42px)', fontWeight: 600,
                    marginBottom: 16, textAlign: 'center', lineHeight: 1.1,
                }}>
                    Built Around How Clubs Actually Work.
                </h2>
                <p style={{
                    fontSize: 18, color: 'rgba(255,255,255,0.5)',
                    textAlign: 'center', marginBottom: 48, maxWidth: 560, margin: '0 auto 48px',
                }}>
                    Every feature was built because club owners asked for it.
                </p>

                {/* Carousel container — fixed height prevents layout shifts on tile transitions */}
                <div
                    style={{ position: 'relative', height: 320, overflow: 'hidden' }}
                    onMouseEnter={() => setIsPaused(true)}
                    onMouseLeave={() => setIsPaused(false)}
                >
                    <AnimatePresence mode="wait" custom={direction}>
                        <motion.div
                            key={current}
                            custom={direction}
                            variants={variants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.15}
                            onDragEnd={handleDragEnd}
                            style={{
                                background: f.bg,
                                border: `1px solid ${f.color}18`,
                                borderRadius: 24, padding: 'clamp(28px, 5vw, 48px)',
                                cursor: 'grab', userSelect: 'none',
                                position: 'relative', overflow: 'hidden',
                            }}
                        >
                            {/* Top accent line */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                                background: `linear-gradient(90deg, transparent, ${f.color}, transparent)`,
                                opacity: 0.5,
                            }} />

                            {/* Icon + counter */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                                <div style={{
                                    width: 52, height: 52, borderRadius: 16,
                                    background: `${f.color}15`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon size={26} color={f.color} />
                                </div>
                                <span style={{
                                    fontSize: 11, fontFamily: 'var(--font-mono)',
                                    color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em',
                                }}>
                                    {String(current + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
                                </span>
                            </div>

                            {/* Title — slides in */}
                            <motion.h3
                                key={`title-${current}`}
                                initial={{ opacity: 0, x: 40 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0.05 }}
                                style={{
                                    fontSize: 'clamp(22px, 4vw, 28px)', fontWeight: 700,
                                    marginBottom: 6, letterSpacing: '-0.02em', lineHeight: 1.2,
                                }}
                            >
                                {f.title}
                            </motion.h3>

                            {/* Subtitle */}
                            <motion.p
                                key={`sub-${current}`}
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.35, delay: 0.12 }}
                                style={{
                                    fontSize: 14, color: f.color, fontWeight: 600,
                                    letterSpacing: '0.02em', marginBottom: 20,
                                    opacity: 0.8,
                                }}
                            >
                                {f.subtitle}
                            </motion.p>

                            {/* Description — expands in */}
                            <motion.p
                                key={`desc-${current}`}
                                initial={{ opacity: 0, y: 16, maxHeight: 0 }}
                                animate={{ opacity: 1, y: 0, maxHeight: 300 }}
                                transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                                style={{
                                    color: 'rgba(255,255,255,0.55)', lineHeight: 1.7,
                                    fontSize: 15, overflow: 'hidden',
                                }}
                            >
                                {f.desc}
                            </motion.p>

                            {/* Progress bar */}
                            <div style={{
                                position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
                                background: 'rgba(255,255,255,0.04)',
                            }}>
                                {!isPaused && (
                                    <motion.div
                                        initial={{ width: '0%' }}
                                        animate={{ width: '100%' }}
                                        transition={{ duration: AUTO_INTERVAL / 1000, ease: 'linear' }}
                                        style={{ height: '100%', background: f.color, opacity: 0.5 }}
                                    />
                                )}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* Navigation dots */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, marginTop: 28,
                }}>
                    {FEATURES.map((_, i) => (
                        <button
                            key={i}
                            className={`mc-carousel-dot ${i === current ? 'active' : ''}`}
                            onClick={() => goTo(i)}
                            aria-label={`Feature ${i + 1}`}
                        />
                    ))}
                </div>

                {/* Arrow buttons (desktop) */}
                <div style={{
                    display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16,
                }}>
                    <button
                        onClick={manualPrev}
                        style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                        ←
                    </button>
                    <button
                        onClick={manualNext}
                        style={{
                            width: 40, height: 40, borderRadius: 12,
                            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 18,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.15s',
                        }}
                        onMouseOver={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                        onMouseOut={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}
                    >
                        →
                    </button>
                </div>
            </div>
        </section>
    );
}
