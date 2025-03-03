import { Middleware } from 'redux';
import { RootState } from '../index';
import { db } from '../../services/db';

// Middleware to persist models to IndexedDB
export const modelPersistenceMiddleware: Middleware = store => next => (action: any) => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a model-related action that should trigger persistence
  if (
    action.type === 'model/addModel' || 
    action.type === 'model/updateModel' || 
    action.type === 'model/deleteModel' ||
    action.type === 'model/setModels'
  ) {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Persist all models to IndexedDB
    const models = state.models.models;
    console.log(`Persisting ${models.length} models to IndexedDB...`);
    
    // Save each model individually
    models.forEach(async (model) => {
      try {
        await db.saveModel(model);
        console.log(`Model saved to IndexedDB: ${model.name} (${model.id})`);
      } catch (error) {
        console.error(`Error saving model to IndexedDB: ${error}`);
      }
    });
  }
  
  return result;
};