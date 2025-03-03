import React, { useEffect } from 'react';
import { 
  Box, 
  Alert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription,
  CloseButton,
  VStack
} from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { removeNotification } from '../../store/slices/uiSlice';

const NotificationSystem = () => {
  const notifications = useSelector((state: RootState) => state.ui.notifications);
  const dispatch = useDispatch();
  
  // Auto-remove notifications after their duration expires
  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);
        
        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);
  
  if (notifications.length === 0) {
    return null;
  }
  
  return (
    <Box
      position="fixed"
      bottom="20px"
      right="20px"
      zIndex="toast"
      maxW="400px"
    >
      <VStack spacing={2} align="stretch">
        {notifications.map(notification => (
          <Alert
            key={notification.id}
            status={notification.type}
            variant="solid"
            borderRadius="md"
            boxShadow="md"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>{notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}</AlertTitle>
              <AlertDescription>{notification.message}</AlertDescription>
            </Box>
            <CloseButton
              position="absolute"
              right="8px"
              top="8px"
              onClick={() => dispatch(removeNotification(notification.id))}
            />
          </Alert>
        ))}
      </VStack>
    </Box>
  );
};

export default NotificationSystem;