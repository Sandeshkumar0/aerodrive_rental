import { motion } from 'framer-motion';

export default function GlowCard({ children, className = '' }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`relative group rounded-2xl glass-panel p-8 ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-violet-500 rounded-2xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500"></div>
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
