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

        # Get total employees count for the company
        total_employees = db.query(func.count(Employee.id)).filter(
            Employee.company_name == company_name
        ).scalar() or 0

        # Get active recruitment count for the company
        active_recruitment = db.query(func.count(Candidate.id)).filter(
            Candidate.company_name == company_name,
            Candidate.status.in_([status.value for status in [
                CandidateStatus.APPLIED, 
                CandidateStatus.SCREENING, 
                CandidateStatus.INTERVIEW
            ]])
        ).scalar() or 0

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

        # Get pending leaves count for the company
        pending_leaves = db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.company_name == company_name,
            LeaveRequest.status == LeaveStatus.PENDING
        ).scalar() or 0

        # Additional metrics for module cards
        
        # Employee productivity (task completion percentage) for the company
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name
        ).scalar() or 1
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.status == TaskStatus.COMPLETED
        ).scalar() or 0
        employee_productivity = int((completed_tasks / total_tasks) * 100) if total_tasks > 0 else 0
        
        # Open positions (active job openings) for the company
        open_positions = db.query(func.count(Candidate.id)).filter(
            Candidate.company_name == company_name,
            Candidate.status == CandidateStatus.APPLIED
        ).scalar() or 0
        
        # Social media impressions (aggregate across campaigns) for the company
        social_campaigns = db.query(SocialMediaCampaign).filter(
            SocialMediaCampaign.company_name == company_name
        ).all()
        total_impressions = sum(campaign.roi for campaign in social_campaigns) if social_campaigns else 0
        social_impressions = int(total_impressions / 1000) if total_impressions > 1000 else total_impressions
        
        # Task completion rate for the past 30 days for the company
        month_ago = datetime.now() - timedelta(days=30)
        recent_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.created_at >= month_ago
        ).scalar() or 1
        recent_completed = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.status == TaskStatus.COMPLETED,
            Task.created_at >= month_ago
        ).scalar() or 0
        task_completion = int((recent_completed / recent_tasks) * 100) if recent_tasks > 0 else 0
        
        # Number of new analytics reports for the company
        new_reports = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.title.ilike('%report%'),
            Task.created_at >= month_ago
        ).scalar() or 0

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