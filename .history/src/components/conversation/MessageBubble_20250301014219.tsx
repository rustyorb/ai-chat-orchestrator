import React from "react";
import {
  Box,
  Flex,
  Text,
  Avatar,
  useColorModeValue,
  Badge,
} from "@chakra-ui/react";
import { Message } from "../../types";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { tomorrow } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const userBgColor = useColorModeValue("blue.50", "blue.900");
  const agentBgColor = useColorModeValue("gray.50", "gray.700");
  const systemBgColor = useColorModeValue("yellow.50", "yellow.900");
  const borderColor = useColorModeValue("gray.200", "gray.600");

  // Determine background color based on sender type
  let bgColor;
  if (message.senderType === "user") {
    bgColor = userBgColor;
  } else if (message.senderType === "agent") {
    bgColor = agentBgColor;
  } else {
    bgColor = systemBgColor;
  }

  // Format timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box
      borderRadius="lg"
      p={4}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      width="100%"
    >
      <Flex justify="space-between" align="center" mb={2}>
        <Flex align="center">
          <Avatar size="sm" name={message.senderId} mr={2} />
          <Text fontWeight="bold">{message.senderId}</Text>
          {message.senderType === "system" && (
            <Badge ml={2} colorScheme="yellow">
              System
            </Badge>
          )}
        </Flex>
        <Text fontSize="xs" color="gray.500">
          {formattedTime}
        </Text>
      </Flex>

      <Box mt={2} className="markdown-content">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={tomorrow}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {message.content}
        </ReactMarkdown>
      </Box>

      {message.metadata && (
        <Flex mt={2} fontSize="xs" color="gray.500" justify="flex-end">
          {message.metadata.modelCallDuration && (
            <Text mr={2}>
              Generated in {message.metadata.modelCallDuration.toFixed(2)}s
            </Text>
          )}
          {message.metadata.modelTokensUsed && (
            <Text>Tokens: {message.metadata.modelTokensUsed}</Text>
          )}
        </Flex>
      )}
    </Box>
  );
};

export default MessageBubble;
