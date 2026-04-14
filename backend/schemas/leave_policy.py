from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CompanyLeavePolicyBase(BaseModel):
    annual_leave_count: int
    sick_leave_count: int
    casual_leave_count: int

class CompanyLeavePolicyCreate(CompanyLeavePolicyBase):
    company_name: str

class CompanyLeavePolicyUpdate(BaseModel):
    annual_leave_count: Optional[int] = None
    sick_leave_count: Optional[int] = None
    casual_leave_count: Optional[int] = None

class CompanyLeavePolicyResponse(CompanyLeavePolicyBase):
    id: int
    company_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 