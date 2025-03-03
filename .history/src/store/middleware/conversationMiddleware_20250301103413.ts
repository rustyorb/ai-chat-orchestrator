import { Middleware } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';
import { v4 as uuidv4 } from 'uuid';

// Middleware to register conversations with the backend
export const conversationMiddleware: Middleware = store => next => (action: any) => {
  // First, let the action go through the reducers
  console.log("🔍 DEBUG - Conversation middleware action:", action.type);
  
  const result = next(action);
  
  // Then, check if it's a conversation-related action
  if (action.type === 'conversation/createConversation') {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Find the conversation that was just created
    const conversationId = action.payload.id;
    const conversation = state.conversations.conversations.find(c => c.id === conversationId);
    
    console.log("🔍 DEBUG - Creating conversation:", {
      id: conversationId,
      title: conversation?.title,
      participants: conversation?.participants,
      hasMessages: (conversation?.messages && conversation.messages.length > 0
) || false
    });
    
    // If we found the conversation and it has participants, register it with the backend
    if (conversation && conversation.participants && conversation.participants.length > 0) {
      console.log(`Starting multi-agent conversation: ${conversation.title} (${conversation.id})`);
      
      // Send a WebSocket message to start the multi-agent conversation
      websocketService.send('multi_agent_start', {
        conversation_id: conversation.id,
        thread_id: uuidv4(), // Generate a unique thread ID for the conversation
        participants: conversation.participants,
        initial_message: conversation.messages[0] || {}
      });
    }
  } else if (action.type === 'conversation/createBranch') {
    // Handle branch creation
    const { parentId, branchId, title } = action.payload;
    
    console.log("🔍 DEBUG - Creating conversation branch:", {
      parentId,
      branchId,
      title
    });
    
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Find the branch that was just created
    const branch = state.conversations.conversations.find(c => c.id === branchId);
    
    if (branch && branch.participants && branch.participants.length > 0) {
      // Send a WebSocket message to start the branched conversation
      websocketService.send('multi_agent_branch', {
        conversation_id: branchId,
        parent_id: parentId,
        thread_id: uuidv4(), // Generate a unique thread ID for the branch
        participants: branch.participants,
        initial_messages: branch.messages || []
      });
    }
  } else if (action.type === 'ui/openModal' && action.payload === 'export') {
    // Pre-select the active conversation for export
    const state = store.getState() as RootState;
    const activeConversationId = state.conversations.activeConversationId;
    
    if (activeConversationId) {
      console.log("🔍 DEBUG - Pre-selecting conversation for export:", activeConversationId);
      
      // Don't need to do anything here - the ExportModal component already checks for activeConversationId
    }
  }
  
  return result;
};
