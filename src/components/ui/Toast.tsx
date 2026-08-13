import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { Toast } from '../../types';
import { useStore } from '../../lib/store';

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'text-green-500 bg-green-50/80 dark:bg-green-900/30 border-green-200/50 dark:border-green-800/50',
  error: 'text-red-500 bg-red-50/80 dark:bg-red-900/30 border-red-200/50 dark:border-red-800/50',
  warning: 'text-amber-500 bg-amber-50/80 dark:bg-amber-900/30 border-amber-200/50 dark:border-amber-800/50',
  info: 'text-blue-500 bg-blue-50/80 dark:bg-blue-900/30 border-blue-200/50 dark:border-blue-800/50',
};

interface ToastComponentProps {
  toast: Toast;
  onClose: (id: string) => void;
}

export function ToastComponent({ toast, onClose }: ToastComponentProps) {
  const Icon = icons[toast.type];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 100, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'glass-card p-4 gap-3 min-w-[300px] max-w-md shadow-glow-lg',
          colors[toast.type],
          'border'
        )}
        role="alert"
        aria-live="polite"
      >
        <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary dark:text-text-dark-primary">{toast.title}</p>
          {toast.message && (
            <p className="mt-0.5 text-body-sm text-text-secondary dark:text-text-dark-secondary">
              {toast.message}
            </p>
          )}
        </div>
        {toast.action && (
          <button
            onClick={() => { toast.action!.onClick(); onClose(toast.id); }}
            className="flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-500/10 text-primary-700 dark:text-primary-300 hover:bg-primary-500/20 transition-colors"
          >
            {toast.action.label}
          </button>
        )}
        <button
          onClick={() => onClose(toast.id)}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-text-muted/50 dark:text-text-dark-muted/50" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

export function ToastContainer() {
  const { ui, removeToast } = useStore();

  return (
    <AnimatePresence mode="popLayout">
      <div className="fixed bottom-4 right-4 z-toast flex flex-col gap-2 pointer-events-none" aria-live="polite" aria-label="Notifications">
        {ui.toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastComponent toast={toast} onClose={removeToast} />
          </div>
        ))}
      </div>
    </AnimatePresence>
  );
}

// Toaster component for App.tsx
export function Toaster() {
  return <ToastContainer />;
}