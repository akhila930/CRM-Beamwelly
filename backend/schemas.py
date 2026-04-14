from typing import Optional, List
from datetime import datetime, date
from pydantic import BaseModel, EmailStr

class GeneralExpenseBase(BaseModel):
    title: str
    amount: float
    date: date
    description: str | None = None
    category: str
    payment_method: str

class GeneralExpenseCreate(GeneralExpenseBase):
    pass

class GeneralExpense(GeneralExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    num_employees: Optional[int] = None

class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class VerificationRequest(BaseModel):
    email: str
    otp: str

class ResendVerificationRequest(BaseModel):
    email: str

class EmployeeCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    position: str
    department: str
    salary: float
    hire_date: date
    address: Optional[str] = None
    can_assign_tasks: bool = False
    can_access_recruitment: bool = False

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    department: Optional[str] = None
    salary: Optional[float] = None
    hire_date: Optional[datetime] = None
    address: Optional[str] = None
    can_assign_tasks: Optional[bool] = None
    can_access_recruitment: Optional[bool] = None

    class Config:
        extra = "ignore"

class Employee(EmployeeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    assigned_to: int
    due_date: date
    priority: str = "medium"
    status: str = "pending"
    tags: Optional[list[str]] = None
    comments: Optional[str] = None

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    priority: Optional[str] = None

class Task(TaskBase):
    id: int
    assigned_by: int
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_type: Optional[str] = None

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: int
    employee_id: int
    file_path: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceBase(BaseModel):
    date: datetime
    status: str

class AttendanceCreate(AttendanceBase):
    pass

class Attendance(AttendanceBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class MilestoneBase(BaseModel):
    title: str
    description: Optional[str] = None
    date: datetime
    status: str
    type: Optional[str] = None

class MilestoneCreate(MilestoneBase):
    pass

class MilestoneUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    date: Optional[datetime] = None
    status: Optional[str] = None
    type: Optional[str] = None

class Milestone(MilestoneBase):
    id: int
    employee_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserMeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    company_name: Optional[str] = None
    num_employees: Optional[int] = None
    avatar: Optional[str] = None

class CompanyLeavePolicyBase(BaseModel):
    annual_leave_count: int
    sick_leave_count: int
    casual_leave_count: int

class CompanyLeavePolicyCreate(CompanyLeavePolicyBase):
    company_id: int

class CompanyLeavePolicyUpdate(CompanyLeavePolicyBase):
    pass

class CompanyLeavePolicy(CompanyLeavePolicyBase):
    id: int
    company_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 