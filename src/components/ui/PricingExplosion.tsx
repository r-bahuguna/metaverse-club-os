'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Database, Brain, Shield, Calendar,
    BarChart3, Smartphone, FileText, Eye, Lock, Activity,
} from 'lucide-react';

interface PricingExplosionProps {
    isOpen: boolean;
    onClose: () => void;
}

const SECTIONS = [
    {
        icon: <Calendar size={26} color="#c084fc" />,
        color: '#c084fc',
        bg: 'rgba(192, 132, 252, 0.07)',
        title: 'Smart Auto-Rostering',
        items: [
            `Tell the system when your staff is available, and it builds the whole weekly schedule automatically — no spreadsheets, no chasing people`,
            `It even matches your DJs to the right night. A techno DJ won't get slotted into a jazz lounge set`,
            'Keeps shift distribution fair so the same few people aren\'t always pulling extra weight',
            'Staff get notified in Discord the moment their shift is confirmed — one tap to accept or reschedule',
        ],
    },
    {
        icon: <BarChart3 size={26} color="#22d3ee" />,
        color: '#22d3ee',
        bg: 'rgba(34, 211, 238, 0.07)',
        title: 'Revenue & Crowd Intelligence',
        items: [
            'Every tip from every jar — DJ, Host, Club — shows up on your dashboard the instant it happens. No waiting until tomorrow',
            'Live leaderboard shows who\'s earning the most tonight, not last week',
            'Crowd insights: when do guests arrive? How long do they stay? Which events bring the biggest spenders?',
            'Track capacity in real time through your in-world group sensor',
            'Week-over-week trends so you can double down on what actually fills the floor',
        ],
    },
    {
        icon: <Eye size={26} color="#fb7185" />,
        color: '#fb7185',
        bg: 'rgba(251, 113, 133, 0.07)',
        title: 'Know Who\'s Active, Right Now',
        items: [
            'See at a glance who is active on the dashboard or online in your Discord — updated live',
            'Smart heartbeat checks confirm genuine activity, not just a forgotten browser tab',
            `Detects disconnections instantly — no more ghost "online" statuses lingering for 20 minutes`,
            'Managers get a live Staff Map: who\'s working, who went quiet, how long they\'ve been away',
            'Note: this tracks dashboard and Discord presence, not Second Life in-world status',
        ],
    },
    {
        icon: <Lock size={26} color="#4ade80" />,
        color: '#4ade80',
        bg: 'rgba(74, 222, 128, 0.07)',
        title: 'Everyone Sees the Right Things',
        items: [
            'Owners see everything. Managers handle rosters. DJs and Hosts only see their own shifts and earnings',
            'It\'s not just hidden buttons — the database itself refuses to share data you\'re not authorised for',
            'Five permission tiers: Owner, General Manager, Manager, DJ, Host — each carefully scoped',
        ],
    },
    {
        icon: <Database size={26} color="#a78bfa" />,
        color: '#a78bfa',
        bg: 'rgba(167, 139, 250, 0.07)',
        title: 'Your Money Is Never Lost',
        items: [
            'Two databases working in tandem: a fast one for instant dashboard updates, a bulletproof one for financial records',
            'Every single L$ transaction is stored with bank-grade reliability — even if SL has technical issues during your busiest night',
            'If the region lags mid-event, tip jars hold the data locally and retry until confirmed — 100% capture rate',
        ],
    },
    {
        icon: <Shield size={26} color="#34d399" />,
        color: '#34d399',
        bg: 'rgba(52, 211, 153, 0.07)',
        title: 'Protected From Griefers & Fraud',
        items: [
            'Every data packet from Second Life is cryptographically verified — fake tips and spoofed traffic are automatically blocked',
            'Unverified or malformed requests are rejected before they can touch your data',
            'Built-in rate limiting stops script flooding and griefing attempts',
        ],
    },
    {
        icon: <Smartphone size={26} color="#f97316" />,
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.07)',
        title: 'Works on Any Phone, No App Needed',
        items: [
            'Staff access their dashboard from any smartphone browser — nothing to install',
            'One tap to submit availability, confirm a shift, or flag a conflict',
            'Instant notifications when the weekly roster drops or a shift changes',
        ],
    },
    {
        icon: <FileText size={26} color="#fbbf24" />,
        color: '#fbbf24',
        bg: 'rgba(251, 191, 36, 0.07)',
        title: 'Hiring Made Simple',
        items: [
            'Applicants fill in a clean web form — SL name, timezone, voice, genres, experience — no more hunting for notecards',
            'Each application posts straight to a private hiring channel in your Discord for management to review',
            'Approve from Discord → account is set up automatically. Reject → applicant gets a clean response',
        ],
    },
    {
        icon: <Brain size={26} color="#ec4899" />,
        color: '#ec4899',
        bg: 'rgba(236, 72, 153, 0.07)',
        title: 'AI-Powered Event Planning (Optional)',
        items: [
            'AI analyses your past revenue data and recommends the highest-earning lineup for next week',
            '"Vibe Match" suggests which DJ-Host combos work best together based on real performance history',
            'Runs securely on Google Cloud — your data never leaves your infrastructure',
        ],
    },
    {
        icon: <Activity size={26} color="#818cf8" />,
        color: '#818cf8',
        bg: 'rgba(129, 140, 248, 0.07)',
        title: 'Automatic Discord Notifications',
        items: [
            'New roster published → notification sent to your dedicated roster channel so every affected staff member sees it',
            'Shift starting in an hour → auto-reminder pings the relevant role in your Discord',
            'New job application → instant alert in your management channel',
            'All channels set up once during deployment — your server, your permissions, your control',
        ],
    },
];

