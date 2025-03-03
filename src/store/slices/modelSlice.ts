import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ModelConfig } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ModelState {
  models: ModelConfig[];
  activeModelId: string | null;
  isLoading: boolean;
  error: string | null;
}

const defaultModels: ModelConfig[] = [
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindowSize: 128000,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 4000,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
  {
    id: 'llama3-70b-local',
    name: 'Llama 3 70B (Ollama)',
    provider: 'ollama',
    contextWindowSize: 8192,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 2000,
    },
  },
  {
    id: 'lmstudio-default',
    name: 'LM Studio Model',
    provider: 'lmstudio',
    baseUrl: 'http://localhost:1234/v1',
    contextWindowSize: 4096,
    defaultParams: {
      temperature: 0.7,
      maxTokens: 1000,
    },
  },
];

const initialState: ModelState = {
  models: defaultModels,
  activeModelId: defaultModels[0].id,
  isLoading: false,
  error: null,
};

const modelSlice = createSlice({
  name: 'model',
  initialState,
  reducers: {
    addModel: (state, action: PayloadAction<Omit<ModelConfig, 'id'>>) => {
      const newModel: ModelConfig = {
        ...action.payload,
        id: uuidv4(),
      };
      state.models.push(newModel);
    },
    updateModel: (state, action: PayloadAction<Partial<ModelConfig> & { id: string }>) => {
      const index = state.models.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.models[index] = {
          ...state.models[index],
          ...action.payload,
        };
      }
    },
    deleteModel: (state, action: PayloadAction<string>) => {
      state.models = state.models.filter(m => m.id !== action.payload);
      if (state.activeModelId === action.payload) {
        state.activeModelId = state.models.length > 0 ? state.models[0].id : null;
      }
    },
    setActiveModel: (state, action: PayloadAction<string>) => {
      state.activeModelId = action.payload;
    },
    setModels: (state, action: PayloadAction<ModelConfig[]>) => {
      state.models = action.payload;
    },
    setModelLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setModelError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addModel,
  updateModel,
  deleteModel,
  setActiveModel,
  setModels,
  setModelLoading,
  setModelError,
} = modelSlice.actions;

export default modelSlice.reducer;