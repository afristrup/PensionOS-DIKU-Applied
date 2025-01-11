from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class DocumentBase(BaseModel):
    filename: str
    content: str


class DocumentCreate(DocumentBase):
    pension_plan_id: int


class Document(DocumentBase):
    id: int
    pension_plan_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PensionPlanBase(BaseModel):
    company_name: str
    plan_type: str
    description: str
    main_contact: str
    participants_count: int
    tags: str


class PensionPlanCreate(PensionPlanBase):
    pass


class PensionPlanUpdate(BaseModel):
    company_name: Optional[str] = None
    plan_type: Optional[str] = None
    description: Optional[str] = None
    main_contact: Optional[str] = None
    participants_count: Optional[int] = None
    tags: Optional[str] = None


class PensionPlan(PensionPlanBase):
    id: int
    created_at: datetime
    updated_at: datetime
    documents: List[Document] = []

    class Config:
        from_attributes = True


class SearchQuery(BaseModel):
    query: str
    limit: int = 10
    include_documents: bool = False


class SearchResult(BaseModel):
    plans: List[PensionPlan]
    total: int


class ClientBase(BaseModel):
    name: str
    email: str
    phone: str
    company: str
    status: str = 'active'


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None


class Client(ClientBase):
    id: int
    created_at: datetime
    updated_at: datetime
    pension_plans: List[int] = []

    class Config:
        from_attributes = True


class ChatMessageBase(BaseModel):
    content: str
    role: str


class ChatMessageCreate(ChatMessageBase):
    client_id: int


class ChatMessage(ChatMessageBase):
    id: int
    client_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UploadBase(BaseModel):
    filename: str
    file_type: str
    status: str = 'pending'


class UploadCreate(UploadBase):
    client_id: int


class Upload(UploadBase):
    id: int
    client_id: int
    document_id: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
