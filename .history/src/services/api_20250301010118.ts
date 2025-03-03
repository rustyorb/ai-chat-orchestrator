import axios, { AxiosError } from 'axios';
import { ModelConfig, Message, Persona } from '../types';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Define a type for error responses
interface ErrorResponse {
  message?: string;
  error?: string;
  detail?: string;
}

export const modelApi = {
  async testConnection(model: ModelConfig): Promise<{ success: boolean; message: string }> {
    try {
      // First check if backend is available
      try {
        const backendCheck = await fetch(`${API_BASE_URL}/`);
        if (!backendCheck.ok) {
          return {
            success: false,
            message: 'Backend server is not available. Please start the backend server first.',
          };
        }
      } catch {
        return {
          success: false,
          message: 'Backend server is not running. Please start the backend server first.',
        };
      }
      
      // Attempt a real connection test with the backend
      console.log('Testing connection for model:', model.name, model.provider);

      try {
        // Call the backend API to test the connection
        const response = await api.post('/models/test', model);

        if (response.data && response.status === 200) {
          return {
            success: response.data.success,
            message: response.data.message,
          };
        }

        // Fallback for unexpected response format
        return response.data || {
          success: true,
          message: `Connection to ${model.provider.toUpperCase()} successful`,
        };
      } catch (connectionError: unknown) {
        console.error('Error testing connection to model API:', connectionError);
        const axiosError = connectionError as AxiosError;
        return {
          success: false,
          message: (axiosError.response?.data as ErrorResponse)?.message || 'Failed to connect to model API',
        };
      }
    } catch (error: unknown) {
      console.error('Unexpected error testing model connection:', error);
      return {
        success: false,
        message: ((error as AxiosError).response?.data as ErrorResponse)?.detail || 'Failed to connect to model API',
      };
    }
  },

  async getAvailableModels(provider: string, apiKey?: string): Promise<string[]> {
    try {
      const response = await api.get('/models/available', {
        params: { 
          provider, 
          api_key: apiKey 
        },
        headers: apiKey ? {
          Authorization: `Bearer ${apiKey}`
        } : undefined
      });
      
      // Handle successful response
      if (response.data && response.data.models) {
        console.log(`Fetched ${response.data.models.length} models from ${provider}`);
        return response.data.models;
      }
      
      // Fallback for empty response
      return [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      
      // Provide fallback models based on provider
      if (provider === 'openai') {
        return ['gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
      } else if (provider === 'ollama') {
        return ['llama3', 'llama3:8b', 'llama3:70b', 'mistral', 'phi3'];
      } else if (provider === 'lmstudio') {
        return ['model'];
      }
      
      // Default fallback
      return ['model'];
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