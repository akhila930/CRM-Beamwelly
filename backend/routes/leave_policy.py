from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import CompanyLeavePolicy, User, Company
from schemas.leave_policy import (
    CompanyLeavePolicyCreate,
    CompanyLeavePolicyUpdate,
    CompanyLeavePolicyResponse
)
from routes.auth import get_current_user

router = APIRouter(
    prefix="/leave-policy",
    tags=["leave-policy"]
)

@router.post("", response_model=CompanyLeavePolicyResponse)
async def create_company_leave_policy(
    policy: CompanyLeavePolicyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create leave policies"
        )
    
    if not current_user.company_name:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Admin user must be associated with a company to create a leave policy"
        )

    # Check if policy already exists for the company
    existing_policy = db.query(CompanyLeavePolicy).filter(
        CompanyLeavePolicy.company_name == current_user.company_name
    ).first()
    
    if existing_policy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Leave policy already exists for this company"
        )
    
    db_policy = CompanyLeavePolicy(
        company_name=current_user.company_name,
        annual_leave_count=policy.annual_leave_count,
        sick_leave_count=policy.sick_leave_count,
        casual_leave_count=policy.casual_leave_count
    )
    
    db.add(db_policy)
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.put("", response_model=CompanyLeavePolicyResponse)
async def update_company_leave_policy(
    policy: CompanyLeavePolicyUpdate,
    company_name: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update leave policy")
    
    # First try to find by company_name
    db_policy = db.query(CompanyLeavePolicy).filter(
        CompanyLeavePolicy.company_name == company_name
    ).first()
    
    if not db_policy:
        # If not found by company_name, try to find by company_id
        company = db.query(Company).filter(Company.name == company_name).first()
        if company:
            db_policy = db.query(CompanyLeavePolicy).filter(
                CompanyLeavePolicy.company_id == company.id
            ).first()
            
            if db_policy:
                # Update the policy with company_name
                db_policy.company_name = company_name
                db.commit()
                db.refresh(db_policy)
    
    if not db_policy:
        raise HTTPException(status_code=404, detail="Leave policy not found for this company")
    
    for key, value in policy.dict(exclude_unset=True).items():
        setattr(db_policy, key, value)
    
    db.commit()
    db.refresh(db_policy)
    return db_policy

@router.get("", response_model=CompanyLeavePolicyResponse)
async def get_company_leave_policy(
    company_name: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # First try to find by company_name
    policy = db.query(CompanyLeavePolicy).filter(
        CompanyLeavePolicy.company_name == company_name
    ).first()

    # If policy not found by company_name, create a default policy
    if not policy:
        # Ensure company exists before creating default policy
        company = db.query(Company).filter(Company.name == company_name).first()
        if not company:
            raise HTTPException(status_code=404, detail="Company not found")

        policy = CompanyLeavePolicy(
            company_name=company_name,
            annual_leave_count=20,
            sick_leave_count=15,
            casual_leave_count=12
        )
        db.add(policy)
        db.commit()
        db.refresh(policy)

    # Return the found or newly created policy
    return policy

@router.get("/leave-policy", response_model=CompanyLeavePolicyResponse)
async def get_leave_policy(
    company_name: str | None = Query(None, description="Company Name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if company_name and current_user.company_name != company_name:
        raise HTTPException(status_code=403, detail="Not authorized to access this company's data")
    
    if company_name:
        policy = db.query(CompanyLeavePolicy).filter(
            CompanyLeavePolicy.company_name == company_name
        ).first()
    else:
        policy = db.query(CompanyLeavePolicy).filter(
            CompanyLeavePolicy.company_name.is_(None)
        ).first()
    
    if not policy:
        return CompanyLeavePolicyResponse(
            id=0,
            company_name=company_name,
            annual_leave_count=20,
            sick_leave_count=15,
            casual_leave_count=12,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    return policy

@router.put("/leave-policy", response_model=CompanyLeavePolicyResponse)
async def update_leave_policy(
    policy: CompanyLeavePolicyUpdate,
    company_name: str = Query(..., description="Company Name"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update leave policy")
    
    if current_user.company_name != company_name:
        raise HTTPException(status_code=403, detail="Not authorized to update this company's policy")
    
    existing_policy = db.query(CompanyLeavePolicy).filter(
        CompanyLeavePolicy.company_name == company_name
    ).first()
    
    if existing_policy:
        for field, value in policy.dict(exclude_unset=True).items():
            setattr(existing_policy, field, value)
        db.commit()
        db.refresh(existing_policy)
        return existing_policy
    else:
        policy.company_name = company_name
        db.add(policy)
        db.commit()
        db.refresh(policy)
        return policy 