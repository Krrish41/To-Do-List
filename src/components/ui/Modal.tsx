import { Fragment, ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useFocusTrap, useClickOutside } from '../../lib/hooks';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const focusTrapRef = useFocusTrap(isOpen);
  const overlayRef = useClickOutside(onClose, closeOnOverlayClick);

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-4xl',
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!closeOnEscape) return;
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, closeOnEscape]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        ref={overlayRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-modal bg-black/40 dark:bg-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />
    </AnimatePresence>
  );

  const modalDialog = (
    <AnimatePresence>
      <motion.div
        ref={el => { modalRef.current = el; focusTrapRef.current = el; }}
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed inset-0 z-modal flex items-center justify-center p-4',
          'pointer-events-none'
        )}
      >
        <div
          ref={focusTrapRef}
          className={cn(
            'glass-card w-full pointer-events-auto animate-slide-up',
            sizes[size],
            className
          )}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-body-sm text-text-muted dark:text-text-dark-muted">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-icon p-1.5 rounded-lg shrink-0"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}
          <div className="max-h-[70vh] overflow-y-auto">
            {children}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(
    <Fragment>{modalContent}{modalDialog}</Fragment>,
    document.body
  );
}

// Confirmation dialog
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'primary';
  loading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  loading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-body text-text-secondary dark:text-text-dark-secondary mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button type="button" onClick={onClose} className="btn-secondary" disabled={loading}>
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={variant === 'danger' ? 'btn-danger' : 'btn-primary'}
          disabled={loading}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}

// Form modal with automatic focus management
interface FormModalProps extends Omit<ModalProps, 'children'> {
  onSubmit: (data: FormData) => Promise<void>;
  children: (close: () => void) => ReactNode;
  submitText?: string;
  loading?: boolean;
}

export function FormModal({ onSubmit, children, submitText = 'Save', loading = false, ...props }: FormModalProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const submitButtonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(formRef.current!);
    await onSubmit(formData);
  };

  const close = () => props.onClose();

  return (
    <Modal {...props}>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {children(close)}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-light/50 dark:border-border-dark/50 mt-6">
          <button type="button" onClick={close} className="btn-secondary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" ref={submitButtonRef} className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : submitText}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Need to import btn-danger class or define it
// We'll use inline styles for danger variant