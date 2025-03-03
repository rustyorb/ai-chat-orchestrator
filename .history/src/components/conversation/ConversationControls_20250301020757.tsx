import React, { useState, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Textarea,
  IconButton,
  HStack,
  Switch,
  FormControl,
  FormLabel,
  Tooltip,
  useColorModeValue,
  Text,
  VStack,
  Divider,
  Badge,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { websocketService } from "../../services/websocket";
import { addMessage } from "../../store/slices/conversationSlice";
import { Send, Play, Pause, SkipForward } from "lucide-react";
import { Message } from "../../types";

interface ConversationControlsProps {
  conversationId: string;
  participants: string[];
}

const ConversationControls: React.FC<ConversationControlsProps> = ({
  conversationId,
  participants,
}) => {
  const dispatch = useDispatch();
  const [message, setMessage] = useState("");
  const [isAutoMode, setAutoMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const autoModeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fixed delay of 2 seconds between turns
  const turnDelay = 2000;

  const personas = useSelector((state: RootState) => state.personas.personas);
  const user = { id: "user", name: "You" };

  const borderColor = useColorModeValue("gray.200", "gray.600");
  const bgColor = useColorModeValue("white", "gray.800");

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Create a new message object
    const newMessage: Omit<Message, "id" | "timestamp"> = {
      conversationId,
      senderId: user.id,
      senderType: "user",
      content: message,
      replyToId: undefined,
      metadata: undefined,
    };

    // Add the message to the conversation
    dispatch(addMessage(newMessage));

    // Clear the input
    setMessage("");

    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }

    // If in auto mode, trigger the next turn
    if (isAutoMode) {
      triggerNextTurn();
    }
  };

  const triggerNextTurn = async () => {
    if (isGenerating) return;

    setIsGenerating(true);

    try {
      // Send a WebSocket message to get the next turn
      websocketService.send("multi_agent_next_turn", {
        conversation_id: conversationId,
      });

      // The response will be handled by the WebSocket event listeners
    } catch (error) {
      console.error("Error triggering next turn:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startAutoMode = () => {
    setAutoMode(true);
    triggerNextTurn();

    // Set up a timer to trigger the next turn after a delay
    autoModeRef.current = setInterval(() => {
      triggerNextTurn();
    }, turnDelay);
  };

  const stopAutoMode = () => {
    setAutoMode(false);
    if (autoModeRef.current) {
      clearInterval(autoModeRef.current);
      autoModeRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="md"
      p={4}
      bg={bgColor}
    >
      <VStack spacing={4} align="stretch">
        <Flex justify="space-between" align="center">
          <Text fontWeight="medium">Conversation Controls</Text>
          <HStack>
            <FormControl display="flex" alignItems="center" width="auto">
              <FormLabel htmlFor="auto-mode" mb="0" fontSize="sm">
                Auto Mode
              </FormLabel>
              <Switch
                id="auto-mode"
                isChecked={isAutoMode}
                onChange={() => (isAutoMode ? stopAutoMode() : startAutoMode())}
                colorScheme="brand"
              />
            </FormControl>
            <Tooltip label="Next Turn">
              <IconButton
                aria-label="Next Turn"
                icon={<SkipForward size={18} />}
                size="sm"
                onClick={triggerNextTurn}
                isDisabled={isAutoMode || isGenerating}
              />
            </Tooltip>
            {/* Removed non-functional settings button */}
          </HStack>
        </Flex>

        <Divider />

        <Box>
          <Text fontSize="sm" mb={2}>
            Participants:
          </Text>
          <Flex wrap="wrap" gap={2}>
            <Badge colorScheme="blue">You</Badge>
            {participants.map((participantId) => {
              const persona = personas.find((p) => p.id === participantId);
              return (
                <Badge key={participantId} colorScheme="green">
                  {persona ? persona.name : participantId}
                </Badge>
              );
            })}
          </Flex>
        </Box>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message here..."
          rows={3}
          resize="none"
        />

        <Flex justify="space-between">
          <Button
            leftIcon={isAutoMode ? <Pause size={18} /> : <Play size={18} />}
            onClick={() => (isAutoMode ? stopAutoMode() : startAutoMode())}
            size="sm"
            colorScheme={isAutoMode ? "red" : "green"}
          >
            {isAutoMode ? "Stop Auto" : "Start Auto"}
          </Button>
          <Button
            rightIcon={<Send size={18} />}
            onClick={handleSendMessage}
            isDisabled={!message.trim()}
            colorScheme="brand"
          >
            Send
          </Button>
        </Flex>
      </VStack>
    </Box>
  );
};

export default ConversationControls;
