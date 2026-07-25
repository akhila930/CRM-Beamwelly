from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from database import get_db
from models import (
    Employee, User, Budget, DepartmentBudget, Candidate, CandidateStatus, 
    LeaveRequest, LeaveStatus, Task, TaskStatus, LeaveType, SocialMediaCampaign
)
from datetime import datetime, timedelta, date
from typing import Dict, Any
import logging
from routes.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics for the dashboard filtered by company:
    - Total employees count
    - Active recruitment count (candidates in process)
    - Budget utilization percentage
    - Pending leaves count
    - Additional metrics for module cards
    """
    try:
        # Determine company name based on user role
        company_name = None
        if current_user.role == "admin":
            company_name = current_user.company_name
        else:
            # For non-admin users, get company from their employee record
            employee = db.query(Employee).filter(Employee.user_id == current_user.id).first()
            if employee:
                company_name = employee.company_name
        
        if not company_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not determine company for the current user"
            )

        # Get counts in a single database query using subqueries
        from sqlalchemy import select

        month_ago = datetime.now() - timedelta(days=30)

        emp_sub = select(func.count(Employee.id)).where(Employee.company_name == company_name).scalar_subquery()
        active_rec_sub = select(func.count(Candidate.id)).where(
            and_(
                Candidate.company_name == company_name,
                Candidate.status.in_([status.value for status in [
                    CandidateStatus.APPLIED, 
                    CandidateStatus.SCREENING, 
                    CandidateStatus.INTERVIEW
                ]])
            )
        ).scalar_subquery()
        leaves_sub = select(func.count(LeaveRequest.id)).where(
            and_(
                LeaveRequest.company_name == company_name,
                LeaveRequest.status == LeaveStatus.PENDING
            )
        ).scalar_subquery()
        total_tasks_sub = select(func.count(Task.id)).where(Task.company_name == company_name).scalar_subquery()
        completed_tasks_sub = select(func.count(Task.id)).where(
            and_(
                Task.company_name == company_name,
                Task.status == TaskStatus.COMPLETED
            )
        ).scalar_subquery()
        open_pos_sub = select(func.count(Candidate.id)).where(
            and_(
                Candidate.company_name == company_name,
                Candidate.status == CandidateStatus.APPLIED
            )
        ).scalar_subquery()
        recent_tasks_sub = select(func.count(Task.id)).where(
            and_(
                Task.company_name == company_name,
                Task.created_at >= month_ago
            )
        ).scalar_subquery()
        recent_completed_sub = select(func.count(Task.id)).where(
            and_(
                Task.company_name == company_name,
                Task.status == TaskStatus.COMPLETED,
                Task.created_at >= month_ago
            )
        ).scalar_subquery()
        new_reports_sub = select(func.count(Task.id)).where(
            and_(
                Task.company_name == company_name,
                Task.title.ilike('%report%'),
                Task.created_at >= month_ago
            )
        ).scalar_subquery()

        # Execute all subqueries in one query roundtrip
        res = db.execute(select(
            emp_sub, active_rec_sub, leaves_sub, total_tasks_sub, 
            completed_tasks_sub, open_pos_sub, recent_tasks_sub, 
            recent_completed_sub, new_reports_sub
        )).first()

        if res:
            (
                total_employees, active_recruitment, pending_leaves, total_tasks,
                completed_tasks, open_positions, recent_tasks, recent_completed, new_reports
            ) = res
        else:
            total_employees = active_recruitment = pending_leaves = total_tasks = 0
            completed_tasks = open_positions = recent_tasks = recent_completed = new_reports = 0

        total_employees = total_employees or 0
        active_recruitment = active_recruitment or 0
        pending_leaves = pending_leaves or 0
        total_tasks = total_tasks or 0
        completed_tasks = completed_tasks or 0
        open_positions = open_positions or 0
        recent_tasks = recent_tasks or 0
        recent_completed = recent_completed or 0
        new_reports = new_reports or 0

        # Get total and used budget for utilization calculation
        current_budget = db.query(Budget).filter(
            Budget.company_name == company_name,
            Budget.status == "active", 
            Budget.start_date <= date.today(),
            Budget.end_date >= date.today()
        ).first()
        
        budget_utilization = 0
        budget_status = 0
        if current_budget:
            total_allocated = float(sum(dept.allocated_amount for dept in current_budget.department_budgets)) or 1
            total_spent = float(sum(dept.spent_amount for dept in current_budget.department_budgets)) or 0
            budget_utilization = int((total_spent / total_allocated) * 100) if total_allocated > 0 else 0
            budget_status = budget_utilization

        employee_productivity = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        task_completion = int((recent_completed / recent_tasks) * 100) if recent_tasks > 0 else 0

        # Social media impressions (aggregate across campaigns) for the company
        total_impressions = db.query(func.sum(SocialMediaCampaign.roi)).filter(
            SocialMediaCampaign.company_name == company_name
        ).scalar() or 0
        social_impressions = int(total_impressions / 1000) if total_impressions > 1000 else int(total_impressions)

        result = {
            "totalEmployees": total_employees,
            "activeRecruitment": active_recruitment,
            "budgetUtilization": budget_utilization,
            "pendingLeaves": pending_leaves,
            "employeeProductivity": employee_productivity,
            "openPositions": open_positions,
            "socialImpressions": social_impressions,
            "budgetStatus": budget_status,
            "taskCompletion": task_completion,
            "newReports": new_reports,
            "companyName": company_name  # Include company name in response
        }
        
        # Log the response
        logging.info(f"Dashboard stats response for company {company_name}: {result}")
        
        return result
    except Exception as e:
        logging.error(f"Error in dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving dashboard stats: {str(e)}"
        ) 