from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime, date
from typing import Optional, List, Dict, Any, Union
from uuid import UUID
from decimal import Decimal

# Task schemas
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: str = "medium"
    status: str = "pending"
    tags: Optional[List[str]] = []
    comments: Optional[str] = None

    class Config:
        from_attributes = True

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    tags: Optional[List[str]] = None
    comments: Optional[str] = None

    class Config:
        from_attributes = True

class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[str]
    priority: str
    status: str
    created_at: Optional[str]
    updated_at: Optional[str]
    completed_at: Optional[str]
    tags: Optional[List[str]]
    comments: Optional[str]

    class Config:
        from_attributes = True

# Document schemas
class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_path: Optional[str] = None
    file_type: Optional[str] = None
    type: Optional[str] = "personal"
    category: Optional[str] = "other"

    class Config:
        from_attributes = True

class DocumentCreate(DocumentBase):
    file: Optional[bytes] = None

    @validator('file_path')
    def validate_file_path(cls, v, values):
        if not v and not values.get('file'):
            raise ValueError('Either file_path or file must be provided')
        return v

    @validator('file_type')
    def validate_file_type(cls, v, values):
        if not v and values.get('file'):
            # Try to determine file type from file content
            file = values.get('file')
            if file:
                # Add logic to determine file type from content
                return 'pdf'  # Default to pdf for now
        return v

class DocumentResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    file_path: str
    file_type: str
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Attendance schemas
class AttendanceBase(BaseModel):
    date: date
    status: str = "present"  # present, absent, halfday

    class Config:
        from_attributes = True

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceResponse(BaseModel):
    id: int
    date: Optional[str]
    status: str
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Milestone schemas
class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: Optional[Union[date, str]] = None
    type: Optional[str] = "general"

    class Config:
        from_attributes = True

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[date] = None
    status: Optional[str] = None
    type: Optional[str] = None

    class Config:
        from_attributes = True

class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    date: Optional[str]
    type: Optional[str]
    created_at: Optional[str]

    class Config:
        from_attributes = True

# Employee schemas
class EmployeeBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    department: str
    salary: Optional[float] = None
    hire_date: date
    status: Optional[str] = "active"
    address: Optional[str] = None
    company_name: Optional[str] = None
    can_assign_tasks: Optional[bool] = False
    can_access_recruitment: Optional[bool] = False

    @validator('salary')
    def validate_salary(cls, v):
        if v is not None:
            if isinstance(v, str) and v.strip() == '':
                return None
            try:
                salary = Decimal(str(v))
                if salary < 0:
                    raise ValueError("Salary cannot be negative")
                return float(salary)
            except (TypeError, ValueError):
                return None
        return v

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[date] = None
    status: Optional[str] = None
    address: Optional[str] = None
    can_assign_tasks: Optional[bool] = None
    can_access_recruitment: Optional[bool] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        }

class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime
    updated_at: datetime
    tasks: List[TaskResponse] = []
    documents: List[DocumentResponse] = []
    attendance: List[AttendanceResponse] = []
    milestones: List[MilestoneResponse] = []

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
            Decimal: lambda v: float(v)
        } 