from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, date, timedelta
import json
import os
import openai
import requests
from database import get_db
from models import SocialMediaCampaign, CampaignExpense, ScheduledPost, CampaignStatus, PostStatus, ExpenseCategory, OAuthToken
from schemas.social import (
    CampaignCreate, CampaignUpdate, CampaignResponse,
    ExpenseCreate, ExpenseResponse,
    PostCreate, PostUpdate, PostResponse,
    CampaignStats, GeneratePostRequest
)
from routes.auth import get_current_user
from fastapi.responses import RedirectResponse
import urllib.parse
import logging

router = APIRouter(
    prefix="/api/social",
    tags=["social"]
)

# Initialize OpenAI client
openai.api_key = os.getenv("OPENAI_API_KEY")

# Function to generate caption using OpenAI
async def generate_caption(campaign_title: str, keywords: List[str]) -> str:
    prompt = f"Generate a short, engaging social media post caption for a campaign titled '{campaign_title}' with keywords: {', '.join(keywords)}."
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that writes social media post captions."},
            {"role": "user", "content": prompt}
        ],
        max_tokens=1000,
        temperature=0.7
    )
    return response.choices[0].message.content.strip()

# Campaign Routes
@router.get("/campaigns", response_model=List[CampaignResponse])
async def get_campaigns(
    status: Optional[CampaignStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(SocialMediaCampaign)

        # Filter by company name for users with a company
        if current_user.company_name:
            query = query.filter(SocialMediaCampaign.company_name == current_user.company_name)

        if status:
            query = query.filter(SocialMediaCampaign.status == status)
        campaigns = query.all()
        
        # Convert platforms string to list for each campaign
        for campaign in campaigns:
            campaign.platforms = campaign.platforms.split(",") if campaign.platforms else []
        
        return campaigns
    except Exception as e:
        print(f"Error fetching campaigns: {str(e)}")  # Add debug print
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching campaigns: {str(e)}"
        )

@router.post("/campaigns", response_model=CampaignResponse)
async def create_campaign(
    campaign: CampaignCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Create campaign with proper platform string and status
        db_campaign = SocialMediaCampaign(
            name=campaign.name,
            description=campaign.description,
            platforms=",".join(campaign.platforms) if campaign.platforms else "",
            budget=float(campaign.budget),
            start_date=campaign.start_date,
            end_date=campaign.end_date,
            status=campaign.status.upper() if campaign.status else "PLANNED",
            spent=0.0,
            roi=0.0,
            company_name=current_user.company_name if current_user.company_name else None, # Set company_name
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_campaign)
        db.commit()
        db.refresh(db_campaign)
        
        # Convert platforms back to list for response
        db_campaign.platforms = db_campaign.platforms.split(",") if db_campaign.platforms else []
        
        return db_campaign
    except Exception as e:
        db.rollback()
        print(f"Error in create_campaign: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error creating campaign: {str(e)}"
        )

@router.put("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: int,
    campaign: CampaignUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(SocialMediaCampaign).filter(SocialMediaCampaign.id == campaign_id)

        # Filter by company name for users with a company
        if current_user.company_name:
            query = query.filter(SocialMediaCampaign.company_name == current_user.company_name)

        db_campaign = query.first()

        if not db_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found or not accessible by your company")
        
        update_data = campaign.dict(exclude_unset=True)

        # Prevent updating company_name via this endpoint
        update_data.pop('company_name', None)
        
        # Handle platforms list conversion
        if "platforms" in update_data and isinstance(update_data["platforms"], list):
            update_data["platforms"] = ",".join(update_data["platforms"])
        
        # Convert status to uppercase if present
        if "status" in update_data:
            update_data["status"] = update_data["status"].upper()
        
        # Calculate ROI if budget or spent is updated
        if "budget" in update_data or "spent" in update_data:
            budget = update_data.get("budget", db_campaign.budget)
            spent = update_data.get("spent", db_campaign.spent)
            if budget is not None and spent is not None and budget > 0:
                update_data["roi"] = ((spent - budget) / budget) * 100
            else:
                update_data["roi"] = 0
        
        for key, value in update_data.items():
            setattr(db_campaign, key, value)
        
        # Explicitly add and commit within a try-except block
        try:
            db.add(db_campaign) # Ensure it's added to the session
            db.commit()
            db.refresh(db_campaign)
            
            # Convert platforms back to list for response
            db_campaign.platforms = db_campaign.platforms.split(",") if db_campaign.platforms else []
            
            return db_campaign
        except Exception as e:
            db.rollback()
            logging.error(f"Error committing campaign update: {str(e)}") # Use logging
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update campaign due to a database error: {str(e)}"
            )
    except HTTPException as e:
        # Re-raise HTTPExceptions
        raise e
    except Exception as e:
        logging.error(f"Error in update_campaign endpoint: {str(e)}") # Use logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred while updating the campaign: {str(e)}"
        )

@router.delete("/campaigns/{campaign_id}")
async def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(SocialMediaCampaign).filter(SocialMediaCampaign.id == campaign_id)

        # Filter by company name for users with a company
        if current_user.company_name:
            query = query.filter(SocialMediaCampaign.company_name == current_user.company_name)

        # Check if the campaign exists and is accessible by the user's company
        db_campaign = query.first()
        if not db_campaign:
             raise HTTPException(status_code=404, detail="Campaign not found or not accessible by your company")

        # First delete associated posts that belong to the campaign and the user's company
        post_query = db.query(ScheduledPost).filter(ScheduledPost.campaign_id == campaign_id)
        if current_user.company_name:
             post_query = post_query.filter(ScheduledPost.company_name == current_user.company_name)
        post_query.delete(synchronize_session=False)

        # Then delete associated expenses that belong to the campaign
        # Expenses don't currently have company_name, assuming they are tied to a campaign which is company-filtered
        # No company filter needed here as expenses are tied to campaigns which are already filtered.
        db.query(CampaignExpense).filter(CampaignExpense.campaign_id == campaign_id).delete(synchronize_session=False)

        # Finally delete the campaign itself
        # Use the original query which is already filtered by campaign_id and company_name
        query.delete(synchronize_session=False)

        db.commit() # Commit all deletions
        return {"message": "Campaign and associated data deleted successfully"}
    except HTTPException as e:
        # Re-raise HTTPExceptions
        raise e
    except Exception as e:
        db.rollback()
        logging.error(f"Error in delete_campaign endpoint: {str(e)}") # Use logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete campaign: {str(e)}"
        )

