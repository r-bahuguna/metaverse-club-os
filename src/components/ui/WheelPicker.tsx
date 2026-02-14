'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import styles from './WheelPicker.module.css';

export interface WheelPickerItem {
    label: string;
    value: string;
}

interface WheelPickerProps {
    items: (string | WheelPickerItem)[];
    value: string;
    onChange: (value: string) => void;
    height?: number;
    itemHeight?: number;
}

export default function WheelPicker({
    items,
    value,
    onChange,
    height = 120,
    itemHeight = 32,
}: WheelPickerProps) {
    const scrollerRef = useRef<HTMLDivElement>(null);

    // Normalize items to objects
    const normalizedItems = useMemo(() => items.map(i =>
        typeof i === 'string' ? { label: i, value: i } : i
    ), [items]);

    // Initial scroll position
    useEffect(() => {
        if (scrollerRef.current) {
            const index = normalizedItems.findIndex(i => i.value === value);
            if (index !== -1) {
                scrollerRef.current.scrollTop = index * itemHeight;
            }
        }
    }, [itemHeight, normalizedItems, value]);

    // Handle scroll events
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        let timeout: NodeJS.Timeout;

        const onScroll = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const scrollTop = scroller.scrollTop;
                const index = Math.round(scrollTop / itemHeight);
                const clampedIndex = Math.min(Math.max(index, 0), normalizedItems.length - 1);
                const selectedItem = normalizedItems[clampedIndex];

                if (selectedItem && selectedItem.value !== value) {
                    onChange(selectedItem.value);
                }
            }, 100); // 100ms debounce
        };

        scroller.addEventListener('scroll', onScroll);
        return () => {
            scroller.removeEventListener('scroll', onScroll);
            clearTimeout(timeout);
        };
    }, [normalizedItems, value, onChange, itemHeight]);

    return (
        <div className={styles.wheelPicker} style={{ height }}>
            <div className={styles.highlight} style={{ height: itemHeight }} />
            <div
                ref={scrollerRef}
                className={styles.scroller}
                style={{
                    paddingTop: (height - itemHeight) / 2,
                    paddingBottom: (height - itemHeight) / 2
                }}
            >
                {normalizedItems.map((item, i) => (
                    <div
                        key={item.value + i}
                        className={`${styles.item} ${item.value === value ? styles.itemActive : ''}`}
                        style={{ height: itemHeight }}
                        onClick={() => {
                            if (scrollerRef.current) {
                                scrollerRef.current.scrollTo({
                                    top: i * itemHeight,
                                    behavior: 'smooth'
                                });
                            }
                        }}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
