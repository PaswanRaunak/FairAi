/**
 * FairLens AI — Animated Counter
 * Counts up to a target value with animation.
 */

import { useState, useEffect, useRef } from 'react';

export default function AnimatedCounter({ value, duration = 1500, decimals = 0, suffix = '', prefix = '' }) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTime = useRef(null);
  const animationFrame = useRef(null);

  useEffect(() => {
    const targetValue = parseFloat(value) || 0;
    const startValue = 0;

    const animate = (timestamp) => {
      if (!startTime.current) startTime.current = timestamp;
      const progress = Math.min((timestamp - startTime.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease-out cubic
      const current = startValue + (targetValue - startValue) * eased;
      setDisplayValue(current);

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      }
    };

    startTime.current = null;
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [value, duration]);

  return (
    <span>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
}
