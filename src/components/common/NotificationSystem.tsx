import React, { useEffect, useRef } from "react";
import {
  Box,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
  VStack,
} from "@chakra-ui/react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../../store";
import { removeNotification } from "../../store/slices/uiSlice";

const NotificationSystem = () => {
  const notifications = useSelector(
    (state: RootState) => state.ui.notifications
  );
  const dispatch = useDispatch();
  const timersRef = useRef<{ [key: string]: ReturnType<typeof setTimeout> }>(
    {}
  );

  // Auto-remove notifications after their duration expires
  useEffect(() => {
    // Clear any existing timers for notifications that no longer exist
    Object.keys(timersRef.current).forEach((id) => {
      if (!notifications.some((n) => n.id === id)) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    });

    // Set up timers for new notifications
    notifications.forEach((notification) => {
      // Skip if timer already exists for this notification
      if (timersRef.current[notification.id]) return;

      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
          delete timersRef.current[notification.id];
        }, notification.duration);

        timersRef.current[notification.id] = timer;
      }
    });

    // Cleanup function
    return () => {
      Object.values(timersRef.current).forEach((timer) => clearTimeout(timer));
    };
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
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            status={notification.type}
            variant="solid"
            borderRadius="md"
            boxShadow="md"
          >
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>
                {notification.type.charAt(0).toUpperCase() +
                  notification.type.slice(1)}
              </AlertTitle>
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
