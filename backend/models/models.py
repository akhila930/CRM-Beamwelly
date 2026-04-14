
from sqlalchemy import Column, Integer, String, Boolean, Float, ForeignKey, Date, Enum, JSON, ARRAY, Text, Numeric, UniqueConstraint
from sqlalchemy.types import DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func, text
from datetime import datetime
import enum


from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

Base = declarative_base()

class CandidateStatus(str, enum.Enum):
    APPLIED = "applied"
    SCREENING = "screening"
    INTERVIEW = "interview"
    OFFER = "offer"
    HIRED = "hired"
    REJECTED = "rejected"

class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

class TaskStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    assigned_to = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    due_date = Column(Date, nullable=False)
    priority = Column(Enum(TaskPriority), nullable=False, default=TaskPriority.MEDIUM)
    status = Column(Enum(TaskStatus), nullable=False, default=TaskStatus.PENDING)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime, nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    comments = Column(Text, nullable=True)
    document_url = Column(String, nullable=True)

    # Relationships
    employee = relationship("Employee", back_populates="tasks")
    task_creator = relationship("User", back_populates="created_tasks", foreign_keys=[assigned_by])

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=False)
    department = Column(String, nullable=False)
    salary = Column(Numeric(10, 2), nullable=True)
    hire_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="active")
    address = Column(String, nullable=True)
    can_assign_tasks = Column(Boolean, default=False)
    can_access_recruitment = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    tasks = relationship("Task", back_populates="employee", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="employee", cascade="all, delete-orphan")
    attendance = relationship("Attendance", back_populates="employee", cascade="all, delete-orphan")
    milestones = relationship("Milestone", back_populates="employee", cascade="all, delete-orphan")
    assigned_leads = relationship("Lead", back_populates="assigned_employee")

class Candidate(Base):
    __tablename__ = "candidates"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    position = Column(String, nullable=False)
    experience = Column(Integer, nullable=True)
    skills = Column(String, nullable=True)  # Stored as comma-separated string
    resume_url = Column(String, nullable=True)
    stage = Column(String, nullable=False)
    status = Column(String, nullable=False)
    notes = Column(Text, nullable=True)  # Add notes field
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class RecruitmentStats(Base):
    __tablename__ = "recruitment_stats"

    id = Column(Integer, primary_key=True, index=True)
    total_candidates = Column(Integer, default=0)
    active_candidates = Column(Integer, default=0)
    hired_candidates = Column(Integer, default=0)
    applied_candidates = Column(Integer, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class DocumentType(str, enum.Enum):
    RESUME = "resume"
    CONTRACT = "contract"
    ID_PROOF = "id_proof"
    CERTIFICATE = "certificate"
    OTHER = "other"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    file_path = Column(String, nullable=False)
    file_type = Column(Enum(DocumentType), nullable=False)
    folder_id = Column(Integer, ForeignKey("document_folders.id"))
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    folder = relationship("DocumentFolder", back_populates="documents")
    uploader = relationship("User", foreign_keys=[uploaded_by], back_populates="documents")
    employee = relationship("Employee", back_populates="documents")

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # 'employee', 'hr', 'manager', 'admin'
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String, nullable=True)  # We'll use this to store OTP
    verification_token_expires = Column(DateTime, nullable=True)  # We'll use this for OTP expiry
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    folders = relationship("DocumentFolder", back_populates="creator")
    documents = relationship("Document", back_populates="uploader")
    created_tasks = relationship("Task", back_populates="task_creator", foreign_keys="Task.assigned_by")
    leave_requests = relationship("LeaveRequest", back_populates="employee", foreign_keys="LeaveRequest.employee_id")
    approved_leaves = relationship("LeaveRequest", back_populates="approver", foreign_keys="LeaveRequest.approved_by")
    leave_balances = relationship("LeaveBalance", back_populates="employee")
    given_feedbacks = relationship("EmployeeFeedback", back_populates="from_employee", foreign_keys="EmployeeFeedback.from_employee_id")
    received_feedbacks = relationship("EmployeeFeedback", back_populates="to_employee", foreign_keys="EmployeeFeedback.to_employee_id")

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    total_budget = Column(Numeric(10, 2), nullable=False)  # Keep the original column name
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="active")
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    department_budgets = relationship("DepartmentBudget", back_populates="budget", cascade="all, delete-orphan")


class DepartmentBudget(Base):
    __tablename__ = "department_budgets"

    id = Column(Integer, primary_key=True, index=True)
    budget_id = Column(Integer, ForeignKey("budgets.id"), nullable=False)
    department = Column(String, nullable=False)  # 'hr', 'marketing', 'operations', 'sales', 'it'
    allocated_amount = Column(Numeric(10, 2), nullable=False)
    spent_amount = Column(Numeric(10, 2), nullable=False, default=0)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    budget = relationship("Budget", back_populates="department_budgets")

class CampaignStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    PAUSED = "PAUSED"

