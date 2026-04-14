export enum LeadStatus {
    NEW = 'new',
    CONTACTED = 'contacted',
    QUALIFIED = 'qualified',
    PROPOSAL = 'proposal',
    NEGOTIATION = 'negotiation',
    WON = 'won',
    LOST = 'lost'
}

export interface Lead {
    id: number;
    name: string;
    company?: string;
    email: string;
    phone?: string;
    source?: string;
    status: LeadStatus;
    notes?: string;
    expected_value?: number;
    assigned_to?: number;
    created_at: string;
    updated_at: string;
}

export interface LeadCreate {
    name: string;
    company?: string;
    email: string;
    phone?: string;
    source?: string;
    status?: LeadStatus;
    notes?: string;
    expected_value?: number;
    assigned_to?: number;
}

export interface LeadUpdate {
    name?: string;
    company?: string;
    email?: string;
    phone?: string;
    source?: string;
    status?: LeadStatus;
    notes?: string;
    expected_value?: number;
    assigned_to?: number;
} 