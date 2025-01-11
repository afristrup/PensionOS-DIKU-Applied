import os
from typing import BinaryIO
from llamaparse import LlamaParse
from .embeddings import embeddings_service
from .llm_service import llm_service

class DocumentProcessor:
    def __init__(self):
        self.llama_parse = LlamaParse(
            api_key=os.getenv("LLAMAPARSE_API_KEY"),
            verbose=True
        )

    async def process_pdf(self, file: BinaryIO) -> tuple[str, list[float], dict]:
        """Process a PDF file and return its content, embedding, and analysis."""
        # Parse PDF using LlamaParse
        doc = await self.llama_parse.parse_file(file)
        
        # Extract text content
        content = doc.text
        
        # Generate embedding for the content
        embedding = embeddings_service.get_embedding(content)
        
        # Process with LlamaIndex
        analysis = await llm_service.process_document(content)
        
        return content, embedding, analysis

# Initialize the document processor
document_processor = DocumentProcessor() 