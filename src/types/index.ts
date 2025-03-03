// Model types
export type ModelProvider = 'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'custom';

export interface ModelConfig {
  id: string;
  name: string;
  provider: ModelProvider;
  baseUrl?: string;
  apiKey?: string;
  contextWindowSize: number;
  defaultParams: ModelParameters;
}

export interface ModelParameters {
  temperature: number;
  topP?: number;
  maxTokens?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
}

// Persona types
export interface Persona {
  id: string;
  name: string;
  avatar: string;
  systemPrompt: string;
  modelId: string;
  parameters: ModelParameters;
  memorySettings: MemorySettings;
  conversationStyle: string;
  created: number;
  updated: number;
}

export interface MemorySettings {
  messageLimit?: number;
  tokenLimit?: number;
  useSearchMemory: boolean;
  summaryInterval?: number;
}

// Conversation types
export interface Conversation {
  id: string;
  title: string;
  created: number;
  updated: number;
  participants: string[]; // Persona IDs
  messages: Message[];
  branches?: { [key: string]: Conversation };
  parentId?: string;
  isActive: boolean;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string; // Persona ID or user ID
  senderType: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  replyToId?: string; // ID of the message this is a reply to
  metadata?: {
    thinking?: string;
    modelCallDuration?: number;
    modelTokensUsed?: number;
    error?: string;
    isGenerating?: boolean;
  };
}

// UI/UX types
export interface ThemeConfig {
  colorMode: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  messageSpacing: 'compact' | 'comfortable' | 'spacious';
  animationEnabled: boolean;
}

// Application state types
export interface AppSettings {
  theme: ThemeConfig;
  defaultModel: string;
  autoSaveInterval: number;
  messageDelay: number;
  developerMode: boolean;
}