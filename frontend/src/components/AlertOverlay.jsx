import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function AlertOverlay({ active, type, message }) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-50 pointer-events-none flex items-center justify-center bg-red-950/40 border-8 border-red-600 animate-pulse"
        >
          <div className="bg-red-600 text-white px-8 py-4 rounded-2xl flex items-center space-x-4 shadow-[0_0_100px_rgba(220,38,38,0.8)] animate-shake">
            <AlertTriangle className="w-12 h-12" />
            <div>
              <div className="font-black text-3xl tracking-tighter uppercase">{type}</div>
              <div className="text-xl font-medium">{message}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
