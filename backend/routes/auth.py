from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Optional
import secrets
import smtplib
from email.mime.text import MIMEText
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from database import get_db
from models import User
import random

# Load environment variables
load_dotenv()

# Email configuration
EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.gmail.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "your_email@gmail.com")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "your_app_password")
EMAIL_FROM = EMAIL_HOST_USER

# Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your_secret_key")  # Use environment variable with fallback
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

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
    refresh_token: Optional[str] = None

class TokenData(BaseModel):
    email: Optional[str] = None

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

class ResendOTPRequest(BaseModel):
    email: str

class UserResponse(UserBase):
    company_name: Optional[str] = None
    num_employees: Optional[int] = None
    logo_url: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None # Email updates might require re-verification, handle carefully
    role: Optional[str] = None # Role updates should likely be restricted to admins
    company_name: Optional[str] = None
    num_employees: Optional[int] = None

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Helper functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

async def send_verification_email(email: str, token: str, background_tasks: BackgroundTasks):
    verification_url = f"http://localhost:5173/api/auth/verify-email/{token}"
    message = f"""Click to verify your email: {verification_url}"""
    
    # Skip email sending if credentials are default/missing
    if EMAIL_HOST_USER == "your_email@gmail.com" or not EMAIL_HOST_PASSWORD or EMAIL_HOST_PASSWORD == "your_app_password":
        print(f"[DEV MODE] Skipping email sending because credentials are not configured.")
        print(f"[DEV MODE] Would have sent: {message}")
        return
    
    msg = MIMEText(message)
    msg['Subject'] = 'Verify your email'
    msg['From'] = EMAIL_FROM
    msg['To'] = email
    
    def send_email():
        try:
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.starttls()
                server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
                server.send_message(msg)
                print(f"Email sent to {email}")
        except Exception as e:
            print(f"Failed to send email: {str(e)}")
    
    background_tasks.add_task(send_email)

def generate_otp():
    return ''.join([str(random.randint(0, 9)) for _ in range(6)])

async def send_otp_email(email: str, otp: str, background_tasks: BackgroundTasks):
    subject = "Your OTP for Email Verification"
    body = f"""
    Your OTP for email verification is: {otp}
    
    This OTP will expire in 10 minutes.
    """
    
    msg = MIMEText(body)
    msg['Subject'] = subject
    msg['From'] = EMAIL_FROM
    msg['To'] = email
    
    try:
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.send_message(msg)
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

