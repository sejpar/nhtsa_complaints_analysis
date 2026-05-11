'use client';
import { useEffect, useRef } from 'react';
import styles from './Cursor.module.css';

export default function Cursor() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.left = e.clientX + 'px';
      el.style.top  = e.clientY + 'px';
    };
    const expand = () => el.classList.add(styles.expand);
    const shrink = () => el.classList.remove(styles.expand);

    document.addEventListener('mousemove', move);
    document.querySelectorAll('button, a, .filter-option').forEach((node) => {
      node.addEventListener('mouseenter', expand);
      node.addEventListener('mouseleave', shrink);
    });

    return () => {
      document.removeEventListener('mousemove', move);
    };
  }, []);

  return <div ref={ref} className={styles.cursor} />;
}
