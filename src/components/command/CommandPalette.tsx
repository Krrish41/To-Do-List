import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command as CommandIcon, ChevronRight, Check, Calendar, Flag, Folder, Plus, Settings, Trash2, Copy, Clock, Bell } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import { Button, Input } from '../ui';

interface Command {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  shortcut?: string;
  keywords: string[];
  action: () => void;
  section?: string;
}

export function CommandPalette({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    projects,
    toggleTaskComplete,
    duplicateTask,
    removeTask,
    setFilter,
    setCommandPaletteOpen,
    toggleSidebar,
    addToast,
    ui,
  } = useStore();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build commands
  const commands = useMemo<Command[]>(() => {
    const cmds: Command[] = [
      // Task commands
      {
        id: 'new-task',
        title: 'New Task',
        description: 'Create a new task',
        icon: <Plus className="w-4 h-4" />,
        shortcut: '⌘N',
        keywords: ['new', 'create', 'add', 'task'],
        action: () => {
          setCommandPaletteOpen(false);
          window.dispatchEvent(new CustomEvent('todo:new-task'));
        },
        section: 'Tasks',
      },
      {
        id: 'search-tasks',
        title: 'Search Tasks',
        description: 'Search across all tasks',
        icon: <Search className="w-4 h-4" />,
        shortcut: '⌘K',
        keywords: ['search', 'find', 'filter'],
        action: () => {
          setCommandPaletteOpen(false);
          const input = document.querySelector('input[placeholder="Search tasks..."]') as HTMLInputElement;
          input?.focus();
        },
        section: 'Tasks',
      },
      // View commands
      {
        id: 'view-all',
        title: 'All Tasks',
        description: 'Show all tasks',
        icon: <Folder className="w-4 h-4" />,
        keywords: ['all', 'view', 'show'],
        action: () => { setFilter({ type: 'all' }); setCommandPaletteOpen(false); },
        section: 'Views',
      },
      {
        id: 'view-today',
        title: 'Today',
        description: 'Tasks due today',
        icon: <Calendar className="w-4 h-4" />,
        shortcut: '⌘⇧T',
        keywords: ['today', 'due', 'now'],
        action: () => { setFilter({ type: 'today' }); setCommandPaletteOpen(false); addToast({ type: 'info', title: 'Filtered: Today' }); },
        section: 'Views',
      },
      {
        id: 'view-upcoming',
        title: 'Upcoming',
        description: 'Tasks due this week',
        icon: <Clock className="w-4 h-4" />,
        shortcut: '⌘⇧U',
        keywords: ['upcoming', 'week', 'soon'],
        action: () => { setFilter({ type: 'upcoming' }); setCommandPaletteOpen(false); addToast({ type: 'info', title: 'Filtered: Upcoming' }); },
        section: 'Views',
      },
      {
        id: 'view-overdue',
        title: 'Overdue',
        description: 'Overdue tasks',
        icon: <Bell className="w-4 h-4" />,
        shortcut: '⌘⇧O',
        keywords: ['overdue', 'late', 'missed'],
        action: () => { setFilter({ type: 'overdue' }); setCommandPaletteOpen(false); addToast({ type: 'info', title: 'Filtered: Overdue' }); },
        section: 'Views',
      },
      {
        id: 'view-high-priority',
        title: 'High Priority',
        description: 'High priority tasks',
        icon: <Flag className="w-4 h-4" />,
        shortcut: '⌘⇧H',
        keywords: ['priority', 'high', 'important', 'flagged'],
        action: () => { setFilter({ type: 'high-priority' }); setCommandPaletteOpen(false); addToast({ type: 'info', title: 'Filtered: High Priority' }); },
        section: 'Views',
      },
      {
        id: 'view-completed',
        title: 'Completed',
        description: 'Show completed tasks',
        icon: <Check className="w-4 h-4" />,
        keywords: ['completed', 'done', 'finished'],
        action: () => { setFilter({ type: 'completed' }); setCommandPaletteOpen(false); },
        section: 'Views',
      },
      // Project commands
      ...Object.values(projects).map(project => ({
        id: `project-${project.id}`,
        title: project.name,
        description: `Switch to ${project.name} project`,
        icon: <Folder className="w-4 h-4" style={{ color: project.color }} />,
        keywords: ['project', project.name.toLowerCase()],
        action: () => { setFilter({ type: 'all', projectId: project.id }); setCommandPaletteOpen(false); },
        section: 'Projects',
      })),
      // UI commands
      {
        id: 'toggle-sidebar',
        title: 'Toggle Sidebar',
        description: 'Show/hide sidebar',
        icon: <Folder className="w-4 h-4" />,
        shortcut: '⌘\\',
        keywords: ['sidebar', 'toggle', 'hide', 'show'],
        action: () => { toggleSidebar(); setCommandPaletteOpen(false); },
        section: 'UI',
      },
      {
        id: 'open-settings',
        title: 'Settings',
        description: 'Open settings',
        icon: <Settings className="w-4 h-4" />,
        shortcut: '⌘,',
        keywords: ['settings', 'preferences', 'config'],
        action: () => { setCommandPaletteOpen(false); window.dispatchEvent(new CustomEvent('todo:open-settings')); },
        section: 'UI',
      },
      // Task actions (when a task is selected)
      ...(ui.selectedTaskIds.length > 0 ? [
        {
          id: 'complete-selected',
          title: 'Mark Selected Complete',
          description: `Complete ${ui.selectedTaskIds.length} task(s)`,
          icon: <Check className="w-4 h-4" />,
          shortcut: '⌘⏎',
          keywords: ['complete', 'done', 'finish', 'selected'],
          action: () => { ui.selectedTaskIds.forEach(id => toggleTaskComplete(id)); setCommandPaletteOpen(false); },
          section: 'Selection',
        },
        {
          id: 'delete-selected',
          title: 'Delete Selected',
          description: `Delete ${ui.selectedTaskIds.length} task(s)`,
          icon: <Trash2 className="w-4 h-4" />,
          shortcut: '⌘⌫',
          keywords: ['delete', 'remove', 'selected'],
          action: () => { ui.selectedTaskIds.forEach(id => removeTask(id)); addToast({ type: 'success', title: 'Tasks deleted' }); setCommandPaletteOpen(false); },
          section: 'Selection',
        },
        {
          id: 'duplicate-selected',
          title: 'Duplicate Selected',
          description: `Duplicate ${ui.selectedTaskIds.length} task(s)`,
          icon: <Copy className="w-4 h-4" />,
          keywords: ['duplicate', 'copy', 'selected'],
          action: async () => { for (const id of ui.selectedTaskIds) await duplicateTask(id); addToast({ type: 'success', title: 'Tasks duplicated' }); setCommandPaletteOpen(false); },
          section: 'Selection',
        },
      ] : []),
      // Help
      {
        id: 'keyboard-shortcuts',
        title: 'Keyboard Shortcuts',
        description: 'Show all keyboard shortcuts',
        icon: <CommandIcon className="w-4 h-4" />,
        shortcut: '⌘/',
        keywords: ['shortcuts', 'keys', 'help', 'keyboard'],
        action: () => { setShowHelp(true); },
        section: 'Help',
      },
    ];
    return cmds;
  }, [projects, ui.selectedTaskIds, setFilter, toggleSidebar, toggleTaskComplete, removeTask, duplicateTask, addToast, setCommandPaletteOpen]);

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const searchTerms = query.toLowerCase().split(' ').filter(Boolean);
    return commands
      .map(cmd => {
        const matchScore = searchTerms.reduce((score, term) => {
          const inTitle = cmd.title.toLowerCase().includes(term) ? 10 : 0;
          const inDesc = cmd.description?.toLowerCase().includes(term) ? 5 : 0;
          const inKeywords = cmd.keywords.some(k => k.includes(term)) ? 8 : 0;
          const inShortcut = cmd.shortcut?.toLowerCase().includes(term) ? 3 : 0;
          return score + inTitle + inDesc + inKeywords + inShortcut;
        }, 0);
        return { cmd, matchScore };
      })
      .filter(({ matchScore }) => matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
      .map(({ cmd }) => cmd);
  }, [commands, query]);

  // Group commands by section
  const groupedCommands = useMemo(() => {
    const groups: Record<string, Command[]> = {};
    filteredCommands.forEach(cmd => {
      const section = cmd.section || 'Other';
      if (!groups[section]) groups[section] = [];
      groups[section].push(cmd);
    });
    return groups;
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      const totalCommands = filteredCommands.length;
      if (totalCommands === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => Math.min(prev + 1, totalCommands - 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => Math.max(prev - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          const selected = filteredCommands[selectedIndex];
          if (selected) {
            selected.action();
          }
          break;
        case 'Escape':
          if (showHelp) {
            setShowHelp(false);
          } else {
            onClose();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, showHelp, onClose]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setShowHelp(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedElement = listRef.current?.querySelector('[data-selected="true"]');
    selectedElement?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex, filteredCommands]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="command-palette command-palette-open"
      >
        <motion.div
          ref={listRef}
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="command-palette-content"
        >
          {/* Input */}
          <div className="p-4 border-b border-border-light/50 dark:border-border-dark/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted/50 dark:text-text-dark-muted/50" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a command or search..."
                className="w-full pl-10 pr-4 py-3 text-body bg-transparent border-0 focus:outline-none text-text-primary dark:text-text-dark-primary placeholder:text-text-muted/50 dark:placeholder:text-text-dark-muted/50"
                autoFocus
                spellCheck={false}
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-2 py-1 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Help Modal */}
          {showHelp && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-xl flex items-center justify-center p-4"
              onClick={() => setShowHelp(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary">Keyboard Shortcuts</h2>
                    <button onClick={() => setShowHelp(false)} className="btn-icon p-1" aria-label="Close">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { category: 'Global', shortcuts: [
                        { key: '⌘N', desc: 'New Task' },
                        { key: '⌘K', desc: 'Command Palette / Search' },
                        { key: '⌘/', desc: 'Show Keyboard Shortcuts' },
                        { key: '⌘\\', desc: 'Toggle Sidebar' },
                        { key: '⌘,', desc: 'Settings' },
                      ]},
                      { category: 'Navigation', shortcuts: [
                        { key: '↑/↓', desc: 'Navigate Tasks' },
                        { key: 'Enter', desc: 'Open Task' },
                        { key: '⌘⏎', desc: 'Toggle Complete' },
                        { key: '⌘D', desc: 'Set Due Date' },
                        { key: '⌘P', desc: 'Set Project' },
                        { key: '⌘1/2/3', desc: 'Set Priority (High/Med/Low)' },
                        { key: '⌘0', desc: 'Clear Priority' },
                      ]},
                      { category: 'Filters', shortcuts: [
                        { key: '⌘⇧T', desc: 'Filter: Today' },
                        { key: '⌘⇧U', desc: 'Filter: Upcoming' },
                        { key: '⌘⇧O', desc: 'Filter: Overdue' },
                        { key: '⌘⇧H', desc: 'Filter: High Priority' },
                      ]},
                      { category: 'Selection', shortcuts: [
                        { key: '⌘A', desc: 'Select All' },
                        { key: '⌘⌫', desc: 'Delete Selected' },
                        { key: 'Escape', desc: 'Clear Selection / Close' },
                      ]},
                    ].map(cat => (
                      <div key={cat.category} className="space-y-2">
                        <h3 className="text-caption font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider">{cat.category}</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {cat.shortcuts.map(s => (
                            <div key={s.key} className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary-50/50 dark:bg-primary-900/30">
                              <kbd className="font-mono text-sm text-primary-700 dark:text-primary-300 px-2 py-1 rounded bg-primary-100/50 dark:bg-primary-800/50">
                                {s.key}
                              </kbd>
                              <span className="text-body-sm text-text-secondary dark:text-text-dark-secondary ml-3">{s.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Commands List */}
          <div ref={listRef} className="max-h-[50vh] overflow-y-auto">
            {filteredCommands.length === 0 && !query && (
              <div className="p-8 text-center">
                <CommandIcon className="w-12 h-12 mx-auto text-primary-300/50 dark:text-primary-700/50 mb-3" />
                <p className="text-text-muted dark:text-text-dark-muted">Type to search commands...</p>
                <p className="text-caption text-text-muted/50 dark:text-text-dark-muted/50 mt-1">Press <kbd className="px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">⌘/</kbd> for shortcuts</p>
              </div>
            )}

            {filteredCommands.length === 0 && query && (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto text-primary-300/50 dark:text-primary-700/50 mb-3" />
                <p className="text-text-muted dark:text-text-dark-muted">No commands found for "{query}"</p>
              </div>
            )}

            {Object.entries(groupedCommands).map(([section, cmds]) => (
              <div key={section} className="py-2">
                <h3 className="px-4 py-1.5 text-caption font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider">
                  {section}
                </h3>
                {cmds.map((cmd) => {
                  const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                  const isSelected = globalIndex === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      type="button"
                      onClick={() => cmd.action()}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                      className={cn(
                        'w-full px-4 py-2.5 flex items-center gap-3 text-left rounded-xl transition-colors',
                        isSelected
                          ? 'bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/20 text-text-primary dark:text-text-dark-primary'
                      )}
                      data-selected={isSelected}
                    >
                      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                        {cmd.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{cmd.title}</p>
                        {cmd.description && (
                          <p className="text-body-sm text-text-muted/70 dark:text-text-dark-muted/70 truncate">
                            {cmd.description}
                          </p>
                        )}
                      </div>
                      {cmd.shortcut && (
                        <kbd className="flex-shrink-0 text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-2 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">
                          {cmd.shortcut}
                        </kbd>
                      )}
                      {isSelected && (
                        <ChevronRight className="flex-shrink-0 w-4 h-4 text-primary-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}