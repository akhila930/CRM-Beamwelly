from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, validator, Field
from models import TaskPriority, TaskStatus

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int
    due_date: date
    priority: str = TaskPriority.MEDIUM.value
    status: str = TaskStatus.PENDING.value
    tags: Optional[List[str]] = None
    comments: Optional[str] = None
    document_url: Optional[str] = None

    @validator('priority')
    def validate_priority(cls, v):
        if not v:
            return TaskPriority.MEDIUM.value
        valid_priorities = {p.value.upper(): p.value for p in TaskPriority}
        if v.upper() not in valid_priorities:
            raise ValueError(f'Invalid priority. Must be one of: {", ".join(valid_priorities.values())}')
        return valid_priorities[v.upper()]

    @validator('status')
    def validate_status(cls, v):
        if not v:
            return TaskStatus.PENDING.value
        valid_statuses = {s.value.upper(): s.value for s in TaskStatus}
        if v.upper() not in valid_statuses:
            raise ValueError(f'Invalid status. Must be one of: {", ".join(valid_statuses.values())}')
        return valid_statuses[v.upper()]

    @validator('due_date')
    def validate_due_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.strptime(v, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError('Invalid date format. Use YYYY-MM-DD')
        return v

class TaskCreate(TaskBase):
    pass

class Task(TaskBase):
    id: int
    assigned_by: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }
        
    @validator('created_at', 'updated_at', 'completed_at', pre=True)
    def ensure_datetime(cls, v):
        if v is None:
            return datetime.utcnow()
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                return datetime.utcnow()
        return v 