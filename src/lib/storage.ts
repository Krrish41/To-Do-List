import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Task, Project, Tag, UserPreferences } from '../types';

interface SyncOperation {
  id: string;
  entityType: 'task' | 'project' | 'tag';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: number;
  synced: boolean;
}

interface TodoDBSchema extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-project': string; 'by-status': string; 'by-due-date': string; 'by-priority': string; 'by-parent': string };
  };
  projects: {
    key: string;
    value: Project;
    indexes: { 'by-order': number };
  };
  tags: {
    key: string;
    value: Tag;
  };
  preferences: {
    key: string;
    value: UserPreferences & { id: string };
  };
  sync: {
    key: string;
    value: SyncOperation;
    indexes: { 'by-synced': boolean; 'by-timestamp': number };
  };
}

let dbInstance: IDBPDatabase<TodoDBSchema> | null = null;

export async function getDB(): Promise<IDBPDatabase<TodoDBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<TodoDBSchema>('todo-app-db', 2, {
    upgrade(db, oldVersion) {
      if (oldVersion < 1) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-project', 'projectId');
        taskStore.createIndex('by-status', 'status');
        taskStore.createIndex('by-due-date', 'dueDate');
        taskStore.createIndex('by-priority', 'priority');
        taskStore.createIndex('by-parent', 'parentTaskId');

        const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
        projectStore.createIndex('by-order', 'order');

        db.createObjectStore('tags', { keyPath: 'id' });
        db.createObjectStore('preferences', { keyPath: 'id' });
      }

      if (oldVersion < 2) {
        const syncStore = db.createObjectStore('sync', { keyPath: 'id' });
        syncStore.createIndex('by-synced', 'synced');
        syncStore.createIndex('by-timestamp', 'timestamp');
      }
    },
  });

  return dbInstance;
}

export async function getAllTasks(): Promise<Task[]> {
  const db = await getDB();
  return db.getAll('tasks');
}

export async function getTask(id: string): Promise<Task | undefined> {
  const db = await getDB();
  return db.get('tasks', id);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-project', projectId);
}

export async function getTasksByStatus(status: Task['status']): Promise<Task[]> {
  const db = await getDB();
  return db.getAllFromIndex('tasks', 'by-status', status);
}

export async function createTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.add('tasks', task);
  await addSyncOperation('task', task.id, 'create', task);
}

export async function updateTask(task: Task): Promise<void> {
  const db = await getDB();
  await db.put('tasks', { ...task, updatedAt: new Date().toISOString() });
  await addSyncOperation('task', task.id, 'update', task);
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tasks', id);
  await addSyncOperation('task', id, 'delete', { id });
}

