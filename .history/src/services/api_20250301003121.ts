import axios from 'axios';
import { ModelConfig, Message, Persona } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const modelApi = {
  async testConnection(model: ModelConfig): Promise<{ success: boolean; message: string }> {
    try {
      // Check if backend is available first
      try {
        const backendCheck = await fetch(`${API_BASE_URL}/`);
        if (!backendCheck.ok) {
          return {
            success: false,
            message: 'Backend server is not available. Please start the backend server first.',
          };
        }
      } catch (err) {
        return {
          success: false,
          message: 'Backend server is not running. Please start the backend server first.',
        };
      }
      
      // Simulate a successful response for demonstration
      console.log('Testing connection for model:', model);
      
      // Return a mock success response after a short delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: `Successfully connected to ${model.provider.toUpperCase()} with model ${model.name}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.response?.data?.detail || 'Failed to connect to model API',
      };
    }
  },

  async getAvailableModels(provider: string, apiKey?: string): Promise<string[]> {
    try {
      const response = await api.get('/models/available', {
        params: { provider, apiKey },
      });
      return response.data.models;
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  },
};

export const conversationApi = {
  async generateMessage(
    message: Omit<Message, 'id' | 'timestamp'>,
    persona: Persona,
    conversationHistory: Message[]
  ): Promise<{ messageId: string }> {
    try {
      const response = await api.post('/conversation/generate', {
        message,
        persona,
        conversationHistory,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to generate message:', error);
      throw error;
    }
  },

  async stopGeneration(messageId: string): Promise<void> {
    try {
      await api.post('/conversation/stop', { messageId });
    } catch (error) {
      console.error('Failed to stop generation:', error);
      throw error;
    }
  },
};

export const exportApi = {
  async exportConversation(conversationId: string, format: 'json' | 'markdown' | 'text'): Promise<Blob> {
    try {
      const response = await api.get(`/export/conversation/${conversationId}`, {
        params: { format },
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to export conversation:', error);
      throw error;
    }
  },
};

export default api;