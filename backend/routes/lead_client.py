from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Form
print("DEBUG: lead_client.py loaded!")
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import pandas as pd
from io import BytesIO
from datetime import datetime, date
import json
from pydantic import BaseModel
import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from sqlalchemy.exc import IntegrityError
import traceback # Import traceback module

from database import get_db
from models import Lead, Client, LeadStatus, ClientStatus, User, Service, Interaction, ClientServiceDocument
from routes.auth import get_current_user

router = APIRouter(prefix="/api", tags=["leads", "clients"])

# Pydantic models for request/response
class LeadBase(BaseModel):
    name: str
    email: str
    mobile_number: Optional[str] = None
    managing_company_name: Optional[str] = None
    profession: Optional[str] = None
    qualification: Optional[str] = None
    income: Optional[float] = None
    date_of_investment: Optional[date] = None
    investment_type: Optional[str] = None
    reference_name: Optional[str] = None
    reference_email: Optional[str] = None
    reference_contact: Optional[str] = None
    relationship_manager: Optional[str] = None
    interaction_type: Optional[str] = None
    source: Optional[str] = None
    status: str
    notes: Optional[str] = None
    expected_value: Optional[float] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(LeadBase):
    pass

class LeadResponse(LeadBase):
    id: int
    assigned_to: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    email: str
    mobile_number: Optional[str] = None
    client_employer_company_name: Optional[str] = None
    profession: Optional[str] = None
    qualification: Optional[str] = None
    income: Optional[float] = None
    date_of_investment: Optional[date] = None
    investment_type: Optional[str] = None
    reference_name: Optional[str] = None
    reference_email: Optional[str] = None
    reference_contact: Optional[str] = None
    relationship_manager: Optional[str] = None
    interaction_type: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "active"
    assigned_to: Optional[int] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(ClientBase):
    name: Optional[str] = None
    email: Optional[str] = None

class ClientResponse(ClientBase):
    id: int
    managing_company_name: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Lead template columns
LEAD_TEMPLATE_COLUMNS = [
    "name", "email", "mobile_number", "managing_company_name", "profession", "qualification",
    "income", "date_of_investment", "investment_type", "reference_name", "reference_email",
    "reference_contact", "relationship_manager", "interaction_type", "source", "status",
    "notes", "expected_value"
]

# Client template columns
CLIENT_TEMPLATE_COLUMNS = [
    "name", "email", "mobile_number", "client_employer_company_name", "profession", "qualification",
    "income", "date_of_investment", "investment_type", "reference_name", "reference_email",
    "reference_contact", "relationship_manager", "interaction_type", "phone", "address",
    "notes", "status"
]

@router.get("/leads/template")
async def download_lead_template():
    """Download an Excel template for lead uploads"""
    # Use LEAD_TEMPLATE_COLUMNS to ensure all fields are included
    df = pd.DataFrame(columns=[col.replace('_', ' ').title() for col in LEAD_TEMPLATE_COLUMNS])
    
    print("DEBUG: LEAD_TEMPLATE_COLUMNS used for DataFrame:", [col.replace('_', ' ').title() for col in LEAD_TEMPLATE_COLUMNS])
    
    # Add a sample row with example data for all columns
    df.loc[0] = [
        'John Doe', # name
        'john@example.com', # email
        '+1234567890', # mobile_number
        'Example Corp', # managing_company_name
        'Software Engineer', # profession
        'B.Tech', # qualification
        100000.00, # income
        date(2024, 3, 20), # date_of_investment
        'equity', # investment_type
        'Jane Smith', # reference_name
        'jane@example.com', # reference_email
        '+1987654321', # reference_contact
        'John Manager', # relationship_manager
        'call', # interaction_type
        'Website', # source
        'New', # status
        'Initial contact made', # notes
        10000.00 # expected_value
    ]
    
    # Create an Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Leads Template')
        
        # Get the workbook and worksheet
        workbook = writer.book
        worksheet = writer.sheets['Leads Template']
        
        # Function to convert column index to Excel column letter
        def get_excel_column_letter(col_idx):
            letter = ''
            while col_idx > 0:
                col_idx, remainder = divmod(col_idx - 1, 26)
                letter = chr(65 + remainder) + letter
            return letter

        # Dynamically find column indices for dropdowns
        investment_type_col_idx = LEAD_TEMPLATE_COLUMNS.index('investment_type')
        investment_type_col_letter = get_excel_column_letter(investment_type_col_idx + 1)

        interaction_type_col_idx = LEAD_TEMPLATE_COLUMNS.index('interaction_type')
        interaction_type_col_letter = get_excel_column_letter(interaction_type_col_idx + 1)

        # Add dropdown for investment type
        investment_types = ['equity', 'sip', 'lumsum', 'insurance', 'PMS', 'AID', 'others']
        worksheet.data_validation(f'{investment_type_col_letter}2:{investment_type_col_letter}1048576', {
            'validate': 'list',
            'source': investment_types
        })
        
        # Add dropdown for interaction type
        interaction_types = ['call', 'meeting', 'email', 'other']
        worksheet.data_validation(f'{interaction_type_col_letter}2:{interaction_type_col_letter}1048576', {
            'validate': 'list',
            'source': interaction_types
        })
        
        # Add dropdown for status
        status_list = [status.value for status in LeadStatus]
        status_col_idx = LEAD_TEMPLATE_COLUMNS.index('status')
        status_col_letter = get_excel_column_letter(status_col_idx + 1)
        worksheet.data_validation(f'{status_col_letter}2:{status_col_letter}1048576', {
            'validate': 'list',
            'source': status_list
        })
        
        # Set column widths
        for i, col in enumerate(df.columns):
            worksheet.set_column(i, i, 20)
    
    output.seek(0)
    
    headers = {
        'Content-Disposition': 'attachment; filename=leads_template.xlsx'
    }
    
    return StreamingResponse(
        output, 
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers=headers
    )

