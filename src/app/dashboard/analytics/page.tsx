'use client';

import React, { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell,
    ScatterChart, Scatter, ZAxis, Legend,
    ComposedChart, Line, ReferenceLine,
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, Receipt,
    Sparkles, X, Plus, PieChart as PieChartIcon, Target, Users,
} from 'lucide-react';
import { useRole } from '@/hooks/useRole';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedCard from '@/components/ui/AnimatedCard';
import {
    MOCK_REVENUE_TREND, MOCK_EXPENSE_TREND,
    MOCK_PEAK_HOURS, MOCK_EVENT_ROI, MOCK_EXPENSES,
} from '@/lib/mock-data';
import { getInsight, AiInsight } from '@/lib/ai-insights';
import { EXPENSE_CATEGORIES } from '@/lib/constants';

/* eslint-disable @typescript-eslint/no-explicit-any */
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null;
    return (
        <div style={{
            background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(12px)',
        }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6, fontFamily: 'var(--font-mono)' }}>
                {label}
            </p>
            {payload.map((e: any, i: number) => (
                <p key={i} style={{ fontSize: 12, color: e.color, fontFamily: 'var(--font-mono)' }}>
                    {e.name}: L${e.value?.toLocaleString()}
                </p>
            ))}
        </div>
    );
}

