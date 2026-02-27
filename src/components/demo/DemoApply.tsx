'use client';

import React, { useState } from 'react';
import { Headphones, Mic, Send, Check, Loader2, Music, Globe, Sparkles, FileText, Link, ArrowRight, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';

type RoleChoice = 'dj' | 'host' | 'both';
type Step = 1 | 2 | 3 | 4;

const ROLE_OPTIONS: { value: RoleChoice; label: string; icon: React.ReactNode; description: string; color: string }[] = [
    { value: 'dj', label: 'DJ', icon: <Headphones size={28} />, description: 'Spin tracks & set the vibe', color: '#00f0ff' },
    { value: 'host', label: 'Host', icon: <Mic size={28} />, description: 'Engage, entertain & keep the energy up', color: '#c084fc' },
    { value: 'both', label: 'DJ + Host', icon: <><Headphones size={22} /><Mic size={22} /></>, description: 'Double threat — do it all', color: '#ff6b9d' },
];

export default function DemoApplyView() {
    const [step, setStep] = useState<Step>(1);
    const [role, setRole] = useState<RoleChoice | null>(null);
    const [slDisplayName, setSlDisplayName] = useState('');
    const [agentName, setAgentName] = useState('');
    const [slUuid, setSlUuid] = useState('');
    const [usesVoice, setUsesVoice] = useState<boolean | null>(null);
    const [discordUsername, setDiscordUsername] = useState('');
    const [experience, setExperience] = useState('');
    const [genres, setGenres] = useState('');
    const [availability, setAvailability] = useState('');
    const [timezone, setTimezone] = useState('');
    const [aboutYou, setAboutYou] = useState('');
    const [sampleLink, setSampleLink] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error] = useState('');

    const canAdvance = (s: Step) => {
        if (s === 1) return !!role;
        if (s === 2) return !!slDisplayName && !!agentName && !!slUuid && usesVoice !== null;
        return true;
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        // Simulate a network request
        await new Promise(resolve => setTimeout(resolve, 800));
        setSubmitting(false);
        setSubmitted(true);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%', padding: '14px 16px', borderRadius: 12,
        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
        color: 'var(--text-primary)', fontSize: 15, outline: 'none',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        fontFamily: 'var(--font-body)',
    };

    const labelStyle: React.CSSProperties = {
        fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.08em',
        marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
    };

    if (submitted) {
        return (
            <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                minHeight: '70vh', gap: 20, textAlign: 'center', padding: '0 20px',
            }}>
                <div style={{
                    width: 80, height: 80, borderRadius: 24,
                    background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(0,240,255,0.15))',
                    border: '1px solid rgba(74,222,128,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 30px rgba(74,222,128,0.15)',
                }}>
                    <Check size={36} color="#4ade80" strokeWidth={3} />
                </div>
                <h1 style={{
                    fontSize: 28, fontWeight: 700, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                }}>Application Submitted!</h1>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.6 }}>
                    Your application has been pushed directly into the club's Discord server. The management team will review it and grant you immediate platform access if approved!
                </p>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    marginTop: 8, padding: '12px 20px', borderRadius: 12,
                    background: 'rgba(88,101,242,0.15)', border: '1px solid rgba(88,101,242,0.3)',
                    color: '#a5b4fc', fontSize: 13, fontFamily: 'var(--font-mono)',
                    boxShadow: '0 0 15px rgba(88,101,242,0.1)'
                }}>
                    <AlertCircle size={16} color="#a5b4fc" /> Notification pinged in #applications
                </div>
                <button onClick={() => { setSubmitted(false); setStep(1); }} style={{ marginTop: 20, padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, cursor: 'pointer' }}>Start Over</button>
            </div>
        );
    }

    return (
        <div style={{
            display: 'flex', flexDirection: 'column', gap: 24,
            maxWidth: 560, margin: '0 auto', padding: '24px 4px',
            overflowY: 'auto'
        }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
                <h1 style={{
                    fontSize: 28, fontWeight: 700, color: 'var(--text-primary)',
                    fontFamily: 'var(--font-display)',
                    background: 'linear-gradient(135deg, #00f0ff, #c084fc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    Aesthetic Recruitment Form
                </h1>
                <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.5 }}>
                    Ditch reading SL Notecards. Applicants fill out an elegant web flow that injects their data straight into your Discord and management dashboard.
                </p>
            </div>

            {/* Progress steps */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                {[1, 2, 3, 4].map(s => (
                    <div key={s} style={{
                        width: s <= step ? 40 : 24, height: 4, borderRadius: 2,
                        background: s <= step
                            ? 'linear-gradient(90deg, var(--neon-cyan), var(--neon-purple))'
                            : 'rgba(255,255,255,0.08)',
                        transition: 'all 0.3s ease',
                    }} />
                ))}
            </div>

            {/* Step 1: Role Selection */}
            {step === 1 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ ...labelStyle, justifyContent: 'center', fontSize: 14 }}>
                        <Sparkles size={16} color="var(--neon-cyan)" /> What position are you interested in?
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {ROLE_OPTIONS.map(opt => {
                            const selected = role === opt.value;
                            return (
                                <button key={opt.value} onClick={() => setRole(opt.value)} style={{
                                    display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
                                    borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                                    background: selected ? `${opt.color}08` : 'rgba(255,255,255,0.02)',
                                    border: `2px solid ${selected ? opt.color : 'rgba(255,255,255,0.06)'}`,
                                    boxShadow: selected ? `0 0 20px ${opt.color}15` : 'none',
                                    transition: 'all 0.2s ease',
                                }}>
                                    <div style={{
                                        width: 52, height: 52, borderRadius: 14,
                                        background: `${opt.color}12`,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                        color: opt.color, flexShrink: 0,
                                    }}>
                                        {opt.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: 16, fontWeight: 700, color: selected ? opt.color : 'var(--text-primary)' }}>{opt.label}</div>
                                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{opt.description}</div>
                                    </div>
                                    {selected && <Check size={20} style={{ marginLeft: 'auto', color: opt.color }} />}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Step 2: Identity */}
            {step === 2 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...labelStyle, justifyContent: 'center', fontSize: 14, marginBottom: 4 }}>
                        Tell us about yourself
                    </div>
                    <div>
                        <label style={labelStyle}>SL Display Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input value={slDisplayName} onChange={e => setSlDisplayName(e.target.value)}
                            placeholder="Your Second Life display name" style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Agent Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input value={agentName} onChange={e => setAgentName(e.target.value)}
                            placeholder="e.g. Nova Resident" style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>SL UUID <span style={{ color: '#ef4444' }}>*</span></label>
                        <input value={slUuid} onChange={e => setSlUuid(e.target.value)}
                            placeholder="e.g. a1b2c3d4-e5f6-7890-abcd..." style={inputStyle}
                        />
                    </div>

                    {/* Voice toggle */}
                    <div>
                        <label style={labelStyle}>Do you use Voice? <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ display: 'flex', gap: 10 }}>
                            {[
                                { val: true, label: 'Yes', icon: <Volume2 size={18} />, color: '#4ade80' },
                                { val: false, label: 'No', icon: <VolumeX size={18} />, color: '#fbbf24' },
                            ].map(opt => {
                                const selected = usesVoice === opt.val;
                                return (
                                    <button key={opt.label} onClick={() => setUsesVoice(opt.val)} style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        padding: '14px 16px', borderRadius: 12, cursor: 'pointer',
                                        background: selected ? `${opt.color}10` : 'rgba(255,255,255,0.02)',
                                        border: `2px solid ${selected ? opt.color : 'rgba(255,255,255,0.06)'}`,
                                        color: selected ? opt.color : 'var(--text-muted)',
                                        fontWeight: selected ? 700 : 400, fontSize: 14,
                                        transition: 'all 0.2s ease',
                                    }}>
                                        {opt.icon} {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div>
                        <label style={labelStyle}>Discord Username <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none', letterSpacing: '0' }}>(optional)</span></label>
                        <input value={discordUsername} onChange={e => setDiscordUsername(e.target.value)}
                            placeholder="e.g. djnova" style={inputStyle}
                        />
                    </div>
                </div>
            )}

            {/* Step 3: Experience */}
            {step === 3 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...labelStyle, justifyContent: 'center', fontSize: 14, marginBottom: 4 }}>
                        Your experience & skills
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}><Globe size={12} /> Timezone</label>
                            <input value={timezone} onChange={e => setTimezone(e.target.value)}
                                placeholder="e.g. EST, SLT" style={inputStyle}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={labelStyle}>Availability</label>
                            <input value={availability} onChange={e => setAvailability(e.target.value)}
                                placeholder="e.g. Weekends" style={inputStyle}
                            />
                        </div>
                    </div>
                    <div>
                        <label style={labelStyle}><Music size={12} /> {role === 'host' ? 'Hosting' : 'DJ'} Experience</label>
                        <textarea value={experience} onChange={e => setExperience(e.target.value)}
                            placeholder={role === 'host'
                                ? 'Tell us about your hosting experience...'
                                : 'Tell us about your DJ experience...'}
                            rows={4} style={{ ...inputStyle, resize: 'vertical', minHeight: 100 }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}><Headphones size={12} /> Genres / Specialties</label>
                        <input value={genres} onChange={e => setGenres(e.target.value)}
                            placeholder="e.g. House, Techno" style={inputStyle}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}><Link size={12} /> Sample Mix / Portfolio (optional)</label>
                        <input value={sampleLink} onChange={e => setSampleLink(e.target.value)}
                            placeholder="https://soundcloud.com/your-mix" style={inputStyle}
                        />
                    </div>
                </div>
            )}

            {/* Step 4: Review & Submit */}
            {step === 4 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ ...labelStyle, justifyContent: 'center', fontSize: 14, marginBottom: 4 }}>
                        Review your application details
                    </div>
                    <div>
                        <label style={labelStyle}><FileText size={12} /> About You (optional)</label>
                        <textarea value={aboutYou} onChange={e => setAboutYou(e.target.value)}
                            placeholder="Anything else you'd like us to know?"
                            rows={3} style={{ ...inputStyle, resize: 'vertical' }}
                        />
                    </div>

                    {/* Review summary */}
                    <GlassCard style={{ padding: 16 }}>
                        <div style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 10 }}>Review</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 13 }}>
                            <div style={{ gridColumn: '1 / -1' }}><span style={{ color: 'var(--text-muted)' }}>Role:</span> <strong style={{ color: ROLE_OPTIONS.find(r => r.value === role)?.color }}>{ROLE_OPTIONS.find(r => r.value === role)?.label}</strong></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>Voice:</span> <strong style={{ color: usesVoice ? '#4ade80' : '#fbbf24' }}>{usesVoice ? 'Yes' : 'No'}</strong></div>
                            <div><span style={{ color: 'var(--text-muted)' }}>SL Name:</span> <strong>{slDisplayName || 'Applicant'}</strong></div>
                        </div>
                    </GlassCard>

                    {error && (
                        <div style={{
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                            color: '#ef4444', fontSize: 12,
                        }}>{error}</div>
                    )}
                </div>
            )}

            {/* Navigation buttons */}
            <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                {step > 1 && (
                    <button onClick={() => setStep((step - 1) as Step)} style={{
                        flex: 1, padding: 14, borderRadius: 12,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)',
                        color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500, cursor: 'pointer',
                    }}>
                        Back
                    </button>
                )}
                {step < 4 ? (
                    <button onClick={() => setStep((step + 1) as Step)} disabled={!canAdvance(step)} style={{
                        flex: 2, padding: 14, borderRadius: 12,
                        background: canAdvance(step)
                            ? 'linear-gradient(135deg, rgba(0,240,255,0.15), rgba(192,132,252,0.15))'
                            : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${canAdvance(step) ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
                        color: canAdvance(step) ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        fontSize: 14, fontWeight: 600, cursor: canAdvance(step) ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        transition: 'all 0.2s ease',
                    }}>
                        Continue <ArrowRight size={16} />
                    </button>
                ) : (
                    <button onClick={handleSubmit} disabled={submitting} style={{
                        flex: 2, padding: 14, borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(74,222,128,0.15), rgba(0,240,255,0.15))',
                        border: '1px solid rgba(74,222,128,0.3)',
                        color: '#4ade80', fontSize: 14, fontWeight: 700, cursor: submitting ? 'wait' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        opacity: submitting ? 0.6 : 1,
                        boxShadow: '0 0 20px rgba(74,222,128,0.1)',
                    }}>
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        {submitting ? 'Authenticating...' : 'Submit Application'}
                    </button>
                )}
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } } .animate-spin { animation: spin 1s linear infinite; }`}</style>
        </div>
    );
}