@router.get("/clients/template")
async def download_client_template():
    """Generate and download client import template"""
    # Use CLIENT_TEMPLATE_COLUMNS to ensure all fields are included
    df = pd.DataFrame(columns=[col.replace('_', ' ').title() for col in CLIENT_TEMPLATE_COLUMNS])
    
    print("DEBUG: CLIENT_TEMPLATE_COLUMNS used for DataFrame:", [col.replace('_', ' ').title() for col in CLIENT_TEMPLATE_COLUMNS])
    
    # Create an Excel writer object
    output = BytesIO()
    with pd.ExcelWriter(output, engine='xlsxwriter') as writer: # Changed engine to xlsxwriter for consistency and dropdowns
        df.to_excel(writer, index=False, sheet_name='Clients Template')
        
        # Get the workbook and the worksheet
        workbook = writer.book
        worksheet = writer.sheets['Clients Template']
        
        # Function to convert column index to Excel column letter (re-defined or import from utils if available)
        def get_excel_column_letter(col_idx):
            letter = ''
            while col_idx > 0:
                col_idx, remainder = divmod(col_idx - 1, 26)
                letter = chr(65 + remainder) + letter
            return letter

        # Dynamically find column indices for client template dropdowns
        client_investment_type_col_idx = CLIENT_TEMPLATE_COLUMNS.index('investment_type')
        client_investment_type_col_letter = get_excel_column_letter(client_investment_type_col_idx + 1)

        client_interaction_type_col_idx = CLIENT_TEMPLATE_COLUMNS.index('interaction_type')
        client_interaction_type_col_letter = get_excel_column_letter(client_interaction_type_col_idx + 1)

        client_status_col_idx = CLIENT_TEMPLATE_COLUMNS.index('status')
        client_status_col_letter = get_excel_column_letter(client_status_col_idx + 1)

        # Add dropdown for investment type
        investment_types = ['equity', 'sip', 'lumsum', 'insurance', 'PMS', 'AID', 'others']
        worksheet.data_validation(f'{client_investment_type_col_letter}2:{client_investment_type_col_letter}1048576', {
            'validate': 'list',
            'source': investment_types
        })
        
        # Add dropdown for interaction type
        interaction_types = ['call', 'meeting', 'email', 'other']
        worksheet.data_validation(f'{client_interaction_type_col_letter}2:{client_interaction_type_col_letter}1048576', {
            'validate': 'list',
            'source': interaction_types
        })
        
        # Add dropdown for status
        status_list = [status.value for status in ClientStatus]
        worksheet.data_validation(f'{client_status_col_letter}2:{client_status_col_letter}1048576', {
            'validate': 'list',
            'source': status_list
        })
        
        # Set column widths
        for i, col in enumerate(df.columns):
            worksheet.set_column(i, i, 20)
    
    output.seek(0)
    
    # Return the Excel file as a downloadable response
    headers = {
        'Content-Disposition': 'attachment; filename="clients_template.xlsx"'
    }
    return StreamingResponse(output, media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', headers=headers)

@router.get("/leads", response_model=List[LeadResponse])
async def get_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = None
):
    """Get all leads with filtering and pagination"""
    try:
        query = db.query(Lead)
        
        # Filter by company for all users
        if current_user.company_name:
            query = query.filter(Lead.managing_company_name == current_user.company_name)
        elif current_user.role != 'admin':
            # If user has no company_name and is not admin, they should not see any leads
            return []

        # Filter by assigned user if not admin and company_name is present
        if current_user.role != 'admin':
            query = query.filter(Lead.assigned_to == current_user.id)
            
        # Apply status filter if provided
        if status:
            query = query.filter(Lead.status == status)
            
        # Apply pagination
        total = query.count()
        leads = query.offset(skip).limit(limit).all()
        
        # Convert to response model
        lead_responses = [LeadResponse.from_orm(lead) for lead in leads]
        
        return lead_responses
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch leads: {str(e)}"
        )

