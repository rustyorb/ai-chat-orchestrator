import { store } from '../store';
import { addMessage, updateMessage } from '../store/slices/conversationSlice';
import { addNotification } from '../store/slices/uiSlice';
import { Message } from '../types';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private url: string;
  private eventHandlers: { [key: string]: Array<(data: any) => void> } = {};
  private isEnabled = false; // Flag to control connection attempts

  constructor(url: string) {
    this.url = url;
  }

  // Enable or disable websocket connection attempts
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    console.log("WebSocket connection enabled:", enabled);
    if (enabled && !this.socket) {
      console.log("Attempting to connect to WebSocket since it's enabled");
      this.connect();
    } else if (!enabled && this.socket) {
      console.log("Disconnecting from WebSocket since it's disabled");
      this.disconnect();
    }
  }

  // Check if backend is available before attempting connection
  async checkBackendAvailability(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:8000/');
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  async connect(): Promise<void> {
    if (!this.isEnabled) {
      console.log('WebSocket connections are disabled');
      return;
    }

    console.log("Starting WebSocket connection attempt to:", this.url);
    try {
      // Check if backend is available
      const isAvailable = await this.checkBackendAvailability();
      console.log("Backend availability check result:", isAvailable);
      if (!isAvailable) {
        console.log('Backend server is not available. WebSocket connection skipped.');
        // Add notification just once
        if (this.reconnectAttempts === 0) {
          store.dispatch(addNotification({
            type: 'info',
            message: 'Backend server is not running. Some features may be limited.',
            duration: 5000,
          }));
        }
        return;
      }
      
      this.socket = new WebSocket(this.url);
      
      this.socket.onopen = () => {
        console.log('WebSocket connection successfully established');
        this.reconnectAttempts = 0;
        this.dispatchEvent('connected', null);
        
        // Add success notification
        store.dispatch(addNotification({
          type: 'success',
          message: 'Connected to backend server',
          duration: 3000,
        }));
      };
      
      this.socket.onmessage = (event) => {
        try {
          console.log("WebSocket message received:", event.data.substring(0, 100) + "...");
          const data = JSON.parse(event.data);
          
          if (data.type === 'message_chunk') {
            // Handle streaming message chunks
            this.handleMessageChunk(data);
          } else if (data.type === 'message_complete') {
            // Handle completed messages
            this.handleMessageComplete(data);
          } else if (data.type === 'error') {
            // Handle errors
            this.handleError(data);
          } else {
            // Handle other event types
            this.dispatchEvent(data.type, data);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed. Code:', event.code, 'Reason:', event.reason, 'Clean:', event.wasClean);
        this.dispatchEvent('disconnected', { code: event.code, reason: event.reason });
        
        if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts && this.isEnabled) {
          this.attemptReconnect();
        }
      };
      
      this.socket.onerror = (error) => {
        // Only log the first error to avoid console spam
        if (this.reconnectAttempts === 0) {
          console.log('WebSocket connection error - backend may not be running');
        }
        this.dispatchEvent('error', error);
      };
    } catch (error) {
      if (this.reconnectAttempts === 0) {
        console.log('Failed to establish WebSocket connection - backend may not be running');
      }
      
      if (this.isEnabled) {
        this.attemptReconnect();
      }
    }
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  send(type: string, data: any): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, data }));
      console.log("Message sent to WebSocket server. Type:", type);
      return true;
    }
    console.log("Failed to send message - WebSocket not connected. Type:", type);
    return false;
  }

  on(event: string, callback: (data: any) => void): void {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(callback);
  }

  off(event: string, callback?: (data: any) => void): void {
    if (!callback) {
      delete this.eventHandlers[event];
    } else if (this.eventHandlers[event]) {
      this.eventHandlers[event] = this.eventHandlers[event].filter(cb => cb !== callback);
    }
  }

  private dispatchEvent(event: string, data: any): void {
    const handlers = this.eventHandlers[event];
    if (handlers) {
      handlers.forEach(callback => callback(data));
    }
  }

  private attemptReconnect(): void {
    this.reconnectAttempts++;
    
    // Use exponential backoff but cap at a reasonable maximum
    const delay = Math.min(
      this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1),
      30000 // Cap at 30 seconds
    );
    
    if (this.reconnectAttempts === 1) {
      console.log(`Attempting to reconnect in ${Math.round(delay/1000)}s (attempt ${this.reconnectAttempts})`);
    }
    
    setTimeout(() => {
      if (this.socket?.readyState !== WebSocket.OPEN && this.isEnabled) {
        this.connect();
      }
    }, delay);
  }

  private handleMessageChunk(data: any): void {
    const { conversationId, messageId, chunk, index } = data;
    
    // Log the received chunk data for debugging
    console.log("Received message chunk:", { conversationId, messageId, chunkLength: chunk?.length });
    
    // Update the message in the store with the new chunk
    store.dispatch(updateMessage({
      id: messageId,
      conversationId,
      content: chunk,
    }));
  }

  private handleMessageComplete(data: any): void {
    const { message } = data;
    
    // Update the completed message
    if (message) {
      // Log the received complete message for debugging
      console.log("Received complete message:", { 
        id: message.id, 
        conversationId: message.conversationId || message.id, 
        contentLength: message.content?.length 
      });
      
      store.dispatch(updateMessage({
        id: message.id,
        conversationId: message.conversationId || message.id, // Handle both formats
        content: message.content,
        metadata: message.metadata,
      }));
    }
  }

  private handleError(data: any): void {
    const { message, details } = data;
    
    console.error('WebSocket error:', message, details);
    console.log('Error data structure:', JSON.stringify(data, null, 2));
    
    // Show error notification
    store.dispatch(addNotification({
      type: 'error',
      message: message || 'An error occurred during communication',
      duration: 10000,
    }));
    
    // Update message if it's related to a specific message
    if (details?.messageId && details?.conversationId) {
      store.dispatch(updateMessage({
        id: details.messageId, 
        conversationId: details.conversationId, 
        metadata: {
          error: message || 'Failed to generate response',
        },
      }));
    } else if (details?.id && details?.conversationId) {
      // Handle alternative format
      store.dispatch(updateMessage({
        id: details.id,
        conversationId: details.conversationId,
        metadata: {
          error: message || 'Failed to generate response',
        },
      }));
    }
  }
}

// Create and export a singleton instance
export const websocketService = new WebSocketService('ws://localhost:8000/ws');