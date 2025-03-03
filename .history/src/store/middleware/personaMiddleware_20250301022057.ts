import { Middleware, AnyAction } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';
import { addPersona, updatePersona } from '../slices/personaSlice';

// Type guard to check if action is addPersona
const isAddPersonaAction = (action: AnyAction): action is ReturnType<typeof addPersona> => 
  action.type === 'persona/addPersona';

// Type guard to check if action is updatePersona
const isUpdatePersonaAction = (action: AnyAction): action is ReturnType<typeof updatePersona> => 
  action.type === 'persona/updatePersona';

// Middleware to register personas with the backend
export const personaMiddleware: Middleware<object, RootState> = store => next => (action: AnyAction) => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a persona-related action
  if (isAddPersonaAction(action) || isUpdatePersonaAction(action)) {
    // Get the updated state
    const state = store.getState();
    
    // Find the persona that was just added or updated
    let persona;
    if (isAddPersonaAction(action)) {
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
