import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  Task,
  Project,
  Tag,
  UserPreferences,
  FilterState,
  AppState,
  Toast,
  Priority,
  TaskStatus,
} from '../types';
import {
  getAllTasks,
  getAllProjects,
  getAllTags,
  getPreferences,
  createTask as storageCreateTask,
  updateTask as storageUpdateTask,
  deleteTask as storageDeleteTask,
  bulkUpdateTasks,
  createProject,
  updateProject,
  deleteProject,
  reorderProjects,
  createTag,
  updateTag,
  deleteTag,
  savePreferences,
  initializeDefaultData,
} from './storage';
import { DEFAULT_PREFERENCES } from '../types';
import { isToday, isTomorrow, isPast, addDays, startOfDay, differenceInDays } from 'date-fns';

interface StoreState extends AppState {
  // Actions
  initialize: () => Promise<void>;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  removeTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  reorderTasks: (taskIds: string[]) => Promise<void>;
  moveTasksToProject: (taskIds: string[], projectId: string) => Promise<void>;
  duplicateTask: (id: string) => Promise<Task>;

  // Project actions
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  reorderProjects: (projectIds: string[]) => Promise<void>;

  // Tag actions
  addTag: (tag: Omit<Tag, 'id' | 'createdAt'>) => Promise<Tag>;
  updateTag: (id: string, updates: Partial<Tag>) => Promise<void>;
  removeTag: (id: string) => Promise<void>;

  // Preference actions
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;

  // Filter actions
  setFilter: (filter: Partial<FilterState>) => void;
  clearFilter: () => void;

  // UI actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setEditingTaskId: (id: string | undefined) => void;
  toggleTaskSelection: (id: string) => void;
  selectAllTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  setDragState: (state: Partial<AppState['ui']['dragState']>) => void;

  // Toast actions
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;

  // Computed
  getFilteredTasks: () => Task[];
  getTasksByProject: (projectId: string) => Task[];
  getProjectTaskCount: (projectId: string) => number;
  getTodayTasks: () => Task[];
  getUpcomingTasks: () => Task[];
  getOverdueTasks: () => Task[];
  getHighPriorityTasks: () => Task[];
  getCompletedTasks: () => Task[];
  getActiveTasks: () => Task[];
  getTasksByTag: (tagId: string) => Task[];
  getSubtasks: (parentId: string) => Task[];
}

const DEFAULT_FILTER: FilterState = {
  type: 'all',
};

