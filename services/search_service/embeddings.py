from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List
import torch

class EmbeddingsService:
    def __init__(self):
        self.model = SentenceTransformer('jinaai/jina-embeddings-v3-base-en')
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        self.model.to(self.device)

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        with torch.no_grad():
            embedding = self.model.encode(text)
            return embedding.tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        with torch.no_grad():
            embeddings = self.model.encode(texts)
            return embeddings.tolist()

    def compute_similarity(self, query_embedding: List[float], document_embeddings: List[List[float]]) -> List[float]:
        """Compute cosine similarity between query and documents."""
        query_embedding = np.array(query_embedding)
        document_embeddings = np.array(document_embeddings)
        
        # Normalize the embeddings
        query_norm = np.linalg.norm(query_embedding)
        doc_norms = np.linalg.norm(document_embeddings, axis=1)
        
        # Compute cosine similarity
        similarities = np.dot(document_embeddings, query_embedding) / (doc_norms * query_norm)
        return similarities.tolist()

# Initialize the embeddings service
embeddings_service = EmbeddingsService() 