from typing import List, Dict, Optional
import uuid
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DocumentProcessor:
    def __init__(self, embeddings_service, llm_service, chroma_store, neo4j_store):
        self.embeddings_service = embeddings_service
        self.llm_service = llm_service
        self.chroma_store = chroma_store
        self.neo4j_store = neo4j_store

    async def process_document(self, content: str, title: str) -> Dict:
        """Process a document through the pipeline."""
        try:
            # Generate document ID
            doc_id = str(uuid.uuid4())

            # Get document embedding
            doc_embedding = self.embeddings_service.get_embedding(content)

            # Process with LLM for summary and entities
            llm_results = await self.llm_service.process_document(content)
            summary = llm_results["summary"]
            entities = llm_results["entities"]

            # Store in ChromaDB
            self.chroma_store.add_documents(
                documents=[content],
                embeddings=[doc_embedding],
                metadatas=[{
                    "id": doc_id,
                    "title": title,
                    "summary": summary
                }],
                ids=[doc_id]
            )

            # Store in Neo4j
            self.neo4j_store.add_document(
                doc_id=doc_id,
                title=title,
                content=content,
                metadata={"summary": summary}
            )

            # Store entities and relationships in Neo4j
            for entity in entities:
                self.neo4j_store.add_entity(
                    name=entity["name"],
                    entity_type=entity["type"],
                    properties=entity.get("properties", {})
                )
                self.neo4j_store.add_relationship(
                    from_id=doc_id,
                    to_name=entity["name"],
                    relationship_type=entity["relationship"],
                    properties=entity.get("properties", {})
                )

            return {
                "document_id": doc_id,
                "summary": summary,
                "entities": entities
            }

        except Exception as e:
            logger.error(f"Error processing document: {str(e)}")
            raise

    async def search(self, query: str, limit: int = 5) -> List[Dict]:
        """Search for documents using both vector and graph databases."""
        try:
            # Get query embedding
            query_embedding = self.embeddings_service.get_embedding(query)

            # Search in ChromaDB
            chroma_results = self.chroma_store.search(
                query_embedding=query_embedding,
                n_results=limit
            )

            # Enhance results with graph information
            enhanced_results = []
            for i, doc_id in enumerate(chroma_results["ids"][0]):
                document = {
                    "id": doc_id,
                    "content": chroma_results["documents"][0][i],
                    "metadata": chroma_results["metadatas"][0][i],
                    "similarity": 1 - chroma_results["distances"][0][i]  # Convert distance to similarity
                }

                # Get related entities from Neo4j
                entities = self.neo4j_store.get_document_entities(doc_id)
                document["entities"] = entities

                enhanced_results.append(document)

            return enhanced_results

        except Exception as e:
            logger.error(f"Error searching documents: {str(e)}")
            raise

    async def get_document(self, document_id: str) -> Optional[Dict]:
        """Get a document by its ID."""
        try:
            # Get document from ChromaDB
            doc = self.chroma_store.get_document(document_id)
            if not doc:
                return None

            # Get related entities from Neo4j
            entities = self.neo4j_store.get_document_entities(document_id)

            return {
                "id": document_id,
                "content": doc["document"],
                "metadata": doc["metadata"],
                "entities": entities
            }

        except Exception as e:
            logger.error(f"Error getting document: {str(e)}")
            raise

    async def get_document_entities(self, document_id: str) -> List[Dict]:
        """Get entities related to a document."""
        try:
            return self.neo4j_store.get_document_entities(document_id)
        except Exception as e:
            logger.error(f"Error getting document entities: {str(e)}")
            raise

    async def delete_document(self, document_id: str):
        """Delete a document from all stores."""
        try:
            self.chroma_store.delete_document(document_id)
            self.neo4j_store.delete_document(document_id)
        except Exception as e:
            logger.error(f"Error deleting document: {str(e)}")
            raise 