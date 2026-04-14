import axios from '../lib/axios';
import { Lead, LeadCreate, LeadUpdate } from '../types/lead';

export const leadService = {
    async getAllLeads(): Promise<Lead[]> {
        try {
            const response = await axios.get('/api/leads/');
            return response.data;
        } catch (error) {
            console.error('Error fetching leads:', error);
            throw new Error('Failed to fetch leads');
        }
    },

    async getLeadById(id: number): Promise<Lead> {
        try {
            const response = await axios.get(`/api/leads/${id}/`);
            return response.data;
        } catch (error) {
            console.error('Error fetching lead:', error);
            throw new Error('Failed to fetch lead');
        }
    },

    async createLead(lead: LeadCreate): Promise<Lead> {
        try {
            const response = await axios.post('/api/leads/', lead);
            return response.data;
        } catch (error) {
            console.error('Error creating lead:', error);
            throw new Error('Failed to create lead');
        }
    },

    async updateLead(id: number, lead: LeadUpdate): Promise<Lead> {
        try {
            const response = await axios.put(`/api/leads/${id}/`, lead);
            return response.data;
        } catch (error) {
            console.error('Error updating lead:', error);
            throw new Error('Failed to update lead');
        }
    },

    async deleteLead(id: number): Promise<void> {
        try {
            await axios.delete(`/api/leads/${id}/`);
        } catch (error) {
            console.error('Error deleting lead:', error);
            throw new Error('Failed to delete lead');
        }
    },

    async downloadTemplate(): Promise<Blob> {
        try {
            const response = await axios.get('/api/leads/template', {
                responseType: 'blob'
            });
            return response.data;
        } catch (error) {
            console.error('Error downloading template:', error);
            throw new Error('Failed to download template');
        }
    }
}; 