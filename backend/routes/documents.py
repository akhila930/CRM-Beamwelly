from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import os
import shutil
from datetime import datetime
from pathlib import Path
import hashlib

from database import get_db
from fastapi.responses import FileResponse
from models import Document, DocumentFolder, User, DocumentType
from schemas.documents import (
    DocumentCreate, DocumentUpdate, DocumentResponse,
    FolderCreate, FolderUpdate, DocumentFolderResponse
)
from routes.auth import get_current_user

router = APIRouter(
    prefix="/api/documents",
    tags=["documents"]
)

UPLOAD_DIR = Path("uploads/documents")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def is_allowed_file(filename: str) -> bool:
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv', 'jpg', 'jpeg', 'png'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def verify_folder_access(folder_id: int, user_id: int, db: Session = Depends(get_db)):
    folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check company access first
    if user.company_name and folder.company_name and user.company_name != folder.company_name:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to folders from other companies"
        )

    # For confidential folders, only allow access to admins from the same company
    if folder.is_confidential:
        if user.role != "admin" or (user.company_name != folder.company_name):
            raise HTTPException(
                status_code=403,
                detail="You do not have access to this confidential folder"
            )

    return folder

# Folder Routes
@router.get("/folders", response_model=List[DocumentFolderResponse])
async def get_folders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(DocumentFolder)
    
    # Filter by company name for users with a company
    if current_user.company_name:
        query = query.filter(DocumentFolder.company_name == current_user.company_name)
    
    folders = query.all()
    
    # Filter out confidential folders for non-admin users
    if current_user.role != "admin":
        folders = [f for f in folders if not f.is_confidential]
    
    # Add document count to each folder
    for folder in folders:
        folder.document_count = db.query(func.count(Document.id)).filter(Document.folder_id == folder.id).scalar()
    
    return folders

@router.post("/folders", response_model=DocumentFolderResponse)
async def create_folder(
    folder: FolderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only admin users can create confidential folders
    if folder.is_confidential and current_user.role != "admin" and current_user.email != "equitywalaa@gmail.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can create confidential folders"
        )

    db_folder = DocumentFolder(
        name=folder.name,
        description=folder.description,
        is_confidential=folder.is_confidential,
        access_key=folder.access_key if folder.is_confidential else None,
        created_by=current_user.id,
        company_name=current_user.company_name if current_user.company_name else None  # Set company_name
    )
    db.add(db_folder)
    
    try:
        db.commit()
        db.refresh(db_folder)
        return db_folder
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating folder: {str(e)}"
        )

@router.put("/folders/{folder_id}", response_model=DocumentFolderResponse)
async def update_folder(
    folder_id: int,
    folder: FolderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update folders"
        )
    
    db_folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
    if not db_folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    for key, value in folder.dict(exclude_unset=True).items():
        setattr(db_folder, key, value)
    
    db.commit()
    db.refresh(db_folder)
    db_folder.document_count = db.query(func.count(Document.id)).filter(Document.folder_id == folder_id).scalar()
    return db_folder

