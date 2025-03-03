import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UIState {
  sidebarOpen: boolean;
  modalOpen: {
    createPersona: boolean;
    editPersona: boolean;
    createConversation: boolean;
    settings: boolean;
    modelConfig: boolean;
    export: boolean;
    import: boolean;
  };
  activeTab: 'conversations' | 'personas' | 'models' | 'settings';
  loadingStates: {
    [key: string]: boolean;
  };
  notifications: Notification[];
  draggingPersonaId: string | null;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  duration?: number;
}

const initialState: UIState = {
  sidebarOpen: true,
  modalOpen: {
    createPersona: false,
    editPersona: false,
    createConversation: false,
    settings: false,
    modelConfig: false,
    export: false,
    import: false,
  },
  activeTab: 'conversations',
  loadingStates: {},
  notifications: [],
  draggingPersonaId: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
      console.log("toggleSidebar action triggered - new state:", state.sidebarOpen);
    },
    openModal: (state, action: PayloadAction<keyof UIState['modalOpen']>) => {
      console.log("openModal action triggered for:", action.payload);
      state.modalOpen[action.payload] = true;
      console.log("Modal state after update:", state.modalOpen);
    },
    closeModal: (state, action: PayloadAction<keyof UIState['modalOpen']>) => {
      console.log("closeModal action triggered for:", action.payload);
      state.modalOpen[action.payload] = false;
    },
    setActiveTab: (state, action: PayloadAction<UIState['activeTab']>) => {
      state.activeTab = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; value: boolean }>) => {
      state.loadingStates[action.payload.key] = action.payload.value;
    },
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id'>>) => {
      const id = Date.now().toString();
      state.notifications.push({
        id,
        ...action.payload,
        duration: action.payload.duration || 5000,
      });
    },
    removeNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    setDraggingPersonaId: (state, action: PayloadAction<string | null>) => {
      state.draggingPersonaId = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  openModal,
  closeModal,
  setActiveTab,
  setLoading,
  addNotification,
  removeNotification,
  setDraggingPersonaId,
} = uiSlice.actions;

export default uiSlice.reducer;