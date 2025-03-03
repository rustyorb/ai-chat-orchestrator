from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional, Any, TypeVar, Generic
from pydantic import BaseModel, Field
import asyncio
import json
import uuid
import time
from datetime import datetime
from pathlib import Path
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("ai-orchestrator")

# Create FastAPI app
app = FastAPI(
    title="AI Conversation Orchestrator",
    description="Backend API for managing multi-agent AI conversations",
    version="0.1.0",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, set this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---

class ModelParameters(BaseModel):
    temperature: float = 0.7
    top_p: Optional[float] = 1.0
    max_tokens: Optional[int] = None
    frequency_penalty: Optional[float] = 0.0
    presence_penalty: Optional[float] = 0.0
    stop: Optional[List[str]] = None

class ModelConfig(BaseModel):
    id: str
    name: str
    provider: str
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    context_window_size: int
    default_params: ModelParameters

class MemorySettings(BaseModel):
    message_limit: Optional[int] = None
    token_limit: Optional[int] = None
    use_search_memory: bool = False
    summary_interval: Optional[int] = None

class Persona(BaseModel):
    id: str
    name: str
    avatar: str
    system_prompt: str
    model_id: str
    parameters: ModelParameters
    memory_settings: MemorySettings
    conversation_style: str
    created: int
    updated: int

class Message(BaseModel):
    id: str
    conversation_id: str
    sender_id: str
    sender_type: str  # 'user' | 'agent' | 'system'
    content: str
    timestamp: int
    reply_to_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class WSMessage(BaseModel):
    type: str
    data: Dict[str, Any]

# --- Model adapter interface and implementations ---

class ModelAdapter:
    """Abstract base class for model adapters"""
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: str,
        parameters: ModelParameters,
        model_name: str = None,
        stream_callback=None
    ) -> str:
        """Generate text from the model"""
        raise NotImplementedError
    
    async def get_available_models(self) -> List[str]:
        """Get a list of available models for this provider"""
        raise NotImplementedError
    
    async def test_connection(self) -> bool:
        """Test if the model connection is working"""
        raise NotImplementedError

# Mock model adapter for development
class MockModelAdapter(ModelAdapter):
    """Mock model adapter that returns predefined responses"""
    
    async def generate_text(
        self, 
        prompt: str, 
        system_prompt: str,
        parameters: ModelParameters,
        model_name: str = None,
        stream_callback=None
    ) -> str:
        """Generate a mock response"""
        logger.info(f"Generating mock response for model: {model_name or 'default-mock'}")
        base_response = f"This is a mock response to: {prompt[:30]}..."
        
        # If streaming is requested, simulate chunks
        if stream_callback:
            words = base_response.split()
            full_text = ""
            
            for word in words:
                full_text += word + " "
                await stream_callback(word + " ")
                await asyncio.sleep(0.2)  # Simulate thinking time
                
            return full_text.strip()
        
        # Otherwise return the full response at once
        return base_response
    
    async def get_available_models(self) -> List[str]:
        """Return mock model list"""
        return ["mock-gpt4", "mock-claude", "mock-llama"]
    
    async def test_connection(self) -> bool:
        """Mock connection test"""
        return True

# Factory to get appropriate model adapter
def get_model_adapter(model_config: ModelConfig) -> ModelAdapter:
    """Return the appropriate model adapter for the given model configuration"""
    # Import adapters here to avoid circular imports
    from openai_adapter import OpenAIAdapter
    from ollama_adapter import OllamaAdapter
    from custom_adapter import CustomAdapter
    
    provider = model_config.provider.lower()
    
    # Return the appropriate adapter based on the provider
    if provider == "openai":
        if not model_config.api_key:
            logger.error("API key is required for OpenAI")
            return MockModelAdapter()
        return OpenAIAdapter(api_key=model_config.api_key)
        
    elif provider == "ollama":
        base_url = model_config.base_url or "http://localhost:11434/api"
        return OllamaAdapter(base_url=base_url)
        
    elif provider == "lmstudio":
        base_url = model_config.base_url or "http://localhost:1234/v1"
        return CustomAdapter(base_url=base_url)
        
    elif provider == "custom":
        if not model_config.base_url:
            logger.error("Base URL is required for custom provider")
            return MockModelAdapter()
        return CustomAdapter(base_url=model_config.base_url, api_key=model_config.api_key)
        
    elif provider == "anthropic":
        logger.warning("Anthropic adapter not implemented yet, using mock adapter")
        return MockModelAdapter()
    
    # Default to mock adapter
    logger.warning(f"Unknown provider: {provider}, using mock adapter")
    return MockModelAdapter()

# --- WebSocket Connection Manager ---