# Post Routes
@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Verify user has connected accounts for selected platforms
        for platform in post.platforms:
            account = db.query(OAuthToken).filter(
                OAuthToken.user_id == current_user.id,
                OAuthToken.platform == platform,
                OAuthToken.expires_at > datetime.utcnow()
            ).first()
            
            if not account:
                raise HTTPException(
                    status_code=400,
                    detail=f"No active {platform} account connected. Please connect an account first."
                )
        
        # Create post
        db_post = ScheduledPost(
            campaign_id=post.campaign_id,
            content=post.content,
            platforms=",".join(post.platforms),
            scheduled_time=post.scheduled_time,
            image_url=post.image_url,
            link_url=post.link_url,
            target_audience=post.target_audience or {},
            status=post.status.lower() if post.status else "scheduled", # Ensure status is lowercase
            performance_metrics={},
            company_name=current_user.company_name if current_user.company_name else None, # Set company_name
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        
        # Convert platforms back to list for response
        db_post.platforms = db_post.platforms.split(",") if db_post.platforms else []
        
        return db_post
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/posts", response_model=List[PostResponse])
async def get_posts(
    campaign_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(ScheduledPost)
        
        # Filter by company name for users with a company
        if current_user.company_name:
             query = query.filter(ScheduledPost.company_name == current_user.company_name)

        if campaign_id is not None:
            query = query.filter(ScheduledPost.campaign_id == campaign_id)
        
        if status:
            query = query.filter(ScheduledPost.status == status.lower()) # Filter by lowercase status
        
        posts = query.all()
        
        # Convert platforms string to list for each post
        for post in posts:
            post.platforms = post.platforms.split(",") if post.platforms else []
        
        return posts
    except Exception as e:
        print(f"Error fetching posts: {str(e)}")  # Debug print
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching posts: {str(e)}"
        )

@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
async def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(SocialMediaCampaign).filter(SocialMediaCampaign.id == campaign_id)

        # Filter by company name for users with a company
        if current_user.company_name:
            query = query.filter(SocialMediaCampaign.company_name == current_user.company_name)

        db_campaign = query.first()

        if not db_campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")

        # Convert platforms back to list for response
        db_campaign.platforms = db_campaign.platforms.split(",") if db_campaign.platforms else []

        return db_campaign
    except Exception as e:
        print(f"Campaign update outer error: {str(e)}") # Keep this debug print or remove
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/campaigns/{campaign_id}/expenses", response_model=List[ExpenseResponse])
async def get_campaign_expenses(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        expenses = db.query(CampaignExpense).filter(CampaignExpense.campaign_id == campaign_id).all()
        return expenses
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching expenses: {str(e)}"
        )

@router.post("/expenses", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Verify campaign exists
        campaign = db.query(SocialMediaCampaign).filter(SocialMediaCampaign.id == expense.campaign_id).first()
        if not campaign:
            raise HTTPException(status_code=404, detail="Campaign not found")
        
        db_expense = CampaignExpense(**expense.dict())
        db.add(db_expense)
        
        # Update campaign spent amount and ROI
        campaign.spent += expense.amount
        if campaign.budget > 0:
            campaign.roi = ((campaign.spent - campaign.budget) / campaign.budget) * 100
        else:
            campaign.roi = 0
        
        db.commit()
        db.refresh(db_expense)
        return db_expense
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating expense: {str(e)}"
        )

@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    post: PostUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(ScheduledPost).filter(ScheduledPost.id == post_id)

        # Filter by company name for users with a company
        if current_user.company_name:
             query = query.filter(ScheduledPost.company_name == current_user.company_name)

        db_post = query.first()

        if not db_post:
            raise HTTPException(status_code=404, detail="Post not found or not accessible")
        
        update_data = post.dict(exclude_unset=True)

        # Prevent updating company_name via this endpoint
        update_data.pop('company_name', None)
        
        # Handle platforms list conversion
        if "platforms" in update_data and isinstance(update_data["platforms"], list):
            update_data["platforms"] = ",".join(update_data["platforms"])
        
        # Convert status to lowercase if present
        if "status" in update_data:
            update_data["status"] = update_data["status"].lower()
        
        for key, value in update_data.items():
            setattr(db_post, key, value)
        
        try:
            db.commit()
            db.refresh(db_post)

            # Convert platforms back to list for response
            db_post.platforms = db_post.platforms.split(",") if db_post.platforms else []

            return db_post
        except Exception as e:
            db.rollback()
            logging.error(f"Post update error: {str(e)}") # Debug print
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=str(e)
            )
    except Exception as e:
        print(f"Post update outer error: {str(e)}") # Debug print
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        query = db.query(ScheduledPost).filter(ScheduledPost.id == post_id)

        # Filter by company name for users with a company
        if current_user.company_name:
             query = query.filter(ScheduledPost.company_name == current_user.company_name)

        result = query.delete(synchronize_session=False)
        if result == 0:
            raise HTTPException(status_code=404, detail="Post not found or not accessible")

        db.commit()
        return {"message": "Post deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting post: {str(e)}"
        )

