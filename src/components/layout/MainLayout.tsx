import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../lib/store';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { TaskList } from '../tasks/TaskList';
import { TaskForm } from '../tasks/TaskForm';
import { ToastContainer } from '../ui/Toast';
import { ConfirmDialog } from '../ui/Modal';
import { CommandPalette } from '../command/CommandPalette';
import { SettingsModal } from '../settings/SettingsModal';
import type { Task } from '../../types';

export function MainLayout() {
  const { ui, initialize, addTask, updateTask, removeTask, setEditingTaskId, toggleSidebar, setCommandPaletteOpen } = useStore();
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      await initialize();
      setIsInitialized(true);
    };
    init();
  }, [initialize]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'n' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setEditingTaskId(undefined);
        window.dispatchEvent(new CustomEvent('todo:new-task'));
      }
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
      if (e.key === '/') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
      }
      if (e.key === 'Escape') {
        setEditingTaskId(undefined);
        setSelectedTask(null);
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setEditingTaskId, setCommandPaletteOpen]);

  // Listen for new task event
  useEffect(() => {
    const handleNewTask = () => {
      setEditingTaskId(undefined);
    };
    window.addEventListener('todo:new-task', handleNewTask);
    return () => window.removeEventListener('todo:new-task', handleNewTask);
  }, [setEditingTaskId]);

  // Listen for settings event
  useEffect(() => {
    const handleSettings = () => {
      setShowSettings(true);
    };
    window.addEventListener('todo:open-settings', handleSettings);
    return () => window.removeEventListener('todo:open-settings', handleSettings);
  }, []);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-surface dark:bg-gradient-surface-dark">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow animate-pulse-soft">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <p className="text-body text-text-muted dark:text-text-dark-muted">Loading To-Do List...</p>
          <div className="w-40 h-2 bg-primary-100/50 dark:bg-primary-900/30 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, ease: 'easeInOut' }}
              className="h-full bg-gradient-primary rounded-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setEditingTaskId(task.id);
  };

  const handleNewTask = async (data: Partial<Task>) => {
    await addTask(data as Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>);
  };

  const handleEditTask = async (data: Partial<Task>) => {
    if (selectedTask) {
      await updateTask(selectedTask.id, data);
    }
  };

  const handleDeleteTask = async () => {
    if (showConfirmDelete) {
      await removeTask(showConfirmDelete);
      setShowConfirmDelete(null);
      setEditingTaskId(undefined);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface dark:bg-gradient-surface-dark">
      {/* Sidebar */}
      <Sidebar
        isOpen={ui.sidebarOpen}
        onClose={toggleSidebar}
        onProjectSelect={() => {}}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-72 min-w-0">
        {/* Header */}
        <Header
          onMenuClick={toggleSidebar}
          onNewTask={() => { setEditingTaskId(undefined); }}
          onSearch={() => { setCommandPaletteOpen(true); }}
          onSettings={() => { setShowSettings(true); }}
        />

        {/* Content */}
        <div className="p-4 lg:p-6 max-w-5xl mx-auto">
          <TaskList
            showProjectColumn={true}
            onTaskClick={handleTaskClick}
          />
        </div>
      </main>

      {/* Task Form Modal */}
      <AnimatePresence>
        {ui.editingTaskId !== undefined || ui.editingTaskId === '' ? (
          selectedTask ? (
            <TaskForm
              task={selectedTask}
              onClose={() => { setEditingTaskId(undefined); setSelectedTask(null); }}
              onSubmit={handleEditTask}
            />
          ) : (
            <TaskForm
              task={null}
              onClose={() => { setEditingTaskId(undefined); setSelectedTask(null); }}
              onSubmit={handleNewTask}
            />
          )
        ) : null}
      </AnimatePresence>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!showConfirmDelete}
        onClose={() => setShowConfirmDelete(null)}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />

      {/* Command Palette */}
      <CommandPalette
        isOpen={ui.commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Toasts */}
      <ToastContainer />
    </div>
  );
}