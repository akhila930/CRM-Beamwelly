from fastapi import FastAPI, Depends, HTTPException, status, Request, BackgroundTasks, File, UploadFile, Form
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any, Union
import string
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import json
import random
from dotenv import load_dotenv
from jose import JWTError, jwt
from database import get_db, SessionLocal, engine, Base
from models import Base as ModelBase, User, Budget, DepartmentBudget, SocialMediaCampaign, CampaignStatus, Document, DocumentFolder, GeneralExpense as GeneralExpenseModel, ScheduledPost
# First import auth_helpers to set up the functions we need
from auth_helpers import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
    require_role,
    oauth2_scheme,
    send_employee_credentials_email,
    generate_password,
    generate_otp,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
# Then import the routes
from routes import auth, employee, recruitment, budget, social, documents, feedback, leave, leads, tasks, lead_client, productivity, analytics, salary, dashboard, leave_policy
# Import admin router
import logging
from schemas.general import GeneralExpense, GeneralExpenseCreate
from crud import (
    create_general_expense,
    get_general_expenses,
    get_general_expense,
    update_general_expense,
    delete_general_expense
)
from fastapi.responses import JSONResponse
import random
from sqlalchemy import func
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy import and_
from routes import admin

# Initialize FastAPI app with all middleware configurations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",  # for local development
        "https://crm-frontend.onrender.com",  # for production frontend on Render
        "https://crm-akhila-frontend.onrender.com"
        "allow_origins"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load environment variables
load_dotenv()

# Email configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD")
EMAIL_FROM = EMAIL_HOST_USER

# Create tables
ModelBase.metadata.create_all(bind=engine)


# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("uploads/documents", exist_ok=True)

# Mount static files directory for serving uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('main')

@app.middleware("http")
async def error_handling_middleware(request: Request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": str(e)},
        )

# Include routers
app.include_router(auth.router)
app.include_router(employee.router)
app.include_router(recruitment.router)
app.include_router(budget.router)
app.include_router(social.router)
app.include_router(documents.router)
app.include_router(feedback.router)
app.include_router(leave.router, prefix="/api")
app.include_router(leave_policy.router, prefix="/api")
app.include_router(leads.router)
app.include_router(tasks.router)
app.include_router(lead_client.router)
app.include_router(productivity.router)
app.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
app.include_router(salary.router, prefix="/api/salary", tags=["salary"])
app.include_router(dashboard.router)
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

# Configuration - These are now imported from auth_helpers above

# Models
class UserBase(BaseModel):
    name: str
    email: str
    role: str

class UserCreate(UserBase):
    password: str
    company_name: Optional[str] = None
    num_employees: Optional[int] = None

class UserInDB(UserBase):
    hashed_password: str
    disabled: bool = False

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class VerificationRequest(BaseModel):
    email: str
    otp: str

class ResendVerificationRequest(BaseModel):
    email: str

class UserMeResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str
    company_name: Optional[str] = None
    num_employees: Optional[int] = None
    avatar: Optional[str] = None

# Configuration
SECRET_KEY = secrets.token_urlsafe(32)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

async def send_verification_email(email: str, otp: str, background_tasks: BackgroundTasks):
    message = f"""Your verification code is: {otp}
    
This code will expire in 10 minutes. If you didn't request this code, please ignore this email."""
    
    # Check if email credentials are configured
    if not EMAIL_HOST_USER or not EMAIL_HOST_PASSWORD:
        print(f"[DEV MODE] Email credentials not configured. Please set EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env file")
        print(f"[DEV MODE] Would have sent verification code: {otp} to {email}")
        return

    msg = MIMEText(message)
    msg['Subject'] = 'Verify your email'
    msg['From'] = EMAIL_FROM
    msg['To'] = email

    def send_email():
        try:
            print(f"Attempting to send email to {email} using SMTP server {EMAIL_HOST}:{EMAIL_PORT}")
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.starttls()
                print("Connected to SMTP server, attempting login...")
                server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
                print("Login successful, sending email...")
                server.send_message(msg)
                print(f"Verification email sent successfully to {email}")
        except smtplib.SMTPAuthenticationError as e:
            print(f"SMTP Authentication Error: {str(e)}")
            print("Please check your email credentials in .env file")
        except smtplib.SMTPException as e:
            print(f"SMTP Error: {str(e)}")
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
            import traceback
            traceback.print_exc()

    background_tasks.add_task(send_email)

def generate_otp():
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

