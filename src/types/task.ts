export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled"
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  assigned_to: number;
  assigned_by: number;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  tags?: string[] | null;
  comments?: string | null;
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  assigned_to: number;
  due_date: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  tags?: string[];
  comments?: string;
}

export interface ProductivityMetric {
  employeeId: string;
  employeeName: string;
  period: string;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOverdue: number;
  averageCompletionTime: number;
  completionRate: number;
}
