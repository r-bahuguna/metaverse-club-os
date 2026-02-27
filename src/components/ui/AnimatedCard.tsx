'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface AnimatedCardProps {
    children: React.ReactNode;
    index?: number;
    className?: string;
    style?: React.CSSProperties;
}

export default function AnimatedCard({ children, index = 0, className, style }: AnimatedCardProps) {
    const shouldReduceMotion = useReducedMotion();

    /* If animations are disabled, render a plain div */
    if (shouldReduceMotion) {
        return (
            <div className={className} style={style}>
                {children}
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
                duration: 0.4,
                delay: index * 0.06,
                ease: [0.16, 1, 0.3, 1] as const,
            }}
            whileHover={{
                y: -2,
                transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] as const },
            }}
            className={className}
            style={style}
        >
            {children}
        </motion.div>
    );
}
