'use client';

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

interface ParallaxSectionProps {
    children: React.ReactNode;
    speed?: number;       // parallax speed: 0 = fixed, 1 = normal scroll, <1 = slower
    className?: string;
    style?: React.CSSProperties;
}

export default function ParallaxSection({
    children,
    speed = 0.5,
    className,
    style,
}: ParallaxSectionProps) {
    const ref = useRef<HTMLDivElement>(null);

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });

    const y = useTransform(scrollYProgress, [0, 1], [0, (1 - speed) * -80]);
    const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.6, 1, 1, 0.6]);

    return (
        <motion.div
            ref={ref}
            style={{ y, opacity, ...style }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
