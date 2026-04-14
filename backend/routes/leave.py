from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date
from dateutil.relativedelta import relativedelta

from database import get_db
from models import LeaveRequest, LeaveBalance, User, LeaveType, LeaveStatus, CompanyLeavePolicy
from schemas.leave import (
    LeaveRequestCreate, LeaveRequestUpdate, LeaveRequestResponse,
    LeaveBalanceResponse, LeaveBalanceUpdate, LeaveStatistics
)
from routes.auth import get_current_user
from .leave_policy import get_leave_policy as get_company_policy_route

router = APIRouter(
    prefix="/leave",
    tags=["leave"]
)

def get_company_leave_policy(db: Session, company_name: str) -> CompanyLeavePolicy:
    policy = db.query(CompanyLeavePolicy).filter(
        CompanyLeavePolicy.company_name == company_name
    ).first()
    
    if not policy:
        # Auto-create and persist default policy if missing
        policy = CompanyLeavePolicy(
            company_name=company_name,
            annual_leave_count=20,
            sick_leave_count=15,
            casual_leave_count=12
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)
    return policy

def calculate_leave_days(start_date: date, end_date: date) -> int:
    # TODO: Implement proper business day calculation excluding weekends and holidays
    delta = end_date - start_date
    return delta.days + 1

def check_leave_balance(db: Session, employee_id: int, leave_type: str, days_requested: int, company_name: str | None) -> bool:
    current_year = datetime.now().year
    # Find any existing balance for the user and year, regardless of company_name
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.year == current_year
    ).first()

    if not balance:
        # If no balance exists, create a default one.
        # get_company_leave_policy already handles the case where company_name is None
        policy = get_company_leave_policy(db, company_name)
        balance = LeaveBalance(
            employee_id=employee_id,
            year=current_year,
            annual_leave=policy.annual_leave_count,
            sick_leave=policy.sick_leave_count,
            casual_leave=policy.casual_leave_count,
            company_name=company_name # Assign the provided company_name (can be None)
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
    else:
        # If a balance exists, ensure its company_name is updated if necessary
        # This handles cases where the user might have had a NULL company_name previously
        if balance.company_name != company_name:
            balance.company_name = company_name
        db.commit()
        db.refresh(balance)

    if leave_type == LeaveType.CASUAL:
        return balance.casual_leave >= days_requested
    elif leave_type == LeaveType.SICK:
        return balance.sick_leave >= days_requested
    elif leave_type == LeaveType.ANNUAL:
        return balance.annual_leave >= days_requested
    return True  # For UNPAID and OTHER leave types

def update_leave_balance(db: Session, employee_id: int, leave_type: str, days_used: int, company_name: str | None):
    current_year = datetime.now().year
    # Modify query to handle potential NULL company_name in leave_balances
    if company_name:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.year == current_year,
            LeaveBalance.company_name == company_name
        ).first()
    else:
        balance = db.query(LeaveBalance).filter(
            LeaveBalance.employee_id == employee_id,
            LeaveBalance.year == current_year,
            LeaveBalance.company_name.is_(None)
        ).first()

    if balance:
        if leave_type == LeaveType.CASUAL:
            balance.casual_leave -= days_used
        elif leave_type == LeaveType.SICK:
            balance.sick_leave -= days_used
        elif leave_type == LeaveType.ANNUAL:
            balance.annual_leave -= days_used
        db.commit()

@router.post("/request", response_model=LeaveRequestResponse)
async def create_leave_request(
    request: LeaveRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # It's still preferable for a user to be associated with a company for leave management,
    # but we will allow NULL company_name for leave balance lookups.
    # We will still use the user's company_name for the leave request itself if available.
    user_company_name = current_user.company_name if current_user.company_name else None

    # Validate dates
    if request.start_date > request.end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Start date cannot be after end date"
        )

    if request.start_date < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot apply for leave in the past"
        )

    # Calculate leave days
    days_requested = calculate_leave_days(request.start_date, request.end_date)

    # Check leave balance for paid leaves, passing user_company_name
    if request.leave_type in [LeaveType.CASUAL, LeaveType.SICK, LeaveType.ANNUAL]:
        if not check_leave_balance(db, current_user.id, request.leave_type, days_requested, user_company_name):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Insufficient {request.leave_type} leave balance"
            )

    # Create leave request with user's company_name (can be None)
    db_request = LeaveRequest(
        employee_id=current_user.id,
        leave_type=request.leave_type,
        start_date=request.start_date,
        end_date=request.end_date,
        reason=request.reason,
        status=LeaveStatus.PENDING,
        company_name=user_company_name # Use user's company_name (can be None)
    )

    db.add(db_request)
    db.commit()
    db.refresh(db_request)

    # Add employee name to response
    response_data = dict(db_request.__dict__)
    response_data["employee_name"] = current_user.name
    response_data["approver_name"] = None

    return response_data