class ConnectionManager:
    """Manager for WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.message_generators: Dict[str, asyncio.Task] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections[client_id] = websocket
        logger.info(f"Client connected: {client_id}")
    
    def disconnect(self, client_id: str):
        if client_id in self.active_connections:
            del self.active_connections[client_id]
        
        # Cancel any message generation tasks for this client
        if client_id in self.message_generators:
            self.message_generators[client_id].cancel()
            del self.message_generators[client_id]
        
        logger.info(f"Client disconnected: {client_id}")
    
    async def send_personal_message(self, message: Dict[str, Any], client_id: str):
        if client_id in self.active_connections:
            await self.active_connections[client_id].send_json(message)
    
    def register_message_generator(self, client_id: str, task: asyncio.Task):
        """Register a message generation task for a client"""
        self.message_generators[client_id] = task
    
    def cancel_message_generation(self, message_id: str):
        """Cancel an ongoing message generation task"""
        # Find tasks generating this message and cancel them
        for client_id, task in self.message_generators.items():
            if task and not task.done() and task.get_name() == message_id:
                task.cancel()
                logger.info(f"Cancelled message generation for message_id: {message_id}")

manager = ConnectionManager()

# --- WebSocket Endpoint ---

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    client_id = str(uuid.uuid4())
    await manager.connect(websocket, client_id)
    
    try:
        while True:
            data = await websocket.receive_text()
            try:
                message_data = json.loads(data)
                message_type = message_data.get("type", "")
                
                if message_type == "generate_message":
                    # Extract data for message generation
                    conversation_id = message_data["data"].get("conversation_id")
                    prompt = message_data["data"].get("content", "")
                    system_prompt = message_data["data"].get("system_prompt", "")
                    persona_id = message_data["data"].get("persona_id")
                    parameters = ModelParameters(**message_data["data"].get("parameters", {}))
                    
                    # Create a new message ID
                    message_id = str(uuid.uuid4())
                    
                    # Create a streaming task
                    task = asyncio.create_task(
                        handle_message_generation(
                            client_id, 
                            message_id, 
                            conversation_id,
                            prompt, 
                            system_prompt, 
                            persona_id,
                            parameters
                        )
                    )
                    task.set_name(message_id)
                    
                    # Register the task
                    manager.register_message_generator(client_id, task)
                    
                    # Send acknowledgment
                    await manager.send_personal_message(
                        {
                            "type": "generation_started",
                            "data": {
                                "message_id": message_id,
                                "conversation_id": conversation_id
                            }
                        },
                        client_id
                    )
                
                elif message_type == "stop_generation":
                    message_id = message_data["data"].get("message_id")
                    if message_id:
                        manager.cancel_message_generation(message_id)
                        await manager.send_personal_message(
                            {
                                "type": "generation_stopped",
                                "data": {
                                    "message_id": message_id
                                }
                            },
                            client_id
                        )
                
                elif message_type == "ping":
                    # Respond to ping messages
                    await manager.send_personal_message(
                        {
                            "type": "pong",
                            "data": {
                                "timestamp": int(time.time() * 1000)
                            }
                        },
                        client_id
                    )
                
                else:
                    # Unknown message type
                    await manager.send_personal_message(
                        {
                            "type": "error",
                            "data": {
                                "message": f"Unknown message type: {message_type}"
                            }
                        },
                        client_id
                    )
                
            except json.JSONDecodeError:
                await manager.send_personal_message(
                    {
                        "type": "error",
                        "data": {
                            "message": "Invalid JSON"
                        }
                    },
                    client_id
                )
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {str(e)}")
                await manager.send_personal_message(
                    {
                        "type": "error",
                        "data": {
                            "message": "Internal server error",
                            "details": str(e)
                        }
                    },
                    client_id
                )
    
    except WebSocketDisconnect:
        manager.disconnect(client_id)

# --- Message Generation Handler ---

async def handle_message_generation(
    client_id: str,
    message_id: str,
    conversation_id: str,
    prompt: str,
    system_prompt: str,
    persona_id: str,
    parameters: ModelParameters
):
    """Handle the generation of a message from an AI model"""
    try:
        # Create a mock model adapter for now
        model_adapter = MockModelAdapter()
        
        # Define the streaming callback
        async def stream_callback(chunk: str):
            await manager.send_personal_message(
                {
                    "type": "message_chunk",
                    "conversationId": conversation_id,
                    "messageId": message_id,
                    "chunk": chunk,
                    "index": 0  # For now, we don't track chunk indices
                },
                client_id
            )
        
        # Start generation time
        start_time = time.time()
        
        # Generate the response
        response = await model_adapter.generate_text(
            prompt=prompt,
            system_prompt=system_prompt,
            parameters=parameters,
            stream_callback=stream_callback
        )
        
        # Calculate generation time
        generation_time = time.time() - start_time
        
        # Send completion message
        await manager.send_personal_message(
            {
                "type": "message_complete",
                "message": {
                    "id": message_id,
                    "conversationId": conversation_id,
                    "senderId": persona_id,
                    "senderType": "agent",
                    "content": response,
                    "timestamp": int(time.time() * 1000),
                    "metadata": {
                        "modelCallDuration": generation_time,
                        "modelTokensUsed": len(response.split())  # Mock token count
                    }
                }
            },
            client_id
        )
    
    except asyncio.CancelledError:
        # Task was cancelled, nothing to do
        logger.info(f"Message generation cancelled for message_id: {message_id}")
    
    except Exception as e:
        logger.error(f"Error in message generation: {str(e)}")
        await manager.send_personal_message(
            {
                "type": "error",
                "data": {
                    "message": "Failed to generate message",
                    "details": {
                        "error": str(e),
                        "messageId": message_id,
                        "conversationId": conversation_id
                    }
                }
            },
            client_id
        )

# --- REST API Endpoints ---

@app.get("/")
async def root():
    return {
        "name": "AI Conversation Orchestrator API",
        "version": "0.1.0",
        "status": "running"
    }

@app.post("/models/test")
async def test_model_connection(model_config: ModelConfig):
    """Test connection to a model API"""
    try:
        adapter = get_model_adapter(model_config)
        success = await adapter.test_connection()
        
        return {
            "success": success,
            "message": "Connection successful" if success else "Connection failed"
        }
    except Exception as e:
        logger.error(f"Error testing model connection: {str(e)}")
        return {
            "success": False,
            "message": f"Error: {str(e)}"
        }

@app.get("/models/available")
async def get_available_models(provider: str, api_key: Optional[str] = None):
    """Get available models for a provider"""
    logger.info(f"Getting available models for provider: {provider}")
    
    # Create a minimal model config for the adapter
    model_config = ModelConfig(
        id="temp",
        name="temp",
        provider=provider,
        api_key=api_key,
        context_window_size=1024,
        default_params=ModelParameters()
    )
    
    try:
        adapter = get_model_adapter(model_config)
        logger.info(f"Using adapter: {adapter.__class__.__name__}")
        
        models = await adapter.get_available_models()
        logger.info(f"Found {len(models)} models: {models[:5] if len(models) > 5 else models}")
        
        return {
            "provider": provider,
            "models": models
        }
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        # Return empty list with error message instead of raising exception
        return {
            "provider": provider,
            "models": [],
            "error": str(e)
        }

@app.post("/conversation/generate")
async def generate_message(request: Dict[str, Any]):
    """Generate a message (non-streaming version)"""
    try:
        message = request.get("message", {})
        persona = request.get("persona", {})
        
        if not message or not persona:
            raise HTTPException(status_code=400, detail="Missing message or persona data")
        
        # Create a message ID
        message_id = str(uuid.uuid4())
        
        # Return immediately with the message ID
        return {
            "messageId": message_id,
            "status": "generation_started"
        }
    except Exception as e:
        logger.error(f"Error in generate_message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/conversation/stop")
async def stop_message_generation(request: Dict[str, Any]):
    """Stop an ongoing message generation"""
    message_id = request.get("messageId")
    
    if not message_id:
        raise HTTPException(status_code=400, detail="Missing messageId")
    
    manager.cancel_message_generation(message_id)
    
    return {
        "success": True,
        "messageId": message_id,
        "status": "generation_stopped"
    }

@app.get("/export/conversation/{conversation_id}")
async def export_conversation(conversation_id: str, format: str = "json"):
    """Export a conversation in the specified format"""
    # This is a mock implementation - in a real app, you'd retrieve the conversation from a database
    
    if format not in ["json", "markdown", "text"]:
        raise HTTPException(status_code=400, detail=f"Unsupported export format: {format}")
    
    # Mock conversation data
    conversation = {
        "id": conversation_id,
        "title": "Sample Conversation",
        "created": int(time.time() * 1000) - 3600000,
        "updated": int(time.time() * 1000),
        "participants": ["user-1", "ai-assistant-1", "ai-assistant-2"],
        "messages": [
            {
                "id": "msg-1",
                "conversationId": conversation_id,
                "senderId": "user-1",
                "senderType": "user",
                "content": "Hello, can you help me understand quantum computing?",
                "timestamp": int(time.time() * 1000) - 3600000
            },
            {
                "id": "msg-2",
                "conversationId": conversation_id,
                "senderId": "ai-assistant-1",
                "senderType": "agent",
                "content": "Quantum computing is a type of computation that harnesses quantum mechanical phenomena.",
                "timestamp": int(time.time() * 1000) - 3500000
            }
        ]
    }
    
    if format == "json":
        return conversation
    elif format == "markdown":
        # Simple markdown conversion
        markdown = f"# {conversation['title']}\n\n"
        for msg in conversation['messages']:
            sender_type = "User" if msg['senderType'] == 'user' else "AI"
            markdown += f"**{sender_type} ({msg['senderId']}):**\n{msg['content']}\n\n"
        return markdown
    else:  # text format
        text = f"{conversation['title']}\n\n"
        for msg in conversation['messages']:
            sender_type = "User" if msg['senderType'] == 'user' else "AI"
            text += f"{sender_type} ({msg['senderId']}): {msg['content']}\n\n"
        return text

# --- Main startup code ---

@app.on_event("startup")
async def startup_event():
    """Run when the server starts up"""
    logger.info("Starting AI Conversation Orchestrator server")
    
    # Create necessary directories
    Path("./data").mkdir(exist_ok=True)

@app.on_event("shutdown")
async def shutdown_event():
    """Run when the server shuts down"""
    logger.info("Shutting down AI Conversation Orchestrator server")

# --- Run the server ---
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)