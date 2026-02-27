'use client';

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
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
    const isUserScrollingRef = useRef(false);
    const programmaticScrollRef = useRef(false);
    const lastValueRef = useRef(value);

    // Normalize items to objects
    const normalizedItems = useMemo(() => items.map(i =>
        typeof i === 'string' ? { label: i, value: i } : i
    ), [items]);

    // Scroll to the correct position when value changes FROM OUTSIDE (not from user scroll)
    useEffect(() => {
        if (isUserScrollingRef.current) return; // Don't fight user's scroll
        if (value === lastValueRef.current) return; // No change
        lastValueRef.current = value;

        if (scrollerRef.current) {
            const index = normalizedItems.findIndex(i => i.value === value);
            if (index !== -1) {
                programmaticScrollRef.current = true;
                scrollerRef.current.scrollTo({
                    top: index * itemHeight,
                    behavior: 'smooth'
                });
                // Reset flag after animation
                setTimeout(() => { programmaticScrollRef.current = false; }, 300);
            }
        }
    }, [value, normalizedItems, itemHeight]);

    // Initial position (no animation)
    useEffect(() => {
        if (scrollerRef.current) {
            const index = normalizedItems.findIndex(i => i.value === value);
            if (index !== -1) {
                scrollerRef.current.scrollTop = index * itemHeight;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Only on mount

    // Handle scroll events with proper debounce
    useEffect(() => {
        const scroller = scrollerRef.current;
        if (!scroller) return;

        let timeout: NodeJS.Timeout;
        let scrollEndTimeout: NodeJS.Timeout;

        const onScrollStart = () => {
            if (!programmaticScrollRef.current) {
                isUserScrollingRef.current = true;
            }
        };

        const onScroll = () => {
            onScrollStart();
            clearTimeout(timeout);
            clearTimeout(scrollEndTimeout);

            timeout = setTimeout(() => {
                const scrollTop = scroller.scrollTop;
                const index = Math.round(scrollTop / itemHeight);
                const clampedIndex = Math.min(Math.max(index, 0), normalizedItems.length - 1);
                const selectedItem = normalizedItems[clampedIndex];

                // Snap to nearest item
                scroller.scrollTo({
                    top: clampedIndex * itemHeight,
                    behavior: 'smooth'
                });

                if (selectedItem && selectedItem.value !== lastValueRef.current) {
                    lastValueRef.current = selectedItem.value;
                    onChange(selectedItem.value);
                }

                // Mark user scrolling as done after snap animation
                scrollEndTimeout = setTimeout(() => {
                    isUserScrollingRef.current = false;
                }, 200);
            }, 80);
        };

        scroller.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            scroller.removeEventListener('scroll', onScroll);
            clearTimeout(timeout);
            clearTimeout(scrollEndTimeout);
        };
    }, [normalizedItems, onChange, itemHeight]);

    const handleItemClick = useCallback((index: number) => {
        if (scrollerRef.current) {
            programmaticScrollRef.current = true;
            isUserScrollingRef.current = false;
            scrollerRef.current.scrollTo({
                top: index * itemHeight,
                behavior: 'smooth'
            });
            const item = normalizedItems[index];
            if (item) {
                lastValueRef.current = item.value;
                onChange(item.value);
            }
            setTimeout(() => { programmaticScrollRef.current = false; }, 300);
        }
    }, [itemHeight, normalizedItems, onChange]);

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
                        onClick={() => handleItemClick(i)}
                    >
                        {item.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
