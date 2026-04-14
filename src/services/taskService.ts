import axios from 'axios';
import { Task, CreateTaskInput } from '@/types/task';
import api from '@/lib/axios';  // Use configured axios instance

export const taskService = {
  // Fetch all tasks
  async getAllTasks(): Promise<Task[]> {
    try {
      const response = await api.get('/api/tasks/');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch tasks');
    }
  },

  // Get tasks assigned to current user
  async getMyTasks(): Promise<Task[]> {
    try {
      const response = await api.get('/api/tasks/assigned');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching assigned tasks:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch assigned tasks');
    }
  },

  // Create a new task
  async createTask(task: CreateTaskInput): Promise<Task> {
    try {
      const response = await api.post('/api/tasks/', task);
      return response.data;
    } catch (error: any) {
      console.error('Error creating task:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create task');
    }
  },

  // Update an existing task
  async updateTask(id: number, task: Partial<Task>): Promise<Task> {
    try {
      const response = await api.put(`/api/tasks/${id}`, task);
      return response.data;
    } catch (error: any) {
      console.error('Error updating task:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update task');
    }
  },

  // Delete a task
  async deleteTask(id: number): Promise<void> {
    try {
      await api.delete(`/api/tasks/${id}`);
    } catch (error: any) {
      console.error('Error deleting task:', error);
      throw new Error(error.response?.data?.detail || 'Failed to delete task');
    }
  },

  // Get a single task by ID
  async getTaskById(id: number): Promise<Task> {
    try {
      const response = await api.get(`/api/tasks/${id}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching task:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch task');
    }
  },

  // Get tasks by status
  async getTasksByStatus(status: string): Promise<Task[]> {
    try {
      const response = await api.get(`/api/tasks/?status=${status}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tasks by status:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch tasks by status');
    }
  },

  // Get tasks by priority
  async getTasksByPriority(priority: string): Promise<Task[]> {
    try {
      const response = await api.get(`/api/tasks/?priority=${priority}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching tasks by priority:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch tasks by priority');
    }
  },

  // Search tasks
  async searchTasks(query: string): Promise<Task[]> {
    try {
      const response = await api.get(`/api/tasks/search?q=${query}`);
      return response.data;
    } catch (error: any) {
      console.error('Error searching tasks:', error);
      throw new Error(error.response?.data?.detail || 'Failed to search tasks');
    }
  }
}; 