import { useEffect, useState } from 'react';
import { useInView } from 'framer-motion';
import { useRef } from 'react';

export default function AnimatedCounter({ value, text, prefix = "", suffix = "" }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  useEffect(() => {
    if (isInView) {
      let start = 0;
      const duration = 2000;
      const increment = value / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= value) {
          setCount(value);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);
      return () => clearInterval(timer);
    }
  }, [value, isInView]);

  return (
    <div ref={ref} className="text-center">
      <div className="text-4xl md:text-5xl font-black font-display text-white mb-2 tracking-tighter">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-zinc-500 font-medium">{text}</div>
    </div>
  );
}
