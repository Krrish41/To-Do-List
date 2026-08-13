import { useState } from 'react';
import { motion } from 'framer-motion';
import { parseISO, isToday, isTomorrow } from 'date-fns';
import {
  MoreVertical,
  Flag,
  Calendar,
  Clock,
  Tag,
  MessageSquare,
  Repeat,
  ChevronRight,
  GripVertical,
  CheckCircle2,
  Circle,
  Flag as FlagIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import type { Task, Priority } from '../../types';
import { TaskCheckbox } from '../ui';
import { formatTime, getRelativeTime, isOverdue, isDueSoon, getPriorityColor } from '../../lib/hooks';

interface TaskItemProps {
  task: Task;
  index: number;
  showProject?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd?: () => void;
}

export function TaskItem({
  task,
  index: _index,
  showProject = false,
  onClick,
  onDragStart,
  onDragEnd,
}: TaskItemProps) {
  const {
    toggleTaskComplete,
    removeTask,
    duplicateTask,
    setEditingTaskId,
    addToast,
  } = useStore();
  const [showMenu, setShowMenu] = useState(false);

  const project = showProject ? useStore.getState().projects[task.projectId] : null;
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length || 0;

  const dueDate = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdueTask = isOverdue(task);
  const isDueSoonTask = isDueSoon(task);
  const isTodayTask = dueDate && isToday(dueDate);
  const isTomorrowTask = dueDate && isTomorrow(dueDate);

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleTaskComplete(task.id);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTaskId(task.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        toggleTaskComplete(task.id);
      } else {
        setEditingTaskId(task.id);
      }
    } else if (e.key === 'Delete' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      removeTask(task.id);
      addToast({ type: 'success', title: 'Task deleted' });
    }
  };

  const priorityColors: Record<Priority, string> = {
    none: 'border-transparent',
    low: 'border-emerald-500',
    medium: 'border-amber-500',
    high: 'border-rose-500',
  };

  const priorityBg: Record<Priority, string> = {
    none: 'bg-transparent',
    low: 'bg-emerald-500/10',
    medium: 'bg-amber-500/10',
    high: 'bg-rose-500/10',
  };

  return (
    <motion.div
      draggable={task.status !== 'completed'}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        'task-row group relative',
        'rounded-xl p-4 transition-all duration-fast',
        'focus-within:ring-2 focus-within:ring-primary-500/50 focus-within:ring-offset-2',
        task.status === 'completed' && 'task-row-completed opacity-60',
        task.priority !== 'none' && `border-l-4 ${priorityColors[task.priority]} ${priorityBg[task.priority]}`
      )}
      tabIndex={0}
      role="listitem"
      aria-label={task.title}
      data-task-id={task.id}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-text-muted/30 dark:text-text-dark-muted/30 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Drag to reorder"
        tabIndex={-1}
      >
        <GripVertical className="w-5 h-5" />
      </button>

      {/* Checkbox */}
      <TaskCheckbox
        checked={task.status === 'completed'}
        onChange={handleToggleComplete}
        size="md"
        className="flex-shrink-0 mt-0.5"
      />

      {/* Content */}
      <div className="flex-1 min-w-0 ml-3">
        {/* Title */}
        <h3 className={cn(
          'font-medium text-text-primary dark:text-text-dark-primary truncate',
          task.status === 'completed' && 'line-through text-text-muted/70 dark:text-text-dark-muted/70'
        )}>
          {task.title}
        </h3>

        {/* Notes preview */}
        {task.notes && (
          <p className="mt-1 text-body-sm text-text-muted/70 dark:text-text-dark-muted/70 line-clamp-1 truncate">
            {task.notes}
          </p>
        )}

        {/* Metadata row */}
        <div className="mt-2 flex flex-wrap items-center gap-3 text-body-sm">
          {/* Due date */}
          {dueDate && (
            <span className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
              isOverdueTask && 'bg-red-50/80 dark:bg-red-900/30 text-red-600 dark:text-red-400',
              isTodayTask && 'bg-rose-50/80 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
              isTomorrowTask && 'bg-amber-50/80 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
              isDueSoonTask && !isTodayTask && !isTomorrowTask && 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              !isOverdueTask && !isTodayTask && !isTomorrowTask && !isDueSoonTask && 'bg-primary-50/80 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
            )}>
              <Calendar className="w-3.5 h-3.5" />
              {isTodayTask ? 'Today' : isTomorrowTask ? 'Tomorrow' : getRelativeTime(dueDate)}
            </span>
          )}

          {/* Due time */}
          {task.dueTime && (
            <span className="flex items-center gap-1.5 text-text-muted/70 dark:text-text-dark-muted/70">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(task.dueTime)}
            </span>
          )}

          {/* Priority */}
          {task.priority !== 'none' && (
            <span className={cn(
              'flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium',
              priorityBg[task.priority],
              `text-${getPriorityColor(task.priority)}-600 dark:text-${getPriorityColor(task.priority)}-400`
            )}>
              <FlagIcon className="w-3.5 h-3.5" />
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </span>
          )}

          {/* Project */}
          {showProject && project && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
              style={{ backgroundColor: `${project.color}15`, color: project.color }}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: project.color }} />
              {project.name}
            </span>
          )}

          {/* Tags */}
          {task.tags.length > 0 && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-text-muted/50 dark:text-text-dark-muted/50" />
              <span className="flex items-center gap-1">
                {task.tags.slice(0, 3).map(tagId => {
                  const tag = useStore.getState().tags[tagId];
                  return tag ? (
                    <span key={tag.id} className="tag-pill">
                      {tag.name}
                    </span>
                  ) : null;
                })}
                {task.tags.length > 3 && (
                  <span className="tag-pill text-text-muted/70 dark:text-text-dark-muted/70">
                    +{task.tags.length - 3}
                  </span>
                )}
              </span>
            </span>
          )}

          {/* Subtasks indicator */}
          {hasSubtasks && (
            <span className="flex items-center gap-1.5 text-text-muted/70 dark:text-text-dark-muted/70">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {completedSubtasks}/{task.subtasks!.length}
            </span>
          )}

          {/* Recurring */}
          {task.recurrence && (
            <span className="flex items-center gap-1.5 text-text-muted/70 dark:text-text-dark-muted/70" title="Recurring task">
              <Repeat className="w-3.5 h-3.5" />
            </span>
          )}

          {/* Notes indicator */}
          {task.notes && !task.notes.trim().startsWith(' ') && (
            <span className="flex items-center gap-1.5 text-text-muted/70 dark:text-text-dark-muted/70" title="Has notes">
              <MessageSquare className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
      </div>

      {/* Actions menu */}
      <div className="relative">
        <button
          type="button"
          className="btn-icon p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          aria-label="More options"
          aria-expanded={showMenu}
        >
          <MoreVertical className="w-5 h-5" />
        </button>

        {showMenu && (
          <div className="absolute right-0 top-full mt-1 glass-card py-1.5 rounded-xl shadow-glow-lg min-w-[160px] z-popover animate-slide-down">
            <button
              type="button"
              onClick={() => { setEditingTaskId(task.id); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
            >
              <MessageSquare className="w-4 h-4" />
              Edit
              <kbd className="ml-auto text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">⌘E</kbd>
            </button>
            <button
              type="button"
              onClick={async () => { await duplicateTask(task.id); setShowMenu(false); addToast({ type: 'success', title: 'Task duplicated' }); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
            >
              <ChevronRight className="w-4 h-4" />
              Duplicate
            </button>
            <div className="border-t border-border-light/50 dark:border-border-dark/50 my-1" />
            <button
              type="button"
              onClick={() => { toggleTaskComplete(task.id); setShowMenu(false); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
            >
              {task.status === 'completed' ? (
                <>
                  <Circle className="w-4 h-4" />
                  Mark Active
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Mark Complete
                </>
              )}
              <kbd className="ml-auto text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">⌘⏎</kbd>
            </button>
            <button
              type="button"
              onClick={() => { removeTask(task.id); setShowMenu(false); addToast({ type: 'success', title: 'Task deleted' }); }}
              className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20"
            >
              <Flag className="w-4 h-4" />
              Delete
              <kbd className="ml-auto text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">⌘⌫</kbd>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}