import { useEffect, useState, useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

export function AnimatedCounter({ value, duration = 1.2, ...props }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-30px' });
  const prefersReducedMotion = useReducedMotion();
  const end = Number(value) || 0;

  useEffect(() => {
    if (!isInView) return undefined;

    let frameId;
    if (prefersReducedMotion) {
      // Evita setState síncrono no efeito (regra react-hooks/set-state-in-effect).
      frameId = requestAnimationFrame(() => setCount(end));
      return () => cancelAnimationFrame(frameId);
    }

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = (currentTime - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3; // ease-out cubic
      setCount(Math.floor(eased * end));
      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [end, duration, isInView, prefersReducedMotion]);

  const displayValue = prefersReducedMotion ? end : count;

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
