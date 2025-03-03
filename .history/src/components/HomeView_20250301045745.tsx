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
  Container,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Link
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  MessageSquare, 
  Users, 
  Database, 
  PlusCircle, 
  Zap, 
  Settings,
  ArrowRight,
  Terminal,
  Server
} from 'lucide-react';
import { openModal } from '../store/slices/uiSlice';
import { RootState } from '../store';

const HomeView = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const { conversations } = useSelector((state: RootState) => state.conversations);
  const { personas } = useSelector((state: RootState) => state.personas);
  
  const recentConversations = conversations
    .sort((a, b) => b.updated - a.updated)
    .slice(0, 3);
  
  return (
    <Container maxW="container.xl" py={6}>
      <Flex direction="column" align="stretch" gap={8}>
        <Box textAlign="center" mb={6}>
          <Heading as="h1" size="2xl" mb={4}>AI Conversation Orchestrator</Heading>
          <Text fontSize="xl" maxW="800px" mx="auto">
            Orchestrate multi-agent AI conversations with powerful personas, model integration, and real-time collaboration
          </Text>
          
          <Alert status="info" variant="subtle" mt={6} borderRadius="md">
            <AlertIcon />
            <Box>
              <AlertTitle>Backend Status</AlertTitle>
              <AlertDescription display="block">
                The backend server is not running yet. To enable full functionality:
                <Box as="ol" pl={5} mt={2}>
                  <Box as="li">Open a new terminal</Box>
                  <Box as="li">Run <Code>cd backend && python -m uvicorn main:app --reload</Code></Box>
                </Box>
              </AlertDescription>
            </Box>
          </Alert>
          
          <Flex justify="center" mt={6} gap={4}>
            <Button 
              leftIcon={<PlusCircle size={20} />}
              colorScheme="brand" 
              size="lg"
              onClick={() => dispatch(openModal('createConversation'))}
            >
              New Conversation
            </Button>
            <Button 
              leftIcon={<Users size={20} />}
              colorScheme="brand" 
              variant="outline"
              size="lg"
              onClick={() => navigate('/personas')}
            >
              Manage Personas
            </Button>
          </Flex>
        </Box>
        
        {recentConversations.length > 0 && (
          <Box mb={8}>
            <Flex justify="space-between" align="center" mb={4}>
              <Heading size="md">Recent Conversations</Heading>
              <Button 
                rightIcon={<ArrowRight size={16} />} 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/conversations')}
              >
                View all
              </Button>
            </Flex>
            
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {recentConversations.map(conversation => (
                <Box 
                  key={conversation.id}
                  p={5}
                  bg={cardBg}
                  borderRadius="lg"
                  boxShadow="md"
                  border="1px"
                  borderColor={borderColor}
                  cursor="pointer"
                  _hover={{ transform: 'translateY(-2px)', transition: 'all 0.3s ease' }}
                  onClick={() => navigate(`/conversations/${conversation.id}`)}
                >
                  <Flex justify="space-between" align="center">
                    <Heading size="sm" isTruncated>
                      {conversation.title}
                    </Heading>
                    <Icon as={MessageSquare} />
                  </Flex>
                  <Text fontSize="sm" color="gray.500" mt={2}>
                    {new Date(conversation.updated).toLocaleDateString()}
                  </Text>
                  <Text fontSize="sm" mt={2} isTruncated>
                    {conversation.participants.length} participants • {conversation.messages.length} messages
                  </Text>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
          <QuickStartCard 
            title="Create Personas"
            icon={Users}
            count={personas.length}
            description="Design custom personas with unique personalities, system prompts, and model settings"
            action={() => dispatch(openModal('createPersona'))}
            actionText="Create Persona"
          />
          
          <QuickStartCard 
            title="Configure Models"
            icon={Database}
            description="Connect to Ollama, LM Studio, OpenAI, or custom endpoints to power your agents"
            action={() => navigate('/models')}
            actionText="Manage Models"
          />
          
          <QuickStartCard 
            title="Run Backend Server"
            icon={Server}
            description="Start the Python backend server to enable real-time model interactions"
            action={() => navigate('/settings')}
            actionText="View Instructions"
          />
        </SimpleGrid>
      </Flex>
    </Container>
  );
};

const Code = ({ children }: { children: React.ReactNode }) => (
  <Box
    as="code"
    px={2}
    py={1}
    bg={useColorModeValue('gray.100', 'gray.700')}
    borderRadius="md"
    fontSize="sm"
    fontFamily="monospace"
  >
    {children}
  </Box>
);

interface QuickStartCardProps {
  title: string;
  icon: React.FC;
  description: string;
  action: () => void;
  actionText: string;
  count?: number;
}

const QuickStartCard = ({ title, icon, description, action, actionText, count }: QuickStartCardProps) => {
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box 
      p={6}
      bg={cardBg}
      borderRadius="lg"
      boxShadow="md"
      border="1px"
      borderColor={borderColor}
    >
      <VStack align="start" spacing={4}>
        <Flex w="full" justify="space-between" align="center">
          <Icon as={icon} boxSize={8} color="brand.500" />
          {count !== undefined && (
            <Text fontSize="sm" fontWeight="bold" color="gray.500">
              {count} {count === 1 ? 'item' : 'items'}
            </Text>
          )}
        </Flex>
        <Heading size="md">{title}</Heading>
        <Text>{description}</Text>
        <Button 
          rightIcon={<ArrowRight size={16} />}
          colorScheme="brand" 
          variant="outline" 
          onClick={action}
        >
          {actionText}
        </Button>
      </VStack>
    </Box>
  );
};

export default HomeView;