function ScatterTooltip({ active, payload }: any) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
        <div style={{
            background: 'rgba(10,10,20,0.92)', border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '10px 14px', backdropFilter: 'blur(12px)',
        }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)' }}>{d.hour}</p>
            <p style={{ fontSize: 12, color: '#4ade80', fontFamily: 'var(--font-mono)' }}>Guests: {d.guests}</p>
            <p style={{ fontSize: 12, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>Tips: L${d.tips.toLocaleString()}</p>
        </div>
    );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ── AI Insight Button + Modal ── */
function AiInsightButton({ chartType }: { chartType: Parameters<typeof getInsight>[0] }) {
    const [loading, setLoading] = useState(false);
    const [insight, setInsight] = useState<AiInsight | null>(null);

    async function handleClick() {
        setLoading(true);
        const result = await getInsight(chartType);
        setInsight(result);
        setLoading(false);
    }

    return (
        <>
            <button
                onClick={handleClick}
                disabled={loading}
                style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 6,
                    border: '1px solid rgba(192, 132, 252, 0.25)',
                    background: 'rgba(192, 132, 252, 0.08)',
                    color: '#c084fc', fontSize: 11, fontWeight: 500,
                    cursor: loading ? 'wait' : 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: loading ? 0.6 : 1,
                }}
            >
                <Sparkles size={12} />
                {loading ? 'Analyzing...' : 'AI Insight'}
            </button>

            {insight && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                }} onClick={() => setInsight(null)}>
                    <div style={{
                        maxWidth: 480, width: '90%',
                        background: 'rgba(15, 15, 30, 0.95)',
                        border: '1px solid rgba(192, 132, 252, 0.2)',
                        borderRadius: 16, padding: 24,
                        boxShadow: '0 0 40px rgba(192, 132, 252, 0.1)',
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles size={18} color="#c084fc" />
                                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{insight.title}</span>
                            </div>
                            <button onClick={() => setInsight(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={18} />
                            </button>
                        </div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 16 }}>
                            {insight.summary}
                        </p>
                        <div style={{
                            padding: '12px 16px', borderRadius: 10,
                            background: 'rgba(192, 132, 252, 0.06)',
                            border: '1px solid rgba(192, 132, 252, 0.15)',
                        }}>
                            <div style={{ fontSize: 10, color: '#c084fc', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6, fontWeight: 600 }}>
                                Recommendation · {insight.confidence} confidence
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                {insight.recommendation}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ── Section header helper ── */
function SectionHeader({ icon, title, chartType }: {
    icon: React.ReactNode;
    title: string;
    chartType?: Parameters<typeof getInsight>[0];
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <h2 style={{
                fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600,
                color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)',
                textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
                {icon} {title}
            </h2>
            {chartType && <AiInsightButton chartType={chartType} />}
        </div>
    );
}

/* ── Add Expense Modal ── */
function AddExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
        }} onClick={onClose}>
            <div style={{
                maxWidth: 420, width: '90%',
                background: 'rgba(15, 15, 30, 0.95)',
                border: '1px solid var(--glass-border)',
                borderRadius: 16, padding: 24,
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Add Expense</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {['Name', 'Amount (L$)', 'Notes'].map(lbl => (
                        <div key={lbl}>
                            <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</label>
                            <input style={{
                                width: '100%', marginTop: 4, padding: '8px 12px',
                                background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                                borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                                outline: 'none',
                            }} />
                        </div>
                    ))}
                    <div>
                        <label style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Category</label>
                        <select style={{
                            width: '100%', marginTop: 4, padding: '8px 12px',
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            borderRadius: 8, color: 'var(--text-primary)', fontSize: 13,
                            outline: 'none',
                        }}>
                            {EXPENSE_CATEGORIES.map(c => (
                                <option key={c.value} value={c.value}>{c.label}</option>
                            ))}
                        </select>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button onClick={onClose} style={{
                            flex: 1, padding: '10px', borderRadius: 8,
                            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13,
                        }}>Cancel</button>
                        <button onClick={onClose} style={{
                            flex: 1, padding: '10px', borderRadius: 8,
                            background: 'rgba(0, 240, 255, 0.1)', border: '1px solid rgba(0, 240, 255, 0.3)',
                            color: 'var(--neon-cyan)', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        }}>Add Expense</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ── Profit/Loss data (derived) ── */
const profitLossData = MOCK_REVENUE_TREND.map((r, i) => {
    const exp = MOCK_EXPENSE_TREND[i];
    const totalExp = exp ? exp.sploder + exp.fishbowl + exp.assets + exp.custom : 0;
    return { week: r.week, revenue: r.revenue, expenses: totalExp, profit: r.revenue - totalExp };
});

const EXPENSE_COLORS: Record<string, string> = {
    sploder: '#ff6b9d',
    fishbowl: '#fbbf24',
    assets: '#c084fc',
    custom: '#00f0ff',
};

export default function AnalyticsPage() {
    const { can } = useRole();
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);

    if (!can('general_manager')) {
        return (
            <div style={{ textAlign: 'center', padding: 'var(--space-12)', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>🔒</p>
                <p>Analytics requires General Manager access or above.</p>
            </div>
        );
    }

    const latestWeek = MOCK_REVENUE_TREND[MOCK_REVENUE_TREND.length - 1];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* ── Summary Cards ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-4)' }}>
                {[
                    { label: 'Revenue (This Week)', value: `L$${latestWeek.revenue.toLocaleString()}`, icon: <TrendingUp size={18} />, color: '#4ade80' },
                    { label: 'Expenses (This Week)', value: `L$${latestWeek.expenses.toLocaleString()}`, icon: <TrendingDown size={18} />, color: '#ff6b9d' },
                    { label: 'Net Profit', value: `L$${(latestWeek.revenue - latestWeek.expenses).toLocaleString()}`, icon: <DollarSign size={18} />, color: '#00f0ff' },
                    { label: 'Profit Margin', value: `${Math.round(((latestWeek.revenue - latestWeek.expenses) / latestWeek.revenue) * 100)}%`, icon: <Target size={18} />, color: '#fbbf24' },
                ].map((card, i) => (
                    <AnimatedCard key={i} index={i}>
                        <GlassCard>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                <div style={{ color: card.color }}>{card.icon}</div>
                                <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{card.label}</span>
                            </div>
                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: card.color }}>
                                {card.value}
                            </div>
                        </GlassCard>
                    </AnimatedCard>
                ))}
            </div>

            {/* ── Two-column charts ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                {/* Revenue Trend */}
                <AnimatedCard index={4}>
                    <GlassCard neon="green">
                        <SectionHeader icon={<TrendingUp size={18} color="#4ade80" />} title="Revenue Trend" chartType="revenue_trend" />
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <AreaChart data={MOCK_REVENUE_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                    <defs>
                                        <linearGradient id="gRevClub" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#00f0ff" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#00f0ff" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gRevDj" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#c084fc" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#c084fc" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="gRevHost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#ff6b9d" stopOpacity={0.25} />
                                            <stop offset="100%" stopColor="#ff6b9d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Area type="monotone" dataKey="tips_club" name="Club Tips" stroke="#00f0ff" strokeWidth={2} fill="url(#gRevClub)" />
                                    <Area type="monotone" dataKey="tips_dj" name="DJ Tips" stroke="#c084fc" strokeWidth={2} fill="url(#gRevDj)" />
                                    <Area type="monotone" dataKey="tips_host" name="Host Tips" stroke="#ff6b9d" strokeWidth={2} fill="url(#gRevHost)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </AnimatedCard>

                {/* Expense Trend */}
                <AnimatedCard index={5}>
                    <GlassCard neon="pink">
                        <SectionHeader icon={<Receipt size={18} color="#ff6b9d" />} title="Expense Trend" chartType="expense_trend" />
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <BarChart data={MOCK_EXPENSE_TREND} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="week" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                                    <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="sploder" name="Sploders" fill="#ff6b9d" radius={[4, 4, 0, 0]} stackId="a" />
                                    <Bar dataKey="fishbowl" name="Fishbowl" fill="#fbbf24" radius={[0, 0, 0, 0]} stackId="a" />
                                    <Bar dataKey="assets" name="Assets" fill="#c084fc" radius={[4, 4, 0, 0]} stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </AnimatedCard>
            </div>

            {/* ── Profit / Loss + Break-Even ── */}
            <AnimatedCard index={6}>
                <GlassCard neon="cyan">
                    <SectionHeader icon={<DollarSign size={18} color="#00f0ff" />} title="Profit / Loss" chartType="profit_loss" />
                    <div style={{ width: '100%', height: 280 }}>
                        <ResponsiveContainer>
                            <ComposedChart data={profitLossData} margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="week" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                                <Tooltip content={<ChartTooltip />} />
                                <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: 'Break Even', fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                                <Bar dataKey="revenue" name="Revenue" fill="rgba(74, 222, 128, 0.3)" stroke="#4ade80" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" name="Expenses" fill="rgba(255, 107, 157, 0.3)" stroke="#ff6b9d" radius={[4, 4, 0, 0]} />
                                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#00f0ff" strokeWidth={2} dot={{ r: 3, fill: '#00f0ff' }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </AnimatedCard>

            {/* ── Bottom row: Crowd Dynamics + Event ROI ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)' }}>
                {/* Crowd Dynamics Scatter */}
                <AnimatedCard index={7}>
                    <GlassCard neon="purple">
                        <SectionHeader icon={<Users size={18} color="#c084fc" />} title="Crowd Dynamics" chartType="crowd_dynamics" />
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer>
                                <ScatterChart margin={{ top: 5, right: 5, bottom: 5, left: -10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="guests" name="Guests" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} />
                                    <YAxis dataKey="tips" name="Tips" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v / 1000}k`} />
                                    <ZAxis range={[40, 200]} />
                                    <Tooltip content={<ScatterTooltip />} />
                                    <Scatter data={MOCK_PEAK_HOURS} fill="#c084fc" fillOpacity={0.6} />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>
                </AnimatedCard>

                {/* Event ROI */}
                <AnimatedCard index={8}>
                    <GlassCard>
                        <SectionHeader icon={<Target size={18} color="#fbbf24" />} title="Event ROI" chartType="event_roi" />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {MOCK_EVENT_ROI.map((e, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: 12,
                                    padding: '10px 12px', borderRadius: 8,
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.04)',
                                }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{e.event}</div>
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            {e.attendees} guests · L${e.cost} cost
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: '#4ade80' }}>
                                            {e.roi}x
                                        </div>
                                        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>ROI</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>
                </AnimatedCard>
            </div>

            {/* ── Expense Log + Add Button ── */}
            <AnimatedCard index={9}>
                <GlassCard>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
                        <h2 style={{
                            fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', fontWeight: 600,
                            color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8,
                            textTransform: 'uppercase', letterSpacing: '0.04em',
                        }}>
                            <Receipt size={18} color="#ff6b9d" /> Expense Log
                        </h2>
                        <button
                            onClick={() => setExpenseModalOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 6,
                                border: '1px solid rgba(0, 240, 255, 0.25)',
                                background: 'rgba(0, 240, 255, 0.06)',
                                color: 'var(--neon-cyan)', fontSize: 12, fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            <Plus size={14} /> Add Expense
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    {['Name', 'Category', 'Amount', 'Date', 'Notes'].map(h => (
                                        <th key={h} style={{
                                            padding: '8px 12px', textAlign: 'left',
                                            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                                            fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em',
                                            fontWeight: 500,
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {MOCK_EXPENSES.map(exp => (
                                    <tr key={exp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                                        <td style={{ padding: '10px 12px', color: 'var(--text-primary)' }}>{exp.name}</td>
                                        <td style={{ padding: '10px 12px' }}>
                                            <span style={{
                                                fontSize: 10, padding: '2px 8px', borderRadius: 4,
                                                background: `${EXPENSE_COLORS[exp.category] || '#00f0ff'}15`,
                                                color: EXPENSE_COLORS[exp.category] || '#00f0ff',
                                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                            }}>
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: '#ff6b9d' }}>L${exp.amount.toLocaleString()}</td>
                                        <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{exp.date}</td>
                                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.notes || '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </GlassCard>
            </AnimatedCard>

            {/* Tip Breakdown Donut */}
            <AnimatedCard index={10}>
                <GlassCard>
                    <SectionHeader icon={<PieChartIcon size={18} color="#00f0ff" />} title="Tip Breakdown" chartType="tip_breakdown" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 260 }}>
                        <ResponsiveContainer width="50%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Club', value: 21000, fill: '#00f0ff' },
                                        { name: 'DJ', value: 16000, fill: '#c084fc' },
                                        { name: 'Host', value: 11200, fill: '#ff6b9d' },
                                    ]}
                                    cx="50%" cy="50%"
                                    innerRadius={50} outerRadius={80}
                                    paddingAngle={4}
                                    dataKey="value"
                                >
                                    {[
                                        { fill: '#00f0ff' },
                                        { fill: '#c084fc' },
                                        { fill: '#ff6b9d' },
                                    ].map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Legend
                                    verticalAlign="bottom"
                                    formatter={(value: string) => <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{value}</span>}
                                />
                                <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>
            </AnimatedCard>

            <AddExpenseModal open={expenseModalOpen} onClose={() => setExpenseModalOpen(false)} />
        </div>
    );
}
