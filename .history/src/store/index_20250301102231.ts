import { configureStore } from '@reduxjs/toolkit';
import personaReducer from './slices/personaSlice';
import conversationReducer from './slices/conversationSlice';
import modelReducer from './slices/modelSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import { personaMiddleware } from './middleware/personaMiddleware';
import { modelMiddleware } from './middleware/modelMiddleware';
import { conversationMiddleware } from './middleware/conversationMiddleware';

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
    }).concat(personaMiddleware, modelMiddleware, conversationMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Log initial state
console.log('🔍 DEBUG - Initial Redux State:', {
  conversations: store.getState().conversations,
  ui: {
    activeModal: store.getState().ui.activeModal,
    notifications: store.getState().ui.notifications?.length || 0
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
    activeModal: state.ui.activeModal
  });
});