export function PricingExplosion({ isOpen, onClose }: PricingExplosionProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.97, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.97, y: 40 }}
                    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                        position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                        background: 'rgba(5, 5, 16, 0.97)', backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        zIndex: 100000, display: 'flex', flexDirection: 'column',
                        overflowY: 'auto', padding: 'clamp(24px, 5vw, 60px) clamp(12px, 3vw, 24px)',
                    }}
                >
                    <div style={{ maxWidth: 820, width: '100%', margin: '0 auto', position: 'relative', boxSizing: 'border-box' }}>
                        <button
                            onClick={onClose}
                            style={{
                                position: 'absolute', top: 0, right: 0,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '50%', width: 40, height: 40,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: 'pointer', color: 'rgba(255,255,255,0.6)',
                                transition: 'background 0.2s',
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                        >
                            <X size={18} />
                        </button>

                        <h2 style={{ fontSize: 'clamp(24px, 5vw, 36px)', fontWeight: 700, marginBottom: 10, letterSpacing: '-0.02em' }}>
                            Here's exactly what you're getting.
                        </h2>
                        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', marginBottom: 48, lineHeight: 1.6 }}>
                            No vague promises. Every feature below is included in your $700 launch price — built, deployed, and ready to run your club.
                        </p>

                        <div style={{ display: 'grid', gap: 20 }}>
                            {SECTIONS.map((s, i) => (
                                <div
                                    key={i}
                                    style={{
                                        background: s.bg,
                                        border: `1px solid ${s.color}20`,
                                        padding: 'clamp(16px, 3vw, 24px) clamp(16px, 3vw, 28px)',
                                        borderRadius: 16,
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                                        <div style={{
                                            background: `${s.color}12`, padding: 8, borderRadius: 10,
                                            border: `1px solid ${s.color}20`,
                                        }}>
                                            {s.icon}
                                        </div>
                                        <h3 style={{ fontSize: 17, fontWeight: 650, color: '#fff', letterSpacing: '-0.01em' }}>
                                            {s.title}
                                        </h3>
                                    </div>
                                    <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 2 }}>
                                        {s.items.map((item, j) => (
                                            <li key={j} style={{
                                                display: 'flex', alignItems: 'flex-start', gap: 9,
                                                color: 'rgba(255,255,255,0.65)', fontSize: 13.5, lineHeight: 1.55,
                                            }}>
                                                <div style={{
                                                    width: 4, height: 4, borderRadius: '50%',
                                                    background: s.color, marginTop: 7, flexShrink: 0,
                                                }} />
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            marginTop: 40, padding: '24px 28px', borderRadius: 14,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16,
                        }}>
                            <div>
                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14 }}>Everything above for </span>
                                <span style={{ color: '#86efac', fontWeight: 700, fontSize: 18 }}>$700</span>
                                <span style={{ color: 'rgba(255,255,255,0.2)', textDecoration: 'line-through', fontSize: 13, marginLeft: 8 }}>$1,000</span>
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}> + $30/mo hosting</span>
                            </div>
                            <button
                                onClick={onClose}
                                style={{
                                    background: 'none', border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'rgba(255,255,255,0.5)', padding: '8px 20px', borderRadius: 8,
                                    cursor: 'pointer', fontSize: 13, transition: 'all 0.2s',
                                }}
                                onMouseOver={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)')}
                                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
                            >
                                Close ↑
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
