import httpx
import asyncio
import json
import logging
from typing import List, Optional, Dict, Any, Callable, Awaitable
from fastapi import HTTPException

from main import ModelAdapter, ModelParameters

logger = logging.getLogger("ai-orchestrator")

class CustomAdapter(ModelAdapter):
    """Adapter for custom OpenAI-compatible API endpoints (including LM Studio)"""
    
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        headers = {"Content-Type": "application/json"}
        
        # Add Authorization header if API key is provided
        if api_key:
            headers["Authorization"] = f"Bearer {api_key}"
            
        self.client = httpx.AsyncClient(
            base_url=self.base_url,
            headers=headers,
            timeout=60.0
        )
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: str,
        parameters: ModelParameters,
        stream_callback: Optional[Callable[[str], Awaitable[None]]] = None
    ) -> str:
        """Generate text using custom OpenAI-compatible API"""
        try:
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": prompt}
            ]
            
            # Convert parameters to OpenAI format
            api_params = {
                "model": "model", # Will be ignored by most custom endpoints
                "messages": messages,
                "temperature": parameters.temperature,
                "max_tokens": parameters.max_tokens or 2000,
                "top_p": parameters.top_p,
                "frequency_penalty": parameters.frequency_penalty,
                "presence_penalty": parameters.presence_penalty,
                "stream": stream_callback is not None
            }
            
            if parameters.stop:
                api_params["stop"] = parameters.stop
            
            # Handle streaming responses
            if stream_callback:
                return await self._stream_response(api_params, stream_callback)
            
            # Handle non-streaming responses
            response = await self.client.post("/chat/completions", json=api_params)
            response.raise_for_status()
            response_data = response.json()
            
            # Handle different response formats
            if "choices" in response_data and len(response_data["choices"]) > 0:
                if "message" in response_data["choices"][0]:
                    return response_data["choices"][0]["message"]["content"]
                elif "text" in response_data["choices"][0]:
                    return response_data["choices"][0]["text"]
            
            logger.error(f"Unexpected response format: {response_data}")
            return "Error: Unexpected response format from API"
            
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
        """Handle streaming responses from custom OpenAI-compatible API"""
        full_response = ""
        
        try:
            async with self.client.stream("POST", "/chat/completions", json=params) as response:
                response.raise_for_status()
                
                async for chunk in response.aiter_text():
                    if chunk.strip():
                        # Process each chunk (which may contain multiple SSE events)
                        for line in chunk.split("\n"):
                            if line.startswith("data: ") and line != "data: [DONE]":
                                try:
                                    data = json.loads(line[6:])
                                    if "choices" in data and len(data["choices"]) > 0:
                                        delta = data["choices"][0].get("delta", {})
                                        if "content" in delta:
                                            content = delta["content"]
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
        """Get available models from custom API"""
        try:
            logger.info(f"Fetching models from custom API at {self.base_url}")
            response = await self.client.get("/models", timeout=10.0)
            response.raise_for_status()
            models_data = response.json()
            
            # Check if the response follows OpenAI format
            if "data" in models_data:
                model_list = [model["id"] for model in models_data["data"]]
                logger.info(f"Found {len(model_list)} models from custom API: {model_list[:5] if len(model_list) > 5 else model_list}")
                return model_list
            
            # Alternative formats for LM Studio and similar services
            if "models" in models_data:
                model_list = [model["name"] if isinstance(model, dict) and "name" in model else str(model) 
                             for model in models_data["models"]]
                logger.info(f"Found {len(model_list)} models from custom API (alternative format): {model_list}")
                return model_list
            
            # Fallback for LM Studio and similar services that don't expose model lists
            logger.info("No models found in response, using fallback model name")
            return ["default-model"]
            
        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error occurred fetching custom API models: {e.response.status_code} - {e.response.text}")
            # For custom endpoints, we can't know the available models, so return a generic name
            return ["default-model"]
        except httpx.RequestError as e:
            logger.error(f"Request error occurred fetching custom API models: {str(e)}")
            # For custom endpoints, we can't know the available models, so return a generic name
            return ["default-model"]
        except Exception as e:
            logger.error(f"Unexpected error getting available models from custom API: {str(e)}")
            # For custom endpoints, we can't know the available models, so return a generic name
            return ["default-model"]
    
    async def test_connection(self) -> bool:
        """Test connection to custom API"""
        try:
            # Try to hit the /models endpoint first (OpenAI compatible)
            try:
                logger.info(f"Testing connection to custom API at {self.base_url}")
                response = await self.client.get("/models", timeout=5.0)
                if response.status_code == 200:
                    logger.info("Connection to custom API successful via /models endpoint")
                    return True
            except Exception as model_error:
                logger.info(f"Failed to connect to /models endpoint: {str(model_error)}")
                # If /models fails, try a simple chat completion with minimal tokens
                test_params = {
                    "model": "default-model",
                    "messages": [{"role": "user", "content": "Hello"}],
                    "max_tokens": 5
                }
                try:
                    response = await self.client.post("/chat/completions", json=test_params, timeout=5.0)
                    logger.info(f"Connection to custom API successful via /chat/completions endpoint: {response.status_code}")
                    return response.status_code == 200
                except Exception as chat_error:
                    logger.error(f"Failed to connect to /chat/completions endpoint: {str(chat_error)}")
                    return False
        except Exception as e:
            logger.error(f"Error testing connection to custom API: {str(e)}")
            return False