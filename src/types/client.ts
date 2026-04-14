export type LeadStage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface ClientInteraction {
  id: string;
  date: string;
  type: 'call' | 'email' | 'meeting' | 'other';
  summary: string;
  nextSteps?: string;
  created_at: string;
}

export interface ClientDocument {
  id: string;
  name: string;
  fileUrl: string;
  uploadDate: string;
  fileType: string;
}

export interface ClientService {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'cancelled' | 'paused';
  stage?: string;
  description?: string | null;
  value: number;
  created_at: string;
  interactions?: ClientInteraction[];
  documents?: ClientServiceDocument[];
}

export interface Lead {
  id: number;
  name: string;
  email: string;
  mobile_number: string | null;
  company_name: string | null;
  profession: string | null;
  qualification: string | null;
  income: number | null;
  date_of_investment: string | null;
  investment_type: string | null;
  reference_name: string | null;
  reference_email: string | null;
  reference_contact: string | null;
  relationship_manager: string | null;
  interaction_type: string | null;
  source: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  notes: string | null;
  expected_value: number | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
}

export type ClientStage = 'active' | 'inactive' | 'onboarding' | 'churned';

export interface Client {
  id: number;
  name: string;
  email: string;
  mobile_number: string | null;
  managing_company_name: string | null;
  client_employer_company_name: string | null;
  profession: string | null;
  qualification: string | null;
  income: number | null;
  date_of_investment: string | null;
  investment_type: string | null;
  reference_name: string | null;
  reference_email: string | null;
  reference_contact: string | null;
  relationship_manager: string | null;
  interaction_type: string | null;
  status: 'active' | 'inactive' | 'onboarding' | 'churned';
  notes: string | null;
  assigned_to: number | null;
  created_at: string;
  updated_at: string;
  phone?: string | null;
  address?: string | null;
  services?: ClientService[];
}

export interface ClientServiceDocument {
  id: string;
  name: string;
  file_url: string;
  created_at: string;
}
