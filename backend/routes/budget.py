from fastapi import APIRouter, Depends, HTTPException, status, Form, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict
from datetime import datetime, date
from decimal import Decimal
from dateutil.relativedelta import relativedelta
import random
from pydantic import BaseModel
import os
import shutil
import uuid
from fastapi.responses import JSONResponse, Response

from database import get_db
from models import Budget, DepartmentBudget, User, Expense
from schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
    BudgetResponse,
    DepartmentBudgetCreate,
    DepartmentBudgetUpdate,
    DepartmentBudgetResponse
)
from routes.auth import get_current_user

router = APIRouter(prefix="/api/budget", tags=["budget"])

class DepartmentBudgetOut(BaseModel):
    id: int
    budget_id: int
    department: str
    allocated_amount: float
    spent_amount: float
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ExpenseOut(BaseModel):
    id: int
    type: str
    amount: float
    department: str
    date: str
    description: str
    receipt_url: str | None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class ForecastOut(BaseModel):
    department: str
    allocated: float
    spent: float
    remaining: float
    projected_spend: float
    status: str

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    type: str
    amount: float
    department: str
    date: str
    description: str

@router.post("/budgets", response_model=BudgetResponse)
async def create_budget(
    budget: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_budget = Budget(**budget.dict(), company_name=current_user.company_name)
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    return db_budget

@router.get("/budgets", response_model=List[BudgetResponse])
async def get_budgets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Budget).filter(Budget.company_name == current_user.company_name).all()

@router.get("/budgets/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    budget = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.company_name == current_user.company_name
    ).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return budget

@router.put("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    budget: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        db_budget = db.query(Budget).filter(
            Budget.id == budget_id,
            Budget.company_name == current_user.company_name
        ).first()
        if not db_budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        update_data = budget.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_budget, key, value)
        
        db.commit()
        db.refresh(db_budget)
        return db_budget
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating budget: {str(e)}"
        )

@router.delete("/budgets/{budget_id}")
async def delete_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        budget = db.query(Budget).filter(
            Budget.id == budget_id,
            Budget.company_name == current_user.company_name
        ).first()
        if not budget:
            raise HTTPException(status_code=404, detail="Budget not found")
        
        db.delete(budget)
        db.commit()
        return {"message": "Budget deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting budget: {str(e)}"
        )

@router.post("/department-budgets", response_model=DepartmentBudgetResponse)
async def create_department_budget(
    department_budget: DepartmentBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    db_dept_budget = DepartmentBudget(**department_budget.dict(), company_name=current_user.company_name)
    db.add(db_dept_budget)
    db.commit()
    db.refresh(db_dept_budget)
    return db_dept_budget

@router.get("/department-budgets", response_model=List[DepartmentBudgetOut])
async def get_department_budgets(
    budget_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DepartmentBudget).filter(DepartmentBudget.company_name == current_user.company_name)
    if budget_id:
        query = query.filter(DepartmentBudget.budget_id == budget_id)
    else:
        # If no budget_id provided, get the latest active budget's departments
        latest_budget = db.query(Budget).filter(
            Budget.status == "active",
            Budget.company_name == current_user.company_name
        ).order_by(Budget.created_at.desc()).first()
        if latest_budget:
            query = query.filter(DepartmentBudget.budget_id == latest_budget.id)
        else:
            return []
    
    dept_budgets = query.all()
    return [
        DepartmentBudgetOut(
            id=dept.id,
            budget_id=dept.budget_id,
            department=dept.department,
            allocated_amount=float(dept.allocated_amount),
            spent_amount=float(dept.spent_amount),
            created_at=dept.created_at.isoformat() if dept.created_at else "",
            updated_at=dept.updated_at.isoformat() if dept.updated_at else ""
        )
        for dept in dept_budgets
    ]

@router.put("/department-budgets/{department_budget_id}", response_model=DepartmentBudgetResponse)
async def update_department_budget(
    department_budget_id: int,
    department_budget: DepartmentBudgetUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        db_department_budget = db.query(DepartmentBudget).filter(DepartmentBudget.id == department_budget_id).first()
        if not db_department_budget:
            raise HTTPException(status_code=404, detail="Department budget not found")
        
        update_data = department_budget.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_department_budget, key, value)
        
        db.commit()
        db.refresh(db_department_budget)
        return db_department_budget
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating department budget: {str(e)}"
        )

