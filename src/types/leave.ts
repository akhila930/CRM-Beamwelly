export type LeaveType = 'casual' | 'sick' | 'annual' | 'unpaid' | 'other';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApplication {
  id: number;
  employee_id: number;
  employee_name: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
  status: LeaveStatus;
  approved_by?: number;
  approver_name?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  duration?: number;
}

export interface LeaveBalance {
  id: number;
  employee_id: number;
  year: number;
  casual_leave: number;
  sick_leave: number;
  annual_leave: number;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  reason: string;
}
