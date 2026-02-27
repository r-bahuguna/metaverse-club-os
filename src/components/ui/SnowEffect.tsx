'use client';

import React from 'react';
import styles from './SnowEffect.module.css';

export function SnowEffect() {
    return (
        <div className={styles.particles}>
            {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className={styles.particle} />
            ))}
        </div>
    );
}
