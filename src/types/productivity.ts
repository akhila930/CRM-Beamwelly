export interface ProductivityMetrics {
    employee_id: number;
    period: string;
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
    average_completion_time: number;
} 