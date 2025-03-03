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
  Select,
  HStack,
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
  Text,
  Box,
  Switch,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import { addModel, updateModel } from "../../store/slices/modelSlice";
import { modelApi } from "../../services/api";
import { Eye, EyeOff, Zap } from "lucide-react";
import { ModelProvider } from "../../types";

interface ModelConfigModalProps {
  modelId?: string;
}

const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ modelId }) => {
  const dispatch = useDispatch();
  const toast = useToast();
  const models = useSelector((state: RootState) => state.models.models);

  const editingModel = modelId ? models.find((m) => m.id === modelId) : null;

  // Form state
  const [name, setName] = useState(editingModel?.name || "");
  const [provider, setProvider] = useState<ModelProvider>(
    editingModel?.provider || "openai"
  );
  const [baseUrl, setBaseUrl] = useState(editingModel?.baseUrl || "");
  const [apiKey, setApiKey] = useState(editingModel?.apiKey || "");
  const [showApiKey, setShowApiKey] = useState(false);
  const [contextWindowSize, setContextWindowSize] = useState(
    editingModel?.contextWindowSize || 8192
  );

  // Default parameters
  const [temperature, setTemperature] = useState(
    editingModel?.defaultParams.temperature || 0.7
  );
  const [maxTokens, setMaxTokens] = useState(
    editingModel?.defaultParams.maxTokens || 2000
  );

  // Testing state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const bgColor = useColorModeValue("white", "gray.800");

  const handleClose = () => {
    dispatch(closeModal("modelConfig"));
  };

  const handleSave = () => {
    const modelData = {
      name: name.trim(),
      provider,
      baseUrl:
        provider === "custom" || provider === "lmstudio"
          ? baseUrl.trim()
          : undefined,
      apiKey:
        provider === "openai" ||
        provider === "anthropic" ||
        provider === "custom"
          ? apiKey.trim()
          : undefined,
      contextWindowSize,
      defaultParams: {
        temperature,
        maxTokens,
      },
    };

    if (editingModel) {
      dispatch(
        updateModel({
          id: editingModel.id,
          ...modelData,
        })
      );
    } else {
      dispatch(addModel(modelData));
    }

    handleClose();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const modelData = {
        name: name.trim(),
        provider,
        baseUrl:
          provider === "custom" || provider === "lmstudio"
            ? baseUrl.trim()
            : undefined,
        apiKey:
          provider === "openai" ||
          provider === "anthropic" ||
          provider === "custom"
            ? apiKey.trim()
            : undefined,
        contextWindowSize,
        defaultParams: {
          temperature,
          maxTokens,
        },
      };

      const result = await modelApi.testConnection(modelData);
      setTestResult(result);

      if (result.success) {
        toast({
          title: "Connection successful",
          description: result.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Connection failed",
          description: result.message,
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message:
          "Failed to test connection. Backend server may not be running.",
      });

      toast({
        title: "Connection error",
        description:
          "Failed to test connection. Backend server may not be running.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  const isFormValid =
    name.trim() !== "" &&
    (provider !== "custom" || baseUrl.trim() !== "") &&
    ((provider !== "openai" &&
      provider !== "anthropic" &&
      provider !== "custom") ||
      apiKey.trim() !== "");

  const needsApiKey =
    provider === "openai" || provider === "anthropic" || provider === "custom";
  const needsBaseUrl = provider === "custom" || provider === "lmstudio";

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>{editingModel ? "Edit Model" : "Add Model"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <FormControl isRequired>
              <FormLabel>Model Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., GPT-4, Claude, Llama 2"
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Provider</FormLabel>
              <Select
                value={provider}
                onChange={(e) => setProvider(e.target.value as ModelProvider)}
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="ollama">Ollama (Local)</option>
                <option value="lmstudio">LM Studio (Local)</option>
                <option value="custom">Custom Endpoint</option>
              </Select>
              <FormHelperText>
                Select the provider that hosts this model
              </FormHelperText>
            </FormControl>

            {needsBaseUrl && (
              <FormControl isRequired={needsBaseUrl}>
                <FormLabel>Base URL</FormLabel>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={
                    provider === "lmstudio"
                      ? "http://localhost:1234/v1"
                      : "https://api.example.com/v1"
                  }
                />
                <FormHelperText>
                  {provider === "lmstudio"
                    ? "The base URL for LM Studio's local API server"
                    : "The base URL for your custom API endpoint"}
                </FormHelperText>
              </FormControl>
            )}

            {needsApiKey && (
              <FormControl isRequired={needsApiKey}>
                <FormLabel>API Key</FormLabel>
                <InputGroup>
                  <Input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter your API key"
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showApiKey ? "Hide API key" : "Show API key"}
                      icon={
                        showApiKey ? <EyeOff size={18} /> : <Eye size={18} />
                      }
                      size="sm"
                      variant="ghost"
                      onClick={toggleApiKeyVisibility}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Your API key will be stored securely in your browser
                </FormHelperText>
              </FormControl>
            )}

            <FormControl>
              <FormLabel>Context Window Size</FormLabel>
              <NumberInput
                value={contextWindowSize}
                onChange={(_, value) => setContextWindowSize(value)}
                min={1024}
                max={128000}
                step={1024}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
              <FormHelperText>
                Maximum number of tokens the model can process (input + output)
              </FormHelperText>
            </FormControl>

            <Box>
              <Text fontWeight="medium" mb={2}>
                Default Parameters
              </Text>

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
                <HStack justify="space-between" mt={1}>
                  <FormHelperText>More Precise</FormHelperText>
                  <FormHelperText>More Creative</FormHelperText>
                </HStack>
              </FormControl>

              <FormControl mt={4}>
                <FormLabel>Default Max Tokens</FormLabel>
                <NumberInput
                  value={maxTokens}
                  onChange={(_, value) => setMaxTokens(value)}
                  min={100}
                  max={contextWindowSize / 2}
                  step={100}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormHelperText>
                  Default maximum tokens to generate per response
                </FormHelperText>
              </FormControl>
            </Box>

            {(needsApiKey || needsBaseUrl) && (
              <Button
                leftIcon={<Zap size={16} />}
                onClick={handleTestConnection}
                isLoading={isTesting}
                loadingText="Testing connection"
                isDisabled={!isFormValid}
                colorScheme={
                  testResult?.success ? "green" : testResult ? "red" : "brand"
                }
                variant="outline"
              >
                Test Connection
              </Button>
            )}

            {testResult && (
              <Box
                p={3}
                borderRadius="md"
                bg={testResult.success ? "green.50" : "red.50"}
                color={testResult.success ? "green.800" : "red.800"}
                borderWidth="1px"
                borderColor={testResult.success ? "green.200" : "red.200"}
              >
                <HStack>
                  <Badge colorScheme={testResult.success ? "green" : "red"}>
                    {testResult.success ? "Success" : "Error"}
                  </Badge>
                  <Text fontSize="sm">{testResult.message}</Text>
                </HStack>
              </Box>
            )}
          </VStack>
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
            {editingModel ? "Save Changes" : "Add Model"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ModelConfigModal;
