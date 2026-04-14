from pydantic import BaseModel, EmailStr, Field, validator
from typing import List, Optional, Dict
from datetime import datetime
from enum import Enum

from models import CandidateStatus  # Import the enum

class CandidateBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, max_length=20)
    position: str = Field(..., min_length=1, max_length=100)
    experience: Optional[float] = Field(None, ge=0, le=100)
    skills: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    company_name: Optional[str] = Field(None, max_length=100)

    @validator('skills', pre=True, always=True)
    def convert_skills_to_string(cls, v):
        if v is None:
            return ""
        if isinstance(v, list):
            return ','.join(str(skill).strip() for skill in v if skill)
        return str(v).replace(', ', ',')

class CandidateCreate(CandidateBase):
    stage: Optional[CandidateStatus] = CandidateStatus.APPLIED
    status: Optional[str] = "active"
    resume_url: Optional[str] = None

class CandidateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = Field(None, max_length=20)
    position: Optional[str] = Field(None, min_length=1, max_length=100)
    experience: Optional[float] = Field(None, ge=0, le=100)
    skills: Optional[str] = Field(None, max_length=500)
    stage: Optional[CandidateStatus] = None
    notes: Optional[str] = Field(None, max_length=1000)
    resume_url: Optional[str] = None
    status: Optional[str] = None

class CandidateResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    position: str
    experience: Optional[float] = None
    skills: Optional[str] = None
    resume_url: Optional[str] = None
    stage: str
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    creator_name: Optional[str] = None

    class Config:
        from_attributes = True

    @validator('skills', pre=True, always=True)
    def ensure_skills_string(cls, v):
        if v is None:
            return ""
        if isinstance(v, list):
            return ','.join(str(skill).strip() for skill in v if skill)
        return str(v).replace(', ', ',')

    @validator('experience', pre=True, always=True)
    def format_experience(cls, v):
        if v is None:
            return None
        return float(v)

class RecruitmentStatsResponse(BaseModel):
    total_candidates: int
    active_candidates: int
    hired_candidates: int
    applied_candidates: int

    class Config:
        from_attributes = True