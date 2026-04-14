from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./app.db")
    
    # JWT settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # SMTP settings
    SMTP_HOST: str = os.getenv("EMAIL_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("EMAIL_PORT", "587"))
    SMTP_USERNAME: str = os.getenv("EMAIL_HOST_USER", "")
    SMTP_PASSWORD: str = os.getenv("EMAIL_HOST_PASSWORD", "")

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"

settings = Settings() 