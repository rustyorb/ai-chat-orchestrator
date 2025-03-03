import httpx
import asyncio
import json
import logging
from typing import List, Optional, Dict, Any, Callable, Awaitable
from fastapi import HTTPException

from main import ModelAdapter, ModelParameters

logger = logging.getLogger("ai-orchestrator")

class OllamaAdapter(ModelAdapter):
    """Adapter for Ollama API (local LLM)"""
    
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = base_url or "http://localhost:11434/api"
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers={"Content-Type": "application/json"},
            timeout=60.0
        )
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: str,
        parameters: ModelParameters,
        stream_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> str:
        """Generate text using Ollama API"""
        try:
            # Default to llama3 if model is not specified
            model = "llama3" 
            
            # Convert parameters to Ollama format
            ollama_params = {
                "model": model,
                "prompt": prompt,
                "system": system_prompt,
                "stream": stream_callback is not None,
                "options": {
                    "temperature": parameters.temperature,
                    "top_p": parameters.top_p or 1.0,
                }
            }
            
            if parameters.max_tokens:
                ollama_params["options"]["num_predict"] = parameters.max_tokens
            
            # Handle streaming responses
            if stream_callback:
                return await self._stream_response(ollama_params, stream_callback)
            
            # Handle non-streaming responses
            response = await self.client.post("/generate", json=ollama_params)
            response.raise_for_status()
            response_data = response.json()
            
            return response_data.get("response", "")
            
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
        """Handle streaming responses from Ollama API"""
        full_response = ""
        
        try:
            async with self.client.stream("POST", "/generate", json=params) as response:
                response.raise_for_status()
                
                async for chunk in response.aiter_text():
                    if chunk.strip():
                        try:
                            data = json.loads(chunk)
                            if "response" in data:
                                content = data["response"]
                                full_response += content
                                await callback(content)
                        except json.JSONDecodeError:
                            # Skip invalid JSON chunks
                            pass
            
            return full_response
            
        except Exception as e:
            error_message = f"Error in streaming response: {str(e)}"
            logger.error(error_message)
            raise HTTPException(status_code=500, detail=error_message)
    
    async def get_available_models(self) -> List[str]:
        """Get available models from Ollama API"""
        try:
            logger.info("Fetching models from Ollama API")
            response = await self.client.get("/tags", timeout=5.0)
            response.raise_for_status()
            models_data = response.json()
            
            # Parse the response based on Ollama API structure
            if "models" in models_data:
                model_names = [model["name"] for model in models_data.get("models", [])]
            else:
                # Alternative structure
                model_names = []
                for item in models_data.get("models", []):
                    if isinstance(item, dict) and "name" in item:
                        model_names.append(item["name"])
                    elif isinstance(item, str):
                        model_names.append(item)
            
            logger.info(f"Found {len(model_names)} Ollama models: {model_names}")
            return model_names or ["llama3", "llama3:8b", "llama3:70b", "mistral", "phi3"]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred fetching Ollama models: {e.response.status_code} - {e.response.text}")
            return ["llama3", "llama3:8b", "llama3:70b", "mistral", "phi3"] # Fallback to common models
        except Exception as e:
            logger.error(f"Error getting available Ollama models: {str(e)}")
            return ["llama3", "llama3:8b", "llama3:70b", "mistral", "phi3"] # Fallback to common models
    
    async def test_connection(self) -> bool:
        """Test connection to Ollama API"""
        try:
            response = await self.client.get("/tags")
            return response.status_code == 200
        except Exception as e:
            logger.error(f"Error testing connection: {str(e)}")
            return False