from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from models import LeadStatus

class LeadBase(BaseModel):
    name: str
    lead_employer_company_name: Optional[str] = None
    email: str
    mobile_number: Optional[str] = None
    source: Optional[str] = None
    status: LeadStatus = LeadStatus.NEW
    notes: Optional[str] = None
    expected_value: Optional[float] = None
    assigned_to: Optional[int] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(LeadBase):
    name: Optional[str] = None
    email: Optional[str] = None

class Lead(LeadBase):
    id: int
    managing_company_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        use_enum_values = True 