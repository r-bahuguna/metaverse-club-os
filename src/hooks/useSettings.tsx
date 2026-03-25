'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

/* ── Types ── */
export interface SettingsData {
    darkMode: boolean;
    animations: boolean;
    sounds: boolean;
}

interface SettingsContextValue extends SettingsData {
    update: (key: keyof SettingsData, value: boolean) => void;
    playSound: (type: SoundType) => void;
}

type SoundType = 'click' | 'tip' | 'notification' | 'toggle' | 'success';

const STORAGE_KEY = 'mcos-settings';

const DEFAULTS: SettingsData = {
    darkMode: true,
    animations: true,
    sounds: false,
};

const SettingsContext = createContext<SettingsContextValue>({
    ...DEFAULTS,
    update: () => { },
    playSound: () => { },
});

export function useSettings() {
    return useContext(SettingsContext);
}

/* ── Synth Sound Engine (Web Audio API) ── */
function createSoundPlayer() {
    let ctx: AudioContext | null = null;

    function getCtx() {
        if (!ctx) ctx = new AudioContext();
        return ctx;
    }

    const SOUNDS: Record<SoundType, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
        click: { freq: 800, duration: 0.06, type: 'sine', gain: 0.15 },
        toggle: { freq: 600, duration: 0.08, type: 'triangle', gain: 0.12 },
        tip: { freq: 1200, duration: 0.15, type: 'sine', gain: 0.2 },
        notification: { freq: 440, duration: 0.2, type: 'triangle', gain: 0.18 },
        success: { freq: 880, duration: 0.25, type: 'sine', gain: 0.15 },
    };

    return function play(type: SoundType) {
        try {
            const c = getCtx();
            const s = SOUNDS[type];
            const osc = c.createOscillator();
            const g = c.createGain();

            osc.type = s.type;
            osc.frequency.setValueAtTime(s.freq, c.currentTime);

            // Add a slight pitch sweep for a more pleasing tone
            if (type === 'tip' || type === 'success') {
                osc.frequency.exponentialRampToValueAtTime(s.freq * 1.5, c.currentTime + s.duration * 0.5);
            }

            g.gain.setValueAtTime(s.gain, c.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + s.duration);

            osc.connect(g);
            g.connect(c.destination);
            osc.start(c.currentTime);
            osc.stop(c.currentTime + s.duration);
        } catch {
            // Web Audio not available — silent fail
        }
    };
}

/* ── Provider ── */
export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SettingsData>(DEFAULTS);
    const [mounted, setMounted] = useState(false);
    const soundPlayer = useRef(createSoundPlayer());

    /* Load from localStorage on mount */
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const saved = JSON.parse(raw) as Partial<SettingsData>;
                setSettings(prev => ({ ...prev, ...saved }));
            }
        } catch { /* ignore */ }
        setMounted(true);
    }, []);

    /* Apply data attributes to <html> whenever settings change */
    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;

        // Theme
        if (settings.darkMode) {
            root.removeAttribute('data-theme');
        } else {
            root.setAttribute('data-theme', 'light');
        }

        // Animations
        if (settings.animations) {
            root.removeAttribute('data-reduced-motion');
        } else {
            root.setAttribute('data-reduced-motion', 'true');
        }
    }, [settings.darkMode, settings.animations, mounted]);

    /* Persist to localStorage on change */
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }, [settings, mounted]);

    const update = useCallback((key: keyof SettingsData, value: boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    }, []);

    const playSound = useCallback((type: SoundType) => {
        if (settings.sounds) {
            soundPlayer.current(type);
        }
    }, [settings.sounds]);

    return (
        <SettingsContext.Provider value={{ ...settings, update, playSound }}>
            {children}
        </SettingsContext.Provider>
    );
}
