from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def add_created_at_fields():
    try:
        # Create engine
        engine = create_engine(SQLALCHEMY_DATABASE_URL)
        
        # SQL statements
        statements = [
            """
            ALTER TABLE services 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            """,
            """
            ALTER TABLE interactions 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            """,
            """
            ALTER TABLE client_service_documents 
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
            """
        ]
        
        # Execute statements
        with engine.connect() as connection:
            for statement in statements:
                connection.execute(text(statement))
                connection.commit()
        
        print("Successfully added created_at fields to all tables")
        
    except Exception as e:
        print(f"Error adding created_at fields: {str(e)}")

if __name__ == "__main__":
    add_created_at_fields() 