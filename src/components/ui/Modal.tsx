'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    open: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    maxWidth?: number | string;
}

export default function Modal({ open, onClose, children, title, maxWidth = 500 }: ModalProps) {
    const [mounted, setMounted] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (open) {
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
            setTimeout(() => setAnimate(true), 10);
        } else {
            setAnimate(false);
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!mounted || !open) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(5, 5, 10, 0.65)',
                    backdropFilter: 'blur(8px)',
                    opacity: animate ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Modal Container */}
            <div
                style={{
                    position: 'relative',
                    width: '100%', maxWidth: maxWidth,
                    maxHeight: '90dvh', // Dynamic Viewport Height
                    display: 'flex', flexDirection: 'column',
                    background: 'rgba(15, 15, 30, 0.95)',
                    border: '1px solid var(--glass-border)',
                    borderRadius: 24,
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    transform: animate ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
                    opacity: animate ? 1 : 0,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                    overflow: 'hidden', // Contain scrolling children
                    margin: 16,
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '20px 24px',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    flexShrink: 0, // Don't shrink header
                }}>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%',
                            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-muted)', cursor: 'pointer', transition: 'all 0.2s',
                        }}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div style={{
                    padding: 24,
                    overflowY: 'auto',
                    WebkitOverflowScrolling: 'touch', // Smooth scroll on iOS
                }}>
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
