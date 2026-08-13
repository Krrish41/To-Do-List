import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Flag, Trash2, Save, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import type { Task, Priority, RecurrenceRule } from '../../types';
import {
  Button,
  Input,
  Textarea,
  Select,
  Checkbox,
  Switch,
  Modal,
} from '../ui';

const PRIORITY_OPTIONS = [
  { value: 'none', label: 'No Priority', icon: <Flag className="w-4 h-4 text-gray-400" /> },
  { value: 'low', label: 'Low', icon: <Flag className="w-4 h-4 text-emerald-500" /> },
  { value: 'medium', label: 'Medium', icon: <Flag className="w-4 h-4 text-amber-500" /> },
  { value: 'high', label: 'High', icon: <Flag className="w-4 h-4 text-rose-500" /> },
];

const RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

interface TaskFormProps {
  task?: Task | null;
  onClose: () => void;
  onSubmit: (data: Partial<Task>) => Promise<void>;
}

export function TaskForm({ task, onClose, onSubmit }: TaskFormProps) {
  const { projects, tags, addTag, addToast } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Task>>({
    title: task?.title || '',
    notes: task?.notes || '',
    projectId: task?.projectId || '',
    priority: task?.priority || 'none',
    dueDate: task?.dueDate || '',
    dueTime: task?.dueTime || '',
    tags: task?.tags || [],
    subtasks: task?.subtasks || [],
    recurrence: task?.recurrence,
    status: task?.status || 'active',
  });

  // UI state
  const [showRecurrence, setShowRecurrence] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule | undefined>(
    task?.recurrence
  );
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  // Focus title on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Update form data
  const updateField = <K extends keyof Partial<Task>>(field: K, value: Partial<Task>[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Handle subtasks
  const addSubtask = () => {
    if (!newSubtask.trim()) return;
    const subtask = {
      id: crypto.randomUUID(),
      title: newSubtask.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      order: formData.subtasks?.length || 0,
    };
    updateField('subtasks', [...(formData.subtasks || []), subtask]);
    setNewSubtask('');
  };

  const removeSubtask = (id: string) => {
    updateField('subtasks', formData.subtasks?.filter(s => s.id !== id) || []);
  };

  const toggleSubtask = (id: string) => {
    updateField('subtasks', formData.subtasks?.map(s =>
      s.id === id ? { ...s, completed: !s.completed } : s
    ) || []);
  };

  // Handle tags
  const addTagHandler = async () => {
    if (!newTag.trim()) return;
    // Check if tag exists
    const existingTag = Object.values(tags).find(t => t.name.toLowerCase() === newTag.trim().toLowerCase());
    if (existingTag) {
      if (!formData.tags?.includes(existingTag.id)) {
        updateField('tags', [...(formData.tags || []), existingTag.id]);
      }
    } else {
      const createdTag = await addTag({
        name: newTag.trim(),
        color: '#a855f7',
      });
      updateField('tags', [...(formData.tags || []), createdTag.id]);
    }
    setNewTag('');
    setShowTagInput(false);
  };

  const removeTag = (tagId: string) => {
    updateField('tags', formData.tags?.filter(t => t !== tagId) || []);
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      titleRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        title: formData.title.trim(),
        tags: formData.tags || [],
        subtasks: formData.subtasks || [],
        recurrence: formData.recurrence || undefined,
      });
      onClose();
    } catch (error) {
      addToast({ type: 'error', title: 'Failed to save task', message: String(error) });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={task ? 'Edit Task' : 'New Task'}
      size="lg"
      showCloseButton={true}
      closeOnOverlayClick={true}
    >
      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
        {/* Title */}
        <Input
          ref={titleRef}
          label="Title"
          placeholder="What needs to be done?"
          value={formData.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
          autoComplete="off"
          required
        />

        {/* Notes */}
        <Textarea
          label="Notes"
          placeholder="Add details, links, or context..."
          value={formData.notes || ''}
          onChange={(e) => updateField('notes', e.target.value)}
          rows={3}
        />

        {/* Project & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Project"
            placeholder="Select project"
            options={Object.values(projects).map(p => ({
              value: p.id,
              label: p.name,
              icon: <span className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />,
            }))}
            value={formData.projectId || ''}
            onChange={(value) => updateField('projectId', value)}
          />

          <Select
            label="Priority"
            placeholder="Select priority"
            options={PRIORITY_OPTIONS}
            value={formData.priority || 'none'}
            onChange={(value) => updateField('priority', value as Priority)}
          />
        </div>

        {/* Due Date & Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Input
              label="Due Date"
              type="date"
              value={formData.dueDate || ''}
              onChange={(e) => updateField('dueDate', e.target.value)}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>
          <div className="relative">
            <Input
              label="Due Time"
              type="time"
              value={formData.dueTime || ''}
              onChange={(e) => updateField('dueTime', e.target.value)}
              icon={<Clock className="w-4 h-4" />}
            />
          </div>
        </div>

        {/* Recurrence */}
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <Switch
              checked={!!formData.recurrence}
              onChange={(checked) => {
                setShowRecurrence(checked);
                if (!checked) {
                  updateField('recurrence', undefined);
                }
              }}
            />
            <div>
              <p className="font-medium text-text-primary dark:text-text-dark-primary">Repeat</p>
              <p className="text-body-sm text-text-muted dark:text-text-dark-muted">
                Make this task recur on a schedule
              </p>
            </div>
          </label>

          <AnimatePresence>
            {showRecurrence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden pl-10"
              >
                <Select
                  label="Frequency"
                  options={RECURRENCE_OPTIONS}
                  value={recurrenceRule?.frequency || 'weekly'}
                  onChange={(value) => {
                    const newRule: RecurrenceRule = {
                      ...recurrenceRule,
                      frequency: value as RecurrenceRule['frequency'],
                      interval: recurrenceRule?.interval || 1,
                    };
                    setRecurrenceRule(newRule);
                    updateField('recurrence', newRule);
                  }}
                />

                {recurrenceRule?.frequency === 'weekly' && (
                  <div className="flex flex-wrap gap-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <Checkbox
                          checked={recurrenceRule.daysOfWeek?.includes(i) || false}
                          onChange={(e) => {
                            const days = recurrenceRule.daysOfWeek || [];
                            const newDays = e.target.checked
                              ? [...days, i]
                              : days.filter(d => d !== i);
                            const newRule: RecurrenceRule = { ...recurrenceRule, daysOfWeek: newDays };
                            setRecurrenceRule(newRule);
                            updateField('recurrence', newRule);
                          }}
                        >
                          {day}
                        </Checkbox>
                      </label>
                    ))}
                  </div>
                )}

                {recurrenceRule?.frequency === 'monthly' && (
                  <Input
                    label="Day of Month"
                    type="number"
                    min={1}
                    max={31}
                    value={recurrenceRule.dayOfMonth || 1}
                    onChange={(e) => {
                      const newRule: RecurrenceRule = { ...recurrenceRule, dayOfMonth: parseInt(e.target.value) || 1 };
                      setRecurrenceRule(newRule);
                      updateField('recurrence', newRule);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-medium text-text-primary dark:text-text-dark-primary">Tags</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowTagInput(true)}
            >
              Add Tag
            </Button>
          </div>

          {showTagInput && (
            <div className="flex gap-2">
              <Input
                placeholder="New tag name..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTagHandler()}
                autoFocus
              />
              <Button type="button" size="sm" onClick={addTagHandler}>Create</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowTagInput(false)}>
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {Object.values(tags).map(tag => (
              <button
                key={tag.id}
                type="button"
                className={cn(
                  'tag-pill transition-colors',
                  formData.tags?.includes(tag.id) && 'bg-primary-500 text-white border-primary-500'
                )}
                onClick={() => {
                  const tags = formData.tags || [];
                  if (tags.includes(tag.id)) {
                    updateField('tags', tags.filter(t => t !== tag.id));
                  } else {
                    updateField('tags', [...tags, tag.id]);
                  }
                }}
              >
                <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            ))}
          </div>

          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {formData.tags.map(tagId => {
                const tag = tags[tagId];
                return tag ? (
                  <span key={tag.id} className="tag-pill">
                    <span className="w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: tag.color }} />
                    {tag.name}
                    <button
                      type="button"
                      className="ml-1 p-0.5 hover:bg-primary-200/50 dark:hover:bg-primary-800/50 rounded"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag.id); }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ) : null;
              })}
            </div>
          )}
        </div>

        {/* Subtasks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-medium text-text-primary dark:text-text-dark-primary">Subtasks</label>
            <span className="text-body-sm text-text-muted dark:text-text-dark-muted">
              {formData.subtasks?.filter(s => s.completed).length || 0} / {formData.subtasks?.length || 0}
            </span>
          </div>

          <div className="space-y-2">
            {formData.subtasks?.map((subtask, index) => (
              <div key={subtask.id} className="flex items-center gap-2">
                <Checkbox
                  checked={subtask.completed}
                  onChange={(e) => toggleSubtask(subtask.id)}
                />
                <Input
                  value={subtask.title}
                  onChange={(e) => {
                    updateField('subtasks', formData.subtasks?.map((s, i) =>
                      i === index ? { ...s, title: e.target.value } : s
                    ) || []);
                  }}
                  className="flex-1"
                  placeholder="Subtask..."
                />
                <button
                  type="button"
                  className="btn-icon p-1 text-red-500/70 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                  onClick={() => removeSubtask(subtask.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addSubtask()}
                placeholder="Add a subtask..."
                className="flex-1"
              />
              <Button type="button" size="sm" onClick={addSubtask} disabled={!newSubtask.trim()}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Status (only for editing) */}
        {task && (
          <div className="flex items-center gap-3 pt-4 border-t border-border-light/50 dark:border-border-dark/50">
            <Checkbox
              label="Mark as completed"
              checked={formData.status === 'completed'}
              onChange={(e) => updateField('status', e.target.checked ? 'completed' : 'active')}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border-light/50 dark:border-border-dark/50">
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isSubmitting} icon={<Save className="w-4 h-4" />}>
            {task ? 'Save Changes' : 'Create Task'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}