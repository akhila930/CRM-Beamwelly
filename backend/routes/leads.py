from fastapi import APIRouter, Depends, HTTPException, status, Response, File, UploadFile
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from database import get_db
from models import Lead, User, LeadStatus, Employee, Client, Company
from routes.auth import get_current_user
from pydantic import BaseModel, Field
from datetime import datetime
import logging
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
import csv
from io import StringIO, BytesIO
from fastapi.responses import StreamingResponse
from schemas.leads import LeadCreate, LeadUpdate, Lead as LeadSchema
import pandas as pd
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/leads",
    tags=["leads"]
)

class LeadResponse(BaseModel):
    id: int
    name: str
    lead_employer_company_name: Optional[str] = None
    email: str
    mobile_number: Optional[str] = None
    profession: Optional[str] = None
    qualification: Optional[str] = None
    income: Optional[float] = None
    date_of_investment: Optional[str] = None
    investment_type: Optional[str] = None
    reference_name: Optional[str] = None
    reference_email: Optional[str] = None
    reference_contact: Optional[str] = None
    relationship_manager: Optional[str] = None
    interaction_type: Optional[str] = None
    source: Optional[str] = None
    status: LeadStatus
    notes: Optional[str] = None
    expected_value: Optional[float] = None
    assigned_to: Optional[int] = None
    client_id: Optional[int] = None
    managing_company_name: str
    created_at: datetime
    updated_at: datetime

    assigned_employee: Optional[dict] = None
    client: Optional[dict] = None

    class Config:
        from_attributes = True
        use_enum_values = True

@router.get("/", response_model=List[LeadResponse])
async def get_leads(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        leads = db.query(Lead).options(
            joinedload(Lead.assigned_employee),
            joinedload(Lead.client)
        ).filter(Lead.managing_company_name == current_user.company_name).all()
        
        response_data = []
        for lead in leads:
            lead_data = {
                "id": lead.id,
                "name": lead.name,
                "lead_employer_company_name": lead.lead_employer_company_name,
                "email": lead.email,
                "mobile_number": lead.mobile_number,
                "profession": lead.profession,
                "qualification": lead.qualification,
                "income": float(lead.income) if lead.income else None,
                "date_of_investment": lead.date_of_investment.isoformat() if lead.date_of_investment else None,
                "investment_type": lead.investment_type,
                "reference_name": lead.reference_name,
                "reference_email": lead.reference_email,
                "reference_contact": lead.reference_contact,
                "relationship_manager": lead.relationship_manager,
                "interaction_type": lead.interaction_type,
                "source": lead.source,
                "status": lead.status.value if lead.status else None,
                "notes": lead.notes,
                "expected_value": float(lead.expected_value) if lead.expected_value else None,
                "assigned_to": lead.assigned_to,
                "client_id": lead.client_id,
                "managing_company_name": lead.managing_company_name,
                "created_at": lead.created_at.isoformat() if lead.created_at else None,
                "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
                "assigned_employee": {
                    "id": lead.assigned_employee.id,
                    "name": lead.assigned_employee.name,
                    "email": lead.assigned_employee.email,
                    "position": lead.assigned_employee.position
                } if lead.assigned_employee else None,
                "client": {
                    "id": lead.client.id,
                    "name": lead.client.name,
                    "email": lead.client.email,
                    "status": lead.client.status.value if lead.client.status else None
                } if lead.client else None
            }
            response_data.append(lead_data)
        
        return response_data
    except Exception as e:
        logger.error(f"Error fetching leads: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching leads: {str(e)}"
        )

@router.get("/template")
async def get_lead_template(
    current_user: User = Depends(get_current_user)
):
    try:
        df = pd.DataFrame(columns=[
            "Name", "Email", "Mobile Number", "Company", "Profession", "Qualification", "Income",
            "Date of Investment", "Investment Type", "Reference Name", "Reference Email",
            "Reference Contact", "Relationship Manager", "Interaction Type", "Source", "Status",
            "Notes", "Expected Value", "Assigned To (Employee ID)", "Client ID"
        ])
        
        df.loc[0] = [
            "John Doe",
            "john@example.com",
            "+1234567890",
            "Example Corp",
            "Software Engineer",
            "B.Tech",
            "50000",
            "2024-12-31",
            "equity",
            "Jane Smith",
            "jane@example.com",
            "+1987654321",
            "Manager A",
            "call",
            "Website",
            "new",
            "Interested in our services.",
            "10000",
            "",
            ""
        ]
        
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False)
        
        output.seek(0)
        
        headers = {
            'Content-Disposition': 'attachment; filename="leads_template.xlsx"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        
        return Response(
            content=output.getvalue(),
            headers=headers
        )
    except Exception as e:
        logger.error(f"Error generating template: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating template: {str(e)}"
        )

@router.post("/", response_model=LeadResponse)
async def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Convert lead_data to a dictionary, ensuring keys match the SQLAlchemy model attributes
        lead_dict = lead_data.dict(by_alias=False)
        # Set managing_company_name from the current user
        lead_dict["managing_company_name"] = current_user.company_name

        # Create new lead
        db_lead = Lead(**lead_dict)
        
        db.add(db_lead)
        db.commit()
        db.refresh(db_lead)
        
        # Load related data for response
        response_data = {
            "id": db_lead.id,
            "name": db_lead.name,
            "lead_employer_company_name": db_lead.lead_employer_company_name,
            "email": db_lead.email,
            "mobile_number": db_lead.mobile_number,
            "profession": db_lead.profession,
            "qualification": db_lead.qualification,
            "income": float(db_lead.income) if db_lead.income else None,
            "date_of_investment": db_lead.date_of_investment.isoformat() if db_lead.date_of_investment else None,
            "investment_type": db_lead.investment_type,
            "reference_name": db_lead.reference_name,
            "reference_email": db_lead.reference_email,
            "reference_contact": db_lead.reference_contact,
            "relationship_manager": db_lead.relationship_manager,
            "interaction_type": db_lead.interaction_type,
            "source": db_lead.source,
            "status": db_lead.status.value if db_lead.status else None,
            "notes": db_lead.notes,
            "expected_value": float(db_lead.expected_value) if db_lead.expected_value else None,
            "assigned_to": db_lead.assigned_to,
            "client_id": db_lead.client_id,
            "managing_company_name": db_lead.managing_company_name,
            "created_at": db_lead.created_at.isoformat() if db_lead.created_at else None,
            "updated_at": db_lead.updated_at.isoformat() if db_lead.updated_at else None,
            "assigned_employee": {
                "id": db_lead.assigned_employee.id,
                "name": db_lead.assigned_employee.name,
                "email": db_lead.assigned_employee.email,
                "position": db_lead.assigned_employee.position
            } if db_lead.assigned_employee else None,
            "client": {
                "id": db_lead.client.id,
                "name": db_lead.client.name,
                "email": db_lead.client.email,
                "status": db_lead.client.status.value if db_lead.client.status else None
            } if db_lead.client else None
        }
        
        return response_data
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error creating lead: {str(e)}")
        if "foreign key" in str(e).lower() and "employees" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with ID {lead_dict['assigned_to']} not found. Please ensure the assigned employee exists."
            )
        if "foreign key" in str(e).lower() and "clients" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Client with ID {lead_dict['client_id']} not found. Please ensure the client exists."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database integrity error: {str(e)}"
        )
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating lead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating lead: {str(e)}"
        )

