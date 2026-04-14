export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  salary: number;
  hire_date: string;
  status: string;
  address?: string;
  tasks: Task[];
  documents: Document[];
  attendance: Attendance[];
  milestones: Milestone[];
  can_assign_tasks?: boolean;
  can_access_recruitment?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assigned_to: string;
  assigned_by: string;
  due_date: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  tags?: string[];
  comments?: string;
}

export interface Document {
  id: string;
  title: string;
  description?: string;
  file_path?: string;
  file_type?: string;
  file?: File;
  folder_id: string;
  uploaded_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Attendance {
  id: string;
  date: string;
  status: 'present' | 'absent' | 'halfday';
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description?: string;
  achievedDate?: string;
  date?: string;
  status: string;
  type?: string;
  created_at: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  assigned_to: string;
  due_date: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  tags?: string[];
  comments?: string;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  salary: number;
  hire_date?: string;
  status?: string;
  address?: string;
  can_assign_tasks?: boolean;
  can_access_recruitment?: boolean;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string;
  position?: string;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: string;
  address?: string;
  can_assign_tasks?: boolean;
  can_access_recruitment?: boolean;
}

export interface KpiData {
  tasksCompleted: string;
  productivityScore: string;
  attendanceRate: string;
}