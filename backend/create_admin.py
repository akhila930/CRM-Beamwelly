from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import Base, User
from passlib.context import CryptContext
from datetime import datetime

# Create tables
Base.metadata.create_all(bind=engine)

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def create_admin_user():
    db = SessionLocal()
    try:
        # Check if admin already exists
        admin = db.query(User).filter(User.email == "equitywalaa@gmail.com").first()
        if admin:
            # Update admin if exists
            admin.name = "Admin"
            admin.hashed_password = get_password_hash("admin@equitywala")
            admin.role = "admin"
            admin.is_active = True
            admin.is_verified = True
            admin.verification_token = None
            admin.verification_token_expires = None
            db.commit()
            print("Admin user updated successfully")
            return
        
        # Create admin user
        admin_user = User(
            email="equitywalaa@gmail.com",
            name="Admin",
            hashed_password=get_password_hash("admin@equitywala"),
            role="admin",
            is_active=True,
            is_verified=True,
            verification_token=None,
            verification_token_expires=None,
            created_at=datetime.utcnow()
        )
        
        db.add(admin_user)
        db.commit()
        print("Admin user created successfully")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
