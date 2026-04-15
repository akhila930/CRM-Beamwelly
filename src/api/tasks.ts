import { Task, CreateTaskInput } from '../types/task';
import api from '@/lib/axios';

function normalizeTask(task: any): Task {
  return {
    ...task,
    created_at: task.created_at ? new Date(task.created_at).toISOString() : task.created_at,
    updated_at: task.updated_at ? new Date(task.updated_at).toISOString() : task.updated_at,
    completed_at: task.completed_at ? new Date(task.completed_at).toISOString() : null,
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await api.get('/api/tasks/');
  return (response.data || []).map(normalizeTask);
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await api.post('/api/tasks/', input);
  return normalizeTask(response.data);
}

export async function updateTask(id: number, updates: Partial<Task>): Promise<Task> {
  const response = await api.put(`/api/tasks/${id}`, updates);
  return normalizeTask(response.data);
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/api/tasks/${id}`);
} 