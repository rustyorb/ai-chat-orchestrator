import { Middleware } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';

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
      hasMessages: conversation?.messages?.length > 0
    });
    
    // If we found the conversation and it has participants, register it with the backend
    if (conversation && conversation.participants && conversation.participants.length > 0) {
      console.log(`Starting multi-agent conversation: ${conversation.title} (${conversation.id})`);
      
      // Send a WebSocket message to start the multi-agent conversation
      websocketService.send('multi_agent_start', {
        conversation_id: conversation.id,
        participants: conversation.participants,
        initial_message: conversation.messages[0] || {}
      });
    }
  } else if (action.type === 'conversation/createBranch') {
    console.log("🔍 DEBUG - Creating branch:", {
      parentId: action.payload.parentId,
      branchId: action.payload.branchId,
      startFromMessageId: action.payload.startFromMessageId,
      title: action.payload.title
    });
  }
  
  return result;
};
