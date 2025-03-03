import axios from 'axios';
import { ModelConfig, Message, Persona } from '../types';
import { AxiosError } from 'axios';

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
          message: axiosError.response?.data?.message || 'Failed to connect to model API',
        };
      }
    } catch (error: unknown) {
      console.error('Unexpected error testing model connection:', error);
      return {
        success: false,
        message: (error as AxiosError)?.response?.data?.detail || 'Failed to connect to model API',
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