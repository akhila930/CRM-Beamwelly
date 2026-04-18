from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List
from datetime import datetime, timedelta
import secrets
import os
from email.mime.text import MIMEText
import smtplib

from database import get_db
from models import EmployeeFeedback, ClientFeedback, User, Employee
from schemas.feedback import (
    EmployeeFeedbackCreate, EmployeeFeedbackResponse,
    ClientFeedbackCreate, ClientFeedbackResponse,
    ClientFeedbackFormCreate, ClientFeedbackFormResponse
)
from routes.auth import get_current_user

router = APIRouter(
    prefix="/api/feedback",
    tags=["feedback"]
)


def _resolve_feedback_form_base_url() -> str:
    def _sanitize(url: str) -> str:
        cleaned = url.strip().rstrip("/")
        if cleaned.endswith("/index.html"):
            cleaned = cleaned[: -len("/index.html")]
        elif cleaned.endswith("index.html"):
            cleaned = cleaned[: -len("index.html")].rstrip("/")
        return cleaned

    explicit = (os.getenv("FEEDBACK_FORM_BASE_URL") or "").strip()
    if explicit:
        return _sanitize(explicit)

    frontend = (os.getenv("FRONTEND_URL") or "").strip()
    if frontend:
        return _sanitize(frontend)

    return "https://crm-beamwelly-3.onrender.com"

