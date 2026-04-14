from pydantic import BaseModel
from datetime import datetime

class ProductivityMetrics(BaseModel):
    employee_id: int
    period: str
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    overdue_tasks: int
    completion_rate: float  # percentage
    average_completion_time: float  # in hours

    class Config:
        from_attributes = True

class OverallProductivityMetrics(BaseModel):
    completed: dict
    inProgress: dict
    overdue: dict
    completionRate: float

    class Config:
        from_attributes = True 