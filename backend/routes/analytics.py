from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Dict, Any
from datetime import datetime, timedelta

from database import get_db
from models import User, Task, Lead, Candidate, LeaveRequest, Budget, DepartmentBudget, SocialMediaCampaign, Client, Service, Employee
from routes.auth import get_current_user

router = APIRouter()

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overall dashboard statistics across all modules for the current user's company"""
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
                status_code=400,
                detail="Could not determine company for the current user"
            )

        # Employee stats for the company
        total_employees = db.query(func.count(Employee.id)).filter(
            Employee.company_name == company_name
        ).scalar() or 0
        active_employees = db.query(func.count(Employee.id)).filter(
            Employee.company_name == company_name,
            Employee.status == "active"
        ).scalar() or 0
        
        # Task stats for the company
        total_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name
        ).scalar() or 0
        completed_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.status == "completed"
        ).scalar() or 0
        overdue_tasks = db.query(func.count(Task.id)).filter(
            Task.company_name == company_name,
            Task.due_date < datetime.utcnow().date(),
            Task.status != "completed"
        ).scalar() or 0

        # Lead stats for the company
        total_leads = db.query(func.count(Lead.id)).filter(
            Lead.managing_company_name == company_name
        ).scalar() or 0
        active_leads = db.query(func.count(Lead.id)).filter(
            Lead.managing_company_name == company_name,
            Lead.status.in_(["new", "contacted", "qualified", "proposal", "negotiation"])
        ).scalar() or 0
        converted_leads = db.query(func.count(Lead.id)).filter(
            Lead.managing_company_name == company_name,
            Lead.status == "won"
        ).scalar() or 0

        # Client stats for the company
        total_clients = db.query(func.count(Client.id)).filter(
            Client.managing_company_name == company_name
        ).scalar() or 0
        active_clients = db.query(func.count(Client.id)).filter(
            Client.managing_company_name == company_name,
            Client.status == "active"
        ).scalar() or 0
        total_services = db.query(func.count(Service.id)).filter(
            Service.managing_company_name == company_name
        ).scalar() or 0

        # Recruitment stats for the company
        total_candidates = db.query(func.count(Candidate.id)).filter(
            Candidate.company_name == company_name
        ).scalar() or 0
        active_candidates = db.query(func.count(Candidate.id)).filter(
            Candidate.company_name == company_name,
            Candidate.stage.in_(["screening", "interview", "offer"])
        ).scalar() or 0
        hired_candidates = db.query(func.count(Candidate.id)).filter(
            Candidate.company_name == company_name,
            Candidate.stage == "hired"
        ).scalar() or 0

        # Leave stats for the company
        pending_leaves = db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.company_name == company_name,
            LeaveRequest.status == "pending"
        ).scalar() or 0
        approved_leaves = db.query(func.count(LeaveRequest.id)).filter(
            LeaveRequest.company_name == company_name,
            LeaveRequest.status == "approved"
        ).scalar() or 0

        # Budget overview for the company
        latest_budget = db.query(Budget).filter(
            Budget.company_name == company_name
        ).order_by(Budget.created_at.desc()).first()
        total_budget = float(latest_budget.total_budget) if latest_budget else 0
        total_spent = float(db.query(func.sum(DepartmentBudget.spent_amount)).filter(
            DepartmentBudget.budget_id == latest_budget.id
        ).scalar() or 0) if latest_budget else 0
        
        remaining_budget = total_budget - total_spent

        return {
            "employees": {
                "total": total_employees,
                "active": active_employees
            },
            "tasks": {
                "total": total_tasks,
                "completed": completed_tasks,
                "overdue": overdue_tasks,
                "completion_rate": round((completed_tasks / total_tasks * 100) if total_tasks > 0 else 0, 2)
            },
            "leads": {
                "total": total_leads,
                "active": active_leads,
                "converted": converted_leads,
                "conversion_rate": round((converted_leads / total_leads * 100) if total_leads > 0 else 0, 2)
            },
            "clients": {
                "total": total_clients,
                "active": active_clients,
                "total_services": total_services
            },
            "recruitment": {
                "total_candidates": total_candidates,
                "active_candidates": active_candidates,
                "hired_candidates": hired_candidates,
                "hiring_rate": round((hired_candidates / total_candidates * 100) if total_candidates > 0 else 0, 2)
            },
            "leaves": {
                "pending": pending_leaves,
                "approved": approved_leaves
            },
            "budget": {
                "total_budget": total_budget,
                "total_spent": total_spent,
                "remaining": remaining_budget,
                "utilization_rate": round((total_spent / total_budget * 100) if total_budget > 0 else 0, 2)
            },
            "companyName": company_name  # Include company name in response
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching dashboard stats: {str(e)}"
        )