class Platform(str, enum.Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"

class ExpenseCategory(str, enum.Enum):
    AD_PLACEMENT = "ad_placement"
    CONTENT_CREATION = "content_creation"
    INFLUENCER = "influencer"
    ANALYTICS = "analytics"
    OTHER = "other"

class PostStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    SCHEDULED = "SCHEDULED"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"

class SocialMediaCampaign(Base):
    __tablename__ = "social_media_campaigns"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    platforms = Column(String, nullable=False)  # Comma-separated string
    budget = Column(Float, nullable=False, default=0)
    spent = Column(Float, nullable=False, default=0)
    roi = Column(Float, nullable=False, default=0)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(String, nullable=False, default="PLANNED")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    posts = relationship("ScheduledPost", back_populates="campaign", cascade="all, delete-orphan")
    expenses = relationship("CampaignExpense", back_populates="campaign", cascade="all, delete-orphan")

class CampaignExpense(Base):
    __tablename__ = "campaign_expenses"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("social_media_campaigns.id", ondelete="CASCADE"))
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category = Column(Enum(ExpenseCategory))
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    campaign = relationship("SocialMediaCampaign", back_populates="expenses")

class ScheduledPost(Base):
    __tablename__ = "scheduled_posts"
    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("social_media_campaigns.id", ondelete="SET NULL"), nullable=True)
    content = Column(Text, nullable=False)
    platforms = Column(String, nullable=False)  # Comma-separated string
    scheduled_time = Column(DateTime, nullable=False)
    image_url = Column(String, nullable=True)
    link_url = Column(String, nullable=True)
    target_audience = Column(JSON, nullable=True, default={})
    status = Column(String, nullable=False, default="SCHEDULED")
    performance_metrics = Column(JSON, default={}, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    campaign = relationship("SocialMediaCampaign", back_populates="posts")

class DocumentFolder(Base):
    __tablename__ = "document_folders"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String, nullable=True)
    is_confidential = Column(Boolean, default=False)
    access_key = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(Integer, ForeignKey("users.id"))

    documents = relationship("Document", back_populates="folder", cascade="all, delete-orphan")
    creator = relationship("User", back_populates="folders")

class FeedbackType(str, enum.Enum):
    EMPLOYEE = "employee"
    CLIENT = "client"

class EmployeeFeedback(Base):
    __tablename__ = "employee_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    from_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    to_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    feedback = Column(Text, nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 rating
    remarks = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    from_employee = relationship("Employee", foreign_keys=[from_employee_id])
    to_employee = relationship("Employee", foreign_keys=[to_employee_id])

class ClientFeedback(Base):
    __tablename__ = "client_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    client_email = Column(String, nullable=False)
    feedback = Column(Text, nullable=True)
    rating = Column(Integer, nullable=True)
    remarks = Column(Text, nullable=True)
    form_token = Column(String, unique=True, nullable=True)
    form_expires_at = Column(DateTime, nullable=True)
    is_submitted = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LeaveType(str, enum.Enum):
    CASUAL = "casual"
    SICK = "sick"
    ANNUAL = "annual"
    UNPAID = "unpaid"
    OTHER = "other"

class LeaveStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    CANCELLED = "cancelled"

class LeaveRequest(Base):
    __tablename__ = "leave_requests"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    leave_type = Column(Enum(LeaveType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    reason = Column(Text, nullable=False)
    status = Column(Enum(LeaveStatus), default=LeaveStatus.PENDING)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    employee = relationship("User", back_populates="leave_requests", foreign_keys=[employee_id])
    approver = relationship("User", back_populates="approved_leaves", foreign_keys=[approved_by])

class LeaveBalance(Base):
    __tablename__ = "leave_balances"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    year = Column(Integer, nullable=False)
    casual_leave = Column(Integer, default=12)  # Default 12 days per year
    sick_leave = Column(Integer, default=15)    # Default 15 days per year
    annual_leave = Column(Integer, default=20)  # Default 20 days per year
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationship
    employee = relationship("User", back_populates="leave_balances")

    __table_args__ = (
        UniqueConstraint('employee_id', 'year', name='unique_employee_year'),
    )

class GeneralExpense(Base):
    __tablename__ = "general_expenses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    category = Column(String, nullable=False)
    payment_method = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class LeadStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    PROPOSAL = "proposal"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    company = Column(String, nullable=True)
    email = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    source = Column(String, nullable=True)
    status = Column(Enum(LeadStatus), nullable=False, default=LeadStatus.NEW)
    notes = Column(Text, nullable=True)
    expected_value = Column(Float, nullable=True)
    assigned_to = Column(Integer, ForeignKey("employees.id", ondelete="SET NULL"), nullable=True)
    client_id = Column(Integer, ForeignKey("clients.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    client = relationship("Client", back_populates="leads")
    assigned_employee = relationship("Employee", back_populates="assigned_leads")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    department = Column(String, nullable=False)
    date = Column(Date, nullable=False)
    description = Column(String, nullable=True)
    receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class AttendanceStatus(str, enum.Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"
    HALF_DAY = "half_day"
    ON_LEAVE = "on_leave"

class MilestoneStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus), nullable=False, default=AttendanceStatus.PRESENT)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee", back_populates="attendance")

    __table_args__ = (
        UniqueConstraint('employee_id', 'date', name='unique_employee_attendance_date'),
    )

class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    date = Column(Date, nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    employee = relationship("Employee", back_populates="milestones")

class ClientStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"
    PENDING = "pending"

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    status = Column(Enum(ClientStatus), nullable=False, default=ClientStatus.ACTIVE)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    leads = relationship("Lead", back_populates="client")
    services = relationship("Service", back_populates="client", cascade="all, delete-orphan")
