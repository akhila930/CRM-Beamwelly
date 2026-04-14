from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def add_company_name_column():
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Add company_name column
    with engine.connect() as connection:
        try:
            # Check if column exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'tasks' 
                AND column_name = 'company_name'
            """))
            
            if not result.fetchone():
                # Add column if it doesn't exist
                connection.execute(text("""
                    ALTER TABLE tasks 
                    ADD COLUMN company_name TEXT
                """))
                connection.commit()
                print("Successfully added company_name column to tasks table")
            else:
                print("company_name column already exists in tasks table")
                
        except Exception as e:
            print(f"Error adding column: {str(e)}")
            raise

if __name__ == "__main__":
    add_company_name_column() 