@router.post("/leads/upload")
async def upload_leads(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload leads from Excel file"""
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed")
    
    # Ensure user is associated with a company
    if not current_user.company_name:
        raise HTTPException(status_code=400, detail="User is not associated with a company, cannot upload leads.")
    
    try:
        # Read file
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        else:
            df = pd.read_excel(BytesIO(contents))
        
        # Check required columns
        required_columns = ['Name', 'Company', 'Email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        # Process each row
        leads = []
        errors = []
        for index, row in df.iterrows():
            try:
                # Validate required fields
                if pd.isna(row['Name']) or pd.isna(row['Company']) or pd.isna(row['Email']):
                    errors.append(f"Row {index + 2}: Missing required fields")
                    continue
                
                # Ensure the company in the Excel matches the user's company, or user is admin
                excel_company = str(row['Company'])
                if excel_company != current_user.company_name and current_user.role != 'admin':
                    errors.append(f"Row {index + 2}: Not authorized to upload leads for company '{excel_company}'. Leads must belong to '{current_user.company_name}'.")
                    continue
                
                # Create lead object with optional fields
                lead_data = {
                    'name': str(row['Name']),
                    'company': current_user.company_name, # Always use user's company for uploads
                    'email': str(row['Email']),
                    'phone': str(row['Phone']) if 'Phone' in df.columns and not pd.isna(row['Phone']) else None,
                    'expected_value': float(row['Value']) if 'Value' in df.columns and not pd.isna(row['Value']) else None,
                    'status': str(row['Status']) if 'Status' in df.columns and not pd.isna(row['Status']) else 'new',
                    'source': str(row['Source']) if 'Source' in df.columns and not pd.isna(row['Source']) else None,
                    'notes': str(row['Notes']) if 'Notes' in df.columns and not pd.isna(row['Notes']) else None,
                    'assigned_to': current_user.id
                }
                
                lead = Lead(**lead_data)
                leads.append(lead)
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        if not leads and errors:
            raise HTTPException(status_code=400, detail={"message": "No valid leads found", "errors": errors})
        
        # Save valid leads
        db.add_all(leads)
        db.commit()
        
        return {
            "message": f"Successfully uploaded {len(leads)} leads",
            "errors": errors if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/clients/upload")
async def upload_clients(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload clients from Excel file"""
    if not file.filename.endswith((".xlsx", ".xls", ".csv")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) or CSV files (.csv) are allowed")
    
    # Ensure user is associated with a company
    if not current_user.company_name:
        raise HTTPException(status_code=400, detail="User is not associated with a company, cannot upload clients.")

    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(BytesIO(contents))
        else:
            df = pd.read_excel(BytesIO(contents))
        required_columns = ['Name', 'Email']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        clients = []
        errors = []
        for index, row in df.iterrows():
            try:
                if pd.isna(row['Name']) or pd.isna(row['Email']):
                    errors.append(f"Row {index + 2}: Missing required fields")
                    continue
                
                # If a 'Client Employer Company Name' column exists in the Excel, validate it against the user's managing company
                if 'Client Employer Company Name' in df.columns and not pd.isna(row['Client Employer Company Name']):
                    excel_company = str(row['Client Employer Company Name'])
                    if excel_company != current_user.company_name and current_user.role != 'admin':
                        errors.append(f"Row {index + 2}: Not authorized to upload clients for company '{excel_company}'. Clients must belong to '{current_user.company_name}'.")
                        continue

                client_data = {
                    'name': str(row['Name']),
                    'email': str(row['Email']),
                    'mobile_number': str(row['Mobile Number']) if 'Mobile Number' in df.columns and not pd.isna(row['Mobile Number']) else None,
                    'profession': str(row['Profession']) if 'Profession' in df.columns and not pd.isna(row['Profession']) else None,
                    'qualification': str(row['Qualification']) if 'Qualification' in df.columns and not pd.isna(row['Qualification']) else None,
                    'income': float(row['Income']) if 'Income' in df.columns and not pd.isna(row['Income']) else None,
                    'date_of_investment': pd.to_datetime(row['Date Of Investment']).date() if 'Date Of Investment' in df.columns and not pd.isna(row['Date Of Investment']) else None,
                    'investment_type': str(row['Investment Type']) if 'Investment Type' in df.columns and not pd.isna(row['Investment Type']) else None,
                    'reference_name': str(row['Reference Name']) if 'Reference Name' in df.columns and not pd.isna(row['Reference Name']) else None,
                    'reference_email': str(row['Reference Email']) if 'Reference Email' in df.columns and not pd.isna(row['Reference Email']) else None,
                    'reference_contact': str(row['Reference Contact']) if 'Reference Contact' in df.columns and not pd.isna(row['Reference Contact']) else None,
                    'relationship_manager': str(row['Relationship Manager']) if 'Relationship Manager' in df.columns and not pd.isna(row['Relationship Manager']) else None,
                    'interaction_type': str(row['Interaction Type']) if 'Interaction Type' in df.columns and not pd.isna(row['Interaction Type']) else None,
                    'phone': str(row['Phone']) if 'Phone' in df.columns and not pd.isna(row['Phone']) else None,
                    'address': str(row['Address']) if 'Address' in df.columns and not pd.isna(row['Address']) else None,
                    'notes': str(row['Notes']) if 'Notes' in df.columns and not pd.isna(row['Notes']) else None,
                    'status': str(row['Status']) if 'Status' in df.columns and not pd.isna(row['Status']) else 'active',
                    'client_employer_company_name': str(row['Client Employer Company Name']) if 'Client Employer Company Name' in df.columns and not pd.isna(row['Client Employer Company Name']) else None,
                    'managing_company_name': current_user.company_name # Automatically assign managing company
                }
                # Check for existing client with the same email in the current user's managing company
                existing_client = db.query(Client).filter(
                    Client.email == client_data['email'],
                    Client.managing_company_name == current_user.company_name
                ).first()
                if existing_client:
                    errors.append(f"Row {index + 2}: Client with email {client_data['email']} already exists for this company.")
                    continue

                client = Client(**client_data)
                clients.append(client)
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        if not clients and errors:
            raise HTTPException(status_code=400, detail={"message": "No valid clients found", "errors": errors})
        db.add_all(clients)
        db.commit()
        return {
            "message": f"Successfully uploaded {len(clients)} clients",
            "errors": errors if errors else None
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# CRUD operations for leads
@router.post("/leads", response_model=LeadResponse)
async def create_lead(
    lead: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new lead"""
    # Ensure the lead's managing company matches the current user's company
    if not current_user.company_name:
        raise HTTPException(status_code=400, detail="User is not associated with a company.")
    
    if lead.managing_company_name and lead.managing_company_name != current_user.company_name:
        raise HTTPException(status_code=403, detail="Cannot create leads for other companies.")

    db_lead = Lead(**lead.model_dump(), 
                   assigned_to=current_user.id,
                   managing_company_name=current_user.company_name)
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.put("/leads/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a lead"""
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Enforce company-based access
    if current_user.company_name and db_lead.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to update leads from other companies.")

    # Prevent changing company if not admin
    if hasattr(lead, 'managing_company_name') and lead.managing_company_name and lead.managing_company_name != db_lead.managing_company_name and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to change lead's company.")
    
    # Ensure lead.managing_company_name is not set if current_user.company_name exists and lead.managing_company_name is different
    if current_user.company_name and hasattr(lead, 'managing_company_name') and lead.managing_company_name and lead.managing_company_name != current_user.company_name and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Cannot update lead company to a different company if not admin.")
    
    # If lead.managing_company_name is provided in the update, ensure it matches current_user.company_name or user is admin
    if hasattr(lead, 'managing_company_name') and lead.managing_company_name and current_user.company_name and lead.managing_company_name != current_user.company_name and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Cannot update lead company to a different company if not admin.")

    for key, value in lead.model_dump(exclude_unset=True).items():
        setattr(db_lead, key, value)
    
    # Ensure managing_company_name field is not updated by non-admins to a different company
    if current_user.role != 'admin' and db_lead.managing_company_name != current_user.company_name:
        db_lead.managing_company_name = current_user.company_name
    
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.delete("/leads/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a lead"""
    db_lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    # Enforce company-based access
    if current_user.company_name and db_lead.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to delete leads from other companies.")

    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

# CRUD operations for clients
@router.get("/clients", response_model=List[ClientResponse])
async def get_clients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all clients"""
    query = db.query(Client)
    
    if current_user.company_name:
        query = query.filter(Client.managing_company_name == current_user.company_name)
    elif current_user.role != 'admin':
        # If user has no company_name and is not admin, they should not see any clients
        return []

    clients = query.all()
    return clients

@router.post("/clients")
async def create_client(
    client: ClientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new client"""
    try:
        # Ensure the client's managing company matches the current user's company
        if not current_user.company_name:
            raise HTTPException(status_code=400, detail="User is not associated with a company.")
        
        db_client = Client(
            name=client.name,
            email=client.email,
            mobile_number=client.mobile_number,
            client_employer_company_name=client.client_employer_company_name,
            profession=client.profession,
            qualification=client.qualification,
            income=client.income,
            date_of_investment=client.date_of_investment,
            investment_type=client.investment_type,
            reference_name=client.reference_name,
            reference_email=client.reference_email,
            reference_contact=client.reference_contact,
            relationship_manager=client.relationship_manager,
            interaction_type=client.interaction_type,
            phone=client.phone,
            address=client.address,
            notes=client.notes,
            status=client.status,
            assigned_to=client.assigned_to,
            managing_company_name=current_user.company_name # Set managing company name
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return ClientResponse.from_orm(db_client)
    except IntegrityError as e:
        db.rollback()
        if "unique constraint" in str(e).lower() and "clients_email_key" in str(e).lower():
            raise HTTPException(
                status_code=409, # Conflict
                detail="Client with this email already exists."
            )
        # If it's another IntegrityError, log it and re-raise as 500
        print(f"ERROR: Unhandled IntegrityError in create_client: {e}")
        traceback.print_exc() # Print full traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create client due to database integrity issue: {str(e)}"
        )
    except Exception as e:
        db.rollback()
        print(f"ERROR: Unhandled exception in create_client: {e}")
        traceback.print_exc() # Print full traceback
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create client: An unexpected error occurred: {str(e)}"
        )

@router.put("/clients/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: int,
    client: ClientUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Enforce company-based access
    if current_user.company_name and db_client.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to update clients from other companies.")

    # Prevent changing company if not admin
    if hasattr(client, 'managing_company_name') and client.managing_company_name and client.managing_company_name != db_client.managing_company_name and current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Not authorized to change client's company.")

    for key, value in client.model_dump(exclude_unset=True).items():
        setattr(db_client, key, value)
    db.commit()
    db.refresh(db_client)
    return db_client

@router.delete("/clients/{client_id}")
async def delete_client(
    client_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Enforce company-based access
    if current_user.company_name and db_client.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to delete clients from other companies.")

    db.delete(db_client)
    db.commit()
    return {"message": "Client deleted successfully"}

@router.get("/clients/report")
async def download_client_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Generate and download a professional client report with all details, services, and interactions (with created_at dates)."""
    try:
        import xlsxwriter
        from datetime import datetime
        clients = db.query(Client).all()
        output = BytesIO()
        workbook = xlsxwriter.Workbook(output, {'in_memory': True})

        # Cover Sheet
        cover = workbook.add_worksheet('Report Cover')
        title_format = workbook.add_format({'bold': True, 'font_size': 24, 'align': 'center'})
        subtitle_format = workbook.add_format({'italic': True, 'font_size': 14, 'align': 'center'})
        date_format = workbook.add_format({'font_size': 12, 'align': 'center'})
        cover.merge_range('B2:F2', 'Client & Service Report', title_format)
        cover.merge_range('B4:F4', 'Generated by Equitywala', subtitle_format)
        cover.merge_range('B6:F6', f'Report Date: {datetime.now().strftime("%Y-%m-%d %H:%M")}', date_format)
        cover.set_row(1, 40)
        cover.set_row(3, 30)
        cover.set_row(5, 20)
        cover.set_column('B:F', 30)

        # Styles
        header_format = workbook.add_format({'bold': True, 'bg_color': '#D9E1F2', 'border': 1, 'align': 'center'})
        subheader_format = workbook.add_format({'bold': True, 'bg_color': '#FCE4D6', 'border': 1, 'align': 'center'})
        date_cell_format = workbook.add_format({'num_format': 'yyyy-mm-dd', 'border': 1, 'align': 'center'})
        cell_format = workbook.add_format({'border': 1, 'align': 'left'})
        wrap_format = workbook.add_format({'text_wrap': True, 'border': 1, 'align': 'left'})
        alt_row_format = workbook.add_format({'bg_color': '#F9F9F9', 'border': 1, 'align': 'left'})

        for client in clients:
            sheet_name = (client.name[:25] if client.name else f"Client{client.id}")
            worksheet = workbook.add_worksheet(sheet_name)
            worksheet.set_column(0, 10, 24)
            row = 0
            # Client Summary
            worksheet.merge_range(row, 0, row, 4, f"Client: {client.name}", header_format)
            row += 1
            worksheet.write_row(row, 0, [
                "Email", "Phone", "Address", "Status", "Contract Start Date", "Contract End Date", "Contract Value", "Notes", "Created At", "Updated At"
            ], subheader_format)
            row += 1
            worksheet.write_row(row, 0, [
                client.email, client.phone, client.address, client.status,
                getattr(client, 'contract_start_date', ''), getattr(client, 'contract_end_date', ''), getattr(client, 'contract_value', ''),
                client.notes, client.created_at.strftime('%Y-%m-%d') if client.created_at else '', client.updated_at.strftime('%Y-%m-%d') if client.updated_at else ''
            ], cell_format)
            row += 2
            # Services Section
            worksheet.write(row, 0, "Services", header_format)
            row += 1
            worksheet.write_row(row, 0, ["Service Name", "Stage", "Description", "Created At"], subheader_format)
            row += 1
            services = db.query(Service).filter(Service.client_id == client.id).all()
            if not services:
                worksheet.write(row, 0, "No services", cell_format)
                row += 2
            else:
                for sidx, service in enumerate(services):
                    fmt = alt_row_format if sidx % 2 == 1 else cell_format
                    worksheet.write_row(row, 0, [
                        service.name, service.stage, service.description or '',
                        service.created_at.strftime('%Y-%m-%d') if service.created_at else ''
                    ], fmt)
                    row += 1
                    # Interactions Section
                    worksheet.write(row, 1, "Interactions", subheader_format)
                    row += 1
                    worksheet.write_row(row, 1, ["Details", "Created At"], subheader_format)
                    row += 1
                    interactions = db.query(Interaction).filter(Interaction.service_id == service.id).all()
                    if not interactions:
                        worksheet.write(row, 1, "No interactions", cell_format)
                        row += 1
                    else:
                        for iidx, interaction in enumerate(interactions):
                            if iidx % 2 == 1:
                                worksheet.write_row(row, 1, [
                                    interaction.details,
                                    interaction.created_at.strftime('%Y-%m-%d') if interaction.created_at else ''
                                ], alt_row_format)
                            else:
                                worksheet.write_row(row, 1, [
                                    interaction.details,
                                    interaction.created_at.strftime('%Y-%m-%d') if interaction.created_at else ''
                                ], wrap_format)
                            row += 1
                    row += 1
            row += 2
        workbook.close()
        output.seek(0)
        headers = {
            'Content-Disposition': 'attachment; filename=client_report.xlsx'
        }
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers=headers
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Service Models ---
class ServiceBase(BaseModel):
    name: str
    description: Optional[str] = None
    stage: Optional[str] = "active"

class ServiceCreate(ServiceBase):
    pass

class ServiceUpdate(ServiceBase):
    pass

class ServiceResponse(ServiceBase):
    id: int
    client_id: int
    created_at: datetime
    class Config:
        from_attributes = True

class InteractionBase(BaseModel):
    details: str

class InteractionCreate(InteractionBase):
    pass

class InteractionResponse(InteractionBase):
    id: int
    service_id: int
    created_at: datetime
    class Config:
        from_attributes = True

from fastapi import UploadFile, File
class DocumentBase(BaseModel):
    name: str

class DocumentCreate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    service_id: int
    file_url: str
    created_at: datetime
    class Config:
        from_attributes = True

# --- Service Endpoints ---
from fastapi import status
from models import Service, Client, Interaction, ClientServiceDocument

@router.post("/clients/{client_id}/services", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
async def add_service_to_client(client_id: int, service: ServiceCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Add a new service to a client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Enforce company-based access for the client
    if current_user.company_name and db_client.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to add service to clients from other companies.")

    # Automatically assign managing_company_name to the new service
    service_data = service.model_dump()
    service_data['managing_company_name'] = current_user.company_name

    db_service = Service(**service_data, client_id=client_id)
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return ServiceResponse.from_orm(db_service)

@router.get("/clients/{client_id}/services", response_model=List[ServiceResponse])
async def list_client_services(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """List services for a specific client"""
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Enforce company-based access for the client
    if current_user.company_name and db_client.managing_company_name != current_user.company_name:
        if current_user.role != 'admin':
            raise HTTPException(status_code=403, detail="Not authorized to view services for clients from other companies.")

    # Filter services by client_id and ensure they belong to the current user's company
    services = db.query(Service).filter(Service.client_id == client_id,
                                        Service.managing_company_name == current_user.company_name).all()
    return services

@router.put("/clients/{client_id}/services/{service_id}", response_model=ServiceResponse)
async def update_client_service(client_id: int, service_id: int, service: ServiceUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    for key, value in service.dict(exclude_unset=True).items():
        setattr(db_service, key, value)
    db.commit()
    db.refresh(db_service)
    return db_service

@router.delete("/clients/{client_id}/services/{service_id}")
async def delete_client_service(client_id: int, service_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    db.delete(db_service)
    db.commit()
    return {"message": "Service deleted successfully"}

# --- Interaction Endpoints ---
@router.post("/clients/{client_id}/services/{service_id}/interactions", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
async def add_interaction_to_service(client_id: int, service_id: int, interaction: InteractionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    db_interaction = Interaction(service_id=service_id, details=interaction.details)
    db.add(db_interaction)
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.get("/clients/{client_id}/services/{service_id}/interactions", response_model=List[InteractionResponse])
async def get_service_interactions(client_id: int, service_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    interactions = db.query(Interaction).filter(Interaction.service_id == service_id).all()
    return interactions

# --- Interaction Edit/Delete Endpoints ---
@router.put("/clients/{client_id}/services/{service_id}/interactions/{interaction_id}", response_model=InteractionResponse)
async def update_interaction(client_id: int, service_id: int, interaction_id: int, interaction: InteractionCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_interaction = db.query(Interaction).filter(Interaction.id == interaction_id, Interaction.service_id == service_id).first()
    if not db_interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db_interaction.details = interaction.details
    db.commit()
    db.refresh(db_interaction)
    return db_interaction

@router.delete("/clients/{client_id}/services/{service_id}/interactions/{interaction_id}")
async def delete_interaction(client_id: int, service_id: int, interaction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_interaction = db.query(Interaction).filter(Interaction.id == interaction_id, Interaction.service_id == service_id).first()
    if not db_interaction:
        raise HTTPException(status_code=404, detail="Interaction not found")
    db.delete(db_interaction)
    db.commit()
    return {"message": "Interaction deleted successfully"}

# --- Document Endpoints ---
@router.post("/clients/{client_id}/services/{service_id}/documents", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def add_document_to_service(client_id: int, service_id: int, name: str = Form(...), file: UploadFile = File(...), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    # Ensure directory exists
    os.makedirs("uploads/client_services", exist_ok=True)
    file_location = f"uploads/client_services/{service_id}_{file.filename}"
    with open(file_location, "wb") as f:
        f.write(await file.read())
    db_document = ClientServiceDocument(service_id=service_id, name=name, file_url=file_location)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    return db_document

@router.get("/clients/{client_id}/services/{service_id}/documents", response_model=List[DocumentResponse])
async def get_service_documents(client_id: int, service_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_service = db.query(Service).filter(Service.id == service_id, Service.client_id == client_id).first()
    if not db_service:
        raise HTTPException(status_code=404, detail="Service not found")
    documents = db.query(ClientServiceDocument).filter(ClientServiceDocument.service_id == service_id).all()
    return documents

# --- Document Delete Endpoint ---
@router.delete("/clients/{client_id}/services/{service_id}/documents/{document_id}")
async def delete_document(client_id: int, service_id: int, document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_document = db.query(ClientServiceDocument).filter(ClientServiceDocument.id == document_id, ClientServiceDocument.service_id == service_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    db.delete(db_document)
    db.commit()
    return {"message": "Document deleted successfully"}

@router.get("/clients/{client_id}/report/pdf")
async def download_client_pdf_report(client_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    services = db.query(Service).filter(Service.client_id == client_id).all()
    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 60
    left_margin = 50
    right_margin = width - 50
    box_padding = 10

    # Title
    p.setFont("Helvetica-Bold", 22)
    p.drawCentredString(width / 2, y, "Client Report")
    y -= 35

    # --- Client Info Box ---
    client_box_height = 90
    p.setStrokeColorRGB(0.2, 0.4, 0.7)
    p.setLineWidth(1.2)
    p.roundRect(left_margin, y - client_box_height, right_margin - left_margin, client_box_height, 10, stroke=1, fill=0)
    p.setFont("Helvetica-Bold", 13)
    p.drawString(left_margin + box_padding, y - 20, "Client Name:")
    p.setFont("Helvetica", 13)
    p.drawString(left_margin + 110, y - 20, client.name)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(left_margin + box_padding, y - 38, "Email:")
    p.setFont("Helvetica", 11)
    p.drawString(left_margin + 60, y - 38, client.email)
    p.setFont("Helvetica-Bold", 11)
    p.drawString(left_margin + 220, y - 38, "Phone:")
    p.setFont("Helvetica", 11)
    p.drawString(left_margin + 270, y - 38, client.phone or "")
    p.setFont("Helvetica-Bold", 11)
    p.drawString(left_margin + box_padding, y - 56, "Address:")
    p.setFont("Helvetica", 11)
    p.drawString(left_margin + 60, y - 56, client.address or "")
    p.setFont("Helvetica-Bold", 11)
    p.drawString(left_margin + box_padding, y - 74, "Status:")
    p.setFont("Helvetica", 11)
    p.drawString(left_margin + 60, y - 74, client.status or "")
    p.setFont("Helvetica-Bold", 11)
    p.drawString(left_margin + 220, y - 74, "Created At:")
    p.setFont("Helvetica", 11)
    p.drawString(left_margin + 300, y - 74, client.created_at.strftime('%Y-%m-%d') if client.created_at else "")
    y -= (client_box_height + 25)

    # --- Services Section ---
    p.setFont("Helvetica-Bold", 15)
    p.drawString(left_margin, y, "Services")
    y -= 18
    if not services:
        p.setFont("Helvetica-Oblique", 12)
        p.drawString(left_margin + 20, y, "No services found.")
        y -= 20
    else:
        for service in services:
            # Service Box (REMOVE the box, just add spacing)
            service_box_height = 80
            # box_top = y  # No longer needed
            # p.setStrokeColorRGB(0.4, 0.6, 0.2)
            # p.setLineWidth(1)
            # p.roundRect(left_margin, y - service_box_height, right_margin - left_margin, service_box_height, 8, stroke=1, fill=0)
            p.setFont("Helvetica-Bold", 12)
            p.drawString(left_margin + box_padding, y - 18, "Service Name:")
            p.setFont("Helvetica", 12)
            p.drawString(left_margin + 100, y - 18, service.name)
            p.setFont("Helvetica-Bold", 11)
            p.drawString(left_margin + box_padding, y - 34, "Stage:")
            p.setFont("Helvetica", 11)
            p.drawString(left_margin + 60, y - 34, service.stage or "")
            p.setFont("Helvetica-Bold", 11)
            p.drawString(left_margin + 140, y - 34, "Created At:")
            p.setFont("Helvetica", 11)
            p.drawString(left_margin + 210, y - 34, service.created_at.strftime('%Y-%m-%d') if service.created_at else "")
            p.setFont("Helvetica-Bold", 11)
            p.drawString(left_margin + box_padding, y - 50, "Description:")
            p.setFont("Helvetica", 11)
            p.drawString(left_margin + 90, y - 50, service.description or "")
            y -= (service_box_height - 10)

            # --- Interactions List ---
            interactions = db.query(Interaction).filter(Interaction.service_id == service.id).all()
            p.setFont("Helvetica-Bold", 12)
            p.drawString(left_margin + 20, y, "Interactions:")
            y -= 16
            if not interactions:
                p.setFont("Helvetica-Oblique", 11)
                p.drawString(left_margin + 40, y, "No interactions found.")
                y -= 14
            else:
                p.setFont("Helvetica", 11)
                bullet = u"\u2022"  # Unicode bullet character
                for interaction in interactions:
                    if y < 100:
                        p.showPage()
                        y = height - 60
                    details = interaction.details or ""
                    date_str = interaction.created_at.strftime('%Y-%m-%d') if interaction.created_at else ""
                    # Compose the line: \u2022 [date] details
                    line = f"{bullet} [{date_str}] {details}"
                    # Wrap text if too long
                    max_chars_per_line = 90
                    while len(line) > max_chars_per_line:
                        split_at = line.rfind(' ', 0, max_chars_per_line)
                        if split_at == -1:
                            split_at = max_chars_per_line
                        p.drawString(left_margin + 40, y, line[:split_at])
                        line = line[split_at:].lstrip()
                        y -= 14
                    p.drawString(left_margin + 40, y, line)
                    y -= 18

            # --- Documents Table ---
            documents = db.query(ClientServiceDocument).filter(ClientServiceDocument.service_id == service.id).all()
            p.setFont("Helvetica-Bold", 12)
            p.drawString(left_margin + 20, y, "Documents:")
            y -= 16
            if not documents:
                p.setFont("Helvetica-Oblique", 11)
                p.drawString(left_margin + 40, y, "No documents found.")
                y -= 14
            else:
                # Table header
                p.setStrokeColorRGB(0.7, 0.7, 0.7)
                p.setLineWidth(0.5)
                p.rect(left_margin + 30, y - 16, right_margin - left_margin - 60, 16, stroke=1, fill=0)
                p.setFont("Helvetica-Bold", 11)
                p.drawString(left_margin + 35, y - 5, "Document Name")
                y -= 16
                for doc in documents:
                    if y < 100:
                        p.showPage()
                        y = height - 60
                    p.setFont("Helvetica", 11)
                    p.rect(left_margin + 30, y - 16, right_margin - left_margin - 60, 16, stroke=1, fill=0)
                    p.drawString(left_margin + 35, y - 5, doc.name)
                    y -= 16
            y -= 18
    p.save()
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename=client_report_{client_id}.pdf"})

# --- Document Download Endpoint ---
@router.get("/clients/{client_id}/services/{service_id}/documents/{document_id}/download")
async def download_document(client_id: int, service_id: int, document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    db_document = db.query(ClientServiceDocument).filter(ClientServiceDocument.id == document_id, ClientServiceDocument.service_id == service_id).first()
    if not db_document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not os.path.exists(db_document.file_url):
        raise HTTPException(status_code=404, detail="Document file not found")
    
    # Get file extension and determine content type
    file_extension = os.path.splitext(db_document.file_url)[1].lower()
    content_type = {
        '.pdf': 'application/pdf',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.xls': 'application/vnd.ms-excel',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    }.get(file_extension, 'application/octet-stream')
    
    return FileResponse(
        db_document.file_url,
        media_type=content_type,
        filename=db_document.name
    ) 