@router.get("/requests", response_model=List[LeaveRequestResponse])
async def get_leave_requests(
    all: bool = False,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if all and current_user.role == "admin":
        requests = db.query(LeaveRequest).filter(
            LeaveRequest.company_name == company_name
        ).all()
    else:
        # Modify query to include leaves with NULL company_name for the user
        requests = db.query(LeaveRequest).filter(
            LeaveRequest.employee_id == current_user.id,
            # Include leaves with the specified company_name OR with company_name as NULL
            (LeaveRequest.company_name == company_name) | (LeaveRequest.company_name.is_(None))
        ).all()

    # Add employee and approver names to response
    response_data = []
    for request in requests:
        employee = db.query(User).filter(User.id == request.employee_id).first()
        approver = db.query(User).filter(User.id == request.approved_by).first() if request.approved_by else None
        
        request_dict = dict(request.__dict__)
        request_dict["employee_name"] = employee.name if employee else None
        request_dict["approver_name"] = approver.name if approver else None
        response_data.append(request_dict)

    return response_data

@router.put("/requests/{request_id}", response_model=LeaveRequestResponse)
async def update_leave_request(
    request_id: int,
    request_update: LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )

    # Check if user is admin or HR
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators and HR can approve or reject leave requests"
        )

    # Get the leave request
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == request_id,
        LeaveRequest.company_name == current_user.company_name
    ).first()
    
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")

    # Update the status
    leave_request.status = request_update.status
    leave_request.rejection_reason = request_update.rejection_reason
    leave_request.approved_by = current_user.id if request_update.status == LeaveStatus.APPROVED else None
    leave_request.updated_at = datetime.utcnow()

    # If approved, update leave balance
    if request_update.status == LeaveStatus.APPROVED:
        days_requested = calculate_leave_days(leave_request.start_date, leave_request.end_date)
        update_leave_balance(db, leave_request.employee_id, leave_request.leave_type, days_requested, current_user.company_name)

    db.commit()
    db.refresh(leave_request)

    # Add employee and approver names to response
    employee = db.query(User).filter(User.id == leave_request.employee_id).first()
    approver = db.query(User).filter(User.id == leave_request.approved_by).first() if leave_request.approved_by else None

    response_data = dict(leave_request.__dict__)
    response_data["employee_name"] = employee.name if employee else None
    response_data["approver_name"] = approver.name if approver else None

    return response_data

@router.get("/balance", response_model=LeaveBalanceResponse)
async def get_leave_balance(
    # Remove company_name query parameter as we will use current_user's company_name
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Use current_user's company_name, handling NULL case
    user_company_name = current_user.company_name if current_user.company_name else None

    current_year = datetime.now().year

    # Find any existing balance for the user and year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == current_user.id,
        LeaveBalance.year == current_year
    ).first()

    # Fetch the current company leave policy
    try:
        policy = await get_company_policy_route(company_name=user_company_name, current_user=current_user, db=db)
    except HTTPException as e:
        # If fetching policy fails with HTTPException (e.g., 403, 404), propagate it
        raise e
    except Exception as e:
        # Catch any other exceptions during policy fetching and raise a 500 error
        print(f"Error fetching policy in get_leave_balance: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching company leave policy")

    if balance:
        # If a balance exists, update its counts to match the current policy
        if balance.annual_leave != policy.annual_leave_count:
            balance.annual_leave = policy.annual_leave_count
        if balance.sick_leave != policy.sick_leave_count:
            balance.sick_leave = policy.sick_leave_count
        if balance.casual_leave != policy.casual_leave_count:
            balance.casual_leave = policy.casual_leave_count
        
        # Also ensure company_name is up to date if it was previously NULL
        if balance.company_name != user_company_name:
            balance.company_name = user_company_name

        db.commit()
        db.refresh(balance)
        return balance
    else:
        # If no balance found, create a new one using the fetched policy
        balance = LeaveBalance(
            employee_id=current_user.id,
            company_name=user_company_name, # Assign user's company_name (can be None)
            year=datetime.now().year,
            annual_leave=policy.annual_leave_count,
            sick_leave=policy.sick_leave_count,
            casual_leave=policy.casual_leave_count,
        )
        db.add(balance)
        db.commit()
        db.refresh(balance)
        return balance

