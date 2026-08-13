import { useState } from 'react';
import { motion } from 'framer-motion';
import { Menu, Sun, Moon, Search, Command, Plus, Bell, Settings, ChevronDown, User, CheckCheck } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore, usePreferences } from '../../lib/store';
import { Button } from '../ui';
import { useDarkMode } from '../../lib/hooks';

interface HeaderProps {
  onMenuClick: () => void;
  onNewTask: () => void;
  onSearch: () => void;
  onSettings: () => void;
}

export function Header({ onMenuClick, onNewTask, onSearch, onSettings }: HeaderProps) {
  const { theme } = usePreferences();
  const { updatePreferences } = useStore();
  const isDark = useDarkMode();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const themeOptions = [
    { value: 'light' as const, label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark' as const, label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system' as const, label: 'System', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-sticky glass-panel border-b border-border-light/50 dark:border-border-dark/50">
      <div className="max-w-full mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Left side - Menu & Title */}
        <div className="flex items-center gap-3">
          <Button
            variant="icon"
            size="md"
            onClick={onMenuClick}
            aria-label="Toggle sidebar"
            className="lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="hidden sm:flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
              <CheckCheck className="w-5 h-5 text-white" />
            </div>
            <span className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary">To-Do List</span>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4 hidden md:block">
          <Button
            variant="ghost"
            className="w-full justify-start px-4"
            onClick={onSearch}
            icon={<Search className="w-4 h-4" />}
            aria-label="Search tasks (⌘K)"
          >
            <span className="text-text-muted dark:text-text-dark-muted">Search tasks...</span>
            <kbd className="ml-auto text-xs text-text-muted/50 dark:text-text-dark-muted/50 px-1.5 py-0.5 rounded bg-primary-100/50 dark:bg-primary-900/30 font-mono">
              ⌘K
            </kbd>
          </Button>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <div className="relative">
            <Button
              variant="icon"
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              aria-label="Change theme"
              aria-expanded={showThemeMenu}
            >
              {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </Button>
            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-2 glass-card rounded-xl shadow-glow-lg min-w-[140px] z-popover animate-slide-down"
                role="menu"
              >
                {themeOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    role="menuitem"
                    onClick={() => { updatePreferences({ theme: opt.value }); setShowThemeMenu(false); }}
                    className={cn(
                      'w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors',
                      theme === opt.value
                        ? 'bg-primary-50/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                    )}
                    tabIndex={-1}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                    {theme === opt.value && <ChevronDown className="ml-auto w-4 h-4 text-primary-500" />}
                  </button>
                ))}
              </motion.div>
            )}
          </div>

          {/* Notifications */}
          <Button variant="icon" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </Button>

          {/* New Task Button */}
          <Button
            variant="primary"
            size="md"
            onClick={onNewTask}
            icon={<Plus className="w-4 h-4" />}
            className="hidden sm:flex"
            aria-label="New task (⌘N)"
          >
            New Task
            <kbd className="ml-2 text-xs text-white/70 px-1.5 py-0.5 rounded bg-white/20 font-mono">⌘N</kbd>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onNewTask}
            icon={<Plus className="w-5 h-5" />}
            className="sm:hidden"
            aria-label="New task"
          />

          {/* Profile Menu */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              aria-label="User menu"
              aria-expanded={showProfileMenu}
              className="gap-2"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-primary flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
            {showProfileMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute right-0 top-full mt-2 glass-card rounded-xl shadow-glow-lg min-w-[180px] z-popover animate-slide-down"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  onClick={onSettings}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => { setShowProfileMenu(false); }}
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-primary-50/50 dark:hover:bg-primary-900/20"
                >
                  <Command className="w-4 h-4" />
                  Keyboard Shortcuts
                </button>
                <div className="border-t border-border-light/50 dark:border-border-dark/50 my-1" />
                <button
                  type="button"
                  role="menuitem"
                  className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-red-500 hover:bg-red-50/50 dark:hover:bg-red-900/20"
                >
                  <User className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}