export type Priority = 'none' | 'low' | 'medium' | 'high';
export type TaskStatus = 'active' | 'completed';
export type ViewMode = 'list' | 'board' | 'calendar';
export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'upcoming' | 'overdue' | 'high-priority';

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  interval: number;
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  dayOfMonth?: number;
  monthOfYear?: number;
  endDate?: string; // ISO date string
  occurrences?: number;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  order: number;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon: string;
  description?: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  notes?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string; // ISO date string
  dueTime?: string; // HH:mm format
  startDate?: string; // ISO date string
  tags: string[]; // tag IDs
  subtasks: Subtask[];
  recurrence?: RecurrenceRule;
  parentTaskId?: string; // for recurring task instances
  isRecurringInstance?: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  density: 'compact' | 'comfortable' | 'spacious';
  defaultView: ViewMode;
  defaultProjectId?: string;
  showCompletedTasks: boolean;
  autoHideCompleted: boolean;
  sortBy: 'manual' | 'dueDate' | 'priority' | 'createdAt' | 'alphabetical';
  sortOrder: 'asc' | 'desc';
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  timeFormat: '12h' | '24h';
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  notifications: {
    enabled: boolean;
    dueSoon: boolean;
    overdue: boolean;
    dailyDigest: boolean;
    digestTime: string; // HH:mm
  };
  keyboardShortcuts: boolean;
  animations: boolean;
}

export interface FilterState {
  type: FilterType;
  projectId?: string;
  tagIds?: string[];
  priority?: Priority;
  searchQuery?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AppState {
  tasks: Record<string, Task>;
  projects: Record<string, Project>;
  tags: Record<string, Tag>;
  preferences: UserPreferences;
  filter: FilterState;
  ui: {
    sidebarOpen: boolean;
    commandPaletteOpen: boolean;
    editingTaskId?: string;
    selectedTaskIds: string[];
    dragState: {
      isDragging: boolean;
      draggedTaskId?: string;
      dropTargetId?: string;
    };
    toasts: Toast[];
  };
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: string;
  description: string;
  global?: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  density: 'comfortable',
  defaultView: 'list',
  showCompletedTasks: true,
  autoHideCompleted: false,
  sortBy: 'manual',
  sortOrder: 'asc',
  startOfWeek: 0,
  timeFormat: '12h',
  dateFormat: 'MM/DD/YYYY',
  notifications: {
    enabled: true,
    dueSoon: true,
    overdue: true,
    dailyDigest: false,
    digestTime: '09:00',
  },
  keyboardShortcuts: true,
  animations: true,
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  none: 'No Priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  none: 'gray',
  low: 'emerald',
  medium: 'amber',
  high: 'rose',
};

export const PROJECT_COLORS = [
  '#a855f7', // purple
  '#d946ef', // fuchsia
  '#ec4899', // pink
  '#f43f5e', // rose
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#eab308', // yellow
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#14b8a6', // teal
  '#06b6d4', // cyan
  '#0ea5e9', // sky
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
] as const;

export const PROJECT_ICONS = [
  'folder',
  'briefcase',
  'home',
  'book',
  'music',
  'film',
  'camera',
  'gamepad',
  'dumbbell',
  'heart',
  'star',
  'tag',
  'archive',
  'inbox',
  'flag',
  'bell',
  'calendar',
  'clock',
  'target',
  'rocket',
] as const;

// Utility function
export function generateId(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const randomHex = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
  return `${timeHex}${randomHex}`.substring(0, 32);
}