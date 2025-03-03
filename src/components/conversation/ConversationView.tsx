import React, { useEffect } from "react";
import MessageBubble from "./MessageBubble";
import ConversationControls from "./ConversationControls";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  useColorModeValue,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { openModal } from "../../store/slices/uiSlice";
import { setActiveConversation } from "../../store/slices/conversationSlice";
import {
  MessageSquare,
  Plus,
  MoreVertical,
  Archive,
  Trash,
  Copy,
  Share,
  Download,
} from "lucide-react";

const ConversationView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const conversations = useSelector(
    (state: RootState) => state.conversations.conversations
  );
  const activeConversationId = useSelector(
    (state: RootState) => state.conversations.activeConversationId
  );

  const cardBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  useEffect(() => {
    if (id && id !== activeConversationId) {
      dispatch(setActiveConversation(id));
    } else if (!id && conversations.length > 0 && !activeConversationId) {
      navigate(`/conversations/${conversations[0].id}`);
    }
  }, [id, activeConversationId, conversations, dispatch, navigate]);

  const activeConversation = useSelector((state: RootState) => {
    if (!activeConversationId) return null;
    return state.conversations.conversations.find(
      (c) => c.id === activeConversationId
    );
  });

  // If no conversations exist yet
  if (conversations.length === 0) {
    return (
      <Flex direction="column" align="center" justify="center" h="full" py={10}>
        <Box
          bg={cardBg}
          p={8}
          borderRadius="lg"
          boxShadow="md"
          maxW="600px"
          w="full"
          textAlign="center"
        >
          <MessageSquare
            size={60}
            color="gray"
            style={{ margin: "0 auto 20px" }}
          />
          <Heading size="lg" mb={4}>
            No Conversations Yet
          </Heading>
          <Text mb={6}>
            Start your first conversation with AI personas to see it here
          </Text>
          <Button
            leftIcon={<Plus size={18} />}
            colorScheme="brand"
            size="lg"
            onClick={() => dispatch(openModal("createConversation"))}
          >
            Create New Conversation
          </Button>
        </Box>
      </Flex>
    );
  }

  // If no active conversation is selected
  if (!activeConversation) {
    return (
      <Flex justify="center" align="center" h="full">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          Select a conversation from the sidebar or create a new one
        </Alert>
      </Flex>
    );
  }

  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">{activeConversation.title}</Heading>
        <Menu>
          <MenuButton
            as={IconButton}
            aria-label="Conversation options"
            icon={<MoreVertical size={20} />}
            variant="ghost"
          />
          <MenuList>
            <MenuItem icon={<Archive size={16} />}>
              Archive Conversation
            </MenuItem>
            <MenuItem icon={<Copy size={16} />}>Create Branch</MenuItem>
            <MenuItem icon={<Share size={16} />}>Share Conversation</MenuItem>
            <MenuItem icon={<Download size={16} />}>
              Export Conversation
            </MenuItem>
            <Divider />
            <MenuItem icon={<Trash size={16} />} color="red.500">
              Delete Conversation
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      <Box
        bg={cardBg}
        borderRadius="md"
        boxShadow="sm"
        border="1px"
        borderColor={borderColor}
        p={4}
        minH="500px"
        maxH="600px"
        overflowY="auto"
        id="conversation-messages"
      >
        {activeConversation.messages &&
        activeConversation.messages.length > 0 ? (
          <VStack spacing={4} align="stretch">
            {activeConversation.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </VStack>
        ) : (
          <Flex
            direction="column"
            align="center"
            justify="center"
            h="full"
            color="gray.500"
          >
            <MessageSquare size={40} />
            <Text mt={4}>No messages yet</Text>
            <Text fontSize="sm">
              Start the conversation or use auto-run to begin AI interactions
            </Text>
          </Flex>
        )}
      </Box>

      <Box mt={4}>
        <ConversationControls
          conversationId={activeConversation.id}
          participants={activeConversation.participants || []}
        />
      </Box>
    </Box>
  );
};

export default ConversationView;
