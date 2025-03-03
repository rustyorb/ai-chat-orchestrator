import { Middleware } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';

// Middleware to register models with the backend
export const modelMiddleware: Middleware = store => next => (action: any) => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a model-related action
  if (action.type === 'model/addModel' || action.type === 'model/updateModel') {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Find the model that was just added or updated
    let model;
    if (action.type === 'model/addModel') {
      // For addModel, it's the last one in the array
      model = state.models.models[state.models.models.length - 1];
    } else {
      // For updateModel, find it by ID
      model = state.models.models.find(m => m.id === action.payload.id);
    }
    
    // If we found the model, register it with the backend
    if (model) {
      console.log(`Registering model with backend: ${model.name} (${model.id})`);
      
      // Send a WebSocket message to register the model
      websocketService.send('register_model', {
        model: model
      });
    }
  }
  
  return result;
};
