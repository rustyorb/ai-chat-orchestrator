import { Middleware } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';

// Middleware to register personas with the backend
export const personaMiddleware: Middleware = store => next => action => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a persona-related action
  if (action.type === 'persona/addPersona' || action.type === 'persona/updatePersona') {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Find the persona that was just added or updated
    let persona;
    if (action.type === 'persona/addPersona') {
      // For addPersona, it's the last one in the array
      persona = state.personas.personas[state.personas.personas.length - 1];
    } else {
      // For updatePersona, find it by ID
      persona = state.personas.personas.find(p => p.id === action.payload.id);
    }
    
    // If we found the persona, register it with the backend
    if (persona) {
      console.log(`Registering persona with backend: ${persona.name} (${persona.id})`);
      
      // Send a WebSocket message to register the persona
      websocketService.send('register_persona', {
        persona: persona
      });
    }
  }
  
  return result;
};
