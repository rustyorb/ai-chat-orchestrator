import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Persona } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { websocketService } from '../../services/websocket';

interface PersonaState {
  personas: Persona[];
  activePersonaId: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: PersonaState = {
  personas: [],
  activePersonaId: null,
  isLoading: false,
  error: null,
};

const personaSlice = createSlice({
  name: 'persona',
  initialState,
  reducers: {
    addPersona: (state, action: PayloadAction<Omit<Persona, 'id' | 'created' | 'updated'>>) => {
      const newPersona: Persona = {
        ...action.payload,
        id: uuidv4(),
        created: Date.now(),
        updated: Date.now(),
      };
      state.personas.push(newPersona);
    },
    updatePersona: (state, action: PayloadAction<Partial<Persona> & { id: string }>) => {
      const index = state.personas.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.personas[index] = {
          ...state.personas[index],
          ...action.payload,
          updated: Date.now(),
        };
      }
    },
    deletePersona: (state, action: PayloadAction<string>) => {
      state.personas = state.personas.filter(p => p.id !== action.payload);
      if (state.activePersonaId === action.payload) {
        state.activePersonaId = null;
      }
    },
    setActivePersona: (state, action: PayloadAction<string>) => {
      state.activePersonaId = action.payload;
    },
    setPersonas: (state, action: PayloadAction<Persona[]>) => {
      state.personas = action.payload;
    },
    setPersonaLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setPersonaError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export const {
  addPersona,
  updatePersona,
  deletePersona,
  setActivePersona,
  setPersonas,
  setPersonaLoading,
  setPersonaError,
} = personaSlice.actions;

export default personaSlice.reducer;
