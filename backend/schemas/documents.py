from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FolderBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_confidential: bool = False
    access_key: Optional[str] = None

class FolderCreate(FolderBase):
    pass

class FolderUpdate(FolderBase):
    pass

class DocumentFolderCreate(FolderBase):
    pass

class DocumentFolderUpdate(FolderBase):
    pass

class DocumentFolderResponse(FolderBase):
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    document_count: Optional[int] = 0

    class Config:
        from_attributes = True

class DocumentBase(BaseModel):
    title: str
    description: Optional[str] = None
    folder_id: int

class DocumentCreate(DocumentBase):
    pass

class DocumentUpdate(DocumentBase):
    pass

class DocumentResponse(DocumentBase):
    id: int
    file_path: str
    file_type: str
    created_at: datetime
    uploaded_by: int
    folder: DocumentFolderResponse

    class Config:
        from_attributes = True 