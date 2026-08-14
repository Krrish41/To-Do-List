import { forwardRef, type SelectHTMLAttributes, useId, useState, useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';
import { ChevronDown } from 'lucide-react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  icon?: React.ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, onChange, icon, className, id, ...props }, ref) => {
    const selectId = useId();
    const inputId = id || selectId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="label-text">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted/50 dark:text-text-dark-muted/50 pointer-events-none">
              {icon}
            </div>
          )}
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'input-field appearance-none pr-10',
              icon && 'pl-10',
              error && 'border-red-400/50 focus:border-red-400 focus:ring-red-500/20',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            onChange={(e) => onChange?.(e.target.value)}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted/50 dark:text-text-dark-muted/50">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-500" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-text-muted/70 dark:text-text-dark-muted/70">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Multi-select component
interface MultiSelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxVisible?: number;
  searchable?: boolean;
}

export function MultiSelect({
  label,
  error,
  hint,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  maxVisible = 3,
  searchable = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = options.filter(opt => value.includes(opt.value));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (buttonRef.current?.contains(event.target as Node)) return;
      if (listRef.current?.contains(event.target as Node)) return;
      setIsOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (optionValue: string) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue));
    } else {
      onChange([...value, optionValue]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  };

  return (
    <div className="w-full">
      {label && <label className="label-text">{label}</label>}
      <div className="relative">
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
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
        >
          <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
            {selectedOptions.length > 0 ? (
              selectedOptions.slice(0, maxVisible).map(opt => (
                <span
                  key={opt.value}
                  className="badge-primary flex items-center gap-1"
                >
                  {opt.label}
                  <button
                    type="button"
                    className="ml-1 p-0.5 hover:bg-primary-200/50 dark:hover:bg-primary-800/50 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleOption(opt.value);
                    }}
                    aria-label={`Remove ${opt.label}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))
            ) : (
              <span className="text-text-muted/50 dark:text-text-dark-muted/50">{placeholder}</span>
            )}
            {selectedOptions.length > maxVisible && (
              <span className="badge-primary">
                +{selectedOptions.length - maxVisible} more
              </span>
            )}
          </div>
          <svg
            className={cn('w-4 h-4 text-text-muted/50 dark:text-text-dark-muted/50 transition-transform', isOpen && 'rotate-180')}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div
            ref={listRef}
            className="glass-card absolute z-dropdown w-full mt-1.5 max-h-60 overflow-y-auto animate-slide-down"
            role="listbox"
            aria-label={label}
          >
            {searchable && (
              <input
                type="text"
                placeholder="Search..."
                className="input-field m-3 mb-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            )}
            <div className="px-3 pb-3">
              {filteredOptions.map(option => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={value.includes(option.value)}
                  disabled={option.disabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleOption(option.value);
                  }}
                  className={cn(
                    'w-full px-3 py-2.5 text-left rounded-xl transition-colors flex items-center gap-3',
                    value.includes(option.value)
                      ? 'bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/20',
                    option.disabled && 'opacity-40 cursor-not-allowed'
                  )}
                  tabIndex={-1}
                >
                  {option.icon && <span className="flex-shrink-0 w-5 h-5">{option.icon}</span>}
                  <span className="truncate">{option.label}</span>
                  {value.includes(option.value) && (
                    <svg className="ml-auto w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              {filteredOptions.length === 0 && (
                <p className="px-3 py-4 text-center text-text-muted/50 dark:text-text-dark-muted/50">
                  No options found
                </p>
              )}
            </div>
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500" role="alert">{error}</p>}
      {hint && !error && <p className="mt-1.5 text-sm text-text-muted/70 dark:text-text-dark-muted/70">{hint}</p>}
    </div>
  );
}