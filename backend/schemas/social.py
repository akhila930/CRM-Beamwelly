from pydantic import BaseModel, Field, Json
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
from enum import Enum

class CampaignStatus(str, Enum):
    PLANNED = "PLANNED"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"

class Platform(str, Enum):
    FACEBOOK = "facebook"
    INSTAGRAM = "instagram"
    TWITTER = "twitter"
    LINKEDIN = "linkedin"
    TIKTOK = "tiktok"

class ExpenseCategory(str, Enum):
    AD_PLACEMENT = "ad_placement"
    CONTENT_CREATION = "content_creation"
    INFLUENCER = "influencer"
    ANALYTICS = "analytics"
    OTHER = "other"

class PostStatus(str, Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    PUBLISHED = "published"
    FAILED = "failed"

# Campaign Schemas
class CampaignBase(BaseModel):
    name: str
    description: Optional[str] = None
    platforms: List[str]
    budget: float
    start_date: date
    end_date: date
    status: str = CampaignStatus.PLANNED.value
    company_name: Optional[str] = None

class CampaignCreate(CampaignBase):
    pass

class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    platforms: Optional[List[str]] = None
    budget: Optional[float] = None
    spent: Optional[float] = None
    roi: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None

class CampaignResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    platforms: List[str]
    budget: float
    spent: float
    roi: float
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Expense Schemas
class ExpenseBase(BaseModel):
    description: str
    amount: float = Field(gt=0)
    category: ExpenseCategory
    date: date

class ExpenseCreate(ExpenseBase):
    campaign_id: int

class ExpenseUpdate(BaseModel):
    description: Optional[str] = None
    amount: Optional[float] = Field(default=None, gt=0)
    category: Optional[ExpenseCategory] = None
    date: Optional[date] = None

class ExpenseResponse(ExpenseBase):
    id: int
    campaign_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Post Schemas
class PostBase(BaseModel):
    campaign_id: Optional[int] = None
    content: str
    platforms: List[str]
    scheduled_time: datetime
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    target_audience: Optional[Dict[str, Any]] = Field(default_factory=dict)
    location: Optional[str] = None
    status: str = PostStatus.SCHEDULED.value
    company_name: Optional[str] = None

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = None
    platforms: Optional[List[str]] = None
    scheduled_time: Optional[datetime] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    target_audience: Optional[Dict[str, Any]] = None
    status: Optional[PostStatus] = None
    location: Optional[str] = None

class PostResponse(BaseModel):
    id: int
    campaign_id: Optional[int]
    content: str
    platforms: List[str]
    scheduled_time: datetime
    image_url: Optional[str]
    link_url: Optional[str]
    target_audience: Dict[str, Any]
    status: str
    performance_metrics: Dict[str, Any]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Campaign Stats Schema
class CampaignStats(BaseModel):
    total_budget: float
    total_spent: float
    campaign_count: int
    active_campaigns: int
    completed_campaigns: int
    total_posts: int
    scheduled_posts: int
    published_posts: int

class GeneratePostRequest(BaseModel):
    campaign_title: str
    keywords: List[str]
    platforms: List[str]
    scheduled_time: datetime