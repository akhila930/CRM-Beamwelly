from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
import string
from datetime import datetime, date
from typing import Dict, Any, Optional
from pydantic import BaseModel, EmailStr
from database import get_db
from models import User, Employee
from auth_helpers import get_current_user, send_employee_credentials_email, get_password_hash, generate_password
import shutil
import os
import uuid
from pathlib import Path
from typing import List

# Define EmployeeCreate schema directly here to avoid import issues
class EmployeeCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    position: str
    department: str
    salary: Optional[float] = None
    hire_date: date
    address: Optional[str] = None
    status: Optional[str] = "active"
    can_assign_tasks: bool = False
    can_access_recruitment: bool = False

router = APIRouter()

@router.post("/create-employee", response_model=Dict[str, Any])
async def create_employee(
    employee: EmployeeCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only administrators can create employee accounts"
        )

    # Check if email already exists
    email_query = db.query(User).filter(User.email == employee.email)
    existing_user = email_query.first()
    if existing_user is not None:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Generate a secure password
    password = generate_password()
    hashed_password = get_password_hash(password)

    # Create user account
    new_user = User(
        email=employee.email,
        name=employee.name,
        hashed_password=hashed_password,
        role="employee",
        is_active=True,
        is_verified=True,  # Set to True so employee doesn't need to verify email
        company_name=current_user.company_name,  # Copy company name from admin
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.flush()  # Get the user ID without committing

    # Create employee record
    new_employee = Employee(
        user_id=new_user.id,
        name=employee.name,
        email=employee.email,
        phone=employee.phone,
        position=employee.position,
        department=employee.department,
        salary=employee.salary,
        hire_date=employee.hire_date,
        address=employee.address,
        company_name=current_user.company_name,  # Copy company name from admin
        status='active',
        can_assign_tasks=employee.can_assign_tasks,
        can_access_recruitment=employee.can_access_recruitment,
        created_at=datetime.utcnow()
    )
    db.add(new_employee)
    db.commit()

    # Send credentials email
    send_employee_credentials_email(
        email=employee.email,
        name=employee.name,
        password=password,
        background_tasks=background_tasks
    )

    return {
        "message": "Employee account created successfully",
        "employee_id": new_employee.id
    }

@router.post("/upload-logo")
async def upload_company_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can upload company logos")

    # Define upload directory and create if it doesn't exist
    upload_base = Path(os.getenv("UPLOAD_DIR", "uploads"))
    upload_dir = upload_base / "logos"
    upload_dir.mkdir(parents=True, exist_ok=True)

    # Generate a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename

    # Save the uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    # Update the admin user's logo_url in the database
    current_user.logo_url = f"/uploads/logos/{unique_filename}"  # Served by /uploads mount
    db.commit()
    db.refresh(current_user)

    return JSONResponse({"message": "Logo uploaded successfully", "logo_url": current_user.logo_url})


@router.post("/import-employees", response_model=Dict[str, Any])
async def import_employees(
    employees: List[EmployeeCreate],
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Bulk import employees.

    Skips duplicates by email and returns a summary instead of failing the whole import.
    """
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can import employees")

    created: List[str] = []
    skipped: List[Dict[str, str]] = []
    failed: List[Dict[str, str]] = []

    for emp in employees:
        try:
            existing_user = db.query(User).filter(User.email == emp.email).first()
            if existing_user is not None:
                skipped.append({"email": emp.email, "reason": "Email already registered"})
                continue

            password = generate_password()
            hashed_password = get_password_hash(password)

            new_user = User(
                email=emp.email,
                name=emp.name,
                hashed_password=hashed_password,
                role="employee",
                is_active=True,
                is_verified=True,
                company_name=current_user.company_name,
                created_at=datetime.utcnow(),
            )
            db.add(new_user)
            db.flush()

            new_employee = Employee(
                user_id=new_user.id,
                name=emp.name,
                email=emp.email,
                phone=emp.phone,
                position=emp.position,
                department=emp.department,
                salary=emp.salary,
                hire_date=emp.hire_date,
                address=emp.address,
                company_name=current_user.company_name,
                status="active",
                can_assign_tasks=emp.can_assign_tasks,
                can_access_recruitment=emp.can_access_recruitment,
                created_at=datetime.utcnow(),
            )
            db.add(new_employee)
            db.commit()

            send_employee_credentials_email(
                email=emp.email,
                name=emp.name,
                password=password,
                background_tasks=background_tasks,
            )
            created.append(emp.email)
        except Exception as e:
            db.rollback()
            failed.append({"email": emp.email, "reason": str(e)})

    return {
        "created_count": len(created),
        "skipped_count": len(skipped),
        "failed_count": len(failed),
        "created": created,
        "skipped": skipped,
        "failed": failed,
    }