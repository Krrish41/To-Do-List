import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Sun, Moon, Sparkles, CheckCircle, Search } from 'lucide-react';
import { useTodoStore } from './store/store';
import type { Task } from './store/store';
import AddTaskForm from './components/AddTaskForm';
import TaskItem from './components/TaskItem';
import ThemeToggle from './components/ui/ThemeToggle';
import CommandPalette from './components/ui/CommandPalette';
import './index.css';
import './assets/apple-design.css';

function App() {
  const { tasks, addTask, toggleTask, deleteTask, setFilter, filter } = useTodoStore();
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Keyboard navigation
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const handleAddTask = useCallback(() => {
    let title = newTaskTitle.trim();
    if (title) {
      let priority: 'low' | 'medium' | 'high' = 'medium';
      let dueDate: string | undefined = undefined;

      if (title.toLowerCase().includes('!high')) {
        priority = 'high';
        title = title.replace(/!high/i, '').trim();
      }
      
      if (title.toLowerCase().includes('!overdue')) {
        // Mock an overdue date (yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        dueDate = yesterday.toISOString();
        title = title.replace(/!overdue/i, '').trim();
      }

      addTask({ title, category: 'general', priority, dueDate });
      setNewTaskTitle('');
    }
  }, [newTaskTitle, addTask]);

  const handleToggleTask = useCallback((id: string) => {
    toggleTask(id);
  }, [toggleTask]);

  const handleDeleteTask = useCallback((id: string) => {
    deleteTask(id);
  }, [deleteTask]);

  const handleFilterChange = useCallback((newFilter: typeof filter) => {
    setFilter(newFilter);
  }, [setFilter]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'a' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      const input = document.querySelector('input[placeholder="Add a task..."]') as HTMLInputElement;
      input?.focus();
    }
    if (e.key === '1' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFilterChange('all');
    }
    if (e.key === '2' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFilterChange('active');
    }
    if (e.key === '3' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleFilterChange('completed');
    }
  }, [handleFilterChange]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const displayedTasks = filter === 'all' ? tasks :
                         filter === 'active' ? activeTasks :
                         filter === 'completed' ? completedTasks : 
                         filter === 'high-priority' ? tasks.filter(t => t.priority === 'high' && !t.completed) :
                         filter === 'overdue' ? tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed) : tasks;

  return (
    <div className="app-container">
      {/* Command Palette */}
      <CommandPalette />

      {/* Top right actions */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 100, display: 'flex', gap: '0.5rem' }}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('todo:open-command-palette'))}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
            color: 'rgb(var(--color-text-primary))',
            cursor: 'pointer',
          }}
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </button>
        <ThemeToggle />
      </div>

      <main style={{
        minHeight: '100vh',
        padding: '4rem 1rem',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
      }}>
        {/* Header */}
        <header style={{ textAlign: 'center', padding: '1.75rem 2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.75rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            border: '1px solid var(--glass-border)',
            borderRadius: '16px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
          }}>
            <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'cover', borderRadius: '8px' }} />
            <h1 style={{
              fontSize: '1.75rem',
              fontWeight: 600,
              margin: 0,
              color: 'rgb(var(--color-text-primary))'
            }}>
              To-Do List
            </h1>
          </div>
        </header>

        {/* Add Task */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.625rem',
        }}>
          <div style={{
            display: 'flex',
            gap: '0.625rem',
            alignItems: 'flex-start',
          }}>
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
              }}
              placeholder="Add a new task..."
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                fontSize: '1rem',
                border: '2px solid var(--glass-border)',
                borderRadius: '12px',
                background: 'var(--card-light)',
                color: 'rgb(var(--color-text-primary))',
                outline: 'none',
                transition: 'all 0.2s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgb(var(--color-primary-dark))';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(var(--color-primary), 0.3)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handleAddTask}
              style={{
                padding: '0.75rem 1.5rem',
                fontSize: '1rem',
                fontWeight: 500,
                background: 'rgb(var(--color-primary-dark))',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(var(--color-primary), 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Filter Controls */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(12px)',
          padding: '0.5rem 1rem',
          borderRadius: '12px',
          border: '1px solid var(--glass-border)',
        }}>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => handleFilterChange(f)}
              style={{
                padding: '0.5rem 1rem',
                background: filter === f ? 'rgb(var(--color-primary-dark))' : 'transparent',
                color: filter === f ? 'white' : 'rgb(var(--color-text-muted))',
                border: filter === f ? 'none' : '1px solid transparent',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {(f.charAt(0).toUpperCase() + f.slice(1)) || ('' as typeof f)}
            </button>
          ))}
        </div>

        {/* Task List */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}>
          {tasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                textAlign: 'center',
                padding: '3rem 1rem',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
              }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}><CheckCircle className="w-12 h-12 mx-auto" style={{ color: 'rgb(var(--color-primary-dark))', opacity: 0.5 }} /></div>
              <p style={{ color: 'rgb(var(--color-text-muted))', marginBottom: '0.5rem' }}>
                Your list is empty...
              </p>
              <p style={{ fontSize: '0.85rem', color: 'rgb(var(--color-text-muted))' }}>
                Add a task above to get started!
              </p>
            </motion.div>
          ) : (
            displayedTasks.map((task, idx) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <TaskItem
                  task={task}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                />
              </motion.div>
            ))
          )}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '0.75rem 1.5rem',
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(12px)',
            borderRadius: '12px',
            border: '1px solid var(--glass-border)',
          }}
        >
          <span style={{ fontWeight: 500, color: 'rgb(var(--color-primary-dark))' }}>
            {tasks.filter(t => !t.completed).length} pending
          </span>
          <span style={{ fontWeight: 500, color: 'rgb(var(--color-text-muted))' }}>
            {tasks.filter(t => t.completed).length} completed
          </span>
        </motion.div>

        {/* Keyboard Shortcuts Tip */}
        <p className="hidden sm:block" style={{
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'rgb(var(--color-text-muted))',
          marginTop: '0.5rem',
        }}>
          Press <kbd style={{ padding: '2px 6px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '4px' }}>⌘K</kbd> for command palette
        </p>
      </main>
    </div>
  );
}

export default App;
