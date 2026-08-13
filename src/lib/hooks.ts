import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useStore, usePreferences, useAddToast } from './store';
import type { KeyboardShortcut, Task, Priority } from '../types';
import { format, parseISO, isToday, isTomorrow, startOfDay, differenceInDays } from 'date-fns';

// Standalone utility functions (not hooks)
export function formatDate(date: Date | string | number | null | undefined, options?: { relative?: boolean }): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);

  if (options?.relative) {
    if (isToday(d)) return 'Today';
    if (isTomorrow(d)) return 'Tomorrow';
    const diff = differenceInDays(d, new Date());
    if (diff > 0 && diff < 7) return format(d, 'EEEE');
    if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
  }

  return format(d, 'MM/dd/yyyy');
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return format(date, 'h:mm a');
}

export function getRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' ? parseISO(date) : new Date(date);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.ceil(diffMs / (1000 * 60));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0 && diffDays < 7) return `${diffDays}d`;
  if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)}d ago`;

  return formatDate(d);
}

export function getPriorityLabel(priority: Priority): string {
  const labels: Record<Priority, string> = {
    none: 'No Priority',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
  };
  return labels[priority];
}

export function getPriorityColor(priority: Priority): string {
  const colors: Record<Priority, string> = {
    none: 'gray',
    low: 'emerald',
    medium: 'amber',
    high: 'rose',
  };
  return colors[priority];
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'completed') return false;
  const due = startOfDay(new Date(task.dueDate));
  const today = startOfDay(new Date());
  return due < today;
}

export function isDueSoon(task: Task, days = 3): boolean {
  if (!task.dueDate || task.status === 'completed') return false;
  const due = startOfDay(new Date(task.dueDate));
  const today = startOfDay(new Date());
  const diff = differenceInDays(due, today);
  return diff >= 0 && diff <= days;
}

export function getTaskStatus(task: Task): 'overdue' | 'due-soon' | 'upcoming' | 'no-date' | 'completed' {
  if (task.status === 'completed') return 'completed';
  if (!task.dueDate) return 'no-date';
  if (isOverdue(task)) return 'overdue';
  if (isDueSoon(task)) return 'due-soon';
  return 'upcoming';
}

// Keyboard shortcuts hook
export function useKeyboardShortcuts() {
  const preferences = usePreferences();
  const { setFilter, clearFilter, toggleSidebar, setCommandPaletteOpen, toggleTaskComplete, getFilteredTasks } = useStore();
  const addToast = useAddToast();

  const shortcuts = useMemo<KeyboardShortcut[]>(() => [
    { key: 'n', meta: true, action: 'new-task', description: 'New task', global: true },
    { key: 'k', meta: true, action: 'command-palette', description: 'Command palette', global: true },
    { key: '/', meta: true, action: 'search', description: 'Search tasks', global: true },
    { key: '\\', meta: true, action: 'toggle-sidebar', description: 'Toggle sidebar', global: true },
    { key: 'Enter', meta: true, action: 'toggle-complete', description: 'Toggle complete', global: false },
    { key: 'd', meta: true, action: 'set-due-date', description: 'Set due date', global: false },
    { key: 'p', meta: true, action: 'set-project', description: 'Set project', global: false },
    { key: '1', meta: true, action: 'priority-high', description: 'Set high priority', global: false },
    { key: '2', meta: true, action: 'priority-medium', description: 'Set medium priority', global: false },
    { key: '3', meta: true, action: 'priority-low', description: 'Set low priority', global: false },
    { key: '0', meta: true, action: 'priority-none', description: 'Clear priority', global: false },
    { key: 'ArrowUp', meta: false, action: 'navigate-up', description: 'Navigate up', global: false },
    { key: 'ArrowDown', meta: false, action: 'navigate-down', description: 'Navigate down', global: false },
    { key: 'Escape', meta: false, action: 'escape', description: 'Close dialog/clear selection', global: true },
    { key: 'a', meta: true, shift: true, action: 'select-all', description: 'Select all', global: false },
    { key: 'Backspace', meta: true, action: 'delete-selected', description: 'Delete selected', global: false },
    { key: 'f', meta: true, shift: true, action: 'filter-today', description: 'Filter today', global: true },
    { key: 'u', meta: true, shift: true, action: 'filter-upcoming', description: 'Filter upcoming', global: true },
    { key: 'o', meta: true, shift: true, action: 'filter-overdue', description: 'Filter overdue', global: true },
    { key: 'h', meta: true, shift: true, action: 'filter-high-priority', description: 'Filter high priority', global: true },
  ], []);

  useEffect(() => {
    if (!preferences.keyboardShortcuts) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        const isGlobalShortcut = shortcuts.some(s =>
          s.global && s.key === e.key && s.meta === (e.metaKey || e.ctrlKey) &&
          s.shift === e.shiftKey && s.alt === e.altKey
        );
        if (!isGlobalShortcut) return;
      }

      const shortcut = shortcuts.find(s =>
        s.key === e.key &&
        s.meta === (e.metaKey || e.ctrlKey) &&
        s.shift === e.shiftKey &&
        s.alt === e.altKey
      );

      if (!shortcut) return;

      e.preventDefault();

      switch (shortcut.action) {
        case 'new-task':
          setFilter({ type: 'all' });
          window.dispatchEvent(new CustomEvent('todo:new-task'));
          break;
        case 'command-palette':
          setCommandPaletteOpen(true);
          break;
        case 'search':
          window.dispatchEvent(new CustomEvent('todo:search'));
          break;
        case 'toggle-sidebar':
          toggleSidebar();
          break;
        case 'toggle-complete': {
          const tasks = getFilteredTasks();
          const selected = useStore.getState().ui.selectedTaskIds;
          if (selected.length > 0) {
            selected.forEach(id => toggleTaskComplete(id));
          } else if (tasks.length > 0) {
            toggleTaskComplete(tasks[0].id);
          }
          break;
        }
        case 'filter-today':
          setFilter({ type: 'today' });
          addToast({ type: 'info', title: 'Filtered: Today' });
          break;
        case 'filter-upcoming':
          setFilter({ type: 'upcoming' });
          addToast({ type: 'info', title: 'Filtered: Upcoming' });
          break;
        case 'filter-overdue':
          setFilter({ type: 'overdue' });
          addToast({ type: 'info', title: 'Filtered: Overdue' });
          break;
        case 'filter-high-priority':
          setFilter({ type: 'high-priority' });
          addToast({ type: 'info', title: 'Filtered: High Priority' });
          break;
        case 'escape':
          clearFilter();
          setCommandPaletteOpen(false);
          useStore.getState().clearSelection();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, preferences.keyboardShortcuts, setFilter, clearFilter, toggleSidebar, setCommandPaletteOpen, addToast, toggleTaskComplete, getFilteredTasks]);

  return shortcuts;
}

// Date formatting hooks (for components that need reactive formatting)
export function useDateFormat() {
  const { dateFormat, timeFormat } = usePreferences();

  const formatDate = useCallback((date: Date | string | number | null | undefined, options?: { relative?: boolean }) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);

    if (options?.relative) {
      if (isToday(d)) return 'Today';
      if (isTomorrow(d)) return 'Tomorrow';
      const diff = differenceInDays(d, new Date());
      if (diff > 0 && diff < 7) return format(d, 'EEEE');
      if (diff < 0 && diff > -7) return `${Math.abs(diff)} days ago`;
    }

    switch (dateFormat) {
      case 'DD/MM/YYYY':
        return format(d, 'dd/MM/yyyy');
      case 'YYYY-MM-DD':
        return format(d, 'yyyy-MM-dd');
      case 'MM/DD/YYYY':
      default:
        return format(d, 'MM/dd/yyyy');
    }
  }, [dateFormat]);

  const formatTime = useCallback((time: string | null | undefined) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes);

    if (timeFormat === '24h') {
      return format(date, 'HH:mm');
    }
    return format(date, 'h:mm a');
  }, [timeFormat]);

  const formatDateTime = useCallback((date: Date | string | number | null | undefined, time?: string | null) => {
    if (!date) return '';
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    const dateStr = formatDate(d);
    const timeStr = formatTime(time);
    return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
  }, [formatDate, formatTime]);

  const getRelativeTime = useCallback((date: Date | string | number) => {
    const d = typeof date === 'string' ? parseISO(date) : new Date(date);
    const now = new Date();
    const diffMs = d.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffMs / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === 0) return 'Today';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays > 0 && diffDays < 7) return `${diffDays}d`;
    if (diffDays < 0 && diffDays > -7) return `${Math.abs(diffDays)}d ago`;

    return formatDate(d);
  }, [formatDate]);

  return { formatDate, formatTime, formatDateTime, getRelativeTime };
}

// Task utilities hook
export function useTaskUtils() {
  const { formatDate, formatTime, getRelativeTime } = useDateFormat();

  const getPriorityLabel = useCallback((priority: Priority) => {
    const labels: Record<Priority, string> = {
      none: 'No Priority',
      low: 'Low',
      medium: 'Medium',
      high: 'High',
    };
    return labels[priority];
  }, []);

  const getPriorityColor = useCallback((priority: Priority) => {
    const colors: Record<Priority, string> = {
      none: 'gray',
      low: 'emerald',
      medium: 'amber',
      high: 'rose',
    };
    return colors[priority];
  }, []);

  const isOverdue = useCallback((task: Task) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const due = startOfDay(new Date(task.dueDate));
    const today = startOfDay(new Date());
    return due < today;
  }, []);

  const isDueSoon = useCallback((task: Task, days = 3) => {
    if (!task.dueDate || task.status === 'completed') return false;
    const due = startOfDay(new Date(task.dueDate));
    const today = startOfDay(new Date());
    const diff = differenceInDays(due, today);
    return diff >= 0 && diff <= days;
  }, []);

  const getTaskStatus = useCallback((task: Task): 'overdue' | 'due-soon' | 'upcoming' | 'no-date' | 'completed' => {
    if (task.status === 'completed') return 'completed';
    if (!task.dueDate) return 'no-date';
    if (isOverdue(task)) return 'overdue';
    if (isDueSoon(task)) return 'due-soon';
    return 'upcoming';
  }, [isOverdue, isDueSoon]);

  const sortTasks = useCallback((tasks: Task[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    return [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
          comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'alphabetical':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'manual':
        default:
          comparison = a.order - b.order;
          break;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }, []);

  return {
    formatDate,
    formatTime,
    getRelativeTime,
    getPriorityLabel,
    getPriorityColor,
    isOverdue,
    isDueSoon,
    getTaskStatus,
    sortTasks,
  };
}

// Local storage persistence for UI state
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key, storedValue]);

  return [storedValue, setValue] as const;
}

// Debounce hook
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Intersection observer for lazy loading
export function useIntersectionObserver(options: IntersectionObserverInit = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting);
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options]);

  return [elementRef, isIntersecting] as const;
}

// Media query hook
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Reduced motion hook
export function useReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// Dark mode hook
export function useDarkMode(): boolean {
  const { theme } = usePreferences();
  const systemDark = useMediaQuery('(prefers-color-scheme: dark)');

  if (theme === 'system') return systemDark;
  return theme === 'dark';
}

// Focus trap hook for modals
export function useFocusTrap(enabled: boolean = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTab);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTab);
  }, [enabled]);

  return containerRef;
}

// Click outside hook
export function useClickOutside(handler: () => void, enabled: boolean = true) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };

    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);

    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [handler, enabled]);

  return ref;
}

// Drag and drop hook
export function useDragAndDrop<T>({
  items,
  onReorder,
  onDragStart,
  onDragEnd,
}: {
  items: T[];
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDragStart?: (item: T, index: number) => void;
  onDragEnd?: () => void;
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setDraggedIndex(index);
    onDragStart?.(items[index], index);
  }, [items, onDragStart]);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== draggedIndex) {
      setDragOverIndex(index);
    }
  }, [draggedIndex]);

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== index && fromIndex >= 0 && fromIndex < items.length) {
      onReorder(fromIndex, index);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
    onDragEnd?.();
  }, [items, onReorder, onDragEnd]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    onDragEnd?.();
  }, [onDragEnd]);

  return {
    draggedIndex,
    dragOverIndex,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  };
}