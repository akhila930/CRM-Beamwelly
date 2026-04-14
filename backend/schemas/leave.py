from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class LeaveType(str, Enum):
    CASUAL = "casual"
    SICK = "sick"
    ANNUAL = "annual"
    UNPAID = "unpaid"
    OTHER = "other"

class LeaveStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class LeaveRequestCreate(BaseModel):
    leave_type: LeaveType
    start_date: date
    end_date: date
    reason: str = Field(..., min_length=1)

class LeaveRequestUpdate(BaseModel):
    status: LeaveStatus
    rejection_reason: Optional[str] = None

class LeaveRequestResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: str
    leave_type: str
    start_date: date
    end_date: date
    reason: str
    status: str
    approved_by: Optional[int] = None
    approver_name: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceResponse(BaseModel):
    id: int
    employee_id: int
    year: int
    casual_leave: int
    sick_leave: int
    annual_leave: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeaveBalanceUpdate(BaseModel):
    casual_leave: Optional[int] = None
    sick_leave: Optional[int] = None
    annual_leave: Optional[int] = None

class LeaveStatistics(BaseModel):
    total_leaves: int
    pending_leaves: int
    approved_leaves: int
    rejected_leaves: int
    leave_balance: LeaveBalanceResponse 