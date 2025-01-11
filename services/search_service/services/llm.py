import aiohttp
import json
from typing import Dict, List
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL

    async def _generate(self, prompt: str) -> str:
        """Generate text using Ollama."""
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model,
                    "prompt": prompt,
                    "stream": False
                }
            ) as response:
                if response.status != 200:
                    raise Exception(f"Ollama API error: {await response.text()}")
                result = await response.json()
                return result["response"]

    async def process_document(self, content: str) -> Dict:
        """Process a document to extract summary and entities."""
        try:
            # Generate summary
            summary_prompt = f"""Please provide a concise summary of the following text:

{content}

Summary:"""
            summary = await self._generate(summary_prompt)

            # Extract entities
            entities_prompt = f"""Please analyze the following text and extract key entities (people, organizations, locations, concepts, etc.).
For each entity, provide:
1. The entity name
2. The entity type (person, organization, location, concept, etc.)
3. A relevant relationship to the document (mentioned_in, author_of, located_in, etc.)
4. Any additional properties

Format the response as a JSON array of objects with the following structure:
[{{"name": "entity_name", "type": "entity_type", "relationship": "relationship_type", "properties": {{"key": "value"}}}}]

Text to analyze:
{content}

Entities (JSON format):"""

            entities_text = await self._generate(entities_prompt)
            try:
                entities = json.loads(entities_text)
            except json.JSONDecodeError:
                logger.error(f"Failed to parse entities JSON: {entities_text}")
                entities = []

            return {
                "summary": summary,
                "entities": entities
            }

        except Exception as e:
            logger.error(f"Error in LLM processing: {str(e)}")
            raise

    async def answer_question(self, question: str, context: str) -> str:
        """Answer a question based on the given context."""
        try:
            prompt = f"""Please answer the following question based on the provided context.
If the answer cannot be found in the context, say "I cannot answer this question based on the provided context."

Context:
{context}

Question: {question}

Answer:"""

            return await self._generate(prompt)

        except Exception as e:
            logger.error(f"Error in question answering: {str(e)}")
            raise 