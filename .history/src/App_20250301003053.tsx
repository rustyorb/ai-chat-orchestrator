import React, { useEffect } from "react";
import { ChakraProvider, Box, Flex, useColorMode } from "@chakra-ui/react";
import { Provider as ReduxProvider } from "react-redux";
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

// Wrapper component to handle dark mode
const AppContent = () => {
  const { setColorMode } = useColorMode();

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
