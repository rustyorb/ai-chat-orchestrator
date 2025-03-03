import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppSettings, ThemeConfig } from '../../types';

const defaultTheme: ThemeConfig = {
  colorMode: 'light',
  fontSize: 'medium',
  messageSpacing: 'comfortable',
  animationEnabled: true,
};

const initialState: AppSettings = {
  theme: defaultTheme,
  defaultModel: 'gpt-4-turbo',
  autoSaveInterval: 30000, // 30 seconds
  messageDelay: 500, // 500ms
  developerMode: false,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateTheme: (state, action: PayloadAction<Partial<ThemeConfig>>) => {
      state.theme = {
        ...state.theme,
        ...action.payload,
      };
    },
    updateSettings: (state, action: PayloadAction<Partial<AppSettings>>) => {
      console.log("🔍 DEBUG - Settings updated:", {
        previousSettings: {
          messageDelay: state.messageDelay,
          autoSaveInterval: state.autoSaveInterval,
          defaultModel: state.defaultModel,
          developerMode: state.developerMode
        },
        newSettings: action.payload
      });
      
      return {
        ...state,
        ...action.payload,
      };
    },
    toggleDarkMode: (state) => {
      state.theme.colorMode = state.theme.colorMode === 'light' ? 'dark' : 'light';
      
      // Apply the theme change immediately
      const colorMode = state.theme.colorMode;
      document.documentElement.dataset.theme = colorMode;
      
      // Update body background color
      if (colorMode === 'dark') {
        document.body.style.backgroundColor = '#1a202c';
        document.body.style.color = '#f8f9fa';
      } else {
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#1a202c';
      }
    },
    toggleDeveloperMode: (state) => {
      state.developerMode = !state.developerMode;
    },
  },
});

export const {
  updateTheme,
  updateSettings,
  toggleDarkMode,
  toggleDeveloperMode,
} = settingsSlice.actions;

export default settingsSlice.reducer;