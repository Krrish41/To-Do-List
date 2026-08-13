import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ChevronDown, ChevronUp, CheckCheck, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore, useSetFilter, useClearFilter, useAddToast } from '../../lib/store';
import type { Task, FilterType } from '../../types';
import { TaskItem } from './TaskItem';
import { Button, Input, Dropdown } from '../ui';
import { useDragAndDrop } from '../../lib/hooks';

interface TaskListProps {
  showProjectColumn?: boolean;
  onTaskClick?: (task: Task) => void;
}

const FILTER_OPTIONS: Array<{ value: FilterType; label: string; icon: React.ReactNode }> = [
  { value: 'all', label: 'All Tasks', icon: <CheckCheck className="w-4 h-4" /> },
  { value: 'active', label: 'Active', icon: <CheckCheck className="w-4 h-4" /> },
  { value: 'completed', label: 'Completed', icon: <X className="w-4 h-4" /> },
  { value: 'today', label: 'Today', icon: <CheckCheck className="w-4 h-4" /> },
  { value: 'upcoming', label: 'Upcoming', icon: <CheckCheck className="w-4 h-4" /> },
  { value: 'overdue', label: 'Overdue', icon: <X className="w-4 h-4" /> },
  { value: 'high-priority', label: 'High Priority', icon: <CheckCheck className="w-4 h-4" /> },
];

const SORT_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

export function TaskList({ showProjectColumn = true, onTaskClick }: TaskListProps) {
  const {
    filter,
    preferences,
    setFilter,
    clearFilter,
    reorderTasks,
    getFilteredTasks,
  } = useStore();
  const addToast = useAddToast();
  const setFilterAction = useSetFilter();
  const clearFilterAction = useClearFilter();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(preferences.showCompletedTasks);
  const [sortBy, setSortBy] = useState(preferences.sortBy);
  const [sortOrder, setSortOrder] = useState(preferences.sortOrder);

  const filteredTasks = getFilteredTasks();
  const activeTasks = filteredTasks.filter(t => t.status === 'active');
  const completedTasks = filteredTasks.filter(t => t.status === 'completed');

  // Debounced search
  const debouncedSearch = useRef<ReturnType<typeof setTimeout>>();
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debouncedSearch.current) clearTimeout(debouncedSearch.current);
    debouncedSearch.current = setTimeout(() => {
      setFilter({ searchQuery: value });
    }, 300);
  };

  // Drag and drop
  const { draggedIndex, dragOverIndex, handleDragStart, handleDragOver, handleDragLeave, handleDrop, handleDragEnd } =
    useDragAndDrop({
      items: activeTasks,
      onReorder: (fromIndex, toIndex) => {
        const taskIds = activeTasks.map(t => t.id);
        const [removed] = taskIds.splice(fromIndex, 1);
        taskIds.splice(toIndex, 0, removed);
        reorderTasks(taskIds);
      },
      onDragStart: () => {},
      onDragEnd: () => {},
    });

  // Handle filter change
  const handleFilterChange = (type: FilterType) => {
    setFilter({ type });
    if (type !== 'all') {
      addToast({ type: 'info', title: `Filtered: ${FILTER_OPTIONS.find(f => f.value === type)?.label}` });
    }
  };

  // Handle sort change
  const handleSortChange = (field: typeof sortBy) => {
    if (field === sortBy) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Empty states
  if (filteredTasks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <h3 className="text-h3 font-medium text-text-primary dark:text-text-dark-primary mb-2">
          {filter.type === 'all' ? 'No tasks yet' : 'No tasks match your filter'}
        </h3>
        <p className="text-body text-text-muted dark:text-text-dark-muted mb-6 max-w-xs text-center">
          {filter.type === 'all'
            ? 'Create your first task to get started'
            : 'Try adjusting your filters or search query'}
        </p>
        {filter.type !== 'all' && (
          <Button variant="secondary" onClick={clearFilterAction} icon={<X className="w-4 h-4" />}>
            Clear Filters
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4 p-4 glass-card">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/50 dark:text-text-dark-muted/50" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            iconPosition="left"
          />
        </div>

        {/* Filter & Sort */}
        <div className="flex items-center gap-2">
          <Dropdown
            trigger={
              <Button
                variant="secondary"
                size="sm"
                icon={<Filter className="w-3.5 h-3.5" />}
                className={cn(filter.type !== 'all' && 'bg-primary-50/50 dark:bg-primary-900/30 border-primary-300/50 dark:border-primary-700/50')}
              >
                {FILTER_OPTIONS.find(f => f.value === filter.type)?.label || 'Filter'}
                <ChevronDown className="w-3.5 h-3.5" />
              </Button>
            }
            items={FILTER_OPTIONS.map(f => ({
              label: f.label,
              value: f.value,
              icon: f.icon,
              onClick: () => handleFilterChange(f.value),
            }))}
            align="right"
          />

          <Dropdown
            trigger={
              <Button variant="secondary" size="sm" icon={<ChevronUp className="w-3.5 h-3.5" />}>
                {SORT_OPTIONS.find(s => s.value === sortBy)?.label}
                {sortOrder === 'desc' ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
              </Button>
            }
            items={SORT_OPTIONS.map(s => ({
              label: s.value,
              value: s.label,
              onClick: () => handleSortChange(s.value as typeof sortBy),
            }))}
            align="right"
          />

          <Button
            variant="ghost"
            size="sm"
            icon={<CheckCheck className="w-3.5 h-3.5" />}
            className={cn(showCompleted && 'text-primary-600 dark:text-primary-400')}
            onClick={() => setShowCompleted(!showCompleted)}
          >
            Completed
          </Button>
        </div>
      </div>

      {/* Active Tasks */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key="active"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto space-y-2 pr-1"
        >
          {activeTasks.map((task, index) => (
            <TaskItem
              key={task.id}
              task={task}
              index={index}
              showProject={showProjectColumn}
              onClick={() => onTaskClick?.(task)}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Completed Tasks */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-body-sm text-text-muted dark:text-text-dark-muted mb-3">
            <span className="flex-1 h-px bg-border-light dark:bg-border-dark" />
            <span>Completed ({completedTasks.length})</span>
            <span className="flex-1 h-px bg-border-light dark:bg-border-dark" />
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key="completed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-2 pr-1 max-h-60 overflow-y-auto"
            >
              {completedTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  showProject={showProjectColumn}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Task list with virtualization for large lists
export function VirtualizedTaskList({ showProjectColumn = true, onTaskClick }: TaskListProps) {
  // For now, use regular TaskList
  // In the future, implement react-window virtualization for 1000+ tasks
  return <TaskList showProjectColumn={showProjectColumn} onTaskClick={onTaskClick} />;
}