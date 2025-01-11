import os
from typing import Optional
from anthropic import Anthropic
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        self.client = Anthropic(
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )

    async def process_query(
        self,
        query: str,
        context: Optional[str] = None,
        max_tokens: int = 500,
        temperature: float = 0.7
    ) -> str:
        """Process a query with optional context and return a response."""
        try:
            # Build the system message
            system_message = """You are a knowledgeable assistant specializing in pension plans and financial documents.
Your role is to help users understand their pension plans, related documents, and provide accurate information.
Always be professional, clear, and concise in your responses.
If you're not sure about something, be honest about it.
Base your responses on the provided context when available."""

            # Build the prompt with context if available
            if context:
                prompt = f"""Here is some relevant context about pension plans and documents:

{context}

Based on this context, please respond to the following query:
{query}"""
            else:
                prompt = f"""Please respond to the following query about pension plans:
{query}

If you need more specific information about particular pension plans or documents, please let me know."""

            # Get response from Claude
            response = await self.client.messages.create(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
                max_tokens=max_tokens,
                temperature=temperature,
                system=system_message,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            return response.content[0].text

        except Exception as e:
            return f"I apologize, but I encountered an error while processing your request: {str(e)}"

    async def process_document(self, content: str) -> dict:
        """Process a document and extract key information."""
        try:
            system_message = """You are an expert at analyzing pension and financial documents.
Your task is to extract key information and provide a clear summary.
Focus on important details like terms, conditions, benefits, and requirements."""

            prompt = f"""Please analyze the following document content and provide:
1. A concise summary
2. Key information points
3. Any important terms or conditions

Document content:
{content}"""

            response = await self.client.messages.create(
                model=os.getenv("ANTHROPIC_MODEL", "claude-3-sonnet-20240229"),
                max_tokens=1000,
                temperature=0.3,
                system=system_message,
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ]
            )

            # Parse the response into sections
            text = response.content[0].text
            sections = text.split("\n\n")
            
            return {
                "summary": sections[0] if len(sections) > 0 else "",
                "key_information": "\n".join(sections[1:]) if len(sections) > 1 else ""
            }

        except Exception as e:
            return {
                "summary": "Error processing document",
                "key_information": str(e)
            }

# Initialize the LLM service
llm_service = LLMService() 