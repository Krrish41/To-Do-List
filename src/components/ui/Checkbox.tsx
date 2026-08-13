import { forwardRef, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  description?: string;
  indeterminate?: boolean;
  onChange?: (checked: boolean) => void;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, indeterminate, className, id, onChange, ...props }, ref) => {
    const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      onChange?.(checked);
    };

    return (
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'absolute h-5 w-5 opacity-0',
              props.disabled && 'cursor-not-allowed'
            )}
            aria-describedby={description ? `${checkboxId}-desc` : undefined}
            onChange={handleChange}
            {...props}
          />
          <div
            className={cn(
              'relative h-5 w-5 rounded-lg border-2 transition-all duration-fast flex items-center justify-center',
              indeterminate
                ? 'bg-primary-500 border-primary-500'
                : props.checked
                ? 'bg-primary-500 border-primary-500'
                : 'border-border-light dark:border-border-dark hover:border-primary-400/50'
            )}
          >
            {indeterminate && (
              <div className="w-2.5 h-0.5 bg-white rounded" />
            )}
            {!indeterminate && props.checked && (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          {label && (
            <label htmlFor={checkboxId} className={cn('font-medium text-text-primary dark:text-text-dark-primary', props.disabled && 'opacity-50 cursor-not-allowed')}>
              {label}
            </label>
          )}
          {description && (
            <p id={`${checkboxId}-desc`} className="mt-0.5 text-body-sm text-text-muted dark:text-text-dark-muted">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

// Task checkbox with custom styling
interface TaskCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function TaskCheckbox({ checked, onChange, disabled, indeterminate, size = 'md' }: TaskCheckboxProps) {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!disabled) {
      onChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'relative flex-shrink-0 rounded-lg border-2 transition-all duration-fast flex items-center justify-center',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 focus-visible:ring-offset-2',
        disabled && 'opacity-50 cursor-not-allowed',
        indeterminate
          ? 'bg-primary-500 border-primary-500'
          : checked
          ? 'bg-gradient-primary border-transparent shadow-glow'
          : 'border-border-light dark:border-border-dark hover:border-primary-400/50'
      )}
      style={{ width: sizes[size], height: sizes[size] }}
    >
      {indeterminate && (
        <div className="w-2.5 h-0.5 bg-white rounded" />
      )}
      {!indeterminate && checked && (
        <Check className={cn('text-white', size === 'sm' && 'w-3 h-3', size === 'md' && 'w-3.5 h-3.5', size === 'lg' && 'w-4 h-4')} strokeWidth={3.5} />
      )}
    </button>
  );
}

// Checkbox group
interface CheckboxGroupProps {
  label: string;
  options: Array<{ value: string; label: string; description?: string }>;
  value: string[];
  onChange: (value: string[]) => void;
  direction?: 'vertical' | 'horizontal';
  required?: boolean;
}

export function CheckboxGroup({ label, options, value, onChange, direction = 'vertical', required }: CheckboxGroupProps) {
  return (
    <fieldset className="w-full">
      <legend className="label-text">{label}{required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}</legend>
      <div className={cn('mt-2', direction === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-2')}>
        {options.map(option => (
          <Checkbox
            key={option.value}
            label={option.label}
            description={option.description}
            checked={value.includes(option.value)}
            onChange={(checked) => {
              const newValue = checked
                ? [...value, option.value]
                : value.filter(v => v !== option.value);
              onChange(newValue);
            }}
          />
        ))}
      </div>
    </fieldset>
  );
}