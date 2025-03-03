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
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { websocketService } from "../../services/websocket";
import {
  addMessage,
  setConversationStatus,
} from "../../store/slices/conversationSlice";
import { Send, Play, Pause, SkipForward, StopCircle } from "lucide-react";
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
  const autoModeRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Get delay from settings
  const settings = useSelector((state: RootState) => state.settings);
  const turnDelay = settings.messageDelay || 2000;

  const personas = useSelector((state: RootState) => state.personas.personas);
  const conversationStatus = useSelector(
    (state: RootState) =>
      state.conversations.conversationStatus[conversationId] || {
        status: "idle",
      }
  );

  const isGenerating = conversationStatus.status === "generating";
  const isPaused = conversationStatus.status === "paused";
  const isStopped = conversationStatus.status === "stopped";

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

    // Update conversation status
    dispatch(
      setConversationStatus({
        conversationId,
        status: "idle",
      })
    );

    // If in auto mode, trigger the next turn after a short delay
    if (isAutoMode) {
      setTimeout(() => {
        triggerNextTurn();
      }, 500);
    }

    // Focus the textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const handlePause = () => {
    console.log("🔍 DEBUG - Pausing conversation:", conversationId);

    if (isPaused) {
      // Resume the conversation
      dispatch(
        setConversationStatus({
          conversationId,
          status: "idle",
        })
      );

      // If auto mode was on, restart it
      if (isAutoMode) {
        startAutoMode();
      }
    } else {
      // Pause the conversation
      dispatch(
        setConversationStatus({
          conversationId,
          status: "paused",
        })
      );

      // If auto mode was on, stop it
      if (isAutoMode) {
        clearAutoModeInterval();
      }
    }
  };

  const handleStop = () => {
    console.log("🔍 DEBUG - Stopping conversation:", conversationId);

    // Stop the conversation
    dispatch(
      setConversationStatus({
        conversationId,
        status: "stopped",
      })
    );

    // If auto mode was on, stop it
    if (isAutoMode) {
      clearAutoModeInterval();
      setAutoMode(false);
    }

    // Send stop signal to the server
    websocketService.send("stop_generation", {
      conversation_id: conversationId,
    });
  };

  const clearAutoModeInterval = () => {
    if (autoModeRef.current) {
      clearInterval(autoModeRef.current);
      autoModeRef.current = null;
    }
  };

  const resetConversation = () => {
    // Reset the conversation to idle state
    dispatch(
      setConversationStatus({
        conversationId,
        status: "idle",
      })
    );

    if (isAutoMode) {
      clearAutoModeInterval();
      setAutoMode(false);
    }
  };

  // Handle export functionality
  const handleExport = (format: "json" | "markdown" | "text") => {
    console.log("🔍 DEBUG - Exporting conversation:", {
      conversationId,
      format,
    });

    // Open the export modal with this conversation pre-selected
    dispatch({
      type: "ui/openModal",
      payload: "export",
    });

    // The export modal will handle the actual export
  };

  const triggerNextTurn = async () => {
    if (isGenerating || isPaused || isStopped) {
      console.log(
        "🔍 DEBUG - Skipping next turn due to status:",
        conversationStatus.status
      );
      return;
    }

    console.log("🔍 DEBUG - Triggering next turn:", {
      conversationId,
      isAutoMode,
      timestamp: new Date().toISOString(),
    });

    // Update conversation status to generating
    dispatch(
      setConversationStatus({
        conversationId,
        status: "generating",
      })
    );

    try {
      // Send a WebSocket message to get the next turn
      websocketService.send("multi_agent_next_turn", {
        conversation_id: conversationId,
      });

      // The response will be handled by the WebSocket event listeners
    } catch (error) {
      console.error("Error triggering next turn:", error);

      // Reset status on error
      dispatch(
        setConversationStatus({
          conversationId,
          status: "idle",
        })
      );
    }
  };

  const startAutoMode = () => {
    console.log("🔍 DEBUG - Starting auto mode with delay:", turnDelay);

    if (isPaused || isStopped) {
      // Reset the conversation state first
      resetConversation();
    }

    setAutoMode(true);

    // Register all personas first to ensure they're in the backend
    participants.forEach((participantId) => {
      const persona = personas.find((p) => p.id === participantId);
      if (persona) {
        console.log(
          `🔍 DEBUG - Registering persona before auto mode: ${persona.name}`
        );
        websocketService.send("register_persona", {
          persona: persona,
        });
      }
    });

    // Wait a moment for registration to complete before triggering first turn
    setTimeout(() => {
      // Trigger first turn
      if (!isGenerating) {
        triggerNextTurn();
      }

      // Set up a timer to trigger the next turn after a delay
      autoModeRef.current = setInterval(() => {
        console.log("🔍 DEBUG - Auto mode interval triggered");

        // Only trigger next turn if not currently generating
        if (
          conversationStatus.status !== "generating" &&
          conversationStatus.status !== "paused" &&
          conversationStatus.status !== "stopped"
        ) {
          triggerNextTurn();
        }
      }, turnDelay);
    }, 500); // Short delay to allow registration to complete
  };

  const stopAutoMode = () => {
    console.log("🔍 DEBUG - Stopping auto mode");
    setAutoMode(false);
    clearAutoModeInterval();
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
              <HStack spacing={2}>
                <FormLabel htmlFor="auto-mode" mb="0" fontSize="sm">
                  Auto
                </FormLabel>
                <Switch
                  id="auto-mode"
                  isChecked={isAutoMode}
                  onChange={() =>
                    isAutoMode ? stopAutoMode() : startAutoMode()
                  }
                  colorScheme="brand"
                  isDisabled={isStopped}
                />
              </HStack>
            </FormControl>

            <HStack spacing={1}>
              <Tooltip label="Next Turn">
                <IconButton
                  aria-label="Next Turn"
                  icon={<SkipForward size={18} />}
                  size="sm"
                  onClick={triggerNextTurn}
                  isDisabled={
                    isAutoMode || isGenerating || isPaused || isStopped
                  }
                />
              </Tooltip>

              <Tooltip label={isPaused ? "Resume" : "Pause"}>
                <IconButton
                  aria-label={isPaused ? "Resume" : "Pause"}
                  icon={<Pause size={18} />}
                  size="sm"
                  onClick={handlePause}
                  isDisabled={isStopped}
                  colorScheme={isPaused ? "yellow" : undefined}
                />
              </Tooltip>

              <Tooltip label="Stop">
                <IconButton
                  aria-label="Stop"
                  icon={<StopCircle size={18} />}
                  size="sm"
                  onClick={handleStop}
                  isDisabled={isStopped}
                  colorScheme={isStopped ? "red" : undefined}
                />
              </Tooltip>
            </HStack>
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
          isDisabled={isStopped}
        />

        <Flex justify="space-between" align="center">
          <HStack>
            <Button
              leftIcon={isAutoMode ? <Pause size={18} /> : <Play size={18} />}
              onClick={() => (isAutoMode ? stopAutoMode() : startAutoMode())}
              size="sm"
              colorScheme={isAutoMode ? "red" : "green"}
              isDisabled={isStopped}
            >
              {isAutoMode ? "Stop Auto" : "Start Auto"}
            </Button>
            <Menu>
              <MenuButton as={Button} size="sm" variant="outline">
                Export
              </MenuButton>
              <MenuList>
                <MenuItem onClick={() => handleExport("json")}>JSON</MenuItem>
                <MenuItem onClick={() => handleExport("markdown")}>
                  Markdown
                </MenuItem>
                <MenuItem onClick={() => handleExport("text")}>
                  Plain Text
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
          <HStack>
            {isGenerating && (
              <Text fontSize="sm" color="gray.500">
                Generating...
              </Text>
            )}
            <Button
              rightIcon={<Send size={18} />}
              onClick={handleSendMessage}
              isDisabled={!message.trim() || isStopped}
              colorScheme="brand"
            >
              Send
            </Button>
          </HStack>
        </Flex>
      </VStack>
    </Box>
  );
};

export default ConversationControls;
