import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Plus, Calendar, Folder, Check, Flag, Bell, Copy, Trash2, Settings, X } from 'lucide-react';
import { useTodoStore } from '../../store/store';
import type { Task } from '../../store/store';

interface Command {
  id: string;
  title: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  section: string;
}

export function CommandPalette() {
  const { tasks, addTask, toggleTask, deleteTask, setFilter } = useTodoStore();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Open with Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleOpen = () => setOpen(true);
    window.addEventListener('todo:open-command-palette', handleOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('todo:open-command-palette', handleOpen);
    };
  }, []);

  // Focus input when open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: Command[] = [
    {
      id: 'new-task',
      title: 'New Task',
      icon: <Plus className="w-4 h-4" />,
      shortcut: '⌘N',
      action: () => {
        const title = window.prompt('Enter task title:');
        if (title?.trim()) {
          addTask({ title: title.trim() });
        }
        setOpen(false);
        setQuery('');
      },
      section: 'Actions',
    },
    {
      id: 'all-tasks',
      title: 'All Tasks',
      icon: <Folder className="w-4 h-4" />,
      shortcut: '⌘A',
      action: () => { setFilter('all'); setOpen(false); },
      section: 'Views',
    },
    {
      id: 'active',
      title: 'Active Tasks',
      icon: <Check className="w-4 h-4" />,
      action: () => { setFilter('active'); setOpen(false); },
      section: 'Views',
    },
    {
      id: 'completed',
      title: 'Completed',
      icon: <Check className="w-4 h-4" />,
      action: () => { setFilter('completed'); setOpen(false); },
      section: 'Views',
    },
    {
      id: 'high-priority',
      title: 'High Priority',
      icon: <Flag className="w-4 h-4" />,
      shortcut: '⌘H',
      action: () => { setFilter('high-priority'); setOpen(false); },
      section: 'Views',
    },
    {
      id: 'overdue',
      title: 'Overdue',
      icon: <Bell className="w-4 h-4" />,
      action: () => { setFilter('overdue'); setOpen(false); },
      section: 'Views',
    },
  ];

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.shortcut?.toLowerCase().includes(query.toLowerCase())
    );
  }, [query, commands]);

  const handleSelect = useCallback((cmd: Command) => {
    cmd.action();
  }, []);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay-bg)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          background: 'var(--modal-bg)',
          backdropFilter: 'blur(16px)',
          borderRadius: '14px',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '70vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div style={{ padding: '1rem', borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search className="w-5 h-5" style={{ position: 'absolute', left: '1rem', color: 'rgb(var(--color-text-muted))' }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tasks, commands..."
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                fontSize: '1rem',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: 'rgb(var(--color-text-primary))',
              }}
            />
            <kbd
              className="hidden sm:inline-block"
              style={{
                position: 'absolute',
                right: '1rem',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                background: 'rgba(0, 0, 0, 0.05)',
                fontSize: '0.75rem',
                color: 'rgb(var(--color-text-muted))',
              }}
            >
              ESC
            </kbd>
          </div>
        </div>

        {/* Commands List */}
        <div style={{ overflowY: 'auto', maxHeight: 'calc(70vh - 60px)' }}>
          {filteredCommands.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
              <Search className="w-12 h-12 mx-auto mb-2" style={{ color: 'rgb(var(--color-text-muted))' }} />
              <p style={{ color: 'rgb(var(--color-text-muted))' }}>No commands found for "{query}"</p>
            </div>
          ) : (
            <div>
              {filteredCommands.map((cmd) => (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: 'none',
                    background: 'transparent',
                    color: 'rgb(var(--color-text-primary))',
                    cursor: 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(216, 180, 234, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, textAlign: 'left' }}>
                    {cmd.icon}
                    {cmd.title}
                  </span>
                  {cmd.shortcut && (
                    <kbd
                      className="hidden sm:inline-block"
                      style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: 'rgba(0, 0, 0, 0.05)',
                        fontSize: '0.75rem',
                        color: 'rgb(var(--color-text-muted))',
                      }}
                    >
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CommandPalette;