@router.put("/balance/{employee_id}", response_model=LeaveBalanceResponse)
async def update_leave_balance_admin(
    employee_id: int,
    balance_update: LeaveBalanceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )

    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and HR can update leave balances"
        )

    current_year = datetime.now().year
    balance = db.query(LeaveBalance).filter(
        LeaveBalance.employee_id == employee_id,
        LeaveBalance.year == current_year,
        LeaveBalance.company_name == current_user.company_name
    ).first()

    if not balance:
        policy = get_company_leave_policy(db, current_user.company_name)
        balance = LeaveBalance(
            employee_id=employee_id,
            year=current_year,
            annual_leave=policy.annual_leave_count,
            sick_leave=policy.sick_leave_count,
            casual_leave=policy.casual_leave_count,
            company_name=current_user.company_name
        )
        db.add(balance)

    for key, value in balance_update.dict(exclude_unset=True).items():
        setattr(balance, key, value)

    db.commit()
    db.refresh(balance)
    return balance

@router.get("/stats", response_model=LeaveStatistics)
async def get_leave_statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )

    # Get leave counts for the user's company
    leave_counts = db.query(
        func.count().label('total'),
        func.sum(case((LeaveRequest.status == 'pending', 1), else_=0)).label('pending'),
        func.sum(case((LeaveRequest.status == 'approved', 1), else_=0)).label('approved'),
        func.sum(case((LeaveRequest.status == 'rejected', 1), else_=0)).label('rejected')
    ).filter(
        LeaveRequest.employee_id == current_user.id,
        LeaveRequest.company_name == current_user.company_name
    ).first()

    # Get leave balance
    balance = await get_leave_balance(db=db, current_user=current_user)

    return {
        "total_leaves": leave_counts.total or 0,
        "pending_leaves": leave_counts.pending or 0,
        "approved_leaves": leave_counts.approved or 0,
        "rejected_leaves": leave_counts.rejected or 0,
        "leave_balance": balance
    }

@router.get("/calendar", response_model=List[LeaveRequestResponse])
async def get_leave_calendar(
    company_name: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Determine the company name to filter by (use user's company name if available)
    filter_company_name = current_user.company_name if current_user.company_name else None

    # Build the query based on user role and company name
    query = db.query(LeaveRequest)

    if current_user.role == "admin":
        # Admins see all leaves for their company or leaves with NULL company_name if they have no company
        if filter_company_name:
            query = query.filter(LeaveRequest.company_name == filter_company_name)
        else:
            query = query.filter(LeaveRequest.company_name.is_(None))
    else:
        # Regular users see their leaves for their company or leaves with NULL company_name if they have no company
        if filter_company_name:
            query = query.filter(
                LeaveRequest.employee_id == current_user.id,
                LeaveRequest.company_name == filter_company_name
            )
        else:
            query = query.filter(
                LeaveRequest.employee_id == current_user.id,
                LeaveRequest.company_name.is_(None)
            )

    requests = query.all()
    
    # Add employee and approver names to response
    response_data = []
    for request in requests:
        employee = db.query(User).filter(User.id == request.employee_id).first()
        approver = db.query(User).filter(User.id == request.approved_by).first() if request.approved_by else None
        
        request_dict = dict(request.__dict__)
        request_dict["employee_name"] = employee.name if employee else None
        request_dict["approver_name"] = approver.name if approver else None
        response_data.append(request_dict)
    
    return response_data

@router.delete("/requests/{request_id}", response_model=dict)
async def delete_leave_request(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not current_user.company_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not associated with any company"
        )

    # Get the leave request
    leave_request = db.query(LeaveRequest).filter(
        LeaveRequest.id == request_id,
        LeaveRequest.company_name == current_user.company_name
    ).first()
    
    if not leave_request:
        raise HTTPException(status_code=404, detail="Leave request not found")
    
    # Check permissions
    is_admin = current_user.role in ["admin", "hr"]
    is_owner = leave_request.employee_id == current_user.id
    
    # Users can only delete their own pending leaves, admins can delete any leave
    if not is_admin and (not is_owner or leave_request.status != LeaveStatus.PENDING):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own pending leave requests"
        )
    
    # Delete the leave request
    db.delete(leave_request)
    db.commit()
    
    return {"message": "Leave request deleted successfully"} 