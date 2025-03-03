import { Middleware } from 'redux';
import { websocketService } from '../../services/websocket';
import { RootState } from '../index';

// Middleware to register conversations with the backend
export const conversationMiddleware: Middleware = store => next => (action: any) => {
  // First, let the action go through the reducers
  const result = next(action);
  
  // Then, check if it's a conversation-related action
  if (action.type === 'conversation/createConversation') {
    // Get the updated state
    const state = store.getState() as RootState;
    
    // Find the conversation that was just created
    const conversationId = action.payload.id;
    const conversation = state.conversations.conversations.find(c => c.id === conversationId);
    
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
  }
  
  return result;
};
