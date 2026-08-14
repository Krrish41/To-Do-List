import { forwardRef, type InputHTMLAttributes, type ChangeEvent } from 'react';
import { cn } from '../../lib/utils';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  onChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, size = 'md', className, id, onChange, ...props }, ref) => {
    const switchId = id || label?.toLowerCase().replace(/\s+/g, '-');

    const sizes = {
      sm: 'w-8 h-4.5',
      md: 'w-11 h-6',
      lg: 'w-14 h-7.5',
    };

    const thumbSizes = {
      sm: 'w-3.5 h-3.5',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const thumbTranslate = {
      sm: 'translate-x-4.5',
      md: 'translate-x-5.5',
      lg: 'translate-x-7',
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
      const checked = e.target.checked;
      onChange?.(checked);
    };

    return (
      <div className={cn('flex items-start gap-3', className)}>
        <div className="relative flex-shrink-0">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            role="switch"
            className="absolute h-full w-full opacity-0 cursor-pointer"
            aria-describedby={description ? `${switchId}-desc` : undefined}
            onChange={handleChange}
            {...props}
          />
          <div
            className={cn(
              'relative rounded-full border-2 transition-all duration-fast flex items-start',
              'focus-within:outline-none focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:ring-offset-2',
              props.checked
                ? 'bg-primary-500 border-primary-500'
                : 'bg-gray-200 dark:bg-gray-700 border-border-light dark:border-border-dark hover:border-primary-400/50',
              sizes[size],
              props.disabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            <span
              className={cn(
                'rounded-full bg-white shadow-lg transition-transform duration-fast',
                props.checked && thumbTranslate[size],
                thumbSizes[size]
              )}
            />
          </div>
        </div>
        <div className="flex-1 min-w-0 pt-1">
          {label && (
            <label htmlFor={switchId} className={cn('font-medium text-text-primary dark:text-text-dark-primary', props.disabled && 'opacity-50 cursor-not-allowed')}>
              {label}
            </label>
          )}
          {description && (
            <p id={`${switchId}-desc`} className="mt-0.5 text-body-sm text-text-muted dark:text-text-dark-muted">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Switch.displayName = 'Switch';