@router.get("/{lead_id}", response_model=LeadResponse)
async def get_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    lead = db.query(Lead).options(
        joinedload(Lead.assigned_employee),
        joinedload(Lead.client)
    ).filter(Lead.id == lead_id, Lead.managing_company_name == current_user.company_name).first()
    
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found or not authorized")
    
    response_data = {
        "id": lead.id,
        "name": lead.name,
        "lead_employer_company_name": lead.lead_employer_company_name,
        "email": lead.email,
        "mobile_number": lead.mobile_number,
        "profession": lead.profession,
        "qualification": lead.qualification,
        "income": float(lead.income) if lead.income else None,
        "date_of_investment": lead.date_of_investment.isoformat() if lead.date_of_investment else None,
        "investment_type": lead.investment_type,
        "reference_name": lead.reference_name,
        "reference_email": lead.reference_email,
        "reference_contact": lead.reference_contact,
        "relationship_manager": lead.relationship_manager,
        "interaction_type": lead.interaction_type,
        "source": lead.source,
        "status": lead.status.value if lead.status else None,
        "notes": lead.notes,
        "expected_value": float(lead.expected_value) if lead.expected_value else None,
        "assigned_to": lead.assigned_to,
        "client_id": lead.client_id,
        "managing_company_name": lead.managing_company_name,
        "created_at": lead.created_at.isoformat() if lead.created_at else None,
        "updated_at": lead.updated_at.isoformat() if lead.updated_at else None,
        "assigned_employee": {
            "id": lead.assigned_employee.id,
            "name": lead.assigned_employee.name,
            "email": lead.assigned_employee.email,
            "position": lead.assigned_employee.position
        } if lead.assigned_employee else None,
        "client": {
            "id": lead.client.id,
            "name": lead.client.name,
            "email": lead.client.email,
            "status": lead.client.status.value if lead.client.status else None
        } if lead.client else None
    }
    return response_data