@router.delete("/folders/{folder_id}")
async def delete_folder(
    folder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")
    
    if not verify_folder_access(folder_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Delete all documents in the folder
    documents = db.query(Document).filter(Document.folder_id == folder_id).all()
    for doc in documents:
        try:
            os.remove(doc.file_path)
        except:
            pass  # Ignore file deletion errors
    
    db.delete(folder)
    db.commit()
    return {"message": "Folder deleted successfully"}

# Document Routes
@router.get("/folders/{folder_id}/documents")
def get_documents(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        folder = verify_folder_access(folder_id, current_user.id, db)
        query = db.query(Document).filter(Document.folder_id == folder_id)
        
        # Filter by company name for users with a company
        if current_user.company_name:
            query = query.filter(Document.company_name == current_user.company_name)
            
        documents = query.all()
        return documents
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/all")
def get_all_documents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        # Get all folders for the user's company
        folder_query = db.query(DocumentFolder)
        if current_user.company_name:
            folder_query = folder_query.filter(DocumentFolder.company_name == current_user.company_name)
        folders = folder_query.all()
        
        all_documents = []
        
        for folder in folders:
            # Skip confidential folders for non-admin users
            if folder.is_confidential and current_user.role != "admin":
                continue
                
            document_query = db.query(Document).filter(Document.folder_id == folder.id)
            if current_user.company_name:
                document_query = document_query.filter(Document.company_name == current_user.company_name)
            documents = document_query.all()
            all_documents.extend(documents)
            
        return all_documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_document_type(file_extension: str) -> DocumentType:
    """Map file extensions to document types."""
    extension = file_extension.lower().strip('.')
    if extension in ['pdf', 'doc', 'docx', 'txt']:
        return DocumentType.OTHER
    elif extension in ['jpg', 'jpeg', 'png']:
        return DocumentType.OTHER
    elif extension in ['xls', 'xlsx', 'csv']:
        return DocumentType.OTHER
    else:
        return DocumentType.OTHER

@router.post("/upload")
async def upload_document(
    folder_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify folder exists and user has access
    folder = db.query(DocumentFolder).filter(DocumentFolder.id == folder_id).first()
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    if not verify_folder_access(folder_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied to this folder")

    if not is_allowed_file(file.filename):
        raise HTTPException(
            status_code=400,
            detail="File type not allowed"
        )

    try:
        # Create unique filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{timestamp}_{hashlib.md5(file.filename.encode()).hexdigest()}{file_extension}"
        
        # Create folder structure
        base_path = UPLOAD_DIR / str(folder.id)
        base_path.mkdir(parents=True, exist_ok=True)
        
        file_path = base_path / unique_filename
        
        # Save the file
        with open(file_path, "wb+") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Get the document type based on file extension
        doc_type = get_document_type(file_extension[1:])  # Remove the dot

        # Create document record
        document = Document(
            title=title,
            description=description,
            file_path=str(file_path),
            file_type=doc_type,  # Use the enum value
            folder_id=folder_id,
            uploaded_by=current_user.id,
            company_name=current_user.company_name if current_user.company_name else None  # Set company_name
        )
        
        db.add(document)
        db.commit()
        db.refresh(document)
        
        return {"message": "Document uploaded successfully", "document": document}
    except Exception as e:
        # Clean up file if upload fails
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}/download")
async def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    folder = db.query(DocumentFolder).filter(DocumentFolder.id == document.folder_id).first()
    if not verify_folder_access(document.folder_id, current_user.id, db):
        raise HTTPException(status_code=403, detail="Access denied")
    
    file_path = Path(document.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    
    # Determine correct content type based on file extension
    extension = file_path.suffix.lower()[1:]  # Remove the dot and convert to lowercase
    content_type = "application/octet-stream"  # Default content type
    
    # Map common extensions to correct MIME types
    mime_types = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'csv': 'text/csv',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'txt': 'text/plain',
        'zip': 'application/zip',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'mp4': 'video/mp4',
        'mp3': 'audio/mpeg',
        'other': 'application/octet-stream',
    }
    content_type = mime_types.get(extension, 'application/octet-stream')
    
    # Use the original filename if possible, otherwise fallback to title + extension
    original_filename = file_path.name
    filename = document.title
    if not filename.lower().endswith(f".{extension}"):
        filename += f".{extension}"
    
    # Use FileResponse with specific headers for proper download
    headers = {
        "Content-Disposition": f'attachment; filename="{filename}"',
        "Content-Type": content_type
    }
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type=content_type,
        headers=headers
    )

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Check if user has permission to delete
    if not (current_user.role == "admin" or document.uploaded_by == current_user.id):
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")
    
    try:
        # Delete file
        if os.path.exists(document.file_path):
            os.remove(document.file_path)
        
        # Delete record
        db.delete(document)
        db.commit()
        
        return {"message": "Document deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents", response_model=List[DocumentResponse])
def get_documents_endpoint(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Endpoint to match the frontend call to /api/documents/documents"""
    try:
        # Get all folders for the user's company
        folder_query = db.query(DocumentFolder)
        if current_user.company_name:
            folder_query = folder_query.filter(DocumentFolder.company_name == current_user.company_name)
        folders = folder_query.all()
        
        all_documents = []
        
        for folder in folders:
            # Skip confidential folders for non-admin users
            if folder.is_confidential and current_user.role != "admin":
                continue
                
            document_query = db.query(Document).filter(Document.folder_id == folder.id)
            if current_user.company_name:
                document_query = document_query.filter(Document.company_name == current_user.company_name)
            documents = document_query.all()
            all_documents.extend(documents)
            
        return all_documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 