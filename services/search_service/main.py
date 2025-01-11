from fastapi import FastAPI, HTTPException, Depends, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import numpy as np
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .database import get_db, engine, database
from .models import Base, PensionPlan, Document, SearchQuery, SearchResponse, ProcessResponse, Client, ChatMessage, Upload
from .schemas import PensionPlanCreate, PensionPlan as PensionPlanSchema
from .schemas import PensionPlanUpdate, SearchQuery, SearchResult, DocumentCreate, Document as DocumentSchema
from .schemas import ClientCreate, ClientUpdate, Client as ClientSchema
from .schemas import ChatMessageCreate, ChatMessage as ChatMessageSchema, UploadCreate, Upload as UploadSchema
from .embeddings import embeddings_service
from .document_processor import document_processor
from .llm_service import llm_service
from .graph_service import graph_service

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PensionOS Search Service")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GraphQuery(BaseModel):
    query: str

class GraphDocuments(BaseModel):
    documents: List[Dict[str, Any]]

class ChatQuery(BaseModel):
    query: str
    client_id: int
    include_history: bool = True
    max_tokens: int = 500
    temperature: float = 0.7

@app.lifespan("startup")
async def startup():
    await database.connect()

@app.lifespan("shutdown")
async def shutdown():
    await database.disconnect()

