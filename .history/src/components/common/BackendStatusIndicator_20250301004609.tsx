import React, { useState, useEffect } from "react";
import {
  Box,
  Badge,
  HStack,
  Text,
  useColorModeValue,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverFooter,
  PopoverArrow,
  PopoverCloseButton,
  List,
  ListItem,
  ListIcon,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Check,
  X,
} from "lucide-react";
import { websocketService } from "../../services/websocket";

const BackendStatusIndicator = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());

  const checkBackendStatus = async () => {
    try {
      setIsChecking(true);
      const response = await fetch("http://localhost:8000/");
      const newStatus = response.ok;
      setIsConnected(newStatus);

      // If status changed from offline to online, try to connect websocket
      if (!isConnected && newStatus) {
        websocketService.setEnabled(true);
        await websocketService.connect();
      }

      // If status changed from online to offline, disable websocket
      if (isConnected && !newStatus) {
        websocketService.setEnabled(false);
      }
    } catch (error) {
      setIsConnected(false);
      websocketService.setEnabled(false);
    } catch {
      // Ignore any other errors
    }
    finally {
      setIsChecking(false);
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Check immediately
    checkBackendStatus();

    // And then check every 30 seconds
    const intervalId = setInterval(checkBackendStatus, 30000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const badgeBg = useColorModeValue("gray.100", "gray.700");
  const popoverBg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");

  const handleRetryConnection = () => {
    checkBackendStatus();
  };

  const limitedFeatures = [
    "Real-time message streaming",
    "AI model testing and connection",
    "Model availability checking",
    "Backend-dependent features",
  ];

  const availableFeatures = [
    "Viewing existing conversations",
    "Managing personas",
    "Configuring models",
    "Importing/exporting data",
  ];

  return (
    <Popover placement="bottom-end">
      <PopoverTrigger>
        <Box>
          <HStack
            spacing={2}
            p={1}
            px={2}
            borderRadius="md"
            bg={badgeBg}
            opacity={isChecking ? 0.6 : 1}
            transition="opacity 0.2s"
            cursor="pointer"
            _hover={{ bg: useColorModeValue("gray.200", "gray.600") }}
            position="relative"
          >
            {isChecking && (
              <Spinner size="xs" position="absolute" right="-2px" top="-2px" />
            )}

            {isConnected ? (
              <>
                <Wifi size={14} color="green" />
                <Text fontSize="xs" fontWeight="medium" color="green.500">
                  Connected
                </Text>
              </>
            ) : (
              <>
                <WifiOff size={14} color="red" />
                <Text fontSize="xs" fontWeight="medium" color="red.500">
                  Backend Offline
                </Text>
              </>
            )}
          </HStack>
        </Box>
      </PopoverTrigger>
      <PopoverContent bg={popoverBg} borderColor={borderColor} width="300px">
        <PopoverArrow bg={popoverBg} />
        <PopoverCloseButton />
        <PopoverHeader fontWeight="bold" borderBottomWidth="1px">
          <Flex align="center" gap={2}>
            {isConnected ? (
              <Badge
                colorScheme="green"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <Check size={12} /> Connected
              </Badge>
            ) : (
              <Badge
                colorScheme="red"
                display="flex"
                alignItems="center"
                gap={1}
              >
                <X size={12} /> Disconnected
              </Badge>
            )}
            <Text ml={2}>Backend Server Status</Text>
          </Flex>
        </PopoverHeader>
        <PopoverBody>
          {isConnected ? (
            <Box>
              <Text mb={2}>
                The backend server is running and all features are available.
              </Text>
              <Text fontSize="xs" color="gray.500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            </Box>
          ) : (
            <Box>
              <HStack mb={3} color="red.500">
                <AlertTriangle size={16} />
                <Text fontWeight="medium">Limited Functionality</Text>
              </HStack>

              <Text mb={2}>The following features are unavailable:</Text>
              <List spacing={1} mb={3} fontSize="sm">
                {limitedFeatures.map((feature, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <ListIcon as={X} color="red.500" />
                    {feature}
                  </ListItem>
                ))}
              </List>

              <Text mb={2}>You can still use:</Text>
              <List spacing={1} mb={3} fontSize="sm">
                {availableFeatures.map((feature, index) => (
                  <ListItem key={index} display="flex" alignItems="center">
                    <ListIcon as={Check} color="green.500" />
                    {feature}
                  </ListItem>
                ))}
              </List>

              <Text fontSize="xs" color="gray.500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </Text>
            </Box>
          )}
        </PopoverBody>
        <PopoverFooter borderTopWidth="1px">
          <Button
            size="sm"
            leftIcon={<RefreshCw size={14} />}
            onClick={handleRetryConnection}
            isLoading={isChecking}
            loadingText="Checking..."
            width="full"
            colorScheme={isConnected ? "green" : "blue"}
          >
            {isConnected ? "Check Connection" : "Retry Connection"}
          </Button>
        </PopoverFooter>
      </PopoverContent>
    </Popover>
  );
};

export default BackendStatusIndicator;
