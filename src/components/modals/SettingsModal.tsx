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
  VStack,
  FormControl,
  FormLabel,
  Switch,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  HStack,
  Box,
  Text,
  Divider,
  useColorModeValue,
  FormHelperText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Icon,
  Badge,
  Code,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import {
  updateSettings,
  toggleDarkMode,
  toggleDeveloperMode,
} from "../../store/slices/settingsSlice";
import { Sun, Moon, Save, Terminal, InfoIcon } from "lucide-react";

const SettingsModal: React.FC = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  const { colorMode } = useSelector((state: RootState) => state.settings.theme);

  // App settings
  const [autoSaveInterval, setAutoSaveInterval] = useState(
    settings.autoSaveInterval
  );
  const [messageDelay, setMessageDelay] = useState(settings.messageDelay);
  const [developerMode, setDeveloperMode] = useState(settings.developerMode);

  // Theme settings
  const [fontSize, setFontSize] = useState(settings.theme.fontSize);
  const [messageSpacing, setMessageSpacing] = useState(
    settings.theme.messageSpacing
  );
  const [animationEnabled, setAnimationEnabled] = useState(
    settings.theme.animationEnabled
  );

  const bgColor = useColorModeValue("white", "gray.800");

  const handleClose = () => {
    dispatch(closeModal("settings"));
  };

  const handleSave = () => {
    dispatch(
      updateSettings({
        autoSaveInterval,
        messageDelay,
        developerMode,
        theme: {
          ...settings.theme,
          fontSize,
          messageSpacing,
          animationEnabled,
        },
      })
    );

    handleClose();
  };

  const handleDarkModeToggle = () => {
    dispatch(toggleDarkMode());
  };

  const handleDeveloperModeToggle = () => {
    setDeveloperMode(!developerMode);
    dispatch(toggleDeveloperMode());
  };

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor} maxW="800px">
        <ModalHeader>Settings</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs>
            <TabList>
              <Tab>General</Tab>
              <Tab>Appearance</Tab>
              <Tab>Advanced</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <FormLabel htmlFor="dark-mode" mb="0">
                      <HStack>
                        <Icon as={colorMode === "dark" ? Moon : Sun} />
                        <Text>
                          {colorMode === "dark" ? "Dark Mode" : "Light Mode"}
                        </Text>
                      </HStack>
                    </FormLabel>
                    <Switch
                      id="dark-mode"
                      isChecked={colorMode === "dark"}
                      onChange={handleDarkModeToggle}
                      colorScheme="brand"
                    />
                  </FormControl>

                  <Divider />

                  <FormControl>
                    <FormLabel>Auto-save Interval</FormLabel>
                    <HStack>
                      <NumberInput
                        value={autoSaveInterval / 1000}
                        onChange={(_, value) =>
                          setAutoSaveInterval(value * 1000)
                        }
                        min={5}
                        max={300}
                        w="100px"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text>seconds</Text>
                    </HStack>
                    <FormHelperText>
                      How often conversations and settings are automatically
                      saved
                    </FormHelperText>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Message Typing Delay</FormLabel>
                    <HStack>
                      <NumberInput
                        value={messageDelay}
                        onChange={(_, value) => setMessageDelay(value)}
                        min={0}
                        max={2000}
                        step={50}
                        w="100px"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                      <Text>milliseconds</Text>
                    </HStack>
                    <FormHelperText>
                      Delay between message chunks (0 for instant display)
                    </FormHelperText>
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl>
                    <FormLabel>Font Size</FormLabel>
                    <Select
                      value={fontSize}
                      onChange={(e) =>
                        setFontSize(
                          e.target.value as "small" | "medium" | "large"
                        )
                      }
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </Select>
                  </FormControl>

                  <FormControl>
                    <FormLabel>Message Spacing</FormLabel>
                    <Select
                      value={messageSpacing}
                      onChange={(e) =>
                        setMessageSpacing(
                          e.target.value as
                            | "compact"
                            | "comfortable"
                            | "spacious"
                        )
                      }
                    >
                      <option value="compact">Compact</option>
                      <option value="comfortable">Comfortable</option>
                      <option value="spacious">Spacious</option>
                    </Select>
                  </FormControl>

                  <FormControl
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <FormLabel htmlFor="animations" mb="0">
                      Enable Animations
                    </FormLabel>
                    <Switch
                      id="animations"
                      isChecked={animationEnabled}
                      onChange={() => setAnimationEnabled(!animationEnabled)}
                      colorScheme="brand"
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              <TabPanel>
                <VStack spacing={6} align="stretch">
                  <FormControl
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Box>
                      <FormLabel
                        htmlFor="developer-mode"
                        mb="0"
                        display="flex"
                        alignItems="center"
                      >
                        <HStack>
                          <Icon as={Terminal} />
                          <Text>Developer Mode</Text>
                        </HStack>
                      </FormLabel>
                      <FormHelperText>
                        Enables additional debugging features and detailed logs
                      </FormHelperText>
                    </Box>
                    <Switch
                      id="developer-mode"
                      isChecked={developerMode}
                      onChange={handleDeveloperModeToggle}
                      colorScheme="brand"
                    />
                  </FormControl>

                  <Divider my={2} />

                  <Box
                    p={4}
                    borderRadius="md"
                    bg={useColorModeValue("gray.50", "gray.700")}
                  >
                    <HStack mb={2}>
                      <InfoIcon size={16} />
                      <Text fontWeight="medium">
                        Backend Server Instructions
                      </Text>
                    </HStack>
                    <Text fontSize="sm" mb={3}>
                      To enable all features, run the backend server:
                    </Text>
                    <Code
                      p={2}
                      borderRadius="md"
                      fontSize="sm"
                      width="100%"
                      display="block"
                      whiteSpace="pre"
                    >
                      cd backend python -m uvicorn main:app --reload
                    </Code>
                  </Box>

                  <Box>
                    <Text fontWeight="medium" mb={2}>
                      About
                    </Text>
                    <HStack mb={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        Version:
                      </Text>
                      <Badge>0.1.0</Badge>
                    </HStack>
                    <HStack>
                      <Text fontSize="sm" fontWeight="bold">
                        Built with:
                      </Text>
                      <Badge colorScheme="blue">React</Badge>
                      <Badge colorScheme="green">Chakra UI</Badge>
                      <Badge colorScheme="purple">Redux</Badge>
                    </HStack>
                  </Box>
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
            leftIcon={<Save size={16} />}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SettingsModal;
