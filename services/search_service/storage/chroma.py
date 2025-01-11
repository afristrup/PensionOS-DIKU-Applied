from chromadb import Client, Settings
from typing import List, Dict, Optional
import chromadb

class ChromaStore:
    def __init__(self, persist_directory: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(path=persist_directory)
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"hnsw:space": "cosine"}
        )

    def add_documents(
        self,
        documents: List[str],
        embeddings: List[List[float]],
        metadatas: List[Dict],
        ids: List[str]
    ):
        """Add documents with their embeddings to ChromaDB."""
        self.collection.add(
            documents=documents,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def search(
        self,
        query_embedding: List[float],
        n_results: int = 5
    ) -> Dict:
        """Search for similar documents using the query embedding."""
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results,
            include=["documents", "metadatas", "distances"]
        )
        return results

    def delete_document(self, document_id: str):
        """Delete a document by its ID."""
        self.collection.delete(ids=[document_id])

    def get_document(self, document_id: str) -> Optional[Dict]:
        """Get a document by its ID."""
        try:
            result = self.collection.get(ids=[document_id])
            if result["ids"]:
                return {
                    "document": result["documents"][0],
                    "metadata": result["metadatas"][0]
                }
        except:
            return None
        return None 