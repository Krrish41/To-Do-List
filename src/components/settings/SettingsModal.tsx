import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Palette, Database, Keyboard, Bell, Trash2, Download, RefreshCw, Settings } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import type { UserPreferences } from '../../types';
import { Modal, Button, Input, Select, Switch } from '../ui';

const DENSITY_OPTIONS = [
  { value: 'compact', label: 'Compact', description: 'Tighter spacing, more tasks visible' },
  { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing (default)' },
  { value: 'spacious', label: 'Spacious', description: 'More breathing room' },
];

const SORT_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const DATE_FORMAT_OPTIONS = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const TIME_FORMAT_OPTIONS = [
  { value: '12h', label: '12 Hour (AM/PM)' },
  { value: '24h', label: '24 Hour' },
];

export function SettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { preferences, updatePreferences, resetPreferences, addToast } = useStore();
  const [activeTab, setActiveTab] = useState<'general' | 'appearance' | 'behavior' | 'notifications' | 'data'>('general');
  const [localPrefs, setLocalPrefs] = useState<UserPreferences>(preferences);

  // Sync local prefs with store
  useEffect(() => {
    setLocalPrefs(preferences);
  }, [preferences]);

  const handleChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setLocalPrefs(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    await updatePreferences(localPrefs);
    addToast({ type: 'success', title: 'Settings saved' });
    onClose();
  };

  const handleReset = async () => {
    await resetPreferences();
    setLocalPrefs(preferences);
    addToast({ type: 'success', title: 'Settings reset to defaults' });
  };

  const handleExport = async () => {
    const { exportAllData } = await import('../../lib/storage');
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast({ type: 'success', title: 'Data exported' });
  };

  const handleImport = async (file: File) => {
    const { importData } = await import('../../lib/storage');
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importData(data);
      addToast({ type: 'success', title: 'Data imported successfully' });
      onClose();
      window.location.reload();
    } catch {
      addToast({ type: 'error', title: 'Import failed', message: 'Invalid file format' });
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: <Settings className="w-4 h-4" /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette className="w-4 h-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Keyboard className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      size="lg"
      showCloseButton={true}
    >
      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1" role="tablist" aria-label="Settings categories">
            {tabs.map(tab => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={cn(
                  'w-full px-3 py-2.5 rounded-xl text-left text-sm font-medium transition-all',
                  activeTab === tab.id
                    ? 'bg-primary-100/50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'text-text-secondary dark:text-text-dark-secondary hover:bg-primary-50/50 dark:hover:bg-primary-900/20'
                )}
              >
                <span className="flex items-center gap-2">
                  {tab.icon}
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 overflow-y-auto max-h-[60vh] pr-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* General Tab */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Language & Region</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Date Format"
                        options={DATE_FORMAT_OPTIONS}
                        value={localPrefs.dateFormat}
                        onChange={(v) => handleChange('dateFormat', v as UserPreferences['dateFormat'])}
                      />
                      <Select
                        label="Time Format"
                        options={TIME_FORMAT_OPTIONS}
                        value={localPrefs.timeFormat}
                        onChange={(v) => handleChange('timeFormat', v as UserPreferences['timeFormat'])}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Select
                        label="Week Starts On"
                        options={[
                          { value: '0', label: 'Sunday' },
                          { value: '1', label: 'Monday' },
                        ]}
                        value={String(localPrefs.startOfWeek)}
                        onChange={(v) => handleChange('startOfWeek', parseInt(v) as 0 | 1)}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Default Views</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Default View"
                        options={[
                          { value: 'list', label: 'List' },
                          { value: 'board', label: 'Board (Kanban)' },
                          { value: 'calendar', label: 'Calendar' },
                        ]}
                        value={localPrefs.defaultView}
                        onChange={(v) => handleChange('defaultView', v as UserPreferences['defaultView'])}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Appearance Tab */}
              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Theme</h3>
                    <Select
                      label="Color Theme"
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'system', label: 'System' },
                      ]}
                      value={localPrefs.theme}
                      onChange={(v) => handleChange('theme', v as UserPreferences['theme'])}
                    />
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Density</h3>
                    <Select
                      label="List Density"
                      options={DENSITY_OPTIONS}
                      value={localPrefs.density}
                      onChange={(v) => handleChange('density', v as UserPreferences['density'])}
                    />
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Animations</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-text-primary dark:text-text-dark-primary">Enable Animations</p>
                        <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Smooth transitions and micro-interactions</p>
                      </div>
                      <Switch
                        checked={localPrefs.animations}
                        onChange={(e) => handleChange('animations', e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Behavior Tab */}
              {activeTab === 'behavior' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Task Behavior</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Show Completed Tasks</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Display completed tasks in lists</p>
                        </div>
                        <Switch
                          checked={localPrefs.showCompletedTasks}
                          onChange={(e) => handleChange('showCompletedTasks', e.target.checked)}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Auto-hide Completed</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Automatically collapse completed tasks</p>
                        </div>
                        <Switch
                          checked={localPrefs.autoHideCompleted}
                          onChange={(e) => handleChange('autoHideCompleted', e.target.checked)}
                        />
                      </label>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Default Sorting</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select
                        label="Sort By"
                        options={SORT_OPTIONS}
                        value={localPrefs.sortBy}
                        onChange={(v) => handleChange('sortBy', v as UserPreferences['sortBy'])}
                      />
                      <Select
                        label="Sort Order"
                        options={[
                          { value: 'asc', label: 'Ascending' },
                          { value: 'desc', label: 'Descending' },
                        ]}
                        value={localPrefs.sortOrder}
                        onChange={(v) => handleChange('sortOrder', v as UserPreferences['sortOrder'])}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Keyboard Shortcuts</h3>
                    <label className="flex items-center justify-between cursor-pointer">
                      <div>
                        <p className="font-medium text-text-primary dark:text-text-dark-primary">Enable Keyboard Shortcuts</p>
                        <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Use ⌘N for new task, ⌘K for search, etc.</p>
                      </div>
                      <Switch
                        checked={localPrefs.keyboardShortcuts}
                        onChange={(e) => handleChange('keyboardShortcuts', e.target.checked)}
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Notification Preferences</h3>
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Enable Notifications</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Receive browser notifications</p>
                        </div>
                        <Switch
                          checked={localPrefs.notifications.enabled}
                          onChange={(e) => handleChange('notifications', { ...localPrefs.notifications, enabled: e.target.checked })}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Due Soon Reminders</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Notify when tasks are due soon</p>
                        </div>
                        <Switch
                          checked={localPrefs.notifications.dueSoon}
                          onChange={(e) => handleChange('notifications', { ...localPrefs.notifications, dueSoon: e.target.checked })}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Overdue Alerts</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Notify when tasks become overdue</p>
                        </div>
                        <Switch
                          checked={localPrefs.notifications.overdue}
                          onChange={(e) => handleChange('notifications', { ...localPrefs.notifications, overdue: e.target.checked })}
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-dark-primary">Daily Digest</p>
                          <p className="text-body-sm text-text-muted dark:text-text-dark-muted">Receive a summary each morning</p>
                        </div>
                        <Switch
                          checked={localPrefs.notifications.dailyDigest}
                          onChange={(e) => handleChange('notifications', { ...localPrefs.notifications, dailyDigest: e.target.checked })}
                        />
                      </label>
                    </div>
                  </div>

                  {localPrefs.notifications.dailyDigest && (
                    <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                      <Input
                        label="Digest Time"
                        type="time"
                        value={localPrefs.notifications.digestTime}
                        onChange={(e) => handleChange('notifications', { ...localPrefs.notifications, digestTime: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Data Tab */}
              {activeTab === 'data' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Export Data</h3>
                    <p className="text-body-sm text-text-muted dark:text-text-dark-muted mb-4">
                      Download all your tasks, projects, tags, and settings as a JSON file.
                    </p>
                    <Button
                      variant="secondary"
                      icon={<Download className="w-4 h-4" />}
                      onClick={handleExport}
                    >
                      Export All Data
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Import Data</h3>
                    <p className="text-body-sm text-text-muted dark:text-text-dark-muted mb-4">
                      Import tasks from a previously exported JSON file. This will merge with existing data.
                    </p>
                    <Input
                      type="file"
                      accept=".json"
                      onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
                    />
                  </div>

                  <div className="pt-4 border-t border-border-light/50 dark:border-border-dark/50">
                    <h3 className="text-body font-semibold text-text-primary dark:text-text-dark-primary mb-4">Danger Zone</h3>
                    <p className="text-body-sm text-text-muted dark:text-text-dark-muted mb-4">
                      These actions are irreversible. Please be careful.
                    </p>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="danger"
                        icon={<Trash2 className="w-4 h-4" />}
                        onClick={() => {
                          if (confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
                            localStorage.clear();
                            indexedDB.deleteDatabase('todo-app-db');
                            window.location.reload();
                          }
                        }}
                      >
                        Delete All Data
                      </Button>
                      <Button
                        variant="secondary"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={handleReset}
                      >
                        Reset Settings
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border-light/50 dark:border-border-dark/50 mt-6">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} icon={<Download className="w-4 h-4" />}>
          Save Changes
        </Button>
      </div>
    </Modal>
  );
}