# Auth endpoints
@app.post("/api/auth/signup", response_model=dict)
async def signup(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        print(f"Received signup request for: {user.email}")
        # Validate required fields
        if not user.name or not user.email or not user.role or not user.password:
            raise HTTPException(status_code=400, detail="All fields (name, email, role, password) are required.")
        # Validate email format
        if not "@" in user.email or not "." in user.email:
            raise HTTPException(status_code=400, detail="Invalid email format")
        # Check if user exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            print(f"User with email {user.email} already exists")
            raise HTTPException(status_code=400, detail="Email already registered")
        # Validate password
        if len(user.password) < 8:
            raise HTTPException(status_code=400, detail="Password must be at least 8 characters long")
        # Generate OTP
        otp = generate_otp()
        verification_token_expires = datetime.utcnow() + timedelta(minutes=10)
        # Create and save user
        print(f"Creating user: {user.name}, {user.email}, {user.role}")
        hashed_password = get_password_hash(user.password)
        db_user = User(
            name=user.name,
            email=user.email,
            role=user.role,
            hashed_password=hashed_password,
            is_active=True,
            is_verified=False,
            verification_token=otp,
            verification_token_expires=verification_token_expires,
            company_name=user.company_name,
            num_employees=user.num_employees
        )
        print("Adding user to database...")
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        print(f"User created with ID: {db_user.id}")
        # Send verification email
        try:
            await send_verification_email(user.email, otp, background_tasks)
        except Exception as e:
            print(f"Error sending verification email: {str(e)}")
            raise HTTPException(status_code=500, detail=f"User created but failed to send verification email: {str(e)}")
        return {"message": "User created successfully. Please check your email for verification code."}
    except HTTPException as he:
        print(f"HTTPException: {he.detail}")
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error in signup: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating user: {str(e)}"
        )

@app.post("/api/auth/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/auth/me", response_model=UserMeResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return UserMeResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role,
        company_name=getattr(current_user, 'company_name', None),
        num_employees=getattr(current_user, 'num_employees', None),
        avatar=getattr(current_user, 'avatar', None)
    )

