from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List, Optional
from pydantic import BaseModel
from app.main import document_processor
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

class SearchQuery(BaseModel):
    query: str
    limit: Optional[int] = 5

class ProcessResponse(BaseModel):
    document_id: str
    summary: str
    entities: List[dict]

@router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = None
):
    """Upload and process a document."""
    try:
        content = await file.read()
        content = content.decode("utf-8")
        title = title or file.filename
        
        result = await document_processor.process_document(
            content=content,
            title=title
        )
        return ProcessResponse(**result)
    except Exception as e:
        logger.error(f"Error processing document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_documents(query: SearchQuery):
    """Search through processed documents."""
    try:
        results = await document_processor.search(
            query=query.query,
            limit=query.limit
        )
        return results
    except Exception as e:
        logger.error(f"Error searching documents: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}")
async def get_document(document_id: str):
    """Get a specific document and its related information."""
    try:
        document = await document_processor.get_document(document_id)
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/documents/{document_id}/entities")
async def get_document_entities(document_id: str):
    """Get entities related to a specific document."""
    try:
        entities = await document_processor.get_document_entities(document_id)
        return entities
    except Exception as e:
        logger.error(f"Error retrieving document entities: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document and its related information."""
    try:
        await document_processor.delete_document(document_id)
        return {"status": "success", "message": "Document deleted"}
    except Exception as e:
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 