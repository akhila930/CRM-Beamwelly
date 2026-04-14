from typing import Optional
from datetime import datetime, date
from pydantic import BaseModel

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