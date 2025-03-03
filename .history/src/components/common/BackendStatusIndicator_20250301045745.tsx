import React, { useState, useEffect } from 'react';
import {
  Box,
  Badge,
  Tooltip,
  HStack,
  Text,
  useColorModeValue
} from '@chakra-ui/react';
import { Wifi, WifiOff } from 'lucide-react';

const BackendStatusIndicator = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        setIsChecking(true);
        const response = await fetch('http://localhost:8000/');
        setIsConnected(response.ok);
      } catch (error) {
        setIsConnected(false);
      } finally {
        setIsChecking(false);
      }
    };
    
    // Check immediately
    checkBackendStatus();
    
    // And then check every 30 seconds
    const intervalId = setInterval(checkBackendStatus, 30000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  const badgeBg = useColorModeValue('gray.100', 'gray.700');
  
  return (
    <Tooltip 
      label={isConnected ? 'Backend server is connected' : 'Backend server is not running'} 
      placement="bottom"
    >
      <HStack 
        spacing={2} 
        p={1} 
        px={2} 
        borderRadius="md" 
        bg={badgeBg}
        opacity={isChecking ? 0.6 : 1}
        transition="opacity 0.2s"
      >
        {isConnected ? (
          <>
            <Wifi size={14} color="green" />
            <Text fontSize="xs" fontWeight="medium" color="green.500">Connected</Text>
          </>
        ) : (
          <>
            <WifiOff size={14} color="red" />
            <Text fontSize="xs" fontWeight="medium" color="red.500">Offline</Text>
          </>
        )}
      </HStack>
    </Tooltip>
  );
};

export default BackendStatusIndicator;