@router.delete("/department-budgets/{department_budget_id}")
async def delete_department_budget(
    department_budget_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        department_budget = db.query(DepartmentBudget).filter(DepartmentBudget.id == department_budget_id).first()
        if not department_budget:
            raise HTTPException(status_code=404, detail="Department budget not found")
        
        db.delete(department_budget)
        db.commit()
        return {"message": "Department budget deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting department budget: {str(e)}"
        )

async def sync_department_spent_amounts(db: Session):
    """Synchronize department spent amounts with actual expenses"""
    try:
        # Get all departments
        departments = db.query(DepartmentBudget).all()
        
        for dept in departments:
            # Calculate total spent from expenses table
            total_spent = db.query(func.sum(Expense.amount)).filter(
                Expense.department == dept.department
            ).scalar() or 0
            
            # Update department spent amount
            dept.spent_amount = Decimal(str(total_spent))
        
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error syncing department spent amounts: {str(e)}")
        raise

@router.get("/overview")
async def get_budget_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the latest budget for the company
    latest_budget = db.query(Budget).filter(
        Budget.company_name == current_user.company_name
    ).order_by(Budget.created_at.desc()).first()
    if not latest_budget:
        return {
            "totalBudget": 0,
            "totalSpent": 0,
            "remainingBudget": 0,
            "budgetPeriod": {
                "startDate": str(date.today()),
                "endDate": str(date.today())
            }
        }

    # Sync department spent amounts with actual expenses
    await sync_department_spent_amounts(db)

    # Calculate total spent
    total_spent = db.query(func.sum(DepartmentBudget.spent_amount)).filter(
        DepartmentBudget.budget_id == latest_budget.id,
        DepartmentBudget.company_name == current_user.company_name
    ).scalar() or 0

    return {
        "totalBudget": float(latest_budget.total_budget),
        "totalSpent": float(total_spent),
        "remainingBudget": float(latest_budget.total_budget - total_spent),
        "budgetPeriod": {
            "startDate": str(latest_budget.start_date),
            "endDate": str(latest_budget.end_date)
        }
    }

@router.post("/update")
async def update_budget_overview(
    data: Dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update the total budget and budget period"""
    try:
        if current_user.role not in ['admin', 'manager']:
            raise HTTPException(status_code=403, detail="Not authorized to update budget")

        total_budget = Decimal(str(data.get('totalBudget', 0)))
        start_date = datetime.fromisoformat(data['budgetPeriod']['startDate'].replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(data['budgetPeriod']['endDate'].replace('Z', '+00:00')).date()

        # Update or create active budget for the current company
        active_budget = db.query(Budget).filter(
            Budget.status == "active",
            Budget.company_name == current_user.company_name
        ).first()
        
        if active_budget:
            active_budget.total_budget = total_budget
            active_budget.start_date = start_date
            active_budget.end_date = end_date
        else:
            active_budget = Budget(
                total_budget=total_budget,
                start_date=start_date,
                end_date=end_date,
                status="active",
                company_name=current_user.company_name
            )
            db.add(active_budget)

        db.commit()
        
        return {
            "totalBudget": float(total_budget),
            "budgetPeriod": {
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat()
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating budget: {str(e)}"
        )

@router.get("/allocation")
async def get_budget_allocation(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the latest active budget for the current company
    latest_budget = db.query(Budget).filter(
        Budget.status == "active",
        Budget.company_name == current_user.company_name
    ).order_by(Budget.created_at.desc()).first()
    
    if not latest_budget:
        return {
            "labels": [],
            "data": []
        }

    # Get department allocations for this company
    dept_budgets = db.query(
        DepartmentBudget.department,
        DepartmentBudget.allocated_amount
    ).filter(
        DepartmentBudget.budget_id == latest_budget.id,
        DepartmentBudget.company_name == current_user.company_name
    ).all()

    return {
        "labels": [dept[0] for dept in dept_budgets],
        "data": [float(dept[1]) for dept in dept_budgets]
    }

@router.get("/vs-spend")
async def get_budget_vs_spend(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the latest budget for the current company
    latest_budget = db.query(Budget).filter(
        Budget.company_name == current_user.company_name
    ).order_by(Budget.created_at.desc()).first()
    if not latest_budget:
        return {
            "departments": [],
            "allocated": [],
            "spent": []
        }

    # Get department allocations and spending for this company
    dept_budgets = db.query(
        DepartmentBudget.department,
        DepartmentBudget.allocated_amount,
        DepartmentBudget.spent_amount
    ).filter(
        DepartmentBudget.budget_id == latest_budget.id,
        DepartmentBudget.company_name == current_user.company_name
    ).all()

    return {
        "departments": [dept[0] for dept in dept_budgets],
        "allocated": [float(dept[1]) for dept in dept_budgets],
        "spent": [float(dept[2]) for dept in dept_budgets]
    }

@router.get("/forecast/chart")
async def get_forecast_chart_data(
    period: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get forecast chart data for the specified period"""
    try:
        # Get expenses for the past 6 months
        six_months_ago = datetime.now().date() - relativedelta(months=6)
        expenses = db.query(Expense).filter(
            Expense.date >= six_months_ago
        ).all()

        # Group expenses by month
        monthly_expenses = {}
        for expense in expenses:
            month_key = expense.date.strftime("%b %Y")
            if month_key not in monthly_expenses:
                monthly_expenses[month_key] = 0
            monthly_expenses[month_key] += float(expense.amount)

        # Generate past 6 months if no data exists
        chart_data = []
        for i in range(-5, 1):
            month = (datetime.now().replace(day=1) + relativedelta(months=i)).strftime("%b %Y")
            actual_amount = monthly_expenses.get(month, 0)
            chart_data.append({
                "name": month,
                "actual": actual_amount,
                "forecast": None
            })

        # Calculate average monthly expense for forecasting
        actual_expenses = list(monthly_expenses.values())
        avg_monthly_expense = sum(actual_expenses) / len(actual_expenses) if actual_expenses else 0
        
        # Add forecast data points with growth rate
        growth_rate = 0.05  # 5% monthly growth rate
        last_actual = max(list(monthly_expenses.values()) + [avg_monthly_expense])
        
        months = int(period)
        for i in range(1, months + 1):
            month = (datetime.now().replace(day=1) + relativedelta(months=i)).strftime("%b %Y")
            forecast_value = last_actual * (1 + growth_rate) ** i
            chart_data.append({
                "name": month,
                "actual": None,
                "forecast": forecast_value
            })

        return chart_data
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching forecast chart data: {str(e)}"
        )

@router.get("/forecast")
async def get_forecast(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get budget forecast for all departments in the company"""
    try:
        # Get expenses for the past 6 months for the company
        six_months_ago = datetime.now().date() - relativedelta(months=6)
        expenses = db.query(Expense).filter(
            Expense.date >= six_months_ago,
            Expense.company_name == current_user.company_name
        ).all()

        # Calculate total expenses for the past 6 months
        total_expenses = sum(float(expense.amount) for expense in expenses)
        monthly_avg = total_expenses / 6 if expenses else 0

        # Calculate projected expenses (with 5% monthly growth)
        growth_rate = 0.05
        projected_expenses = monthly_avg * 6 * (1 + growth_rate)  # For next 6 months

        # Calculate expense change percentage
        expense_change_percentage = ((projected_expenses - total_expenses) / total_expenses * 100) if total_expenses > 0 else 0

        # Calculate recommended budget (10% buffer over projected expenses)
        recommended_budget = projected_expenses * 1.1

        # Get department budgets for the company
        dept_budgets = db.query(DepartmentBudget).filter(
            DepartmentBudget.company_name == current_user.company_name
        ).all()
        
        forecasts = []
        for dept in dept_budgets:
            # Get department expenses for past 6 months
            dept_expenses = [e for e in expenses if e.department == dept.department]
            dept_total = sum(float(e.amount) for e in dept_expenses)
            dept_monthly_avg = dept_total / 6 if dept_expenses else 0

            # Project department expenses
            projected_amount = dept_monthly_avg * 6 * (1 + growth_rate)
            
            # Calculate change percentage
            change_percentage = ((projected_amount - dept_total) / dept_total * 100) if dept_total > 0 else 0
            
            forecasts.append({
                "department": dept.department,
                "allocated": float(dept.allocated_amount),
                "spent": float(dept.spent_amount),
                "remaining": float(dept.allocated_amount - dept.spent_amount),
                "projected_spend": projected_amount,
                "status": "Over Budget" if projected_amount > float(dept.allocated_amount) else 
                         "Warning" if projected_amount >= float(dept.allocated_amount) * 0.9 else 
                         "On Track"
            })

        return {
            "projectedExpenses": projected_expenses,
            "expenseChangePercentage": expense_change_percentage,
            "recommendedBudget": recommended_budget,
            "departmentForecasts": forecasts
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating forecast: {str(e)}"
        )

@router.post("/allocate")
async def allocate_department_budgets(
    allocation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Get the latest active budget for the current company
    current_budget = db.query(Budget).filter(
        Budget.status == "active",
        Budget.company_name == current_user.company_name
    ).order_by(Budget.created_at.desc()).first()
    
    if not current_budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active budget found"
        )
    
    # Validate total allocation doesn't exceed budget
    total_allocation = sum(dept["allocated_amount"] for dept in allocation_data["departments"])
    if total_allocation > float(current_budget.total_budget):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total allocation exceeds available budget"
        )

    # Delete existing allocations for this company and budget
    db.query(DepartmentBudget).filter(
        DepartmentBudget.budget_id == current_budget.id,
        DepartmentBudget.company_name == current_user.company_name
    ).delete()

    # Create new allocations for this company
    for dept_data in allocation_data["departments"]:
        dept_budget = DepartmentBudget(
            budget_id=current_budget.id,
            department=dept_data["department"],
            allocated_amount=dept_data["allocated_amount"],
            spent_amount=0,
            company_name=current_user.company_name
        )
        db.add(dept_budget)

    db.commit()
    
    return {"message": "Department budgets allocated successfully"}

@router.get("/expenses")
async def get_expenses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all expenses for the company"""
    try:
        expenses = db.query(Expense).filter(Expense.company_name == current_user.company_name).all()
        return [
            {
                "id": expense.id,
                "type": expense.type,
                "amount": float(expense.amount),
                "department": expense.department,
                "date": expense.date.strftime("%Y-%m-%d"),
                "description": expense.description,
                "receipt_url": expense.receipt_url,
                "created_at": expense.created_at.isoformat() if expense.created_at else "",
                "updated_at": expense.updated_at.isoformat() if expense.updated_at else ""
            }
            for expense in expenses
        ]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching expenses: {str(e)}"
        )

@router.post("/expenses", response_model=ExpenseOut)
async def create_expense(
    type: str = Form(...),
    amount: float = Form(...),
    department: str = Form(...),
    date: str = Form(...),
    description: str = Form(...),
    receipt: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new expense with optional receipt upload"""
    try:
        # Save receipt if provided
        receipt_url = None
        if receipt and receipt.filename:
            # Validate file type
            if not receipt.filename.lower().endswith('.pdf'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only PDF files are allowed"
                )

            try:
                # Create uploads directory if it doesn't exist
                upload_dir = "uploads/receipts"
                os.makedirs(upload_dir, exist_ok=True)
                
                # Generate unique filename
                unique_filename = f"{uuid.uuid4()}.pdf"
                file_path = os.path.join(upload_dir, unique_filename)
                
                # Save file
                with open(file_path, "wb") as buffer:
                    shutil.copyfileobj(receipt.file, buffer)
                receipt_url = f"/uploads/receipts/{unique_filename}"
            except Exception as e:
                print(f"Error saving receipt: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error saving receipt file"
                )

        # Get department budget
        dept_budget = db.query(DepartmentBudget).filter(
            DepartmentBudget.department == department,
            DepartmentBudget.company_name == current_user.company_name
        ).first()

        # Create new expense
        new_expense = Expense(
            type=type,
            amount=amount,
            department=department,
            date=datetime.strptime(date, "%Y-%m-%d").date(),
            description=description,
            receipt_url=receipt_url,
            company_name=current_user.company_name
        )
        db.add(new_expense)

        # Update department budget spent amount
        if dept_budget:
            dept_budget.spent_amount += Decimal(str(amount))

        db.commit()
        db.refresh(new_expense)

        return {
            "id": new_expense.id,
            "type": new_expense.type,
            "amount": float(new_expense.amount),
            "department": new_expense.department,
            "date": new_expense.date.strftime("%Y-%m-%d"),
            "description": new_expense.description,
            "receipt_url": new_expense.receipt_url,
            "created_at": new_expense.created_at.isoformat() if new_expense.created_at else "",
            "updated_at": new_expense.updated_at.isoformat() if new_expense.updated_at else ""
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating expense: {str(e)}"
        )

@router.put("/expenses/{expense_id}", response_model=ExpenseOut)
async def update_expense(
    expense_id: int,
    expense_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an existing expense"""
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )

        # If department changed, update department budgets
        if 'department' in expense_data and expense_data['department'] != expense.department:
            # Remove amount from old department
            old_dept = db.query(DepartmentBudget).filter(
                DepartmentBudget.department == expense.department
            ).first()
            if old_dept:
                old_dept.spent_amount -= Decimal(str(expense.amount))

            # Add amount to new department
            new_dept = db.query(DepartmentBudget).filter(
                DepartmentBudget.department == expense_data['department']
            ).first()
            if not new_dept:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Department {expense_data['department']} not found"
                )
            new_dept.spent_amount += Decimal(str(expense.amount))

        # If amount changed, update department budget
        if 'amount' in expense_data and expense_data['amount'] != float(expense.amount):
            dept = db.query(DepartmentBudget).filter(
                DepartmentBudget.department == expense.department
            ).first()
            if dept:
                # Remove old amount and add new amount
                dept.spent_amount = dept.spent_amount - Decimal(str(expense.amount)) + Decimal(str(expense_data['amount']))

        # Update expense fields
        for key, value in expense_data.items():
            if hasattr(expense, key):
                if key == 'date':
                    value = datetime.strptime(value, "%Y-%m-%d").date()
                setattr(expense, key, value)

        db.commit()
        db.refresh(expense)
        
        # Format the response data
        return ExpenseOut(
            id=expense.id,
            type=expense.type,
            amount=float(expense.amount),
            department=expense.department,
            date=expense.date.isoformat(),
            description=expense.description,
            receipt_url=expense.receipt_url,
            created_at=expense.created_at.isoformat() if expense.created_at else "",
            updated_at=expense.updated_at.isoformat() if expense.updated_at else ""
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating expense: {str(e)}"
        )

@router.delete("/expenses/{expense_id}")
async def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete an expense"""
    try:
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Expense not found"
            )

        # Update department spent amount
        dept = db.query(DepartmentBudget).filter(
            DepartmentBudget.department == expense.department
        ).first()
        if dept:
            dept.spent_amount -= Decimal(str(expense.amount))

        # Delete receipt file if exists
        if expense.receipt_url:
            file_path = os.path.join(".", expense.receipt_url.lstrip("/"))
            try:
                os.remove(file_path)
            except OSError:
                # Log error but continue with expense deletion
                print(f"Error deleting receipt file: {file_path}")

        db.delete(expense)
        db.commit()
        return {"message": "Expense deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting expense: {str(e)}"
        )