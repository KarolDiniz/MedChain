import { useEffect, useState, useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';
import { motion } from 'framer-motion';

export function AnimatedCounter({ value, duration = 1.2, ...props }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView) return;
    if (prefersReducedMotion) {
      setCount(Number(value) || 0);
      return;
    }
    const end = Number(value) || 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      const current = Math.floor(eased * end);
      setCount(current);
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [value, duration, isInView, prefersReducedMotion]);

  const displayValue = prefersReducedMotion ? (Number(value) || 0) : count;

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {displayValue}
    </motion.span>
  );
}
