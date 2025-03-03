# Testing Guide: Persona Registration Fix

This guide will help you verify that the persona registration issue has been fixed. The problem was that personas were not being properly registered with the backend when starting conversations, causing "Persona not found" errors.

## Setup

1. Run `start-app.bat` to start both the backend and frontend servers
2. Wait for both servers to initialize (backend Python server and frontend Vite server)
3. Open your browser to the URL shown in the frontend console (typically http://localhost:5173)

## Test Procedure

### Test 1: Basic Persona Registration

1. Create at least two personas:
   - Click on "Personas" in the sidebar
   - Click "Create New Persona" 
   - Fill in the details (name, avatar, system prompt, model)
   - Save the personas

2. Create a new conversation:
   - Click on "New Conversation" in the sidebar
   - Add the personas you created to the conversation
   - Click "Create"

3. Start the auto mode:
   - In the conversation view, click the "Start Auto" button
   - Observe the console logs in your browser's developer tools (F12)
   - You should see messages like:
     ```
     🔍 DEBUG - Registering persona before auto mode: [Persona Name]
     ```
   - After a short delay, you should see a message appear from one of the personas

4. Verify successful operation:
   - The conversation should proceed with personas taking turns
   - There should be no "Persona not found" errors in the console
   - The chat should continue automatically until you click "Stop Auto"

### Test 2: WebSocket Reconnection Test

This test verifies that personas are re-registered when the WebSocket reconnects:

1. Start a conversation with personas as in Test 1
2. Stop the conversation
3. In the backend terminal, press Ctrl+C to stop the backend server
4. Restart the backend server (or run `start-app.bat` again)
5. Wait for the WebSocket to reconnect (watch for connection messages in the browser console)
6. Start the auto mode again
7. Verify that the conversation works without "Persona not found" errors

## What Was Fixed

1. Added automatic persona registration when the WebSocket connection is established:
   ```typescript
   // In websocket.ts
   this.socket.onopen = () => {
     // ...
     // Register all personas when connection is established
     this.registerAllPersonas();
     // ...
   };
   ```

2. Added registration of personas before starting a conversation:
   ```typescript
   // In ConversationControls.tsx
   const startAutoMode = () => {
     // ...
     // Register all personas first to ensure they're in the backend
     participants.forEach(participantId => {
       const persona = personas.find(p => p.id === participantId);
       if (persona) {
         websocketService.send('register_persona', {
           persona: persona
         });
       }
     });
     
     // Wait for registration to complete before triggering first turn
     setTimeout(() => {
       // Start the conversation...
     }, 500);
   };
   ```

## Cleanup

When done testing, run `stop-app.bat` to shut down all servers.