@router.get("/module-overview/{module}")
async def get_module_overview(
    module: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get overview data for specific module filtered by company"""
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
                status_code=400,
                detail="Could not determine company for the current user"
            )

        if module == "employees":
            # Get employee count by department for the company
            dept_counts = db.query(
                Employee.department,
                func.count(Employee.id).label('count')
            ).filter(
                Employee.company_name == company_name
            ).group_by(Employee.department).all()
            
            return {
                "type": "bar",
                "data": [
                    {"name": dept[0], "value": dept[1]}
                    for dept in dept_counts
                ]
            }

        elif module == "tasks":
            # Get task count by status for the company
            status_counts = db.query(
                Task.status,
                func.count(Task.id).label('count')
            ).filter(
                Task.company_name == company_name
            ).group_by(Task.status).all()
            
            return {
                "type": "pie",
                "data": [
                    {"name": status[0], "value": status[1]}
                    for status in status_counts
                ]
            }

        elif module == "leads":
            # Get lead count by status for the company
            status_counts = db.query(
                Lead.status,
                func.count(Lead.id).label('count')
            ).filter(
                Lead.managing_company_name == company_name
            ).group_by(Lead.status).all()
            
            return {
                "type": "pie",
                "data": [
                    {"name": status[0], "value": status[1]}
                    for status in status_counts
                ]
            }

        elif module == "clients":
            # Get client count by status for the company
            status_counts = db.query(
                Client.status,
                func.count(Client.id).label('count')
            ).filter(
                Client.managing_company_name == company_name
            ).group_by(Client.status).all()
            
            return {
                "type": "pie",
                "data": [
                    {"name": status[0], "value": status[1]}
                    for status in status_counts
                ]
            }

        elif module == "recruitment":
            # Get candidate count by stage for the company
            stage_counts = db.query(
                Candidate.stage,
                func.count(Candidate.id).label('count')
            ).filter(
                Candidate.company_name == company_name
            ).group_by(Candidate.stage).all()
            
            return {
                "type": "bar",
                "data": [
                    {"name": stage[0], "value": stage[1]}
                    for stage in stage_counts
                ]
            }

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid module: {module}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching module overview: {str(e)}"
        )

@router.get("/report")
async def get_report_data(
    module: str,
    type: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get report data for specific module and visualization type"""
    try:
        if module == "employees":
            if type == "chart":
                # Get employee count by department
                dept_counts = db.query(
                    Employee.department,
                    func.count(Employee.id).label('count')
                ).group_by(Employee.department).all()
                
                return [
                    {"name": dept[0], "value": dept[1]}
                    for dept in dept_counts
                ]
            elif type == "pie":
                # Get employee count by position instead of role
                position_counts = db.query(
                    Employee.position,
                    func.count(Employee.id).label('count')
                ).group_by(Employee.position).all()
                
                return [
                    {"name": role[0], "value": role[1]}
                    for role in position_counts
                ]

        elif module == "tasks":
            if type == "chart":
                # Get task count by status for the company
                status_counts = db.query(
                    Task.status,
                    func.count(Task.id).label('count')
                ).filter(
                    Task.company_name == current_user.company_name
                ).group_by(Task.status).all()
                
                return [
                    {"name": status[0], "value": status[1]}
                    for status in status_counts
                ]
            elif type == "pie":
                # Get task count by priority for the company
                priority_counts = db.query(
                    Task.priority,
                    func.count(Task.id).label('count')
                ).filter(
                    Task.company_name == current_user.company_name
                ).group_by(Task.priority).all()
                
                return [
                    {"name": priority[0], "value": priority[1]}
                    for priority in priority_counts
                ]

        elif module == "leads":
            if type == "chart":
                # Get lead count by status
                status_counts = db.query(
                    Lead.status,
                    func.count(Lead.id).label('count')
                ).group_by(Lead.status).all()
                
                return [
                    {"name": status[0], "value": status[1]}
                    for status in status_counts
                ]
            elif type == "pie":
                # Get lead count by source
                source_counts = db.query(
                    Lead.source,
                    func.count(Lead.id).label('count')
                ).group_by(Lead.source).all()
                
                return [
                    {"name": source[0], "value": source[1]}
                    for source in source_counts
                ]

        elif module == "recruitment":
            if type == "chart":
                # Get candidate count by stage
                stage_counts = db.query(
                    Candidate.stage,
                    func.count(Candidate.id).label('count')
                ).group_by(Candidate.stage).all()
                
                return [
                    {"name": stage[0], "value": stage[1]}
                    for stage in stage_counts
                ]
            elif type == "pie":
                # Get candidate count by position
                position_counts = db.query(
                    Candidate.position,
                    func.count(Candidate.id).label('count')
                ).group_by(Candidate.position).all()
                
                return [
                    {"name": position[0], "value": position[1]}
                    for position in position_counts
                ]

        return []
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching report data: {str(e)}"
        ) 