# Stats Route
@router.get("/stats", response_model=CampaignStats)
async def get_campaign_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        campaign_query = db.query(SocialMediaCampaign)
        post_query = db.query(ScheduledPost)

        # Filter by company name for users with a company
        if current_user.company_name:
            campaign_query = campaign_query.filter(SocialMediaCampaign.company_name == current_user.company_name)
            post_query = post_query.filter(ScheduledPost.company_name == current_user.company_name)

        # Calculate stats based on filtered queries
        # Handle potential None results from scalar() for count by using .count() instead or explicitly checking
        total_budget = campaign_query.with_entities(func.sum(SocialMediaCampaign.budget)).scalar() or 0
        total_spent = campaign_query.with_entities(func.sum(SocialMediaCampaign.spent)).scalar() or 0
        campaign_count = campaign_query.count()
        active_campaigns = campaign_query.filter(SocialMediaCampaign.status == CampaignStatus.ACTIVE).count()
        completed_campaigns = campaign_query.filter(SocialMediaCampaign.status == CampaignStatus.COMPLETED).count()
        total_posts = post_query.count()
        scheduled_posts = post_query.filter(ScheduledPost.status == PostStatus.SCHEDULED).count()
        # Ensure the status string matches the enum values exactly (case-sensitive)
        published_posts = post_query.filter(ScheduledPost.status == PostStatus.PUBLISHED.value).count() # Use .value

        return CampaignStats(
            total_budget=float(total_budget),
            total_spent=float(total_spent),
            campaign_count=campaign_count,
            active_campaigns=active_campaigns,
            completed_campaigns=completed_campaigns,
            total_posts=total_posts,
            scheduled_posts=scheduled_posts,
            published_posts=published_posts
        )

    except Exception as e:
        logging.error(f"Error fetching campaign stats: {str(e)}") # Use logging
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching campaign stats: {str(e)}"
        )

