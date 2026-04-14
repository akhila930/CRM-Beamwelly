from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field

class BudgetBase(BaseModel):
    total_budget: Decimal = Field(..., gt=0)
    start_date: datetime
    end_date: datetime
    status: str = "active"

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    total_budget: Optional[Decimal] = Field(None, gt=0)
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    status: Optional[str] = None

class BudgetResponse(BudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class DepartmentBudgetBase(BaseModel):
    budget_id: int
    department: str = Field(..., min_length=1, max_length=100)
    allocated_amount: Decimal = Field(..., gt=0)
    spent_amount: Decimal = Field(0, ge=0)
    description: Optional[str] = Field(None, max_length=500)

class DepartmentBudgetCreate(DepartmentBudgetBase):
    pass

class DepartmentBudgetUpdate(BaseModel):
    allocated_amount: Optional[Decimal] = Field(None, gt=0)
    spent_amount: Optional[Decimal] = Field(None, ge=0)
    description: Optional[str] = Field(None, max_length=500)

class DepartmentBudgetResponse(DepartmentBudgetBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True 