@router.put("/{lead_id}", response_model=LeadResponse)
async def update_lead(
    lead_id: int,
    lead_update: LeadUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.managing_company_name == current_user.company_name
        ).first()
        if not db_lead:
            raise HTTPException(status_code=404, detail="Lead not found or not authorized")
        
        update_data = lead_update.dict(exclude_unset=True, by_alias=False)
        logger.info(f"Update data for lead {lead_id}: {update_data}") # Log update data

        if "assigned_to" in update_data and update_data["assigned_to"] is not None:
            assigned_employee = db.query(Employee).filter(Employee.id == update_data["assigned_to"]).first()
            if not assigned_employee:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Employee with ID {update_data['assigned_to']} not found"
                )

        if "client_id" in update_data and update_data["client_id"] is not None:
            client = db.query(Client).filter(Client.id == update_data["client_id"]).first()
            if not client:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Client with ID {update_data['client_id']} not found"
                )
        
        if "company" in update_data:
            update_data["lead_employer_company_name"] = update_data.pop("company")
            
        if "managing_company_name" in update_data:
            del update_data["managing_company_name"]

        for key, value in update_data.items():
            if hasattr(db_lead, key):
                setattr(db_lead, key, value)
        
        db.commit()
        db.refresh(db_lead)
        
        response_data = {
            "id": db_lead.id,
            "name": db_lead.name,
            "lead_employer_company_name": db_lead.lead_employer_company_name,
            "email": db_lead.email,
            "mobile_number": db_lead.mobile_number,
            "profession": db_lead.profession,
            "qualification": db_lead.qualification,
            "income": float(db_lead.income) if db_lead.income else None,
            "date_of_investment": db_lead.date_of_investment.isoformat() if db_lead.date_of_investment else None,
            "investment_type": db_lead.investment_type,
            "reference_name": db_lead.reference_name,
            "reference_email": db_lead.reference_email,
            "reference_contact": db_lead.reference_contact,
            "relationship_manager": db_lead.relationship_manager,
            "interaction_type": db_lead.interaction_type,
            "source": db_lead.source,
            "status": db_lead.status.value if db_lead.status else None,
            "notes": db_lead.notes,
            "expected_value": float(db_lead.expected_value) if db_lead.expected_value else None,
            "assigned_to": db_lead.assigned_to,
            "client_id": db_lead.client_id,
            "managing_company_name": db_lead.managing_company_name,
            "created_at": db_lead.created_at.isoformat() if db_lead.created_at else None,
            "updated_at": db_lead.updated_at.isoformat() if db_lead.updated_at else None,
            "assigned_employee": {
                "id": db_lead.assigned_employee.id,
                "name": db_lead.assigned_employee.name,
                "email": db_lead.assigned_employee.email,
                "position": db_lead.assigned_employee.position
            } if db_lead.assigned_employee else None,
            "client": {
                "id": db_lead.client.id,
                "name": db_lead.client.name,
                "email": db_lead.client.email,
                "status": db_lead.client.status.value if db_lead.client.status else None
            } if db_lead.client else None
        }
        
        return response_data
    except IntegrityError as e:
        db.rollback()
        logger.error(f"Integrity error updating lead: {str(e)}")
        if "foreign key" in str(e).lower() and "employees" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"One or more 'Assigned To (Employee ID)' values in the uploaded file are invalid. Please ensure all employee IDs exist."
            )
        if "foreign key" in str(e).lower() and "clients" in str(e).lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"One or more 'Client ID' values in the uploaded file are invalid. Please ensure all client IDs exist."
            )
        raise HTTPException(status_code=500, detail=f"Database error during lead upload: {str(e)}")
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating lead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating lead: {str(e)}"
        )

@router.delete("/{lead_id}")
async def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        db_lead = db.query(Lead).filter(
            Lead.id == lead_id,
            Lead.managing_company_name == current_user.company_name
        ).first()
        if not db_lead:
            raise HTTPException(status_code=404, detail="Lead not found or not authorized")
        
        db.delete(db_lead)
        db.commit()
        return {"message": "Lead deleted successfully"}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting lead: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting lead: {str(e)}"
        )

