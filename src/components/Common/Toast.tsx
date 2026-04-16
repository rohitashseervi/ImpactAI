import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onClose: () => void;
}

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-success" />,
  error: <AlertCircle className="w-4 h-4 text-danger" />,
  info: <Info className="w-4 h-4 text-primary" />,
};

export default function Toast({ message, type = 'info', visible, onClose }: ToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-white border border-border px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium"
        >
          {icons[type]}
          {message}
          <button onClick={onClose} className="ml-2 text-slate hover:text-ink">
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
