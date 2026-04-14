import api from '@/lib/axios';
import { ProductivityMetrics } from '@/types/productivity';

export const productivityService = {
  async getEmployeeProductivity(employeeId: number, period: string = 'week'): Promise<ProductivityMetrics> {
    try {
      const response = await api.get(`/api/productivity/employee/${employeeId}?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching employee productivity:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch productivity metrics');
    }
  },

  async getTeamProductivity(department: string, period: string = 'week'): Promise<ProductivityMetrics[]> {
    try {
      const response = await api.get(`/api/productivity/team/${department}?period=${period}`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching team productivity:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch team productivity metrics');
    }
  }
}; 