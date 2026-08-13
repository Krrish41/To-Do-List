import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Inbox,
  Sun,
  Calendar,
  Flag,
  Folder,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCheck,
  Settings,
  Archive,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../lib/store';
import { Button, Input, Dropdown } from '../ui';

const SMART_PROJECTS: Array<{ id: string; name: string; icon: React.ReactNode; color: string; count: (tasks: Record<string, any>) => number }> = [
  {
    id: 'inbox',
    name: 'Inbox',
    icon: <Inbox className="w-5 h-5" />,
    color: '#a855f7',
    count: (tasks) => Object.values(tasks).filter((t: any) => t.projectId === 'inbox' && t.status === 'active').length,
  },
  {
    id: 'today',
    name: 'Today',
    icon: <Sun className="w-5 h-5" />,
    color: '#ec4899',
    count: (tasks) => Object.values(tasks).filter((t: any) => t.dueDate && t.status === 'active' && new Date(t.dueDate).toDateString() === new Date().toDateString()).length,
  },
  {
    id: 'upcoming',
    name: 'Upcoming',
    icon: <Calendar className="w-5 h-5" />,
    color: '#f97316',
    count: (tasks) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      return Object.values(tasks).filter((t: any) => {
        if (!t.dueDate || t.status !== 'active') return false;
        const due = new Date(t.dueDate);
        return due >= tomorrow && due <= nextWeek;
      }).length;
    },
  },
  {
    id: 'flagged',
    name: 'Flagged',
    icon: <Flag className="w-5 h-5" />,
    color: '#ef4444',
    count: (tasks) => Object.values(tasks).filter((t: any) => t.priority === 'high' && t.status === 'active').length,
  },
  {
    id: 'completed',
    name: 'Completed',
    icon: <CheckCheck className="w-5 h-5" />,
    color: '#22c55e',
    count: (tasks) => Object.values(tasks).filter((t: any) => t.status === 'completed').length,
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectSelect: (projectId: string) => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { projects, filter, setFilter, addProject, removeProject, updateProject, addToast } = useStore();
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#a855f7');
  const [newProjectIcon, setNewProjectIcon] = useState('folder');
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectName, setEditProjectName] = useState('');

  const projectColors = [
    '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#ef4444',
    '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6',
  ];

  const projectIcons = [
    'folder', 'briefcase', 'home', 'book', 'music', 'film',
    'camera', 'gamepad', 'dumbbell', 'heart', 'star', 'tag',
    'archive', 'inbox', 'flag', 'bell', 'calendar', 'clock',
    'target', 'rocket',
  ];

  const userProjects = Object.values(projects).filter(p => !['inbox', 'today', 'upcoming', 'flagged', 'completed'].includes(p.id));
  const sortedProjects = [...userProjects].sort((a, b) => a.order - b.order);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    await addProject({
      name: newProjectName.trim(),
      color: newProjectColor,
      icon: newProjectIcon,
      description: '',
    });
    setShowCreateProject(false);
    setNewProjectName('');
    addToast({ type: 'success', title: 'Project created' });
  };

  const handleUpdateProject = async (id: string) => {
    if (!editProjectName.trim()) return;
    await updateProject(id, { name: editProjectName.trim() });
    setEditingProjectId(null);
    addToast({ type: 'success', title: 'Project updated' });
  };

  const handleDeleteProject = async (id: string) => {
    await removeProject(id);
    addToast({ type: 'success', title: 'Project deleted' });
  };

  const getIconComponent = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      folder: <Folder className="w-5 h-5" />,
      briefcase: <Folder className="w-5 h-5" />,
      home: <Inbox className="w-5 h-5" />,
      book: <Folder className="w-5 h-5" />,
      music: <Folder className="w-5 h-5" />,
      film: <Folder className="w-5 h-5" />,
      camera: <Folder className="w-5 h-5" />,
      gamepad: <Folder className="w-5 h-5" />,
      dumbbell: <Folder className="w-5 h-5" />,
      heart: <Flag className="w-5 h-5" />,
      star: <Flag className="w-5 h-5" />,
      tag: <Flag className="w-5 h-5" />,
      archive: <Archive className="w-5 h-5" />,
      inbox: <Inbox className="w-5 h-5" />,
      flag: <Flag className="w-5 h-5" />,
      bell: <Flag className="w-5 h-5" />,
      calendar: <Calendar className="w-5 h-5" />,
      clock: <Calendar className="w-5 h-5" />,
      target: <Flag className="w-5 h-5" />,
      rocket: <Flag className="w-5 h-5" />,
    };
    return icons[iconName] || icons.folder;
  };

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: isOpen ? 0 : -300, opacity: isOpen ? 1 : 0 }}
        exit={{ x: -300, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          'fixed left-0 top-0 z-sticky h-screen w-72 glass-panel flex flex-col',
          'border-r border-border-light/50 dark:border-border-dark/50',
          'transform transition-transform duration-normal'
        )}
        role="navigation"
        aria-label="Projects sidebar"
      >
        {/* Overlay for mobile */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[199] bg-black/20 backdrop-blur-sm lg:hidden"
              onClick={onClose}
              aria-hidden="true"
            />
          )}
        </AnimatePresence>

        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-border-light/50 dark:border-border-dark/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-glow">
                <CheckCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary">To-Do List</h1>
              </div>
            </div>
          </div>

          {/* Smart Projects */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Smart lists">
            {SMART_PROJECTS.map((smartProject) => {
              const count = smartProject.count(useStore.getState().tasks);
              const isActive = filter.type === smartProject.id || filter.projectId === smartProject.id;

              return (
                <button
                  key={smartProject.id}
                  type="button"
                  onClick={() => {
                    if (smartProject.id === 'inbox') {
                      setFilter({ type: 'all', projectId: 'inbox' });
                    } else if (smartProject.id === 'today') {
                      setFilter({ type: 'today' });
                    } else if (smartProject.id === 'upcoming') {
                      setFilter({ type: 'upcoming' });
                    } else if (smartProject.id === 'flagged') {
                      setFilter({ type: 'high-priority' });
                    } else if (smartProject.id === 'completed') {
                      setFilter({ type: 'completed' });
                    }
                    onClose();
                  }}
                  className={cn(
                    'sidebar-item w-full',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <span
                    className="w-5 h-5 flex items-center justify-center rounded-lg flex-shrink-0"
                    style={{ backgroundColor: `${smartProject.color}20`, color: smartProject.color }}
                  >
                    {smartProject.icon}
                  </span>
                  <span className="truncate flex-1">{smartProject.name}</span>
                  {count > 0 && (
                    <span
                      className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full"
                      style={{ backgroundColor: `${smartProject.color}20`, color: smartProject.color }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="px-3 border-t border-border-light/50 dark:border-border-dark/50 my-2" />

          {/* User Projects */}
          <div className="px-3 mb-2 flex items-center justify-between">
            <h2 className="text-caption font-semibold text-text-muted dark:text-text-dark-muted uppercase tracking-wider">
              Projects
            </h2>
            <Button
              variant="ghost"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setShowCreateProject(true)}
              aria-label="Create new project"
            >
              New
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto p-1 space-y-0.5" aria-label="User projects">
            {sortedProjects.map((project) => {
              const taskCount = Object.values(useStore.getState().tasks).filter(
                (t: any) => t.projectId === project.id && t.status === 'active'
              ).length;
              const isActive = filter.projectId === project.id;

              return (
                <div key={project.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      setFilter({ type: 'all', projectId: project.id });
                      onClose();
                    }}
                    className={cn(
                      'sidebar-item w-full',
                      isActive && 'sidebar-item-active'
                    )}
                  >
                    <span
                      className="w-5 h-5 flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ backgroundColor: `${project.color}20`, color: project.color }}
                    >
                      {getIconComponent(project.icon)}
                    </span>
                    <span className="truncate flex-1">{project.name}</span>
                    {taskCount > 0 && (
                      <span
                        className="flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full"
                        style={{ backgroundColor: `${project.color}20`, color: project.color }}
                      >
                        {taskCount}
                      </span>
                    )}
                  </button>

                  {/* Project actions menu */}
                  <Dropdown
                    trigger={
                      <button
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-muted/50 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Project options"
                      >
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    }
                    items={[
                      {
                        label: 'Edit',
                        value: 'edit',
                        icon: <Edit className="w-4 h-4" />,
                        onClick: () => {
                          setEditProjectName(project.name);
                          setEditingProjectId(project.id);
                        },
                      },
                      {
                        label: 'Delete',
                        value: 'delete',
                        icon: <Trash2 className="w-4 h-4" />,
                        danger: true,
                        onClick: () => handleDeleteProject(project.id),
                      },
                    ]}
                    align="right"
                  />
                </div>
              );
            })}
          </nav>

          {/* Settings */}
          <div className="p-3 border-t border-border-light/50 dark:border-border-dark/50">
            <Button
              variant="ghost"
              className="w-full justify-start"
              icon={<Settings className="w-4 h-4" />}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('todo:open-settings'));
              }}
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Create Project Modal */}
        {showCreateProject && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setShowCreateProject(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary mb-4">New Project</h3>
              <div className="space-y-4">
                <Input
                  label="Name"
                  placeholder="Project name"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  autoFocus
                />
                <div>
                  <label className="label-text">Color</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {projectColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewProjectColor(color)}
                        className={cn(
                          'w-8 h-8 rounded-xl border-2 transition-all',
                          newProjectColor === color && 'border-white shadow-glow scale-110'
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={color}
                        aria-pressed={newProjectColor === color}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label-text">Icon</label>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    {projectIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setNewProjectIcon(icon)}
                        className={cn(
                          'w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all',
                          'bg-white/60 dark:bg-surface-dark/60 border-border-light/50 dark:border-border-dark/50',
                          newProjectIcon === icon && 'border-primary-500 bg-primary-50/50 dark:bg-primary-900/30'
                        )}
                        aria-label={icon}
                        aria-pressed={newProjectIcon === icon}
                      >
                        {getIconComponent(icon)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setShowCreateProject(false)}>Cancel</Button>
                <Button variant="primary" onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                  Create
                </Button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Edit Project Modal */}
        {editingProjectId && (
          <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setEditingProjectId(null)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6 animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-h3 font-semibold text-text-primary dark:text-text-dark-primary mb-4">Edit Project</h3>
              <Input
                label="Name"
                value={editProjectName}
                onChange={(e) => setEditProjectName(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="secondary" onClick={() => setEditingProjectId(null)}>Cancel</Button>
                <Button variant="primary" onClick={() => handleUpdateProject(editingProjectId!)} disabled={!editProjectName.trim()}>
                  Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.aside>
    </AnimatePresence>
  );
}