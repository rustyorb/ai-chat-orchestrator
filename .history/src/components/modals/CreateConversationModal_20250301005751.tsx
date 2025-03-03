import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Checkbox,
  Text,
  useColorModeValue,
  Flex,
  Avatar,
  Box,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import { createConversation } from "../../store/slices/conversationSlice";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";

const CreateConversationModal: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [title, setTitle] = useState("New Conversation");
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>([]);

  const personas = useSelector((state: RootState) => state.personas.personas);
  const bgColor = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.50", "gray.700");

  const handleClose = () => {
    dispatch(closeModal("createConversation"));
  };

  const handleCreate = () => {
    // Generate a unique ID for the new conversation
    const conversationId = uuidv4();

    // Create the conversation using the Redux action
    dispatch(
      createConversation({
        id: conversationId,
        title: title.trim() || "New Conversation",
        participants: selectedPersonas,
      })
    );

    // Close the modal
    handleClose();

    // Navigate to the new conversation
    navigate(`/conversations/${conversationId}`);
  };

  const togglePersona = (personaId: string) => {
    setSelectedPersonas((prev) => {
      if (prev.includes(personaId)) {
        return prev.filter((id) => id !== personaId);
      } else {
        return [...prev, personaId];
      }
    });
  };

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Create New Conversation</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Conversation Title</FormLabel>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a title for your conversation"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Select Participants</FormLabel>
              {personas.length === 0 ? (
                <Text color="gray.500">
                  No personas available. Create a persona first from the
                  Personas tab.
                </Text>
              ) : (
                <VStack
                  spacing={2}
                  align="stretch"
                  maxH="200px"
                  overflowY="auto"
                >
                  {personas.map((persona) => (
                    <Box
                      key={persona.id}
                      p={2}
                      borderRadius="md"
                      border="1px"
                      borderColor={
                        selectedPersonas.includes(persona.id)
                          ? "brand.500"
                          : borderColor
                      }
                      cursor="pointer"
                      _hover={{ bg: hoverBg }}
                      onClick={() => togglePersona(persona.id)}
                    >
                      <Flex align="center">
                        <Checkbox
                          isChecked={selectedPersonas.includes(persona.id)}
                          colorScheme="brand"
                          onChange={() => togglePersona(persona.id)}
                          mr={3}
                        />
                        <Avatar
                          size="sm"
                          name={persona.name}
                          src={persona.avatar}
                          mr={3}
                        />
                        <Text fontWeight="medium">{persona.name}</Text>
                      </Flex>
                    </Box>
                  ))}
                </VStack>
              )}
            </FormControl>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleCreate}
            isDisabled={personas.length > 0 && selectedPersonas.length === 0}
          >
            Create Conversation
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateConversationModal;