# New endpoint to generate and store AI-generated post
@router.post("/generate-post", response_model=PostResponse)
async def generate_post(
    req: GeneratePostRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        # Generate caption using OpenAI
        content = await generate_caption(req.campaign_title, req.keywords)
        
        # Create post with generated content and set company_name
        db_post = ScheduledPost(
            campaign_id=None, # No campaign associated with a generated post initially?
            content=content,
            platforms=",".join(req.platforms) if req.platforms else "",
            scheduled_time=req.scheduled_time,
            image_url=None, # Generated post doesn't have image initially?
            link_url=None, # Generated post doesn't have link initially?
            target_audience={},
            status="SCHEDULED", # Default status for generated post
            performance_metrics={},
            company_name=current_user.company_name if current_user.company_name else None, # Set company_name
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_post)
        db.commit()
        db.refresh(db_post)
        
        # Convert platforms back to list for response
        db_post.platforms = db_post.platforms.split(",") if db_post.platforms else []
        
        return db_post
    except Exception as e:
        db.rollback()
        print(f"Post generation error: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Error generating post: {str(e)}"
        )

# Update OAuth endpoints to handle multiple accounts
@router.get("/auth/{platform}/accounts")
async def get_connected_accounts(
    platform: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        accounts = db.query(OAuthToken).filter(
            OAuthToken.user_id == current_user.id,
            OAuthToken.platform == platform
        ).all()
        
        # For LinkedIn, get profile information
        if platform == "linkedin":
            for account in accounts:
                headers = {"Authorization": f"Bearer {account.access_token}"}
                response = requests.get(
                    "https://api.linkedin.com/v2/me",
                    headers=headers
                )
                if response.status_code == 200:
                    profile = response.json()
                    account.profile_info = {
                        "name": f"{profile.get('localizedFirstName', '')} {profile.get('localizedLastName', '')}",
                        "id": profile.get('id')
                    }
        
        # For Facebook, get page information
        elif platform == "facebook":
            for account in accounts:
                headers = {"Authorization": f"Bearer {account.access_token}"}
                response = requests.get(
                    "https://graph.facebook.com/v12.0/me/accounts",
                    headers=headers
                )
                if response.status_code == 200:
                    pages = response.json().get('data', [])
                    account.profile_info = {
                        "pages": pages
                    }
        
        return accounts
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/auth/{platform}/disconnect/{account_id}")
async def disconnect_account(
    platform: str,
    account_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        account = db.query(OAuthToken).filter(
            OAuthToken.id == account_id,
            OAuthToken.user_id == current_user.id,
            OAuthToken.platform == platform
        ).first()
        
        if not account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        db.delete(account)
        db.commit()
        
        return {"message": f"{platform.capitalize()} account disconnected successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Update the auto-posting function
async def post_to_platform(platform: str, post: ScheduledPost, user_id: int, db: Session):
    try:
        # Get user's token for the platform
        token = db.query(OAuthToken).filter(
            OAuthToken.user_id == user_id,
            OAuthToken.platform == platform,
            OAuthToken.expires_at > datetime.utcnow()
        ).first()
        
        if not token:
            return False, f"No active {platform} account connected"
        
        if platform == "linkedin":
            await post_to_linkedin(post.content, post.image_url, post.link_url, user_id, db)
        elif platform == "facebook":
            await post_to_facebook(post.content, post.image_url, post.link_url, user_id, db)
        elif platform == "instagram":
            await post_to_instagram(post.content, post.image_url, post.link_url, user_id, db)
        elif platform == "twitter":
            await post_to_twitter(post.content, post.image_url, post.link_url, user_id, db)
        
        return True, f"Successfully posted to {platform}"
    except Exception as e:
        return False, f"Error posting to {platform}: {str(e)}"

# Update the publish endpoint
@router.post("/posts/{post_id}/publish")
async def publish_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    try:
        post = db.query(ScheduledPost).filter(ScheduledPost.id == post_id).first()
        if not post:
            raise HTTPException(status_code=404, detail="Post not found")
        
        platforms = post.platforms.split(",") if post.platforms else []
        results = []
        
        for platform in platforms:
            success, message = await post_to_platform(platform, post, current_user.id, db)
            results.append({
                "platform": platform,
                "success": success,
                "message": message
            })
        
        # Update post status
        all_success = all(r["success"] for r in results)
        post.status = "PUBLISHED" if all_success else "FAILED"
        post.performance_metrics = {
            "results": results,
            "published_at": datetime.utcnow().isoformat()
        }
        
        db.commit()
        
        return {
            "message": "Post publishing completed",
            "results": results
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# --- OAUTH2 ENDPOINTS FOR ALL PLATFORMS ---

# Helper: Get OAuth config from env
OAUTH_CONFIG = {
    'linkedin': {
        'client_id': os.getenv('LINKEDIN_CLIENT_ID'),
        'client_secret': os.getenv('LINKEDIN_CLIENT_SECRET'),
        'redirect_uri': os.getenv('LINKEDIN_REDIRECT_URI'),
        'auth_url': 'https://www.linkedin.com/oauth/v2/authorization',
        'token_url': 'https://www.linkedin.com/oauth/v2/accessToken',
        'scope': 'r_liteprofile r_emailaddress w_member_social',
    },
    'facebook': {
        'client_id': os.getenv('FACEBOOK_APP_ID'),
        'client_secret': os.getenv('FACEBOOK_APP_SECRET'),
        'redirect_uri': os.getenv('FACEBOOK_REDIRECT_URI'),
        'auth_url': 'https://www.facebook.com/v12.0/dialog/oauth',
        'token_url': 'https://graph.facebook.com/v12.0/oauth/access_token',
        'scope': 'pages_manage_posts pages_read_engagement',
    },
    'instagram': {
        'client_id': os.getenv('INSTAGRAM_CLIENT_ID'),
        'client_secret': os.getenv('INSTAGRAM_CLIENT_SECRET'),
        'redirect_uri': os.getenv('INSTAGRAM_REDIRECT_URI'),
        'auth_url': 'https://api.instagram.com/oauth/authorize',
        'token_url': 'https://api.instagram.com/oauth/access_token',
        'scope': 'user_profile,user_media',
    },
    'twitter': {
        'client_id': os.getenv('TWITTER_CLIENT_ID'),
        'client_secret': os.getenv('TWITTER_CLIENT_SECRET'),
        'redirect_uri': os.getenv('TWITTER_REDIRECT_URI'),
        'auth_url': 'https://twitter.com/i/oauth2/authorize',
        'token_url': 'https://api.twitter.com/2/oauth2/token',
        'scope': 'tweet.read tweet.write users.read offline.access',
    },
}

# --- GENERIC OAUTH2 INITIATE ENDPOINT ---
@router.get("/auth/{platform}")
async def oauth_initiate(platform: str, request: Request):
    if platform not in OAUTH_CONFIG:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    conf = OAUTH_CONFIG[platform]
    params = {
        'client_id': conf['client_id'],
        'redirect_uri': conf['redirect_uri'],
        'response_type': 'code',
        'scope': conf['scope'],
        'state': 'random_state',
    }
    if platform == 'twitter':
        params['scope'] = conf['scope'].replace(' ', ' ')
        params['response_type'] = 'code'
    auth_url = f"{conf['auth_url']}?{urllib.parse.urlencode(params)}"
    return {"auth_url": auth_url}

# --- GENERIC OAUTH2 CALLBACK ENDPOINT ---
@router.get("/auth/{platform}/callback")
async def oauth_callback(platform: str, code: str, state: str = None, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if platform not in OAUTH_CONFIG:
        raise HTTPException(status_code=400, detail="Unsupported platform")
    conf = OAUTH_CONFIG[platform]
    data = {
        'client_id': conf['client_id'],
        'client_secret': conf['client_secret'],
        'redirect_uri': conf['redirect_uri'],
        'code': code,
        'grant_type': 'authorization_code',
    }
    headers = {'Accept': 'application/json'}
    if platform == 'facebook':
        # Facebook expects GET
        token_resp = requests.get(conf['token_url'], params=data)
    elif platform == 'instagram':
        # Instagram expects POST
        token_resp = requests.post(conf['token_url'], data=data)
    elif platform == 'twitter':
        # Twitter expects POST and Basic Auth
        basic_auth = requests.auth.HTTPBasicAuth(conf['client_id'], conf['client_secret'])
        token_resp = requests.post(conf['token_url'], data=data, auth=basic_auth)
    else:
        token_resp = requests.post(conf['token_url'], data=data, headers=headers)
    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Failed to get token: {token_resp.text}")
    token_data = token_resp.json()
    access_token = token_data.get('access_token')
    refresh_token = token_data.get('refresh_token')
    expires_in = token_data.get('expires_in', 3600)
    expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
    # Save token
    db_token = OAuthToken(
        user_id=current_user.id,
        platform=platform,
        access_token=access_token,
        refresh_token=refresh_token,
        expires_at=expires_at
    )
    db.add(db_token)
    db.commit()
    # Redirect to frontend (customize as needed)
    return RedirectResponse(url="http://localhost:8080/social")

# --- Platform-specific posting (placeholders for Instagram/Twitter) ---
async def post_to_instagram(content, image_url, link_url, user_id, db):
    # TODO: Implement Instagram posting using Graph API
    pass

async def post_to_twitter(content, image_url, link_url, user_id, db):
    # TODO: Implement Twitter posting using Twitter API v2
    pass

async def post_to_facebook(content, image_url, link_url, user_id, db):
    # TODO: Implement Facebook posting using Graph API
    pass

async def post_to_linkedin(content, image_url, link_url, user_id, db):
    # TODO: Implement LinkedIn posting using relevant API
    pass

async def post_to_tiktok(content, image_url, link_url, user_id, db):
    # TODO: Implement TikTok posting using relevant API
    pass