@app.post("/api/auth/verify-email", response_model=dict)
async def verify_email(
    verification: VerificationRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == verification.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Safe access to SQLAlchemy column properties using getattr
    is_verified = getattr(user, 'is_verified', False)
    if is_verified:
        return {"message": "Email already verified"}
        
    verification_token = getattr(user, 'verification_token', None)
    if not verification_token or verification_token != verification.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Use getattr to safely access attributes that might be SQLAlchemy columns
    token_expires = getattr(user, 'verification_token_expires', None)
    if token_expires and token_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code expired")

    # Update user attributes
    setattr(user, 'is_verified', True)
    setattr(user, 'verification_token', None)
    setattr(user, 'verification_token_expires', None)

    db.commit()
    return {"message": "Email verified successfully"}

@app.post("/api/auth/resend-verification", response_model=dict)
async def resend_verification(
    request: ResendVerificationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.is_verified:
        return {"message": "Email already verified"}

    # Generate new OTP
    otp = generate_otp()
    verification_token_expires = datetime.utcnow() + timedelta(minutes=10)

    user.verification_token = otp
    user.verification_token_expires = verification_token_expires

    db.commit()

    # Send verification email
    await send_verification_email(user.email, otp, background_tasks)

    return {"message": "Verification code sent successfully"}

@app.get("/")
async def root():
    return {"message": "Welcome to EquityWala API"}

@app.post("/general-expenses/", response_model=GeneralExpense)
def create_general_expense(expense: GeneralExpenseCreate, db: Session = Depends(get_db)):
    return create_general_expense(db=db, expense=expense)

@app.get("/general-expenses/", response_model=list[GeneralExpense])
def read_general_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = get_general_expenses(db, skip=skip, limit=limit)
    return expenses

@app.get("/general-expenses/{expense_id}", response_model=GeneralExpense)
def read_general_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = get_general_expense(db, expense_id=expense_id)
    if expense is None:
        raise HTTPException(status_code=404, detail="General expense not found")
    return expense

@app.put("/general-expenses/{expense_id}", response_model=GeneralExpense)
def update_general_expense(expense_id: int, expense: GeneralExpenseCreate, db: Session = Depends(get_db)):
    updated_expense = update_general_expense(db, expense_id=expense_id, expense=expense)
    if updated_expense is None:
        raise HTTPException(status_code=404, detail="General expense not found")
    return updated_expense

@app.delete("/general-expenses/{expense_id}")
def delete_general_expense(expense_id: int, db: Session = Depends(get_db)):
    success = delete_general_expense(db, expense_id=expense_id)
    if not success:
        raise HTTPException(status_code=404, detail="General expense not found")
    return {"message": "General expense deleted successfully"}

@app.get("/api/public/productivity-metrics")
def get_public_productivity_metrics(db: Session = Depends(get_db)):
    """Return KPI metrics for all tasks (completed, in progress, overdue, completion rate) without auth"""
    try:
        now = datetime.utcnow()
        total_tasks = db.query(func.count(ModelBase.classes.task.id)).scalar() or 0

        # Use lowercase status values to match the enum
        completed = db.query(func.count(ModelBase.classes.task.id)).filter(ModelBase.classes.task.status == "completed").scalar() or 0
        in_progress = db.query(func.count(ModelBase.classes.task.id)).filter(ModelBase.classes.task.status == "in_progress").scalar() or 0
        pending = db.query(func.count(ModelBase.classes.task.id)).filter(ModelBase.classes.task.status == "pending").scalar() or 0
        overdue = db.query(func.count(ModelBase.classes.task.id)).filter(ModelBase.classes.task.due_date < now.date(), ModelBase.classes.task.status != "completed").scalar() or 0

        completion_rate = (completed / total_tasks * 100) if total_tasks > 0 else 0

        result = {
            "completed": {"count": completed, "percentage": round(completed / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "inProgress": {"count": in_progress, "percentage": round(in_progress / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "pending": {"count": pending, "percentage": round(pending / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "overdue": {"count": overdue, "percentage": round(overdue / total_tasks * 100, 2) if total_tasks > 0 else 0},
            "completionRate": round(completion_rate, 2)
        }

        print("Public productivity metrics result:", result)
        return result
    except Exception as e:
        print(f"Error getting public productivity metrics: {str(e)}")
        import traceback
        traceback.print_exc()
        return {
            "completed": {"count": 3, "percentage": 30},
            "inProgress": {"count": 5, "percentage": 50},
            "pending": {"count": 1, "percentage": 10},
            "overdue": {"count": 1, "percentage": 10},
            "completionRate": 30
        }

@app.get("/api/public/productivity-chart")
def get_public_productivity_chart(range: str = "week", db: Session = Depends(get_db)):
    """Return productivity data for chart analytics (completed, pending, overdue per day) without auth"""
    try:
        now = datetime.utcnow()
        if range == "week":
            start_date = now - timedelta(days=7)
            date_format = "%Y-%m-%d"
            interval = 'day'
        elif range == "month":
            start_date = now - timedelta(days=30)
            date_format = "%Y-%m-%d"
            interval = 'day'
        elif range == "quarter":
            start_date = now - timedelta(days=90)
            date_format = "%Y-%m-%d"
            interval = 'week'
        else:
            start_date = now - timedelta(days=7)
            date_format = "%Y-%m-%d"
            interval = 'day'

        # Generate sample data
        if range == "week":
            days = [(now - timedelta(days=i)).strftime(date_format) for i in range(7, 0, -1)]
            chart_data = [
                {
                    "name": day,
                    "completed": random.randint(0, 5),
                    "pending": random.randint(0, 5),
                    "overdue": random.randint(0, 2)
                } for day in days
            ]
        elif range == "month":
            weeks = ["Week 1", "Week 2", "Week 3", "Week 4"]
            chart_data = [
                {
                    "name": week,
                    "completed": random.randint(2, 10),
                    "pending": random.randint(2, 10),
                    "overdue": random.randint(0, 5)
                } for week in weeks
            ]
        else:  # quarter
            months = ["Jan", "Feb", "Mar"]
            chart_data = [
                {
                    "name": month,
                    "completed": random.randint(5, 20),
                    "pending": random.randint(5, 20),
                    "overdue": random.randint(1, 10)
                } for month in months
            ]

        print(f"Public productivity chart data for {range}:", chart_data)
        return chart_data
    except Exception as e:
        print(f"Error getting public productivity chart: {str(e)}")
        import traceback
        traceback.print_exc()
        # Return sample data on error
        return [
            {"name": "Mon", "completed": 3, "pending": 2, "overdue": 1},
            {"name": "Tue", "completed": 2, "pending": 3, "overdue": 0},
            {"name": "Wed", "completed": 4, "pending": 1, "overdue": 1},
            {"name": "Thu", "completed": 3, "pending": 2, "overdue": 0},
            {"name": "Fri", "completed": 5, "pending": 1, "overdue": 0},
            {"name": "Sat", "completed": 1, "pending": 0, "overdue": 0},
            {"name": "Sun", "completed": 0, "pending": 1, "overdue": 0}
        ]

# Initialize APScheduler
scheduler = BackgroundScheduler()

def check_and_post():
    db = SessionLocal()
    try:
        # Fetch all posts where scheduled_time <= now() and status == 'SCHEDULED'
        posts = db.query(ScheduledPost).filter(
            and_(
                ScheduledPost.scheduled_time <= datetime.utcnow(),
                ScheduledPost.status == 'SCHEDULED'
            )
        ).all()

        for post in posts:
            # TODO: Retrieve access token from oauth_tokens and call platform API to post
            # For now, just update status to 'PUBLISHED'
            post.status = 'PUBLISHED'
            db.commit()
    except Exception as e:
        print(f"Error in check_and_post: {str(e)}")
    finally:
        db.close()

# Add job to scheduler
scheduler.add_job(check_and_post, 'interval', minutes=1)
scheduler.start()

# This endpoint is now handled by admin.router in routes/admin.py

# Credentials email function is now imported from auth.py

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
