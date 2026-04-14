from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime

class EmployeeFeedbackCreate(BaseModel):
    to_employee_id: int
    feedback: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    remarks: Optional[str] = None

class EmployeeFeedbackResponse(BaseModel):
    id: int
    from_employee_id: int
    to_employee_id: int
    feedback: str
    rating: int
    remarks: Optional[str]
    created_at: datetime
    updated_at: datetime
    from_employee_name: str
    to_employee_name: str

    class Config:
        from_attributes = True

class ClientFeedbackCreate(BaseModel):
    client_email: Optional[EmailStr] = None
    feedback: str = Field(..., min_length=1)
    rating: int = Field(..., ge=1, le=5)
    remarks: Optional[str] = None

class ClientFeedbackResponse(BaseModel):
    id: int
    client_email: str
    feedback: Optional[str]
    rating: Optional[int]
    remarks: Optional[str]
    is_submitted: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClientFeedbackFormCreate(BaseModel):
    client_email: EmailStr

class ClientFeedbackFormResponse(BaseModel):
    form_url: str
    expires_at: datetime 