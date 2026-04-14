from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from datetime import datetime, timedelta

from database import get_db
from models import User, Task, TaskStatus, Employee
from schemas.productivity import ProductivityMetrics, OverallProductivityMetrics
from routes.auth import get_current_user, require_role

router = APIRouter(prefix="/api/productivity", tags=["productivity"])

@router.get("/employee/{employee_id}", response_model=ProductivityMetrics)
def get_employee_productivity(
    employee_id: int,
    period: str = "week",  # week, month, year
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get productivity metrics for a specific employee"""
    # Check permissions
    if current_user.role not in ["admin", "hr"] and current_user.id != employee_id:
        raise HTTPException(status_code=403, detail="Not authorized to view these metrics")

    # Get the employee
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    # Check if employee belongs to the same company
    if current_user.role != "admin" and employee.company_name != current_user.company_name:
        raise HTTPException(status_code=403, detail="Not authorized to view metrics for employee from different company")

    # Calculate date range
    now = datetime.utcnow()
    if period == "week":
        start_date = now - timedelta(days=7)
    elif period == "month":
        start_date = now - timedelta(days=30)
    elif period == "year":
        start_date = now - timedelta(days=365)
    else:
        raise HTTPException(status_code=400, detail="Invalid period specified")

    # Get tasks statistics for the employee in their company
    tasks_stats = db.query(
        func.count(Task.id).label("total_tasks"),
        func.sum(case((Task.status == TaskStatus.COMPLETED, 1), else_=0)).label("completed_tasks"),
        func.sum(case((Task.status == TaskStatus.PENDING, 1), else_=0)).label("pending_tasks"),
        func.sum(case((Task.due_date < now, 1), else_=0)).label("overdue_tasks")
    ).filter(
        Task.assigned_to == employee_id,
        Task.created_at >= start_date,
        Task.company_name == employee.company_name
    ).first()

    # Calculate completion rate
    total_tasks = tasks_stats.total_tasks or 0
    completed_tasks = tasks_stats.completed_tasks or 0
    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    # Calculate average completion time for completed tasks
    completed_task_times = db.query(
        func.avg(
            func.extract('epoch', Task.completed_at - Task.created_at) / 3600  # Convert to hours
        )
    ).filter(
        Task.assigned_to == employee_id,
        Task.status == TaskStatus.COMPLETED,
        Task.created_at >= start_date,
        Task.company_name == employee.company_name
    ).scalar()

    return {
        "employee_id": employee_id,
        "period": period,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "pending_tasks": tasks_stats.pending_tasks or 0,
        "overdue_tasks": tasks_stats.overdue_tasks or 0,
        "completion_rate": round(completion_rate, 2),
        "average_completion_time": round(completed_task_times or 0, 2)  # in hours
    }

@router.get("/team/{department}", response_model=List[ProductivityMetrics])
def get_team_productivity(
    department: str,
    period: str = "week",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get productivity metrics for all employees in a department"""
    # Check permissions
    if current_user.role not in ["admin", "hr"] and current_user.department != department:
        raise HTTPException(status_code=403, detail="Not authorized to view team metrics")

    # Get all employees in the department
    employees = db.query(User).filter(User.department == department).all()
    
    return [
        get_employee_productivity(
            employee_id=employee.id,
            period=period,
            current_user=current_user,
            db=db
        )
        for employee in employees
    ]

@router.get("/tasks/productivity-metrics", response_model=OverallProductivityMetrics)
def get_overall_productivity_metrics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overall productivity metrics for the current user's company"""
    company_name = current_user.company_name
    if not company_name:
        raise HTTPException(status_code=400, detail="User not associated with a company.")

    # Get all tasks for the current user's company
    tasks = db.query(Task).filter(Task.company_name == company_name).all()

    total_tasks = len(tasks)
    completed_tasks = sum(1 for task in tasks if task.status == TaskStatus.COMPLETED)
    in_progress_tasks = sum(1 for task in tasks if task.status == TaskStatus.IN_PROGRESS)
    overdue_tasks = sum(1 for task in tasks if task.status == TaskStatus.OVERDUE)

    completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0

    return {
        "completed": {"count": completed_tasks, "percentage": round(completion_rate, 2)},
        "inProgress": {"count": in_progress_tasks, "percentage": 0}, # Percentage can be added based on total in-progress tasks
        "overdue": {"count": overdue_tasks, "percentage": 0}, # Percentage can be added based on total overdue tasks
        "completionRate": round(completion_rate, 2),
    } 