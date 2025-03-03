import { configureStore } from '@reduxjs/toolkit';
import personaReducer from './slices/personaSlice';
import conversationReducer from './slices/conversationSlice';
import modelReducer from './slices/modelSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import { personaMiddleware } from './middleware/personaMiddleware';
import { modelMiddleware } from './middleware/modelMiddleware';
import { conversationMiddleware } from './middleware/conversationMiddleware';
import { modelPersistenceMiddleware } from './middleware/modelPersistenceMiddleware';
import { settingsPersistenceMiddleware } from './middleware/settingsPersistenceMiddleware';

export const store = configureStore({
  reducer: {
    personas: personaReducer,
    conversations: conversationReducer,
    models: modelReducer,
    settings: settingsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(
      personaMiddleware, 
      modelMiddleware, 
      conversationMiddleware, 
      modelPersistenceMiddleware,
      settingsPersistenceMiddleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Log initial state
console.log('🔍 DEBUG - Initial Redux State:', {
  conversations: store.getState().conversations,
  ui: { 
    modalOpen: store.getState().ui.modalOpen,
    notifications: store.getState().ui.notifications.length 
  }, 
  settings: store.getState().settings,
  personas: store.getState().personas.personas.length,
  models: store.getState().models.models.length
});

// Subscribe to store changes to track conversation creation
store.subscribe(() => {
  const state = store.getState();
  console.log('🔍 DEBUG - State updated:', {
    conversationsCount: state.conversations.conversations.length,
    activeConversation: state.conversations.activeConversationId, 
    modalOpen: state.ui.modalOpen
  });
});
