import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  SimpleGrid, 
  Flex, 
  Icon, 
  useColorModeValue, 
  VStack,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Container
} from '@chakra-ui/react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Plus, 
  Edit3, 
  Trash, 
  Copy, 
  MoreVertical, 
  Tag,
  Settings
} from 'lucide-react';
import { RootState } from '../../store';
import { openModal } from '../../store/slices/uiSlice';

// Placeholder component - to be fully implemented
const PersonaManagement = () => {
  const dispatch = useDispatch();
  const { personas } = useSelector((state: RootState) => state.personas);
  const { models } = useSelector((state: RootState) => state.models);
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const renderEmptyState = () => (
    <Flex direction="column" align="center" justify="center" py={10}>
      <Box 
        bg={cardBg} 
        p={8} 
        borderRadius="lg" 
        boxShadow="md" 
        maxW="600px" 
        w="full"
        textAlign="center"
      >
        <Icon as={Settings} boxSize={16} color="gray.400" mb={6} />
        <Heading size="lg" mb={4}>No Personas Yet</Heading>
        <Text mb={6}>Create your first AI persona to start conversations</Text>
        <Button 
          leftIcon={<Plus size={18} />} 
          colorScheme="brand" 
          size="lg"
          onClick={() => dispatch(openModal('createPersona'))}
        >
          Create New Persona
        </Button>
      </Box>
    </Flex>
  );
  
  const renderPersonaCards = () => (
    <Container maxW="container.xl" py={6}>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading>AI Personas</Heading>
        <Button 
          leftIcon={<Plus size={16} />} 
          colorScheme="brand"
          onClick={() => dispatch(openModal('createPersona'))}
        >
          New Persona
        </Button>
      </Flex>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
        {personas.map(persona => {
          const model = models.find(m => m.id === persona.modelId);
          
          return (
            <Box 
              key={persona.id}
              bg={cardBg}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor={borderColor}
              overflow="hidden"
              position="relative"
            >
              <Flex p={6}>
                <Avatar 
                  size="lg" 
                  name={persona.name} 
                  src={persona.avatar} 
                  mr={4}
                />
                <VStack align="start" flex={1} spacing={1}>
                  <Heading size="md">{persona.name}</Heading>
                  <Badge colorScheme="blue">{model?.name || 'Unknown Model'}</Badge>
                  <Text fontSize="sm" color="gray.500" noOfLines={2} mt={2}>
                    {persona.systemPrompt.slice(0, 120)}...
                  </Text>
                </VStack>
                <Menu>
                  <MenuButton 
                    as={IconButton}
                    aria-label="Persona options"
                    icon={<MoreVertical size={20} />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem icon={<Edit3 size={16} />}>Edit Persona</MenuItem>
                    <MenuItem icon={<Copy size={16} />}>Duplicate</MenuItem>
                    <MenuItem icon={<Tag size={16} />}>Add to Conversation</MenuItem>
                    <Divider />
                    <MenuItem icon={<Trash size={16} />} color="red.500">Delete</MenuItem>
                  </MenuList>
                </Menu>
              </Flex>
              <Box 
                p={4} 
                borderTop="1px" 
                borderColor={borderColor}
                bg={useColorModeValue('gray.50', 'gray.700')}
              >
                <Text fontSize="xs" color="gray.500">
                  Created: {new Date(persona.created).toLocaleDateString()}
                </Text>
              </Box>
            </Box>
          );
        })}
      </SimpleGrid>
    </Container>
  );
  
  return personas.length === 0 ? renderEmptyState() : renderPersonaCards();
};

export default PersonaManagement;