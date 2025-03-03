import React, { useState, useEffect } from "react";
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
  Textarea,
  VStack,
  Select,
  HStack,
  Avatar,
  AvatarBadge,
  IconButton,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  FormHelperText,
  useColorModeValue,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Grid,
  GridItem,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import { addPersona, updatePersona } from "../../store/slices/personaSlice";
import { Edit, X } from "lucide-react";

interface CreatePersonaModalProps {
  isEditing?: boolean;
  personaId?: string;
}

const CreatePersonaModal: React.FC<CreatePersonaModalProps> = ({
  isEditing = false,
  personaId,
}) => {
  const dispatch = useDispatch();
  const models = useSelector((state: RootState) => state.models.models);
  const personas = useSelector((state: RootState) => state.personas.personas);

  const editingPersona =
    isEditing && personaId ? personas.find((p) => p.id === personaId) : null;

  // Form state
  const [name, setName] = useState(editingPersona?.name || "");
  const [avatar, setAvatar] = useState(editingPersona?.avatar || "");
  const [systemPrompt, setSystemPrompt] = useState(
    editingPersona?.systemPrompt || ""
  );
  const [modelId, setModelId] = useState(
    editingPersona?.modelId || models[0]?.id || ""
  );
  const [conversationStyle, setConversationStyle] = useState(
    editingPersona?.conversationStyle || "helpful"
  );

  // Model parameters
  const [temperature, setTemperature] = useState(
    editingPersona?.parameters?.temperature || 0.7
  );
  const [maxTokens, setMaxTokens] = useState(
    editingPersona?.parameters?.maxTokens || 2000
  );

  // Memory settings
  const [messageLimit, setMessageLimit] = useState(
    editingPersona?.memorySettings?.messageLimit || 10
  );
  const [useSearchMemory, setUseSearchMemory] = useState(
    editingPersona?.memorySettings?.useSearchMemory || false
  );

  const bgColor = useColorModeValue("white", "gray.800");

  // Load the model's default parameters when model changes
  useEffect(() => {
    const selectedModel = models.find((m) => m.id === modelId);
    if (selectedModel && !isEditing) {
      setTemperature(selectedModel.defaultParams.temperature);
      setMaxTokens(selectedModel.defaultParams.maxTokens || 2000);
    }
  }, [modelId, models, isEditing]);

  const handleClose = () => {
    dispatch(closeModal(isEditing ? "editPersona" : "createPersona"));
  };

  const handleSave = () => {
    const personaData = {
      name: name.trim(),
      avatar,
      systemPrompt: systemPrompt.trim(),
      modelId,
      parameters: {
        temperature,
        maxTokens,
      },
      memorySettings: {
        messageLimit,
        useSearchMemory,
      },
      conversationStyle,
    };

    if (isEditing && personaId) {
      dispatch(
        updatePersona({
          id: personaId,
          ...personaData,
        })
      );
    } else {
      dispatch(
        addPersona({
          ...personaData,
        })
      );
    }

    handleClose();
  };

  const isFormValid =
    name.trim() !== "" && systemPrompt.trim() !== "" && modelId !== "";

  return (
    <Modal isOpen={true} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxW="800px">
        <ModalHeader>
          {isEditing ? "Edit Persona" : "Create New Persona"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>Basic Info</Tab>
              <Tab>Model Parameters</Tab>
              <Tab>Memory Settings</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <HStack spacing={6} align="start">
                    <Avatar size="xl" name={name || "New Persona"} src={avatar}>
                      <AvatarBadge boxSize="1.25em" bg="gray.200">
                        <IconButton
                          aria-label="Change avatar"
                          icon={avatar ? <X size={12} /> : <Edit size={12} />}
                          size="xs"
                          isRound
                          onClick={() =>
                            setAvatar(
                              avatar
                                ? ""
                                : `https://api.dicebear.com/7.x/thumbs/svg?seed=${Math.random()}`
                            )
                          }
                        />
                      </AvatarBadge>
                    </Avatar>

                    <FormControl isRequired>
                      <FormLabel>Persona Name</FormLabel>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Helpful Assistant, Code Expert"
                      />
                    </FormControl>
                  </HStack>

                  <FormControl isRequired>
                    <FormLabel>Select Model</FormLabel>
                    <Select
                      value={modelId}
                      onChange={(e) => setModelId(e.target.value)}
                    >
                      {models.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} ({model.provider.toUpperCase()})
                        </option>
                      ))}
                    </Select>
                    <FormHelperText>
                      This model will be used for all conversations with this
                      persona
                    </FormHelperText>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>System Prompt</FormLabel>
                    <Textarea
                      value={systemPrompt}
                      onChange={(e) => setSystemPrompt(e.target.value)}
                      placeholder="Describe the persona's role, expertise, and behavior..."
                      minH="150px"
                    />
                    <FormHelperText>
                      This prompt defines the persona's behavior, knowledge, and
                      tone
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Conversation Style</FormLabel>
                    <Select
                      value={conversationStyle}
                      onChange={(e) => setConversationStyle(e.target.value)}
                    >
                      <option value="helpful">Helpful & Balanced</option>
                      <option value="creative">Creative & Imaginative</option>
                      <option value="precise">Precise & Concise</option>
                      <option value="friendly">
                        Friendly & Conversational
                      </option>
                      <option value="analytical">Analytical & Detailed</option>
                    </Select>
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Temperature: {temperature}</FormLabel>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={temperature}
                      onChange={setTemperature}
                      colorScheme="brand"
                    >
                      <SliderTrack>
                        <SliderFilledTrack />
                      </SliderTrack>
                      <SliderThumb />
                    </Slider>
                    <Grid templateColumns="repeat(3, 1fr)" gap={2} mt={1}>
                      <GridItem>
                        <FormHelperText textAlign="left">
                          More Precise
                        </FormHelperText>
                      </GridItem>
                      <GridItem>
                        <FormHelperText textAlign="center">
                          Balanced
                        </FormHelperText>
                      </GridItem>
                      <GridItem>
                        <FormHelperText textAlign="right">
                          More Creative
                        </FormHelperText>
                      </GridItem>
                    </Grid>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Max Tokens</FormLabel>
                    <NumberInput
                      value={maxTokens}
                      onChange={(_, value) => setMaxTokens(value)}
                      min={100}
                      max={8000}
                      step={100}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>
                      Maximum number of tokens to generate in each response
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Message Context Limit</FormLabel>
                    <NumberInput
                      value={messageLimit}
                      onChange={(_, value) => setMessageLimit(value)}
                      min={3}
                      max={50}
                    >
                      <NumberInputField />
                      <NumberInputStepper>
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                    <FormHelperText>
                      Number of recent messages to include in each request's
                      context
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Advanced Memory Options</FormLabel>
                    <Select
                      value={useSearchMemory ? "semantic" : "recency"}
                      onChange={(e) =>
                        setUseSearchMemory(e.target.value === "semantic")
                      }
                    >
                      <option value="recency">
                        Recency-based (use most recent messages)
                      </option>
                      <option value="semantic">
                        Semantic search (use most relevant messages)
                      </option>
                    </Select>
                    <FormHelperText>
                      How the persona should retrieve context from conversation
                      history
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSave}
            isDisabled={!isFormValid}
          >
            {isEditing ? "Save Changes" : "Create Persona"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreatePersonaModal;
