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
    upload_dir = "uploads/logos"
    os.makedirs(upload_dir, exist_ok=True)

    # Generate a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)

    # Save the uploaded file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving file: {e}")

    # Update the admin user's logo_url in the database
    current_user.logo_url = f"/{file_path}" # Store path relative to static directory
    db.commit()
    db.refresh(current_user)

    return JSONResponse({"message": "Logo uploaded successfully", "logo_url": current_user.logo_url})