# Employee Feedback Routes
@router.post("/employee", response_model=EmployeeFeedbackResponse)
async def create_employee_feedback(
    feedback: EmployeeFeedbackCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get the target employee
    target_employee = db.query(Employee).filter(Employee.id == feedback.to_employee_id).first()
    if not target_employee:
        raise HTTPException(status_code=404, detail="Target employee not found")
    
    # Create the feedback using the user ID directly
    db_feedback = EmployeeFeedback(
        from_employee_id=current_user.id,  # Use the user ID directly
        to_employee_id=feedback.to_employee_id,
        feedback=feedback.feedback,
        rating=feedback.rating,
        remarks=feedback.remarks,
        company_name=current_user.company_name  # Set company_name from current user
    )
    
    db.add(db_feedback)
    db.commit()
    db.refresh(db_feedback)
    
    # Get employee names for response
    from_user = db.query(User).filter(User.id == db_feedback.from_employee_id).first()
    to_employee = db.query(Employee).filter(Employee.id == db_feedback.to_employee_id).first()
    
    return {
        **db_feedback.__dict__,
        "from_employee_name": from_user.name if from_user else None,
        "to_employee_name": to_employee.name if to_employee else None
    }

@router.get("/employee", response_model=List[EmployeeFeedbackResponse])
async def get_employee_feedbacks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter feedbacks by company name
    query = db.query(EmployeeFeedback)
    if current_user.company_name:
        query = query.filter(EmployeeFeedback.company_name == current_user.company_name)
    
    feedbacks = query.all()
    response_data = []
    for feedback in feedbacks:
        feedback_dict = dict(feedback.__dict__)
        from_user = db.query(User).filter(User.id == feedback.from_employee_id).first()
        to_employee = db.query(Employee).filter(Employee.id == feedback.to_employee_id).first()
        feedback_dict["from_employee_name"] = from_user.name if from_user else "Unknown"
        feedback_dict["to_employee_name"] = to_employee.name if to_employee else "Unknown"
        response_data.append(feedback_dict)
    return response_data

@router.get("/employees")
async def get_available_employees(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        print("Fetching all employees...")
        # Get employees filtered by company name
        query = db.query(Employee)
        if current_user.company_name:
            query = query.filter(Employee.company_name == current_user.company_name)
        
        employees = query.all()
        
        if not employees:
            print("No employees found in database")
            return []
        
        employee_list = []
        for emp in employees:
            employee_list.append({
                "id": emp.id,
                "name": emp.name,
                "email": emp.email,
                "position": emp.position,
                "department": emp.department
            })
        
        print(f"Successfully fetched {len(employee_list)} employees")
        return employee_list
    except Exception as e:
        print(f"Error fetching employees: {str(e)}")
        import traceback
        traceback.print_exc()
        return []

@router.delete("/employee/{feedback_id}")
async def delete_employee_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    feedback = db.query(EmployeeFeedback).filter(EmployeeFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    # Only allow the feedback creator or admin to delete
    if feedback.from_employee_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this feedback")
    
    db.delete(feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"}

# Client Feedback Routes
@router.post("/client/form", response_model=ClientFeedbackFormResponse)
async def create_client_feedback_form(
    form_data: ClientFeedbackFormCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Generate unique token and set expiry
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=7)
    
    # Create feedback entry with empty feedback and rating
    db_feedback = ClientFeedback(
        client_email=form_data.client_email,
        feedback="",  # Initialize with empty string instead of null
        rating=0,     # Initialize with 0 instead of null
        form_token=token,
        form_expires_at=expires_at,
        is_submitted=False,
        company_name=current_user.company_name  # Set company_name from current user
    )
    
    try:
        db.add(db_feedback)
        db.commit()
        db.refresh(db_feedback)
        
        # Generate form URL
        base_url = _resolve_feedback_form_base_url()
        form_url = f"{base_url}/feedback/client/{token}"
        
        # Send email to client
        async def send_feedback_form_email():
            email_body = f"""
            Hello,

            You have been invited to provide feedback. Please click the link below to submit your feedback:
            {form_url}

            This link will expire in 7 days.

            Thank you for your time.
            """
            
            msg = MIMEText(email_body)
            msg['Subject'] = 'Feedback Form'
            msg['From'] = os.getenv("EMAIL_HOST_USER")
            msg['To'] = form_data.client_email
            
            try:
                with smtplib.SMTP(os.getenv("EMAIL_HOST", "smtp.gmail.com"), int(os.getenv("EMAIL_PORT", "587"))) as server:
                    server.starttls()
                    server.login(os.getenv("EMAIL_HOST_USER"), os.getenv("EMAIL_HOST_PASSWORD"))
                    server.send_message(msg)
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to send email. Please check email configuration."
                )
        
        background_tasks.add_task(send_feedback_form_email)
        
        return {
            "form_url": form_url,
            "expires_at": expires_at
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating feedback form: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating feedback form: {str(e)}"
        )

@router.post("/client/{token}", response_model=ClientFeedbackResponse)
async def submit_client_feedback(
    token: str,
    feedback: ClientFeedbackCreate,
    db: Session = Depends(get_db)
):
    # Get feedback entry by token
    db_feedback = db.query(ClientFeedback).filter(
        ClientFeedback.form_token == token,
        ClientFeedback.is_submitted == False,
        ClientFeedback.form_expires_at > datetime.utcnow()
    ).first()
    
    if not db_feedback:
        raise HTTPException(status_code=404, detail="Invalid or expired feedback form")
    
    # Update feedback
    for key, value in feedback.dict(exclude={'client_email'}).items():
        setattr(db_feedback, key, value)
    
    db_feedback.is_submitted = True
    db_feedback.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_feedback)
    
    return db_feedback

@router.get("/client", response_model=List[ClientFeedbackResponse])
async def get_client_feedbacks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Filter client feedbacks by company name
    query = db.query(ClientFeedback)
    if current_user.company_name:
        query = query.filter(ClientFeedback.company_name == current_user.company_name)
    
    feedbacks = query.all()
    return feedbacks

@router.delete("/client/{feedback_id}")
async def delete_client_feedback(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "hr"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins and HR can delete client feedbacks"
        )
    
    feedback = db.query(ClientFeedback).filter(ClientFeedback.id == feedback_id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    
    db.delete(feedback)
    db.commit()
    return {"message": "Feedback deleted successfully"} 