export const useStore = create<StoreState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    tasks: {},
    projects: {},
    tags: {},
    preferences: DEFAULT_PREFERENCES,
    filter: DEFAULT_FILTER,
    ui: {
      sidebarOpen: true,
      commandPaletteOpen: false,
      editingTaskId: undefined,
      selectedTaskIds: [],
      dragState: {
        isDragging: false,
        draggedTaskId: undefined,
        dropTargetId: undefined,
      },
      toasts: [],
    },

    // Initialize
    initialize: async () => {
      await initializeDefaultData();
      const [tasks, projects, tags, preferences] = await Promise.all([
        getAllTasks(),
        getAllProjects(),
        getAllTags(),
        getPreferences(),
      ]);

      const taskMap: Record<string, Task> = {};
      tasks.forEach(t => { taskMap[t.id] = t; });

      const projectMap: Record<string, Project> = {};
      projects.forEach(p => { projectMap[p.id] = p; });

      const tagMap: Record<string, Tag> = {};
      tags.forEach(t => { tagMap[t.id] = t; });

      set({
        tasks: taskMap,
        projects: projectMap,
        tags: tagMap,
        preferences: preferences || DEFAULT_PREFERENCES,
      });
    },

    // Task actions
    addTask: async (taskData) => {
      const { tasks } = get();
      const now = new Date().toISOString();
      const maxOrder = Math.max(0, ...Object.values(tasks).map(t => t.order));

      const newTask: Task = {
        ...taskData,
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        createdAt: now,
        updatedAt: now,
        subtasks: taskData.subtasks || [],
        tags: taskData.tags || [],
      };

      await storageCreateTask(newTask);

      set(state => ({
        tasks: { ...state.tasks, [newTask.id]: newTask },
      }));

      return newTask;
    },

    updateTask: async (id, updates) => {
      const task = get().tasks[id];
      if (!task) return;

      const updatedTask = { ...task, ...updates, updatedAt: new Date().toISOString() };
      await storageUpdateTask(updatedTask);

      set(state => ({
        tasks: { ...state.tasks, [id]: updatedTask },
      }));
    },

    removeTask: async (id) => {
      await storageDeleteTask(id);
      set(state => {
        const { [id]: removed, ...rest } = state.tasks;
        return { tasks: rest };
      });
    },

    toggleTaskComplete: async (id) => {
      const task = get().tasks[id];
      if (!task) return;

      const newStatus: TaskStatus = task.status === 'completed' ? 'active' : 'completed';
      const updates: Partial<Task> = {
        status: newStatus,
        completedAt: newStatus === 'completed' ? new Date().toISOString() : undefined,
      };

      await get().updateTask(id, updates);
    },

    reorderTasks: async (taskIds) => {
      const { tasks } = get();
      const updates = taskIds.map((id, index) => ({
        ...tasks[id],
        order: index,
        updatedAt: new Date().toISOString(),
      }));

      await bulkUpdateTasks(updates);

      set(state => {
        const newTasks = { ...state.tasks };
        updates.forEach(t => { newTasks[t.id] = t; });
        return { tasks: newTasks };
      });
    },

    moveTasksToProject: async (taskIds, projectId) => {
      const { tasks } = get();
      const updates = taskIds.map(id => ({
        ...tasks[id],
        projectId,
        updatedAt: new Date().toISOString(),
      }));

      await bulkUpdateTasks(updates);

      set(state => {
        const newTasks = { ...state.tasks };
        updates.forEach(t => { newTasks[t.id] = t; });
        return { tasks: newTasks };
      });
    },

    duplicateTask: async (id) => {
      const task = get().tasks[id];
      if (!task) throw new Error('Task not found');

      const duplicated = await get().addTask({
        ...task,
        title: `${task.title} (Copy)`,
        status: 'active',
        completedAt: undefined,
        order: task.order + 1,
      });

      return duplicated;
    },

    // Project actions
    addProject: async (projectData) => {
      const { projects } = get();
      const maxOrder = Math.max(-1, ...Object.values(projects).map(p => p.order));

      const newProject: Project = {
        ...projectData,
        id: crypto.randomUUID(),
        order: maxOrder + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await createProject(newProject);

      set(state => ({
        projects: { ...state.projects, [newProject.id]: newProject },
      }));

      return newProject;
    },

    updateProject: async (id, updates) => {
      const project = get().projects[id];
      if (!project) return;

      const updatedProject = { ...project, ...updates, updatedAt: new Date().toISOString() };
      await updateProject(updatedProject);

      set(state => ({
        projects: { ...state.projects, [id]: updatedProject },
      }));
    },

    removeProject: async (id) => {
      // Move tasks to inbox first
      const { tasks } = get();
      const inboxTasks = Object.values(tasks).filter(t => t.projectId === id);
      if (inboxTasks.length > 0) {
        await get().moveTasksToProject(inboxTasks.map(t => t.id), 'inbox');
      }

      await deleteProject(id);

      set(state => {
        const { [id]: removed, ...rest } = state.projects;
        return { projects: rest };
      });
    },

    reorderProjects: async (projectIds) => {
      await reorderProjects(projectIds);

      const { projects } = get();
      const newProjects = { ...projects };
      projectIds.forEach((id, index) => {
        if (newProjects[id]) {
          newProjects[id] = { ...newProjects[id], order: index };
        }
      });

      set({ projects: newProjects });
    },

    // Tag actions
    addTag: async (tagData) => {
      const newTag: Tag = {
        ...tagData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };

      await createTag(newTag);

      set(state => ({
        tags: { ...state.tags, [newTag.id]: newTag },
      }));

      return newTag;
    },

    updateTag: async (id, updates) => {
      const tag = get().tags[id];
      if (!tag) return;

      const updatedTag = { ...tag, ...updates };
      await updateTag(updatedTag);

      set(state => ({
        tags: { ...state.tags, [id]: updatedTag },
      }));
    },

    removeTag: async (id) => {
      // Remove tag from all tasks
      const { tasks } = get();
      const updates = Object.values(tasks)
        .filter(t => t.tags.includes(id))
        .map(t => ({ ...t, tags: t.tags.filter(tagId => tagId !== id), updatedAt: new Date().toISOString() }));

      if (updates.length > 0) {
        await bulkUpdateTasks(updates);
      }

      await deleteTag(id);

      set(state => {
        const { [id]: removed, ...rest } = state.tags;
        const newTasks = { ...state.tasks };
        updates.forEach(t => { newTasks[t.id] = t; });
        return { tags: rest, tasks: newTasks };
      });
    },

    // Preference actions
    updatePreferences: async (prefs) => {
      const current = get().preferences;
      const updated = { ...current, ...prefs };
      await savePreferences(updated);
      set({ preferences: updated });
    },

    resetPreferences: async () => {
      await savePreferences(DEFAULT_PREFERENCES);
      set({ preferences: DEFAULT_PREFERENCES });
    },

    // Filter actions
    setFilter: (filter) => {
      set(state => ({
        filter: { ...state.filter, ...filter },
      }));
    },

    clearFilter: () => {
      set({ filter: DEFAULT_FILTER });
    },

    // UI actions
    setSidebarOpen: (open) => {
      set(state => ({
        ui: { ...state.ui, sidebarOpen: open },
      }));
    },

    toggleSidebar: () => {
      set(state => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      }));
    },

    setCommandPaletteOpen: (open) => {
      set(state => ({
        ui: { ...state.ui, commandPaletteOpen: open },
      }));
    },

    setEditingTaskId: (id) => {
      set(state => ({
        ui: { ...state.ui, editingTaskId: id },
      }));
    },

    toggleTaskSelection: (id) => {
      set(state => {
        const selected = state.ui.selectedTaskIds;
        const isSelected = selected.includes(id);
        return {
          ui: {
            ...state.ui,
            selectedTaskIds: isSelected
              ? selected.filter(s => s !== id)
              : [...selected, id],
          },
        };
      });
    },

    selectAllTasks: (taskIds) => {
      set(state => ({
        ui: { ...state.ui, selectedTaskIds: taskIds },
      }));
    },

    clearSelection: () => {
      set(state => ({
        ui: { ...state.ui, selectedTaskIds: [] },
      }));
    },

    setDragState: (dragState) => {
      set(state => ({
        ui: { ...state.ui, dragState: { ...state.ui.dragState, ...dragState } },
      }));
    },

    // Toast actions
    addToast: (toast) => {
      const id = crypto.randomUUID();
      const newToast: Toast = { ...toast, id };

      set(state => ({
        ui: { ...state.ui, toasts: [...state.ui.toasts, newToast] },
      }));

      // Auto-remove
      const duration = toast.duration ?? 4000;
      setTimeout(() => {
        get().removeToast(id);
      }, duration);

      return id;
    },

    removeToast: (id) => {
      set(state => ({
        ui: { ...state.ui, toasts: state.ui.toasts.filter(t => t.id !== id) },
      }));
    },

    // Computed
    getFilteredTasks: () => {
      const { tasks, filter, preferences } = get();
      let result = Object.values(tasks);

      // Filter by status
      if (filter.type === 'active') {
        result = result.filter(t => t.status === 'active');
      } else if (filter.type === 'completed') {
        result = result.filter(t => t.status === 'completed');
      } else if (filter.type === 'today') {
        const today = startOfDay(new Date());
        result = result.filter(t => t.dueDate && isToday(new Date(t.dueDate)));
      } else if (filter.type === 'upcoming') {
        const tomorrow = startOfDay(addDays(new Date(), 1));
        const nextWeek = startOfDay(addDays(new Date(), 7));
        result = result.filter(t => {
          if (!t.dueDate) return false;
          const due = startOfDay(new Date(t.dueDate));
          return due >= tomorrow && due <= nextWeek;
        });
      } else if (filter.type === 'overdue') {
        const today = startOfDay(new Date());
        result = result.filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
      } else if (filter.type === 'high-priority') {
        result = result.filter(t => t.priority === 'high');
      }

      // Filter by project
      if (filter.projectId) {
        result = result.filter(t => t.projectId === filter.projectId);
      }

      // Filter by tags
      if (filter.tagIds && filter.tagIds.length > 0) {
        result = result.filter(t => filter.tagIds!.some(tagId => t.tags.includes(tagId)));
      }

      // Filter by priority
      if (filter.priority) {
        result = result.filter(t => t.priority === filter.priority);
      }

      // Filter by search query
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase();
        result = result.filter(t =>
          t.title.toLowerCase().includes(query) ||
          t.notes?.toLowerCase().includes(query)
        );
      }

      // Filter by date range
      if (filter.dateRange) {
        const start = new Date(filter.dateRange.start);
        const end = new Date(filter.dateRange.end);
        result = result.filter(t => {
          if (!t.dueDate) return false;
          const due = new Date(t.dueDate);
          return due >= start && due <= end;
        });
      }

      // Hide completed if preference set
      if (!preferences.showCompletedTasks) {
        result = result.filter(t => t.status === 'active');
      }

      // Sort
      const { sortBy, sortOrder } = preferences;
      result.sort((a, b) => {
        let comparison = 0;

        switch (sortBy) {
          case 'dueDate':
            if (!a.dueDate && !b.dueDate) comparison = 0;
            else if (!a.dueDate) comparison = 1;
            else if (!b.dueDate) comparison = -1;
            else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
            break;
          case 'priority':
            const priorityOrder = { high: 3, medium: 2, low: 1, none: 0 };
            comparison = priorityOrder[b.priority] - priorityOrder[a.priority];
            break;
          case 'createdAt':
            comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            break;
          case 'alphabetical':
            comparison = a.title.localeCompare(b.title);
            break;
          case 'manual':
          default:
            comparison = a.order - b.order;
            break;
        }

        return sortOrder === 'desc' ? -comparison : comparison;
      });

      return result;
    },

    getTasksByProject: (projectId) => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.projectId === projectId);
    },

    getProjectTaskCount: (projectId) => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.projectId === projectId && t.status === 'active').length;
    },

    getTodayTasks: () => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.dueDate && isToday(new Date(t.dueDate)));
    },

    getUpcomingTasks: () => {
      const { tasks } = get();
      const tomorrow = startOfDay(addDays(new Date(), 1));
      const nextWeek = startOfDay(addDays(new Date(), 7));
      return Object.values(tasks).filter(t => {
        if (!t.dueDate) return false;
        const due = startOfDay(new Date(t.dueDate));
        return due >= tomorrow && due <= nextWeek;
      });
    },

    getOverdueTasks: () => {
      const { tasks } = get();
      const today = startOfDay(new Date());
      return Object.values(tasks).filter(t => t.dueDate && isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
    },

    getHighPriorityTasks: () => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.priority === 'high' && t.status === 'active');
    },

    getCompletedTasks: () => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.status === 'completed');
    },

    getActiveTasks: () => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.status === 'active');
    },

    getTasksByTag: (tagId) => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.tags.includes(tagId));
    },

    getSubtasks: (parentId) => {
      const { tasks } = get();
      return Object.values(tasks).filter(t => t.parentTaskId === parentId);
    },
  }))
);

