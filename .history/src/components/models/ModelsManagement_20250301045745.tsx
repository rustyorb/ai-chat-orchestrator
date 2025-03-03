import React from 'react';
import { 
  Box, 
  Button, 
  Container, 
  Flex, 
  Heading, 
  VStack, 
  HStack, 
  Text, 
  Badge, 
  Icon, 
  SimpleGrid, 
  useColorModeValue,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Switch
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Database, 
  Plus, 
  MoreVertical, 
  Edit3, 
  Copy, 
  Trash, 
  ExternalLink, 
  Zap,
  Shield
} from 'lucide-react';
import { RootState } from '../../store';
import { openModal } from '../../store/slices/uiSlice';

// Placeholder component - to be fully implemented
const ModelsManagement = () => {
  const dispatch = useDispatch();
  const { models } = useSelector((state: RootState) => state.models);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const getProviderBadge = (provider: string) => {
    const colorMap: Record<string, string> = {
      'openai': 'green',
      'anthropic': 'purple',
      'ollama': 'orange',
      'lmstudio': 'blue',
      'custom': 'gray'
    };
    
    return (
      <Badge colorScheme={colorMap[provider] || 'gray'} px={2} py={1} borderRadius="md">
        {provider.toUpperCase()}
      </Badge>
    );
  };
  
  return (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>AI Models</Heading>
        <Button 
          leftIcon={<Plus size={16} />} 
          colorScheme="brand"
          onClick={() => dispatch(openModal('modelConfig'))}
        >
          Add Model
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {models.map(model => (
          <Box 
            key={model.id}
            bg={cardBg}
            borderRadius="lg"
            boxShadow="md"
            border="1px"
            borderColor={borderColor}
            overflow="hidden"
          >
            <Box p={6}>
              <Flex justify="space-between" align="start">
                <VStack align="start" spacing={2}>
                  <Heading size="md">{model.name}</Heading>
                  {getProviderBadge(model.provider)}
                </VStack>
                <Menu>
                  <MenuButton 
                    as={IconButton}
                    aria-label="Model options"
                    icon={<MoreVertical size={20} />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<Edit3 size={16} />}>Edit Configuration</MenuItem>
                    <MenuItem icon={<Zap size={16} />}>Test Connection</MenuItem>
                    <MenuItem icon={<Copy size={16} />}>Duplicate</MenuItem>
                    <Divider />
                    <MenuItem icon={<Trash size={16} />} color="red.500">Delete</MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
              
              <Divider my={4} />
              
              <SimpleGrid columns={2} spacing={4}>
                <Stat>
                  <StatLabel>Context Window</StatLabel>
                  <StatNumber>{(model.contextWindowSize / 1000).toFixed(0)}K</StatNumber>
                  <StatHelpText>tokens</StatHelpText>
                </Stat>
                <Stat>
                  <StatLabel>Temperature</StatLabel>
                  <StatNumber>{model.defaultParams.temperature}</StatNumber>
                  <StatHelpText>default setting</StatHelpText>
                </Stat>
              </SimpleGrid>
              
              {model.baseUrl && (
                <HStack spacing={2} mt={4} fontSize="sm" color="gray.500">
                  <Icon as={ExternalLink} boxSize={4} />
                  <Text isTruncated>{model.baseUrl}</Text>
                </HStack>
              )}
              
              {model.apiKey && (
                <HStack spacing={2} mt={2} fontSize="sm" color="gray.500">
                  <Icon as={Shield} boxSize={4} />
                  <Text>API Key: ••••••••••••••••</Text>
                </HStack>
              )}
            </Box>
            
            <Flex 
              p={4} 
              borderTop="1px" 
              borderColor={borderColor}
              bg={useColorModeValue('gray.50', 'gray.700')}
              justify="space-between"
              align="center"
            >
              <Text fontSize="sm" fontWeight="medium">Set as default</Text>
              <Switch 
                colorScheme="brand"
                isChecked={model.id === 'gpt-4-turbo'}
              />
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
    </Container>
  );
};

export default ModelsManagement;