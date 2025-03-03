import { Middleware } from 'redux';
import { RootState } from '../index';
import { db } from '../../services/db';

// Middleware to persist settings to IndexedDB
export const settingsPersistenceMiddleware: Middleware = store => next => (action: any) => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a settings-related action that should trigger persistence
  if (
    action.type === 'settings/updateSettings' || 
    action.type === 'settings/updateTheme' || 
    action.type === 'settings/toggleDarkMode' ||
    action.type === 'settings/toggleDeveloperMode'
  ) {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Persist settings to IndexedDB
    const settings = state.settings;
    console.log(`Persisting settings to IndexedDB...`);
    
    // Save settings
    try {
      db.saveSettings(settings)
        .then(() => console.log('Settings saved to IndexedDB successfully'))
        .catch(err => console.error('Error saving settings to IndexedDB:', err));
    } catch (error) {
      console.error(`Error saving settings to IndexedDB: ${error}`);
    }
  }
  
  return result;
};