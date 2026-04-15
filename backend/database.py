from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

if not SQLALCHEMY_DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable not set. "
        "Set it in your environment (e.g., Render service env vars)."
    )

# print(f"DEBUG: Connecting with SQLALCHEMY_DATABASE_URL: '{SQLALCHEMY_DATABASE_URL}'")

# if not SQLALCHEMY_DATABASE_URL:
#     raise ValueError("DATABASE_URL environment variable not set. Please create a .env file and set it, e.g., DATABASE_URL=postgresql://user:password@host:port/dbname")

# Create engine
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

Base = declarative_base()
