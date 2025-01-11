from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List, Dict
import torch
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class EmbeddingsService:
    def __init__(self):
        """Initialize the embeddings service with a sentence transformer model."""
        try:
            self.model = SentenceTransformer('BAAI/bge-small-en-v1.5')
            self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
            self.model.to(self.device)
            logger.info(f"Embeddings model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to initialize embeddings model: {str(e)}")
            raise

    def get_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text."""
        try:
            with torch.no_grad():
                embedding = self.model.encode(text, normalize_embeddings=True)
                return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        try:
            with torch.no_grad():
                embeddings = self.model.encode(texts, normalize_embeddings=True)
                return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {str(e)}")
            raise

    def compute_similarity(self, query_embedding: List[float], document_embeddings: List[List[float]]) -> List[float]:
        """Compute cosine similarity between query and documents."""
        try:
            query_embedding = np.array(query_embedding)
            document_embeddings = np.array(document_embeddings)
            
            # Normalize the embeddings
            query_norm = np.linalg.norm(query_embedding)
            doc_norms = np.linalg.norm(document_embeddings, axis=1)
            
            # Compute cosine similarity
            similarities = np.dot(document_embeddings, query_embedding) / (doc_norms * query_norm)
            return similarities.tolist()
        except Exception as e:
            logger.error(f"Error computing similarity: {str(e)}")
            raise 