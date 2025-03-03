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
      const response = await api.post('/models/test', model);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.detail || 'Failed to connect to model API',
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