// Selectors for performance
export const useTasks = () => useStore(state => state.tasks);
export const useProjects = () => useStore(state => state.projects);
export const useTags = () => useStore(state => state.tags);
export const usePreferences = () => useStore(state => state.preferences);
export const useFilter = () => useStore(state => state.filter);
export const useUI = () => useStore(state => state.ui);
export const useFilteredTasks = () => useStore(state => state.getFilteredTasks());
export const useAddTask = () => useStore(state => state.addTask);
export const useUpdateTask = () => useStore(state => state.updateTask);
export const useRemoveTask = () => useStore(state => state.removeTask);
export const useToggleTaskComplete = () => useStore(state => state.toggleTaskComplete);
export const useAddProject = () => useStore(state => state.addProject);
export const useUpdateProject = () => useStore(state => state.updateProject);
export const useRemoveProject = () => useStore(state => state.removeProject);
export const useAddTag = () => useStore(state => state.addTag);
export const useUpdatePreferences = () => useStore(state => state.updatePreferences);
export const useSetFilter = () => useStore(state => state.setFilter);
export const useClearFilter = () => useStore(state => state.clearFilter);
export const useAddToast = () => useStore(state => state.addToast);
export const useSetCommandPaletteOpen = () => useStore(state => state.setCommandPaletteOpen);
export const useToggleSidebar = () => useStore(state => state.toggleSidebar);
export const useSetEditingTaskId = () => useStore(state => state.setEditingTaskId);
export const useClearSelection = () => useStore(state => state.clearSelection);
export const useSelectAllTasks = () => useStore(state => state.selectAllTasks);
export const useToggleTaskSelection = () => useStore(state => state.toggleTaskSelection);
export const useSetDragState = () => useStore(state => state.setDragState);