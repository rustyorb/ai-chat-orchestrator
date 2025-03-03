import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  VStack,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  HStack,
  Box,
  Text,
  useColorModeValue,
  Select,
  Checkbox,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store";
import { closeModal } from "../../store/slices/uiSlice";
import { exportApi } from "../../services/api";
import { Download, FileJson, FileText } from "lucide-react";

const ExportModal: React.FC = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const conversations = useSelector(
    (state: RootState) => state.conversations.conversations
  );
  const activeConversationId = useSelector(
    (state: RootState) => state.conversations.activeConversationId
  );

  const [exportFormat, setExportFormat] = useState<
    "json" | "markdown" | "text"
  >("json");
  const [exportTarget, setExportTarget] = useState<
    "current" | "selected" | "all"
  >(activeConversationId ? "current" : "all");
  const [selectedConversations, setSelectedConversations] = useState<string[]>(
    activeConversationId ? [activeConversationId] : []
  );
  const [includePersonas, setIncludePersonas] = useState(true);
  const [includeModels, setIncludeModels] = useState(true);
  const [includeSettings, setIncludeSettings] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const bgColor = useColorModeValue("white", "gray.800");

  const handleClose = () => {
    dispatch(closeModal("export"));
  };

  const handleExport = async () => {
    setIsExporting(true);

    console.log("🔍 DEBUG - Starting export:", {
      format: exportFormat,
      target: exportTarget,
      selectedCount: selectedConversations.length,
      includePersonas,
      includeModels,
      includeSettings,
    });

    try {
      // Determine which conversations to export
      let conversationsToExport: string[] = [];
      if (exportTarget === "current" && activeConversationId) {
        conversationsToExport = [activeConversationId];
      } else if (exportTarget === "selected") {
        conversationsToExport = selectedConversations;
      } else {
        // For 'all', export all conversation IDs
        conversationsToExport = conversations.map((c) => c.id);
      }

      if (conversationsToExport.length === 0) {
        console.log("🔍 DEBUG - Export error: No conversations selected");
        toast({
          title: "Export Error",
          description: "No conversations selected for export",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        setIsExporting(false);
        return;
      }

      console.log("🔍 DEBUG - Conversations to export:", conversationsToExport);

      // For single conversation export, use the conversation API
      if (conversationsToExport.length === 1) {
        console.log(
          `🔍 DEBUG - Exporting single conversation in ${exportFormat} format`
        );
        const conversationId = conversationsToExport[0];
        const blob = await exportApi.exportConversation(
          conversationId,
          exportFormat
        );

        console.log("🔍 DEBUG - Export API response received:", {
          blobSize: blob.size,
          blobType: blob.type,
        });

        // Create a download link and trigger it
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `conversation-${conversationId}.${getFileExtension(
          exportFormat
        )}`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: "Conversation exported successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // For multiple conversations, use the database export
        const db = await import("../../services/db").then(
          (module) => module.db
        );
        const exportData: any = {};

        // Export conversations
        if (conversationsToExport.length > 0) {
          const allConversations = await db.getConversations();
          exportData.conversations = allConversations.filter((c) =>
            conversationsToExport.includes(c.id)
          );
        }

        // Include other data based on options
        if (includePersonas) {
          exportData.personas = await db.getPersonas();
        }

        if (includeModels) {
          exportData.models = await db.getModels();
        }

        if (includeSettings) {
          exportData.settings = await db.getSettings();
        }

        // Create and download the JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ai-orchestrator-export-${new Date()
          .toISOString()
          .slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Export Successful",
          description: `Exported ${conversationsToExport.length} conversations and related data`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred during export",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFileExtension = (format: "json" | "markdown" | "text"): string => {
    switch (format) {
      case "json":
        return "json";
      case "markdown":
        return "md";
      case "text":
        return "txt";
    }
  };

  const handleConversationToggle = (conversationId: string) => {
    setSelectedConversations((prev) => {
      if (prev.includes(conversationId)) {
        return prev.filter((id) => id !== conversationId);
      } else {
        return [...prev, conversationId];
      }
    });
  };

  // Determine if export button should be disabled
  const isExportDisabled =
    (exportTarget === "selected" && selectedConversations.length === 0) ||
    conversations.length === 0;

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Export Data</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {conversations.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <Box>
                  <AlertTitle>No Conversations Available</AlertTitle>
                  <AlertDescription>
                    You don't have any conversations to export yet.
                  </AlertDescription>
                </Box>
              </Alert>
            ) : (
              <>
                <FormControl>
                  <FormLabel>What to Export</FormLabel>
                  <RadioGroup
                    value={exportTarget}
                    onChange={(value) =>
                      setExportTarget(value as "current" | "selected" | "all")
                    }
                  >
                    <VStack align="start" spacing={2}>
                      {activeConversationId && (
                        <Radio value="current">Current conversation only</Radio>
                      )}
                      <Radio value="selected">Selected conversations</Radio>
                      <Radio value="all">All conversations</Radio>
                    </VStack>
                  </RadioGroup>
                </FormControl>

                {exportTarget === "selected" && (
                  <FormControl>
                    <FormLabel>Select Conversations</FormLabel>
                    <Box
                      maxH="200px"
                      overflowY="auto"
                      p={2}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor={useColorModeValue("gray.200", "gray.600")}
                    >
                      <VStack align="start" spacing={1}>
                        {conversations.map((conversation) => (
                          <Checkbox
                            key={conversation.id}
                            isChecked={selectedConversations.includes(
                              conversation.id
                            )}
                            onChange={() =>
                              handleConversationToggle(conversation.id)
                            }
                          >
                            {conversation.title} (
                            {new Date(
                              conversation.updated
                            ).toLocaleDateString()}
                            )
                          </Checkbox>
                        ))}
                      </VStack>
                    </Box>
                  </FormControl>
                )}

                {(exportTarget === "selected" || exportTarget === "all") && (
                  <FormControl>
                    <FormLabel>Include Additional Data</FormLabel>
                    <VStack align="start" spacing={2}>
                      <Checkbox
                        isChecked={includePersonas}
                        onChange={() => setIncludePersonas(!includePersonas)}
                      >
                        Include personas
                      </Checkbox>
                      <Checkbox
                        isChecked={includeModels}
                        onChange={() => setIncludeModels(!includeModels)}
                      >
                        Include model configurations
                      </Checkbox>
                      <Checkbox
                        isChecked={includeSettings}
                        onChange={() => setIncludeSettings(!includeSettings)}
                      >
                        Include application settings
                      </Checkbox>
                    </VStack>
                  </FormControl>
                )}

                {exportTarget === "current" && (
                  <FormControl>
                    <FormLabel>Export Format</FormLabel>
                    <Select
                      value={exportFormat}
                      onChange={(e) =>
                        setExportFormat(
                          e.target.value as "json" | "markdown" | "text"
                        )
                      }
                    >
                      <option value="json">JSON</option>
                      <option value="markdown">Markdown</option>
                      <option value="text">Plain Text</option>
                    </Select>
                  </FormControl>
                )}
              </>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleExport}
            isLoading={isExporting}
            loadingText="Exporting..."
            isDisabled={isExportDisabled}
            leftIcon={
              exportFormat === "json" ? (
                <FileJson size={16} />
              ) : exportFormat === "markdown" ? (
                <FileText size={16} />
              ) : (
                <Download size={16} />
              )
            }
          >
            Export
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ExportModal;
