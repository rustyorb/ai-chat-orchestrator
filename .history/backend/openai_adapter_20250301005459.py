import httpx
import asyncio
import json
import logging
from typing import List, Optional, Dict, Any, Callable, Awaitable
from fastapi import HTTPException

from main import ModelAdapter, ModelParameters

logger = logging.getLogger("ai-orchestrator")

class OpenAIAdapter(ModelAdapter):
    """Adapter for OpenAI API"""
    
    def __init__(self, api_key: str, base_url: Optional[str] = None):
        self.api_key = api_key
        self.base_url = base_url or "https://api.openai.com/v1"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json"
            },
            timeout=60.0
        )
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: str,
        parameters: ModelParameters,
        stream_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> str:
        """Generate text using OpenAI API"""
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            # Convert parameters to OpenAI format
            openai_params = {
                "model": "gpt-4-turbo-preview",  # Default model, can be overridden
                "messages": messages,
                "temperature": parameters.temperature,
                "max_tokens": parameters.max_tokens or 2000,
                "top_p": parameters.top_p,
                "frequency_penalty": parameters.frequency_penalty,
                "presence_penalty": parameters.presence_penalty,
                "stream": stream_callback is not None
            }
            
            if parameters.stop:
                openai_params["stop"] = parameters.stop
            
            # Handle streaming responses
            if stream_callback:
                return await self._stream_response(openai_params, stream_callback)
            
            # Handle non-streaming responses
            response = await self.client.post("/chat/completions", json=openai_params)
            response.raise_for_status()
            response_data = response.json()
            
            return response_data["choices"][0]["message"]["content"]
            
        except httpx.HTTPStatusError as e:
            error_message = f"HTTP error occurred: {e.response.status_code} - {e.response.text}"
            logger.error(error_message)
            raise HTTPException(status_code=e.response.status_code, detail=error_message)
        except httpx.RequestError as e:
            error_message = f"Request error occurred: {str(e)}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
        except Exception as e:
            error_message = f"Error generating text: {str(e)}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
    
    async def _stream_response(
        self, 
        params: Dict[str, Any], 
        callback: Callable[[str], Awaitable[None]]
    ) -> str:
        """Handle streaming responses from OpenAI API"""
        full_response = ""
        
        try:
            async with self.client.stream("POST", "/chat/completions", json=params) as response:
                response.raise_for_status()
                
                async for chunk in response.aiter_text():
                    if chunk.strip():
                        # Process each chunk (which may contain multiple SSE events)
                        for line in chunk.split("\n"):
                            if line.startswith("data: ") and line != "data: [DONE]":
                                data = json.loads(line[6:])
                                if "choices" in data and len(data["choices"]) > 0:
                                    delta = data["choices"][0].get("delta", {})
                                    if "content" in delta:
                                        content = delta["content"]
                                        full_response += content
                                        await callback(content)
            
            return full_response
            
        except Exception as e:
            error_message = f"Error in streaming response: {str(e)}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
    
    async def get_available_models(self) -> List[str]:
        """Get available models from OpenAI API"""
        try:
            response = await self.client.get("/models")
            response.raise_for_status()
            models_data = response.json()
            
            # Filter for chat models
            chat_models = [
                model["id"] for model in models_data["data"]
                if model["id"].startswith("gpt-")
            ]
            
            return chat_models
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred: {e.response.status_code} - {e.response.text}")
            return ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"] # Fallback to common models
        except Exception as e:
            logger.error(f"Error getting available models: {str(e)}")
            return ["gpt-4-turbo-preview", "gpt-4", "gpt-3.5-turbo"] # Fallback to common models
    
    async def test_connection(self) -> bool:
        """Test connection to OpenAI API"""
        try:
            response = await self.client.get("/models")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error testing connection: {str(e)}")
            return False