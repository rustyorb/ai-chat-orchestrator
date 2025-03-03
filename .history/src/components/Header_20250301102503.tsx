import React from "react";
import {
  Flex,
  IconButton,
  useColorMode,
  useColorModeValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  Heading,
  Badge,
  HStack,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import {
  Sun,
  Moon,
  User,
  LogOut,
  Settings,
  Save,
  Upload,
  HelpCircle,
} from "lucide-react";
import { RootState } from "../store";
import { toggleDarkMode } from "../store/slices/settingsSlice";
import { openModal } from "../store/slices/uiSlice";
import { useLocation, useNavigate } from "react-router-dom";
import BackendStatusIndicator from "./common/BackendStatusIndicator";

const Header = () => {
  const { colorMode } = useColorMode();
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const bg = useColorModeValue("white", "gray.800");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const activeConversation = useSelector((state: RootState) => {
    const activeId = state.conversations.activeConversationId;
    if (!activeId) return null;
    return state.conversations.conversations.find((c) => c.id === activeId);
  });

  const getPageTitle = () => {
    const path = location.pathname;

    if (path.startsWith("/conversations") && activeConversation) {
      return activeConversation.title;
    }

    switch (true) {
      case path === "/":
        return "Home";
      case path.startsWith("/conversations"):
        return "Conversations";
      case path.startsWith("/personas"):
        return "Personas";
      case path.startsWith("/models"):
        return "Models";
      case path.startsWith("/settings"):
        return "Settings";
      default:
        return "AI Orchestrator";
    }
  };

  return (
    <Flex
      as="header"
      align="center"
      justify="space-between"
      py={2}
      px={4}
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      h="60px"
    >
      <Heading
        size="md"
        cursor="pointer"
        onClick={() => {
          if (location.pathname !== "/") {
            console.log("🔍 DEBUG - Navigating to home page");
            navigate("/");
          }
        }}
      >
        {getPageTitle()}
        {activeConversation && !activeConversation.isActive && (
          <Badge ml={2} colorScheme="yellow">
            Archived
          </Badge>
        )}
      </Heading>

      <HStack spacing={3}>
        <BackendStatusIndicator />

        <IconButton
          aria-label={
            colorMode === "light"
              ? "Switch to dark mode"
              : "Switch to light mode"
          }
          icon={colorMode === "light" ? <Moon size={20} /> : <Sun size={20} />}
          onClick={() => dispatch(toggleDarkMode())}
          variant="ghost"
        />

        <Menu>
          <MenuButton as={Button} variant="ghost" size="md">
            <User size={20} />
          </MenuButton>
          <MenuList>
            <MenuItem
              icon={<Settings size={16} />}
              onClick={() => dispatch(openModal("settings"))}
            >
              Settings
            </MenuItem>
            <MenuItem
              icon={<Save size={16} />}
              onClick={() => dispatch(openModal("export"))}
            >
              Export Data
            </MenuItem>
            <MenuItem
              icon={<Upload size={16} />}
              onClick={() => dispatch(openModal("import"))}
            >
              Import Data
            </MenuItem>
            <MenuItem
              icon={<HelpCircle size={16} />}
              onClick={() =>
                window.open(
                  "https://github.com/your-repo/ai-orchestrator/wiki",
                  "_blank"
                )
              }
            >
              Help
            </MenuItem>
          </MenuList>
        </Menu>
      </HStack>
    </Flex>
  );
};

export default Header;
