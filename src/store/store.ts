import { create } from 'zustand';

// --- Types ---
export type Task = {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
};

export type Filter = 'all' | 'active' | 'completed' | 'archived' | 'high-priority' | 'overdue';

// --- Simple In-Memory Store for Now ---
// This will be replaced with IndexedDB persistence later
export interface TodoStore {
  tasks: Task[];
  filter: Filter;
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  setFilter: (filter: Filter) => void;
  clearCompleted: () => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  tasks: [],
  filter: 'all',

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      priority: task.priority || 'medium',
    };

    set(state => ({ tasks: [...state.tasks, newTask] }));
  },

  toggleTask: (id) => {
    set(state => ({
      tasks: state.tasks.map(t =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
    }));
  },

  deleteTask: (id) => {
    set(state => ({ tasks: state.tasks.filter(t => t.id !== id) }));
  },

  setFilter: (filter) => set({ filter }),

  clearCompleted: () => {
    set(state => ({
      tasks: state.tasks.filter(t => !t.completed)
    }));
  }
}));

// Export types for convenience
export type { Task, Filter };