import React, { useEffect } from "react";
import { ChakraProvider, Box, Flex, useColorMode } from "@chakra-ui/react";
import { Provider as ReduxProvider, useSelector } from "react-redux";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { store } from "./store";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import ConversationView from "./components/conversation/ConversationView";
import PersonaManagement from "./components/persona/PersonaManagement";
import ModelsManagement from "./components/models/ModelsManagement";
import SettingsView from "./components/settings/SettingsView";
import NotificationSystem from "./components/common/NotificationSystem";
import { db } from "./services/db";
import { websocketService } from "./services/websocket";
import { setPersonas } from "./store/slices/personaSlice";
import { setConversations } from "./store/slices/conversationSlice";
import { setModels } from "./store/slices/modelSlice";
import { updateSettings } from "./store/slices/settingsSlice";
import HomeView from "./components/HomeView";
import { customTheme } from "./theme";
import ModalProvider from "./components/modals/ModalProvider";
import { RootState } from "./store";

// Wrapper component to handle dark mode
const AppContent = () => {
  const { setColorMode } = useColorMode();

  // Get state from Redux store
  const { models } = useSelector((state: RootState) => state.models);
  const { conversations } = useSelector(
    (state: RootState) => state.conversations
  );
  const { personas } = useSelector((state: RootState) => state.personas);
  const settings = useSelector((state: RootState) => state.settings);

  // Apply color mode changes when theme changes
  const colorMode = useSelector(
    (state: RootState) => state.settings.theme.colorMode
  );

  useEffect(() => {
    setColorMode(colorMode);
    console.log("Color mode changed to:", colorMode);
  }, [colorMode, setColorMode]);

  // Initialize the application
  useEffect(() => {
    // Load data from IndexedDB
    const loadInitialData = async () => {
      try {
        // Load personas
        const personas = await db.getPersonas();
        if (personas.length > 0) {
          store.dispatch(setPersonas(personas));
        }

        // Load conversations
        const conversations = await db.getConversations();
        if (conversations.length > 0) {
          store.dispatch(setConversations(conversations));
        }

        // Load models
        const models = await db.getModels();
        if (models.length > 0) {
          store.dispatch(setModels(models));
        }

        // Load settings
        const settings = await db.getSettings();
        if (settings) {
          store.dispatch(updateSettings(settings));
          setColorMode(settings.theme.colorMode);
        }
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    };

    loadInitialData();

    // Check if backend is available before trying to connect
    const checkAndConnectWebsocket = async () => {
      try {
        const response = await fetch("http://localhost:8000/");
        if (response.ok) {
          // Backend is available, enable WebSocket connections
          websocketService.setEnabled(true);
          await websocketService.connect();
        } else {
          console.log(
            "Backend server is not available, WebSocket connections disabled"
          );
          websocketService.setEnabled(false);
        }
      } catch {
        // Ignore error details
        // Ignore error details
        console.log(
          "Backend server is not running, WebSocket connections disabled"
        );
        websocketService.setEnabled(false);
      }
    };

    checkAndConnectWebsocket();

    // Disconnect WebSocket when component unmounts
    return () => {
      websocketService.disconnect();
    };
  }, [setColorMode]);

  // Save models to IndexedDB whenever they change
  useEffect(() => {
    const saveModelsToDb = async () => {
      try {
        // Save each model to the database
        for (const model of models) {
          await db.saveModel(model);
        }
        console.log("Models saved to IndexedDB:", models.length);
      } catch (error) {
        console.error("Failed to save models to IndexedDB:", error);
      }
    };

    // Only save if we have models
    if (models.length > 0) {
      saveModelsToDb();
    }
  }, [models]);

  // Save conversations to IndexedDB whenever they change
  useEffect(() => {
    const saveConversationsToDb = async () => {
      try {
        // Save each conversation to the database
        for (const conversation of conversations) {
          await db.saveConversation(conversation);
        }
        console.log("Conversations saved to IndexedDB:", conversations.length);
      } catch (error) {
        console.error("Failed to save conversations to IndexedDB:", error);
      }
    };

    // Only save if we have conversations
    if (conversations.length > 0) {
      saveConversationsToDb();
    }
  }, [conversations]);

  // Save personas to IndexedDB whenever they change
  useEffect(() => {
    const savePersonasToDb = async () => {
      try {
        // Save each persona to the database
        for (const persona of personas) {
          await db.savePersona(persona);
        }
        console.log("Personas saved to IndexedDB:", personas.length);
      } catch (error) {
        console.error("Failed to save personas to IndexedDB:", error);
      }
    };

    // Only save if we have personas
    if (personas.length > 0) {
      savePersonasToDb();
    }
  }, [personas]);

  // Save settings to IndexedDB whenever they change
  useEffect(() => {
    const saveSettingsToDb = async () => {
      try {
        // Create a serializable copy of settings to avoid proxy objects
        const settingsToSave = JSON.parse(
          JSON.stringify({
            ...settings,
          })
        );
        await db.saveSettings(settingsToSave);
        console.log("Settings saved to IndexedDB");
      } catch (error) {
        console.error(
          "Failed to save settings to IndexedDB:",
          error instanceof Error ? error.message : String(error)
        );
      }
    };

    saveSettingsToDb();
  }, [settings]);

  return (
    <Flex h="100vh" overflow="hidden">
      <Sidebar />
      <Flex direction="column" flex="1" overflow="hidden">
        <Header />
        <Box flex="1" overflow="auto" px="4" py="2">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/conversations" element={<ConversationView />} />
            <Route path="/conversations/:id" element={<ConversationView />} />
            <Route path="/personas" element={<PersonaManagement />} />
            <Route path="/models" element={<ModelsManagement />} />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </Box>
      </Flex>
      <NotificationSystem />
      <ModalProvider />
    </Flex>
  );
};

function App() {
  return (
    <ReduxProvider store={store}>
      <ChakraProvider theme={customTheme}>
        <Router>
          <AppContent />
        </Router>
      </ChakraProvider>
    </ReduxProvider>
  );
}

export default App;