@router.post("/upload")
async def upload_leads(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not file.filename.endswith(('.csv', '.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are allowed")
    
    try:
        logger.info(f"Processing file upload: {file.filename}")
        content = await file.read()
        
        try:
            file_obj = BytesIO(content)
            
            if file.filename.endswith('.csv'):
                content_str = content.decode('utf-8')
                df = pd.read_csv(StringIO(content_str))
            elif file.filename.endswith('.xlsx'):
                df = pd.read_excel(file_obj, engine='openpyxl')
            elif file.filename.endswith('.xls'):
                df = pd.read_excel(file_obj, engine='xlrd')
            else:
                raise HTTPException(status_code=400, detail="Unsupported file type")
            
            logger.info(f"Successfully read file with columns: {df.columns.tolist()}")
            
        except Exception as e:
            logger.error(f"Error reading file: {str(e)}")
            logger.error(traceback.format_exc())
            raise HTTPException(status_code=400, detail=f"Error reading file: {str(e)}")
        
        # Check required columns (updated)
        required_columns = ['Name', 'Email', 'Company'] # 'Company' for lead_employer_company_name
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns in uploaded file: {', '.join(missing_columns)}. Please download the latest template."
            )
        
        # Process each row
        leads = []
        errors = []
        for index, row in df.iterrows():
            try:
                # Validate required fields
                if pd.isna(row['Name']) or pd.isna(row['Email']) or pd.isna(row['Company']):
                    errors.append(f"Row {index + 2}: Missing required fields (Name, Email, Company).")
                    continue
                
                # Get status from row or default to 'new'
                status = str(row['Status']).lower() if 'Status' in df.columns and not pd.isna(row['Status']) else 'new'
                try:
                    status_enum = LeadStatus[status.upper()]
                except KeyError:
                    status_enum = LeadStatus.NEW
                
                # Create lead object
                lead_data = {
                    'name': str(row['Name']).strip(),
                    'lead_employer_company_name': str(row['Company']).strip(),  # Map Company to lead_employer_company_name
                    'email': str(row['Email']).strip(),
                    'mobile_number': str(row['Mobile Number']).strip() if 'Mobile Number' in df.columns and not pd.isna(row['Mobile Number']) else None,
                    'profession': str(row['Profession']).strip() if 'Profession' in df.columns and not pd.isna(row['Profession']) else None,
                    'qualification': str(row['Qualification']).strip() if 'Qualification' in df.columns and not pd.isna(row['Qualification']) else None,
                    'income': float(row['Income']) if 'Income' in df.columns and not pd.isna(row['Income']) else None,
                    'date_of_investment': pd.to_datetime(row['Date of Investment']).date() if 'Date of Investment' in df.columns and not pd.isna(row['Date of Investment']) else None,
                    'investment_type': str(row['Investment Type']).strip() if 'Investment Type' in df.columns and not pd.isna(row['Investment Type']) else None,
                    'reference_name': str(row['Reference Name']).strip() if 'Reference Name' in df.columns and not pd.isna(row['Reference Name']) else None,
                    'reference_email': str(row['Reference Email']).strip() if 'Reference Email' in df.columns and not pd.isna(row['Reference Email']) else None,
                    'reference_contact': str(row['Reference Contact']).strip() if 'Reference Contact' in df.columns and not pd.isna(row['Reference Contact']) else None,
                    'relationship_manager': str(row['Relationship Manager']).strip() if 'Relationship Manager' in df.columns and not pd.isna(row['Relationship Manager']) else None,
                    'interaction_type': str(row['Interaction Type']).strip() if 'Interaction Type' in df.columns and not pd.isna(row['Interaction Type']) else None,
                    'source': str(row['Source']).strip() if 'Source' in df.columns and not pd.isna(row['Source']) else None,
                    'status': status_enum,
                    'notes': str(row['Notes']).strip() if 'Notes' in df.columns and not pd.isna(row['Notes']) else None,
                    'expected_value': float(row['Expected Value']) if 'Expected Value' in df.columns and not pd.isna(row['Expected Value']) else None,
                    'assigned_to': int(row['Assigned To (Employee ID)']) if 'Assigned To (Employee ID)' in df.columns and not pd.isna(row['Assigned To (Employee ID)']) else None,
                    'client_id': int(row['Client ID']) if 'Client ID' in df.columns and not pd.isna(row['Client ID']) else None,
                    'managing_company_name': current_user.company_name  # Set managing company from current user
                }
                
                lead = Lead(**lead_data)
                leads.append(lead)
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        if not leads and errors:
            raise HTTPException(status_code=400, detail={"message": "No valid leads found", "errors": errors})
        
        try:
            db.add_all(leads)
            db.commit()
        except IntegrityError as e:
            db.rollback()
            logger.error(f"Database integrity error during lead upload: {str(e)}")
            if "foreign key" in str(e).lower() and "employees" in str(e).lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"One or more 'Assigned To (Employee ID)' values in the uploaded file are invalid. Please ensure all employee IDs exist."
                )
            if "foreign key" in str(e).lower() and "clients" in str(e).lower():
                raise HTTPException(
                    status_code=400,
                    detail=f"One or more 'Client ID' values in the uploaded file are invalid. Please ensure all client IDs exist."
                )
            raise HTTPException(status_code=500, detail=f"Database error during lead upload: {str(e)}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving uploaded leads: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Error saving uploaded leads: {str(e)}")
        
        return {
            "message": f"Successfully uploaded {len(leads)} leads",
            "errors": errors if errors else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading leads: {str(e)}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e)) 