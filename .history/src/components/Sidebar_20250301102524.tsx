import React from "react";
import {
  Box,
  VStack,
  Heading,
  Text,
  Icon,
  Flex,
  Divider,
  useColorModeValue,
  Button,
} from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../store";
import { toggleSidebar, openModal } from "../store/slices/uiSlice";
import {
  MessageSquare,
  Users,
  Settings,
  Database,
  Plus,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const sidebarOpen = useSelector((state: RootState) => state.ui.sidebarOpen);
  const conversations = useSelector(
    (state: RootState) => state.conversations.conversations
  );
  const personas = useSelector((state: RootState) => state.personas.personas);

  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  // Calculate hover and active backgrounds outside of render functions
  const hoverBg = useColorModeValue("gray.100", "gray.700");
  const activeBg = useColorModeValue("gray.100", "gray.700");

  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    {
      name: "Home",
      icon: Home,
      path: "/",
    },
    {
      name: "Conversations",
      icon: MessageSquare,
      path: "/conversations",
      count: conversations.length,
    },
    {
      name: "Personas",
      icon: Users,
      path: "/personas",
      count: personas.length,
    },
    {
      name: "Models",
      icon: Database,
      path: "/models",
    },
    {
      name: "Settings",
      icon: Settings,
      path: "/settings",
    },
  ];

  if (!sidebarOpen) {
    return (
      <Box
        position="fixed"
        left="0"
        top="0"
        h="100vh"
        w="50px"
        bg={bg}
        borderRight="1px"
        borderColor={borderColor}
        zIndex="2"
      >
        <VStack spacing={4} align="center" py={4}>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => dispatch(toggleSidebar())}
            aria-label="Open sidebar"
          >
            <Icon as={ChevronRight} />
          </Button>
          <Divider />
          {navItems.map((item) => (
            <Button
              key={item.name}
              p={2}
              variant="ghost"
              onClick={() => {
                console.log("🔍 DEBUG - Navigating to:", item.path);
                navigate(item.path);
              }}
              aria-label={item.name}
              colorScheme={isActive(item.path) ? "brand" : undefined}
            >
              <Icon as={item.icon} boxSize={5} />
            </Button>
          ))}
        </VStack>
      </Box>
    );
  }

  return (
    <Box
      w="250px"
      h="100vh"
      bg={bg}
      borderRight="1px"
      borderColor={borderColor}
      position="relative"
      overflowY="auto"
    >
      <Flex justify="space-between" align="center" p={4}>
        <Heading size="md">AI Orchestrator</Heading>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => dispatch(toggleSidebar())}
          aria-label="Close sidebar"
        >
          <Icon as={ChevronLeft} />
        </Button>
      </Flex>
      <Divider />
      <VStack spacing={0} align="stretch">
        {navItems.map((item) => (
          <Box
            key={item.name}
            p={2}
            pl={4}
            cursor="pointer"
            bg={isActive(item.path) ? activeBg : "transparent"}
            _hover={{ bg: hoverBg }}
            onClick={() => {
              console.log("🔍 DEBUG - Navigating to:", item.path);
              navigate(item.path);
            }}
          >
            <Flex align="center" justify="space-between">
              <Flex align="center">
                <Icon as={item.icon} mr={3} />
                <Text>{item.name}</Text>
              </Flex>
              {item.count !== undefined && (
                <Text fontSize="sm" color="gray.500" fontWeight="medium">
                  {item.count}
                </Text>
              )}
            </Flex>
          </Box>
        ))}
      </VStack>

      <Divider my={2} />

      <Box p={4}>
        <Button
          leftIcon={<Icon as={Plus} />}
          colorScheme="brand"
          size="sm"
          w="full"
          onClick={() => {
            console.log(
              "New Conversation button clicked - attempting to open modal with type: createConversation"
            );
            dispatch(openModal("createConversation"));
            console.log(
              "openModal action dispatched - checking if modal exists and is shown"
            );
          }}
        >
          New Conversation
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;
