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
    }).concat(personaMiddleware, modelMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
