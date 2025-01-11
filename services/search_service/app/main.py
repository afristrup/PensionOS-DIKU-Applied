from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from storage.chroma import ChromaStore
from storage.neo4j import Neo4jStore
from services.llm import LLMService
from services.embeddings import EmbeddingsService
from services.document import DocumentProcessor
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
try:
    chroma_store = ChromaStore(persist_directory=settings.CHROMA_PERSIST_DIRECTORY)
    neo4j_store = Neo4jStore(
        uri=settings.NEO4J_URI,
        username=settings.NEO4J_USER,
        password=settings.NEO4J_PASSWORD
    )
    embeddings_service = EmbeddingsService()
    llm_service = LLMService()
    document_processor = DocumentProcessor(
        embeddings_service=embeddings_service,
        llm_service=llm_service,
        chroma_store=chroma_store,
        neo4j_store=neo4j_store
    )
except Exception as e:
    logger.error(f"Failed to initialize services: {str(e)}")
    raise

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup connections on shutdown."""
    neo4j_store.close()

# Import and include routers
from app.api.routes import router as api_router
app.include_router(api_router, prefix=settings.API_V1_STR) 