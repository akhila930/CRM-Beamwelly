import api from "@/lib/axios";
import { Client, Lead } from "@/types/client";

// Lead Services
export const getLeads = async (): Promise<Lead[]> => {
  const response = await api.get("/api/leads/");
  return response.data;
};

export const createLead = async (leadData: Partial<Lead>): Promise<Lead> => {
  const response = await api.post("/api/leads/", leadData);
  return response.data;
};

export const updateLead = async (id: number, leadData: Partial<Lead>): Promise<Lead> => {
  const response = await api.put(`/api/leads/${id}`, leadData);
  return response.data;
};

export const deleteLead = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/leads/${id}`);
  return response.data;
};

export const downloadLeadTemplate = async () => {
  const response = await api.get('/api/leads/template', {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'leads_template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export const uploadLeads = async (file: File): Promise<Lead[]> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/leads/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Client Services
export const getClients = async (): Promise<Client[]> => {
  const response = await api.get("/api/clients/");
  return response.data;
};

export const createClient = async (clientData: Partial<Client>): Promise<Client> => {
  const response = await api.post("/api/clients/", clientData);
  return response.data;
};

export const updateClient = async (id: number, clientData: Partial<Client>): Promise<Client> => {
  const response = await api.put(`/api/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/clients/${id}`);
  return response.data;
};

export async function downloadClientTemplate(): Promise<Blob> {
  const response = await api.get('/api/clients/template', {
    responseType: 'blob'
  });
  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'client_template.xlsx');
  document.body.appendChild(link);
  link.click();
  link.remove();
  return response.data;
}

export const uploadClients = async (file: File): Promise<Client[]> => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await api.post("/api/clients/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};
