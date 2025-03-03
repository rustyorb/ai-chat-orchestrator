import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conversation, Message } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface ConversationState {
  conversations: Conversation[];
  activeConversationId: string | null;
  conversationStatus: {
    [conversationId: string]: {
      status: 'idle' | 'generating' | 'paused' | 'stopped';
      currentSpeakerId?: string;
      lastMessageId?: string;
    };
  };
  isLoading: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  conversations: [],
  activeConversationId: null,
  conversationStatus: {},
  isLoading: false,
  error: null,
};

const conversationSlice = createSlice({
  name: 'conversation',
  initialState,
  reducers: {
    createConversation: (state, action: PayloadAction<{ id?: string; title: string; participants: string[] }>) => {
      const newConversation: Conversation = {
        id: action.payload.id || uuidv4(),
        title: action.payload.title,
        created: Date.now(),
        updated: Date.now(),
        participants: action.payload.participants,
        messages: [],
        isActive: true,
      };
      
      console.log('🔍 DEBUG - Creating conversation:', newConversation.id, newConversation.title);
      
      state.conversations.push(newConversation);
      state.activeConversationId = newConversation.id;
      
      // Initialize conversation status
      state.conversationStatus[newConversation.id] = {
        status: 'idle'
      };
      
      console.log('🔍 DEBUG - Conversation status initialized:', state.conversationStatus[newConversation.id]);
    },
    updateConversation: (state, action: PayloadAction<Partial<Conversation> & { id: string }>) => {
      const index = state.conversations.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.conversations[index] = {
          ...state.conversations[index],
          ...action.payload,
          updated: Date.now(),
        };
      }
    },
    deleteConversation: (state, action: PayloadAction<string>) => {
      state.conversations = state.conversations.filter(c => c.id !== action.payload);
      if (state.activeConversationId === action.payload) {
        state.activeConversationId = state.conversations.length > 0 ? state.conversations[0].id : null;
      }
    },
    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action: PayloadAction<Omit<Message, 'id' | 'timestamp'>>) => {
      const conversationIndex = state.conversations.findIndex(
        c => c.id === action.payload.conversationId
      );
      
      if (conversationIndex !== -1) {
        const newMessage: Message = {
          ...action.payload,
          id: uuidv4(),
          timestamp: Date.now(),
        };
        
        console.log('🔍 DEBUG - Adding message:', {
          id: newMessage.id,
          conversationId: newMessage.conversationId,
          senderId: newMessage.senderId,
          contentLength: newMessage.content?.length || 0
        });
        
        state.conversations[conversationIndex].messages.push(newMessage);
        state.conversations[conversationIndex].updated = Date.now();
        
        // Update conversation status when user sends a message
        if (newMessage.senderType === 'user') {
          state.conversationStatus[newMessage.conversationId] = {
            status: 'idle',
            lastMessageId: newMessage.id
          };
        }
      }
    },
    updateMessage: (state, action: PayloadAction<Partial<Message> & { id: string; conversationId: string }>) => {
      const conversationIndex = state.conversations.findIndex(
        c => c.id === action.payload.conversationId
      );
      
      if (conversationIndex !== -1) {
        const messageIndex = state.conversations[conversationIndex].messages.findIndex(
          m => m.id === action.payload.id
        );
        
        if (messageIndex !== -1) {
          const prevContent = state.conversations[conversationIndex].messages[messageIndex].content;
          const newContent = action.payload.content;
          
          // If content changed significantly, it's not just a chunk update
          const isCompleteMessage = 
            newContent && 
            prevContent !== newContent && 
            (prevContent === '...' || newContent.length > prevContent.length + 20);
            
          if (isCompleteMessage) {
            console.log('🔍 DEBUG - Message complete:', {
              id: action.payload.id,
              contentLength: newContent?.length || 0
            });
          }
          
          state.conversations[conversationIndex].messages[messageIndex] = {
            ...state.conversations[conversationIndex].messages[messageIndex],
            ...action.payload,
          };
          state.conversations[conversationIndex].updated = Date.now();
          
          // Update conversation status if message is complete
          if (isCompleteMessage && action.payload.metadata?.isGenerating === false) {
            state.conversationStatus[action.payload.conversationId] = {
              status: 'idle',
              lastMessageId: action.payload.id
            };
          }
        }
      }
    },
    deleteMessage: (state, action: PayloadAction<{ id: string; conversationId: string }>) => {
      const conversationIndex = state.conversations.findIndex(
        c => c.id === action.payload.conversationId
      );
      
      if (conversationIndex !== -1) {
        state.conversations[conversationIndex].messages = state.conversations[conversationIndex].messages.filter(
          m => m.id !== action.payload.id
        );
        state.conversations[conversationIndex].updated = Date.now();
      }
    },
    createBranch: (
      state,
      action: PayloadAction<{
        parentId: string;
        branchId: string;
        startFromMessageId: string;
        title: string;
      }>
    ) => {
      const { parentId, branchId, startFromMessageId, title } = action.payload;
      const parentIndex = state.conversations.findIndex(c => c.id === parentId);
      
      if (parentIndex !== -1) {
        const parentConversation = state.conversations[parentIndex];
        const messageIndex = parentConversation.messages.findIndex(m => m.id === startFromMessageId);
        
        if (messageIndex !== -1) {
          // Create messages for the branch up to the specified message
          const branchMessages = parentConversation.messages.slice(0, messageIndex + 1);
          
          // Create the branch conversation
          const branch: Conversation = {
            id: branchId,
            title,
            created: Date.now(),
            updated: Date.now(),
            participants: [...parentConversation.participants],
            messages: branchMessages,
            parentId,
            isActive: true,
          };
          
          // Initialize branches object if it doesn't exist
          if (!parentConversation.branches) {
            parentConversation.branches = {};
          }
          
          // Add the branch to the parent conversation
          parentConversation.branches[branchId] = branch;
          
          // Also add as a separate conversation for easier access
          state.conversations.push(branch);
          
          // Set this as the active conversation
          state.activeConversationId = branchId;
        }
      }
    },
    setConversations: (state, action: PayloadAction<Conversation[]>) => {
      state.conversations = action.payload;
    },
    setConversationLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setConversationError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setConversationStatus: (state, action: PayloadAction<{ 
      conversationId: string; 
      status: 'idle' | 'generating' | 'paused' | 'stopped';
      currentSpeakerId?: string;
    }>) => {
      const { conversationId, status, currentSpeakerId } = action.payload;
      
      console.log('🔍 DEBUG - Setting conversation status:', {
        conversationId,
        status,
        currentSpeakerId
      });
      
      state.conversationStatus[conversationId] = {
        status,
        currentSpeakerId,
        lastMessageId: state.conversationStatus[conversationId]?.lastMessageId
      };
    },
  },
});

export const {
  createConversation,
  updateConversation,
  deleteConversation,
  setActiveConversation,
  addMessage,
  updateMessage,
  deleteMessage,
  createBranch,
  setConversations,
  setConversationLoading,
  setConversationError,
  setConversationStatus,
} = conversationSlice.actions;

export default conversationSlice.reducer;