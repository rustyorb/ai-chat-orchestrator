import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Divider, 
  Flex, 
  FormControl, 
  FormLabel, 
  Heading, 
  HStack, 
  Input, 
  Select, 
  Switch, 
  Text, 
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  VStack,
  useColorMode,
  useColorModeValue,
  RadioGroup,
  Radio,
  SimpleGrid,
  Badge,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Save, 
  RefreshCw, 
  Code as CodeIcon, 
  MessageSquare,
  Terminal
} from 'lucide-react';
import { RootState } from '../../store';
import { 
  updateSettings, 
  updateTheme, 
  toggleDeveloperMode 
} from '../../store/slices/settingsSlice';

// Placeholder component - to be fully implemented
const SettingsView = () => {
  const dispatch = useDispatch();
  const { colorMode, toggleColorMode } = useColorMode();
  const settings = useSelector((state: RootState) => state.settings);
  const models = useSelector((state: RootState) => state.models.models);
  
  const formBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleFontSizeChange = (value: string) => {
    dispatch(updateTheme({ fontSize: value as 'small' | 'medium' | 'large' }));
  };
  
  const handleSpacingChange = (value: string) => {
    dispatch(updateTheme({ messageSpacing: value as 'compact' | 'comfortable' | 'spacious' }));
  };
  
  const handleAnimationToggle = () => {
    dispatch(updateTheme({ animationEnabled: !settings.theme.animationEnabled }));
  };
  
  const handleDefaultModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    dispatch(updateSettings({ defaultModel: e.target.value }));
  };
  
  const handleAutoSaveChange = (value: number) => {
    dispatch(updateSettings({ autoSaveInterval: value * 1000 }));
  };
  
  const handleMessageDelayChange = (value: number) => {
    dispatch(updateSettings({ messageDelay: value }));
  };
  
  return (
    <Container maxW="container.lg" py={6}>
      <Heading mb={8}>Application Settings</Heading>
      
      <Alert status="info" mb={8} borderRadius="md">
        <AlertIcon />
        <Box>
          <AlertTitle mb={1}>Backend Server Setup</AlertTitle>
          <AlertDescription>
            <Text mb={2}>To enable real-time AI features, start the backend server in a new terminal:</Text>
            <Code p={2} display="block" borderRadius="md" mb={2}>cd backend</Code>
            <Code p={2} display="block" borderRadius="md">python -m uvicorn main:app --reload</Code>
          </AlertDescription>
        </Box>
      </Alert>
      
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        {/* Theme & Appearance Settings */}
        <Box 
          bg={formBg} 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>Theme & Appearance</Heading>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Color Theme</FormLabel>
              <RadioGroup 
                onChange={(value) => dispatch(updateTheme({ colorMode: value as 'light' | 'dark' }))} 
                value={settings.theme.colorMode}
              >
                <HStack spacing={4}>
                  <Radio value="light">
                    <HStack spacing={2}>
                      <Sun size={16} />
                      <Text>Light</Text>
                    </HStack>
                  </Radio>
                  <Radio value="dark">
                    <HStack spacing={2}>
                      <Moon size={16} />
                      <Text>Dark</Text>
                    </HStack>
                  </Radio>
                  <Radio value="system">
                    <HStack spacing={2}>
                      <Monitor size={16} />
                      <Text>System</Text>
                    </HStack>
                  </Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Font Size</FormLabel>
              <RadioGroup 
                onChange={handleFontSizeChange} 
                value={settings.theme.fontSize}
              >
                <HStack spacing={4}>
                  <Radio value="small">Small</Radio>
                  <Radio value="medium">Medium</Radio>
                  <Radio value="large">Large</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            
            <FormControl>
              <FormLabel>Message Spacing</FormLabel>
              <RadioGroup 
                onChange={handleSpacingChange} 
                value={settings.theme.messageSpacing}
              >
                <HStack spacing={4}>
                  <Radio value="compact">Compact</Radio>
                  <Radio value="comfortable">Comfortable</Radio>
                  <Radio value="spacious">Spacious</Radio>
                </HStack>
              </RadioGroup>
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Enable Animations</FormLabel>
              <Switch 
                isChecked={settings.theme.animationEnabled} 
                onChange={handleAnimationToggle} 
                colorScheme="brand"
              />
            </FormControl>
          </VStack>
        </Box>
        
        {/* Model & Performance Settings */}
        <Box 
          bg={formBg} 
          p={6} 
          borderRadius="lg" 
          boxShadow="md"
          border="1px"
          borderColor={borderColor}
        >
          <Heading size="md" mb={4}>Model & Performance</Heading>
          
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Default AI Model</FormLabel>
              <Select 
                value={settings.defaultModel} 
                onChange={handleDefaultModelChange}
              >
                {models.map(model => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>
                Auto-Save Interval 
                <Badge ml={2} colorScheme="blue">
                  {settings.autoSaveInterval / 1000}s
                </Badge>
              </FormLabel>
              <Slider 
                min={5} 
                max={60} 
                step={5}
                value={settings.autoSaveInterval / 1000}
                onChange={handleAutoSaveChange}
                colorScheme="brand"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
            
            <FormControl>
              <FormLabel>
                Message Delay 
                <Badge ml={2} colorScheme="blue">
                  {settings.messageDelay}ms
                </Badge>
              </FormLabel>
              <Slider 
                min={0} 
                max={2000} 
                step={100}
                value={settings.messageDelay}
                onChange={handleMessageDelayChange}
                colorScheme="brand"
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel mb={0}>Developer Mode</FormLabel>
              <Switch 
                isChecked={settings.developerMode} 
                onChange={() => dispatch(toggleDeveloperMode())} 
                colorScheme="brand"
              />
            </FormControl>
          </VStack>
        </Box>
      </SimpleGrid>
      
      <Flex justify="flex-end" mt={8}>
        <Button leftIcon={<Save size={16} />} colorScheme="brand">
          Save Settings
        </Button>
      </Flex>
    </Container>
  );
};

export default SettingsView;