# Auth endpoints
@router.post("/signup", response_model=dict)
async def signup(
    user: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    try:
        print(f"Received signup request for: {user.email}")
        
        # Check if user already exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            name=user.name,
            hashed_password=hashed_password,
            role=user.role,
            is_active=False,
            is_verified=False,
            company_name=user.company_name,
            num_employees=user.num_employees
        )
        
        # Generate and store OTP
        otp = generate_otp()
        db_user.verification_token = otp
        db_user.verification_token_expires = datetime.utcnow() + timedelta(minutes=10)
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # Send OTP email
        await send_otp_email(user.email, otp, background_tasks)
        
        return {"message": "Registration successful. Please verify your email with the OTP sent."}
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        print(f"Error during signup: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/verify-email", response_model=dict)
async def verify_otp(
    request: VerifyOTPRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.verification_token or not user.verification_token_expires:
        raise HTTPException(status_code=400, detail="No OTP request found")
    
    if datetime.utcnow() > user.verification_token_expires:
        raise HTTPException(status_code=400, detail="OTP has expired")
    
    if user.verification_token != request.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Verify and activate user
    user.is_verified = True
    user.is_active = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()
    
    return {"success": True, "message": "Email verified successfully. You can now log in."}

@router.post("/resend-otp", response_model=dict)
async def resend_otp(
    request: ResendOTPRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Email already verified")
    
    # Generate new OTP
    otp = generate_otp()
    user.verification_token = otp
    user.verification_token_expires = datetime.utcnow() + timedelta(minutes=10)
    db.commit()
    
    # Send new OTP email
    await send_otp_email(user.email, otp, background_tasks)
    
    return {"success": True, "message": "New OTP has been sent to your email"}

@router.post("/token", response_model=Token)
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
    
    # Only require email verification for admin accounts
    if not user.is_verified and user.role == "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email not verified. Please verify your email first.",
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is not active. Please contact support.",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    refresh_token_expires = timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role},
        expires_delta=access_token_expires
    )
    refresh_token = create_access_token(
        data={"sub": user.email, "purpose": "refresh"},
        expires_delta=refresh_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "refresh_token": refresh_token
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(request.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")
        purpose = payload.get("purpose")
        
        if email is None or purpose != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
            
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
            
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.email, "role": user.role},
            expires_delta=access_token_expires
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(roles: list[str]):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_data = current_user.__dict__
    if current_user.role != "admin" and current_user.company_name:
        # Find the admin user for this company to get the logo URL
        admin_user = db.query(User).filter(
            User.company_name == current_user.company_name,
            User.role == "admin"
        ).first()
        if admin_user and admin_user.logo_url:
            user_data["logo_url"] = admin_user.logo_url

    return UserResponse(**user_data)

@router.put("/me", response_model=UserResponse)
async def update_user_me(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        # Fetch the user from the database using the current_user object
        db_user = db.query(User).filter(User.id == current_user.id).first()
        if not db_user:
            # This should ideally not happen if get_current_user works correctly
            raise HTTPException(status_code=404, detail="User not found in database")

        update_data = user_update.model_dump(exclude_unset=True)

        # Prevent non-admins from changing role or company_name/num_employees
        if current_user.role != "admin":
            if "role" in update_data:
                 raise HTTPException(status_code=403, detail="Only admins can change roles")
            if "company_name" in update_data or "num_employees" in update_data:
                 raise HTTPException(status_code=403, detail="Only admins can change company details")

        # Prevent email change via this endpoint for simplicity (requires re-verification flow)
        if "email" in update_data and update_data["email"] != db_user.email:
             raise HTTPException(status_code=400, detail="Email cannot be changed via this endpoint")

        # Update fields from the request model
        for key, value in update_data.items():
            setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)

        return db_user

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error updating user profile: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.put("/users/{user_id}", response_model=UserResponse)
async def update_user_by_admin(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(require_role(["admin"])), # Restrict to admins
    db: Session = Depends(get_db)
):
    try:
        # Fetch the target user from the database
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            raise HTTPException(status_code=404, detail="User not found")

        update_data = user_update.model_dump(exclude_unset=True)

        # Admins can update name, company_name, and num_employees for other users
        # Prevent email or role changes via this endpoint
        if "email" in update_data and update_data["email"] != db_user.email:
             raise HTTPException(status_code=400, detail="Email cannot be changed via this endpoint")
        if "role" in update_data and update_data["role"] != db_user.role:
             raise HTTPException(status_code=400, detail="Role cannot be changed via this endpoint")

        # Update fields from the request model
        for key, value in update_data.items():
            if key in ["name", "company_name", "num_employees"]:
                 setattr(db_user, key, value)

        db.commit()
        db.refresh(db_user)

        return db_user

    except HTTPException as he:
        db.rollback()
        raise he
    except Exception as e:
        db.rollback()
        print(f"Error updating user by admin: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# Password reset endpoints
@router.post("/forgot-password")
async def forgot_password(
    email: str, 
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If email exists, reset link sent"}
    
    reset_token = create_access_token(
        data={"sub": user.email, "purpose": "reset"},
        expires_delta=timedelta(hours=1)
    )
    
    reset_url = f"http://localhost:3000/reset-password?token={reset_token}"
    message = f"""Password reset link: {reset_url}"""
    
    msg = MIMEText(message)
    msg['Subject'] = 'Password Reset'
    msg['From'] = 'noreply@equitywala.com'
    msg['To'] = email
    
    def send_reset_email():
        with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
            server.starttls()
            server.login(EMAIL_HOST_USER, EMAIL_HOST_PASSWORD)
            server.send_message(msg)
    
    
    return {"message": "Password reset link sent"}

@router.post("/reset-password")
async def reset_password(
    token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "reset":
            raise HTTPException(status_code=400, detail="Invalid token")
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        user.hashed_password = get_password_hash(new_password)
        db.commit()
        return {"message": "Password updated"}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid/expired token")

@router.post("/verify-email")
async def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("purpose") != "verification":
            raise HTTPException(status_code=400, detail="Invalid token")
        
        email = payload.get("sub")
        user = db.query(User).filter(User.email == email).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Update both verification and active status
        user.is_verified = True
        user.is_active = True
        user.verification_token = None
        user.verification_token_expires = None
        db.commit()
        
        return {"message": "Email verified successfully. You can now log in."}
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")