export async function bulkUpdateTasks(tasks: Task[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('tasks', 'readwrite');
  await Promise.all(tasks.map(t => tx.store.put({ ...t, updatedAt: new Date().toISOString() })));
  await tx.done;
  for (const task of tasks) {
    await addSyncOperation('task', task.id, 'update', task);
  }
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB();
  return db.getAllFromIndex('projects', 'by-order');
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function createProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.add('projects', project);
  await addSyncOperation('project', project.id, 'create', project);
}

export async function updateProject(project: Project): Promise<void> {
  const db = await getDB();
  await db.put('projects', { ...project, updatedAt: new Date().toISOString() });
  await addSyncOperation('project', project.id, 'update', project);
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
  await addSyncOperation('project', id, 'delete', { id });
}

export async function reorderProjects(projectIds: string[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('projects', 'readwrite');
  const projects = await Promise.all(projectIds.map(id => tx.store.get(id)));
  await Promise.all(
    projects.map((p, i) => {
      if (p) tx.store.put({ ...p, order: i });
    })
  );
  await tx.done;
}

export async function getAllTags(): Promise<Tag[]> {
  const db = await getDB();
  return db.getAll('tags');
}

export async function createTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.add('tags', tag);
  await addSyncOperation('tag', tag.id, 'create', tag);
}

export async function updateTag(tag: Tag): Promise<void> {
  const db = await getDB();
  await db.put('tags', tag);
  await addSyncOperation('tag', tag.id, 'update', tag);
}

export async function deleteTag(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('tags', id);
  await addSyncOperation('tag', id, 'delete', { id });
}

export async function getPreferences(): Promise<UserPreferences | undefined> {
  const db = await getDB();
  const prefs = await db.get('preferences', 'user-prefs');
  if (prefs) {
    const { id, ...rest } = prefs;
    return rest as UserPreferences;
  }
  return undefined;
}

export async function savePreferences(prefs: UserPreferences): Promise<void> {
  const db = await getDB();
  await db.put('preferences', { ...prefs, id: 'user-prefs' });
}

async function addSyncOperation(
  entityType: 'task' | 'project' | 'tag',
  entityId: string,
  operation: 'create' | 'update' | 'delete',
  data: unknown
): Promise<void> {
  const db = await getDB();
  await db.add('sync', {
    id: crypto.randomUUID(),
    entityType,
    entityId,
    operation,
    data,
    timestamp: Date.now(),
    synced: false,
  });
}

export async function getPendingSyncOperations(): Promise<SyncOperation[]> {
  const db = await getDB();
  return db.getAllFromIndex('sync', 'by-synced', false);
}

export async function markSyncOperationSynced(id: string): Promise<void> {
  const db = await getDB();
  const op = await db.get('sync', id);
  if (op) {
    op.synced = true;
    await db.put('sync', op);
  }
}

export async function clearSyncedOperations(): Promise<void> {
  const db = await getDB();
  const ops = await db.getAllFromIndex('sync', 'by-synced', true);
  const tx = db.transaction('sync', 'readwrite');
  await Promise.all(ops.map(op => tx.store.delete(op.id)));
  await tx.done;
}

export function generateId(): string {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const randomHex = crypto.randomUUID().replace(/-/g, '').substring(0, 20);
  return `${timeHex}${randomHex}`.substring(0, 32);
}

export async function exportAllData(): Promise<{
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  preferences: UserPreferences | undefined;
  exportedAt: string;
}> {
  const [tasks, projects, tags, preferences] = await Promise.all([
    getAllTasks(),
    getAllProjects(),
    getAllTags(),
    getPreferences(),
  ]);

  return {
    tasks,
    projects,
    tags,
    preferences,
    exportedAt: new Date().toISOString(),
  };
}

export async function importData(data: {
  tasks?: Task[];
  projects?: Project[];
  tags?: Tag[];
  preferences?: UserPreferences;
}): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['tasks', 'projects', 'tags', 'preferences'], 'readwrite');

  if (data.tasks) {
    await Promise.all(data.tasks.map(t => tx.objectStore('tasks').put(t)));
  }
  if (data.projects) {
    await Promise.all(data.projects.map(p => tx.objectStore('projects').put(p)));
  }
  if (data.tags) {
    await Promise.all(data.tags.map(t => tx.objectStore('tags').put(t)));
  }
  if (data.preferences) {
    await tx.objectStore('preferences').put({ ...data.preferences, id: 'user-prefs' });
  }

  await tx.done;
}

export async function initializeDefaultData(): Promise<void> {
  const existingProjects = await getAllProjects();
  if (existingProjects.length > 0) return;

  const defaultProjects: Project[] = [
    {
      id: 'inbox',
      name: 'Inbox',
      color: '#a855f7',
      icon: 'folder',
      description: 'Quick capture for new tasks',
      order: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'today',
      name: 'Today',
      color: '#ec4899',
      icon: 'sun',
      description: 'Tasks due today',
      order: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'upcoming',
      name: 'Upcoming',
      color: '#f97316',
      icon: 'calendar',
      description: 'Tasks due soon',
      order: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'personal',
      name: 'Personal',
      color: '#22c55e',
      icon: 'home',
      description: 'Personal tasks and projects',
      order: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'work',
      name: 'Work',
      color: '#3b82f6',
      icon: 'briefcase',
      description: 'Work-related tasks',
      order: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const defaultTags: Tag[] = [
    { id: 'urgent', name: 'Urgent', color: '#ef4444', createdAt: new Date().toISOString() },
    { id: 'important', name: 'Important', color: '#f59e0b', createdAt: new Date().toISOString() },
    { id: 'someday', name: 'Someday', color: '#8b5cf6', createdAt: new Date().toISOString() },
    { id: 'waiting', name: 'Waiting', color: '#06b6d4', createdAt: new Date().toISOString() },
  ];

  const tx = dbInstance?.transaction(['projects', 'tags'], 'readwrite');
  if (tx) {
    await Promise.all(defaultProjects.map(p => tx.objectStore('projects').put(p)));
    await Promise.all(defaultTags.map(t => tx.objectStore('tags').put(t)));
    await tx.done;
  }
}