# Document Operations
@app.post("/documents/", response_model=DocumentSchema)
async def upload_document(
    pension_plan_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Check if pension plan exists
    db_plan = db.query(PensionPlan).filter(PensionPlan.id == pension_plan_id).first()
    if db_plan is None:
        raise HTTPException(status_code=404, detail="Pension plan not found")
    
    try:
        # Process PDF file
        content, embedding, analysis = await document_processor.process_pdf(file.file)
        
        # Create document record
        db_document = Document(
            pension_plan_id=pension_plan_id,
            filename=file.filename,
            content=content,
            embedding=embedding,
            summary=analysis["summary"],
            key_information=analysis["key_information"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        return db_document
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/documents/{document_id}", response_model=DocumentSchema)
async def read_document(document_id: int, db: Session = Depends(get_db)):
    db_document = db.query(Document).filter(Document.id == document_id).first()
    if db_document is None:
        raise HTTPException(status_code=404, detail="Document not found")
    return db_document

# CRUD Operations
@app.post("/pension-plans/", response_model=PensionPlanSchema)
async def create_pension_plan(plan: PensionPlanCreate, db: Session = Depends(get_db)):
    try:
        # Generate embedding for the plan description
        embedding = embeddings_service.get_embedding(plan.description)
        
        db_plan = PensionPlan(
            **plan.dict(),
            embedding=embedding,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_plan)
        db.commit()
        db.refresh(db_plan)
        return db_plan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/pension-plans/{plan_id}", response_model=PensionPlanSchema)
async def read_pension_plan(plan_id: int, db: Session = Depends(get_db)):
    db_plan = db.query(PensionPlan).filter(PensionPlan.id == plan_id).first()
    if db_plan is None:
        raise HTTPException(status_code=404, detail="Pension plan not found")
    return db_plan

@app.get("/pension-plans/", response_model=List[PensionPlanSchema])
async def list_pension_plans(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    plans = db.query(PensionPlan).offset(skip).limit(limit).all()
    return plans

@app.put("/pension-plans/{plan_id}", response_model=PensionPlanSchema)
async def update_pension_plan(
    plan_id: int,
    plan_update: PensionPlanUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_plan = db.query(PensionPlan).filter(PensionPlan.id == plan_id).first()
        if db_plan is None:
            raise HTTPException(status_code=404, detail="Pension plan not found")
        
        update_data = plan_update.dict(exclude_unset=True)
        
        # If description is updated, update the embedding
        if "description" in update_data:
            update_data["embedding"] = embeddings_service.get_embedding(update_data["description"])
        
        for key, value in update_data.items():
            setattr(db_plan, key, value)
        
        db_plan.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_plan)
        return db_plan
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/pension-plans/{plan_id}")
async def delete_pension_plan(plan_id: int, db: Session = Depends(get_db)):
    try:
        db_plan = db.query(PensionPlan).filter(PensionPlan.id == plan_id).first()
        if db_plan is None:
            raise HTTPException(status_code=404, detail="Pension plan not found")
        
        # Delete associated documents first
        for doc in db_plan.documents:
            db.delete(doc)
        
        db.delete(db_plan)
        db.commit()
        return {"message": "Pension plan and associated documents deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Search Endpoints
@app.post("/search/", response_model=SearchResult)
async def search_pension_plans(
    query: SearchQuery,
    db: Session = Depends(get_db)
):
    # Get query embedding
    query_embedding = embeddings_service.get_embedding(query.query)
    
    # Get all plans and their embeddings
    plans = db.query(PensionPlan).all()
    if not plans:
        return SearchResult(plans=[], total=0)
    
    # Get all documents if requested
    if query.include_documents:
        # Get all documents and their embeddings
        documents = db.query(Document).all()
        if documents:
            doc_embeddings = [doc.embedding for doc in documents]
            doc_similarities = embeddings_service.compute_similarity(query_embedding, doc_embeddings)
            
            # Group documents by pension plan and add to relevant plans
            for doc, similarity in zip(documents, doc_similarities):
                if similarity > 0.7:  # Only include highly relevant documents
                    for plan in plans:
                        if plan.id == doc.pension_plan_id:
                            plan.documents.append(doc)
    
    # Compute similarities for plans
    plan_embeddings = [plan.embedding for plan in plans]
    similarities = embeddings_service.compute_similarity(query_embedding, plan_embeddings)
    
    # Sort plans by similarity
    plans_with_scores = list(zip(plans, similarities))
    plans_with_scores.sort(key=lambda x: x[1], reverse=True)
    
    # Return top-k results
    top_k_plans = [plan for plan, _ in plans_with_scores[:query.limit]]
    
    return SearchResult(
        plans=top_k_plans,
        total=len(top_k_plans)
    )

@app.post("/process", response_model=ProcessResponse)
async def process_document(file: UploadFile = File(...)):
    try:
        result = await document_processor.process(file)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search", response_model=SearchResponse)
async def search(query: SearchQuery):
    try:
        # Get query embedding
        query_embedding = embeddings_service.get_embedding(query.query)
        
        # Search for similar documents
        results = document_processor.search(query_embedding)
        
        return SearchResponse(results=results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
async def chat(query: ChatQuery, db: Session = Depends(get_db)):
    """Process a chat message and return an AI response."""
    try:
        # Get chat history for context
        chat_history = []
        if query.include_history:
            messages = (
                db.query(ChatMessage)
                .filter(ChatMessage.client_id == query.client_id)
                .order_by(ChatMessage.created_at.desc())
                .limit(10)  # Get last 10 messages
                .all()
            )
            chat_history = [
                f"{'User' if msg.role == 'user' else 'Assistant'}: {msg.content}"
                for msg in reversed(messages)  # Reverse to get chronological order
            ]

        # Get client's pension plans
        client = db.query(Client).filter(Client.id == query.client_id).first()
        if not client:
            raise HTTPException(status_code=404, detail="Client not found")

        # Get relevant context from documents and pension plans
        context = await get_chat_context(query.query, db, client)
        
        # Build the complete context
        full_context = ""
        if context:
            full_context += f"Relevant Information:\n{context}\n\n"
        if chat_history:
            full_context += f"Recent Conversation:\n" + "\n".join(chat_history)
        
        # Process query with context
        response = await llm_service.process_query(
            query=query.query,
            context=full_context if full_context else None,
            max_tokens=query.max_tokens,
            temperature=query.temperature
        )
        
        return {
            "response": response,
            "context_used": bool(full_context)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

async def get_chat_context(query: str, db: Session, client: Client) -> str:
    """Get relevant context for the chat query."""
    try:
        # Get query embedding
        query_embedding = embeddings_service.get_embedding(query)
        
        relevant_docs = []
        relevant_plans = []

        # Get client's pension plans
        if client.pension_plans:
            # Search in documents related to client's pension plans
            for plan in client.pension_plans:
                # Get documents for this plan
                if plan.documents:
                    doc_embeddings = [doc.embedding for doc in plan.documents]
                    doc_similarities = embeddings_service.compute_similarity(query_embedding, doc_embeddings)
                    
                    # Get relevant documents
                    for doc, similarity in zip(plan.documents, doc_similarities):
                        if similarity > 0.7:  # Only include highly relevant documents
                            relevant_docs.append(
                                f"Document '{doc.filename}' from plan '{plan.company_name}':\n"
                                f"Summary: {doc.summary}\n"
                                f"Key Information: {doc.key_information}"
                            )
                
                # Add plan information if relevant
                plan_embedding = embeddings_service.get_embedding(plan.description)
                plan_similarity = embeddings_service.compute_similarity(query_embedding, [plan_embedding])[0]
                if plan_similarity > 0.7:
                    relevant_plans.append(
                        f"Pension Plan: {plan.company_name}\n"
                        f"Type: {plan.plan_type}\n"
                        f"Description: {plan.description}\n"
                        f"Contact: {plan.main_contact}\n"
                        f"Participants: {plan.participants_count}"
                    )
        
        # Combine context
        context_parts = []
        if relevant_plans:
            context_parts.append("Relevant Pension Plans:\n" + "\n\n".join(relevant_plans))
        if relevant_docs:
            context_parts.append("Relevant Documents:\n" + "\n\n".join(relevant_docs))
        
        return "\n\n".join(context_parts)
    except Exception as e:
        print(f"Error getting chat context: {str(e)}")
        return ""

@app.post("/graph/process")
async def process_graph_documents(documents: GraphDocuments):
    """Process documents and create a knowledge graph."""
    try:
        result = await graph_service.process_documents(documents.documents)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/graph/query")
async def query_graph(query: GraphQuery):
    """Query the knowledge graph."""
    try:
        result = await graph_service.query_graph(query.query)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Client Operations
@app.post("/clients/", response_model=ClientSchema)
async def create_client(client: ClientCreate, db: Session = Depends(get_db)):
    try:
        db_client = Client(
            **client.dict(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_client)
        db.commit()
        db.refresh(db_client)
        return db_client
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/clients/{client_id}", response_model=ClientSchema)
async def read_client(client_id: int, db: Session = Depends(get_db)):
    db_client = db.query(Client).filter(Client.id == client_id).first()
    if db_client is None:
        raise HTTPException(status_code=404, detail="Client not found")
    return db_client

@app.get("/clients/", response_model=List[ClientSchema])
async def list_clients(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    clients = db.query(Client).offset(skip).limit(limit).all()
    return clients

@app.patch("/clients/{client_id}", response_model=ClientSchema)
async def update_client(
    client_id: int,
    client_update: ClientUpdate,
    db: Session = Depends(get_db)
):
    try:
        db_client = db.query(Client).filter(Client.id == client_id).first()
        if db_client is None:
            raise HTTPException(status_code=404, detail="Client not found")
        
        update_data = client_update.dict(exclude_unset=True)
        
        for key, value in update_data.items():
            setattr(db_client, key, value)
        
        db_client.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_client)
        return db_client
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clients/{client_id}")
async def delete_client(client_id: int, db: Session = Depends(get_db)):
    try:
        db_client = db.query(Client).filter(Client.id == client_id).first()
        if db_client is None:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Delete associated chat messages and uploads
        for msg in db_client.chat_messages:
            db.delete(msg)
        for upload in db_client.uploads:
            db.delete(upload)
        
        # Remove client from pension plans but don't delete the plans
        db_client.pension_plans = []
        
        db.delete(db_client)
        db.commit()
        return {"message": "Client and associated data deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Association endpoints for client-pension plan relationships
@app.post("/clients/{client_id}/pension-plans/{plan_id}")
async def associate_client_with_plan(
    client_id: int,
    plan_id: int,
    db: Session = Depends(get_db)
):
    try:
        db_client = db.query(Client).filter(Client.id == client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client not found")
            
        db_plan = db.query(PensionPlan).filter(PensionPlan.id == plan_id).first()
        if not db_plan:
            raise HTTPException(status_code=404, detail="Pension plan not found")
        
        if db_plan not in db_client.pension_plans:
            db_client.pension_plans.append(db_plan)
            db.commit()
        
        return {"message": "Client associated with pension plan successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/clients/{client_id}/pension-plans/{plan_id}")
async def dissociate_client_from_plan(
    client_id: int,
    plan_id: int,
    db: Session = Depends(get_db)
):
    try:
        db_client = db.query(Client).filter(Client.id == client_id).first()
        if not db_client:
            raise HTTPException(status_code=404, detail="Client not found")
            
        db_plan = db.query(PensionPlan).filter(PensionPlan.id == plan_id).first()
        if not db_plan:
            raise HTTPException(status_code=404, detail="Pension plan not found")
        
        if db_plan in db_client.pension_plans:
            db_client.pension_plans.remove(db_plan)
            db.commit()
        
        return {"message": "Client dissociated from pension plan successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

# Chat History Operations
@app.post("/chat-messages/", response_model=ChatMessage)
async def create_chat_message(message: ChatMessageCreate, db: Session = Depends(get_db)):
    db_message = ChatMessage(
        **message.dict(),
        created_at=datetime.utcnow()
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

@app.get("/chat-messages/{client_id}", response_model=List[ChatMessage])
async def get_chat_history(
    client_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    messages = (
        db.query(ChatMessage)
        .filter(ChatMessage.client_id == client_id)
        .order_by(ChatMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return messages

# Upload Operations
@app.post("/uploads/", response_model=Upload)
async def create_upload(
    client_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Create upload record
    db_upload = Upload(
        client_id=client_id,
        filename=file.filename,
        file_type=file.content_type,
        status="pending",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)

    try:
        # Process the document
        content, embedding, analysis = await document_processor.process_pdf(file.file)
        
        # Create document record
        db_document = Document(
            filename=file.filename,
            content=content,
            embedding=embedding,
            summary=analysis["summary"],
            key_information=analysis["key_information"],
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        # Update upload record with document_id
        db_upload.document_id = db_document.id
        db_upload.status = "processed"
        db_upload.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(db_upload)

    except Exception as e:
        db_upload.status = "failed"
        db_upload.updated_at = datetime.utcnow()
        db.commit()
        raise HTTPException(status_code=500, detail=str(e))

    return db_upload

@app.get("/uploads/{client_id}", response_model=List[Upload])
async def get_client_uploads(
    client_id: int,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    uploads = (
        db.query(Upload)
        .filter(Upload.client_id == client_id)
        .order_by(Upload.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return uploads

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
