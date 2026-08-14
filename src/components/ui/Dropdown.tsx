import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { ChevronDown, Check } from 'lucide-react';
import { useClickOutside } from '../../lib/hooks';

interface DropdownItem {
  label: string;
  value: string;
  icon?: ReactNode;
  shortcut?: string;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'left', className }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickOutsideRef = useClickOutside(() => setIsOpen(false), isOpen);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className={cn('relative inline-block', className)} ref={clickOutsideRef}>
      <div>{trigger}</div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'glass-card absolute z-popover mt-1.5 min-w-[180px] py-1.5 animate-slide-down',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {items.map((item, index) => (
              item.divider ? (
                <div key={`divider-${index}`} className="border-t border-border-light/50 dark:border-border-dark/50 my-1" role="separator" />
              ) : (
                <button
                  key={item.value}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={() => {
                    item.onClick?.();
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors',
                    'hover:bg-primary-50/50 dark:hover:bg-primary-900/20',
                    item.disabled && 'opacity-40 cursor-not-allowed',
                    item.danger && 'text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20'
                  )}
                  tabIndex={-1}
                >
                  {item.icon && <span className="flex-shrink-0 w-5 h-5">{item.icon}</span>}
                  <span className="truncate flex-1">{item.label}</span>
                  {item.shortcut && (
                    <kbd className="text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">
                      {item.shortcut}
                    </kbd>
                  )}
                </button>
              )
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Select-style dropdown
interface SelectDropdownProps {
  value: string;
  placeholder?: string;
  options: Array<{ value: string; label: string; icon?: ReactNode; disabled?: boolean }>;
  onChange: (value: string) => void;
  label?: string;
  error?: string;
  className?: string;
  searchable?: boolean;
}

export function SelectDropdown({
  value,
  placeholder = 'Select...',
  options,
  onChange,
  label,
  error,
  className,
  searchable = false,
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const clickOutsideRef = useClickOutside(() => setIsOpen(false), isOpen);

  const selectedOption = options.find(opt => opt.value === value);
  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className={cn('w-full', className)} ref={clickOutsideRef}>
      {label && <label className="label-text">{label}</label>}
      <button
        ref={buttonRef}
        type="button"
        className={cn(
          'input-field text-left justify-between',
          error && 'border-red-400/50 focus:border-red-400 focus:ring-red-500/20'
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={label}
        onClick={() => { setIsOpen(!isOpen); setSearchQuery(''); }}
        onKeyDown={handleKeyDown}
      >
        <span className={cn('truncate', !selectedOption && 'text-text-muted/50 dark:text-text-dark-muted/50')}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={cn('w-4 h-4 text-text-muted/50 dark:text-text-dark-muted/50 flex-shrink-0 transition-transform', isOpen && 'rotate-180')} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-card absolute z-popover w-full mt-1.5 max-h-60 overflow-y-auto"
            role="listbox"
            aria-label={label}
          >
            {searchable && (
              <input
                type="text"
                placeholder="Search..."
                className="input-field m-3 mb-2"
                value={searchQuery}
                onChange={(e) => { e.stopPropagation(); setSearchQuery(e.target.value); }}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            )}
            <div className="py-1.5">
              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  onClick={(e) => { e.stopPropagation(); onChange(option.value); setIsOpen(false); }}
                  className={cn(
                    'w-full px-3 py-2.5 text-left flex items-center gap-3 transition-colors',
                    option.value === value
                      ? 'bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/20',
                    option.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                  tabIndex={-1}
                >
                  {option.icon && <span className="flex-shrink-0 w-5 h-5">{option.icon}</span>}
                  <span className="truncate flex-1">{option.label}</span>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-primary-500 flex-shrink-0 ml-auto" />
                  )}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <p className="px-3 py-4 text-center text-text-muted/50 dark:text-text-dark-muted/50">
                  No options found
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && <p className="mt-1.5 text-sm text-red-500" role="alert">{error}</p>}
    </div>
  );
}