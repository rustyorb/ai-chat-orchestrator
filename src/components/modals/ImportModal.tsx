import React, { useState, useRef } from "react";
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
  Box,
  Text,
  useColorModeValue,
  FormControl,
  FormLabel,
  Checkbox,
  Input,
  Progress,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
} from "@chakra-ui/react";
import { useDispatch } from "react-redux";
import { closeModal } from "../../store/slices/uiSlice";
import { setPersonas } from "../../store/slices/personaSlice";
import { setConversations } from "../../store/slices/conversationSlice";
import { setModels } from "../../store/slices/modelSlice";
import { updateSettings } from "../../store/slices/settingsSlice";
import { Upload, FileJson, AlertTriangle } from "lucide-react";

const ImportModal: React.FC = () => {
  const dispatch = useDispatch();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Import options
  const [importPersonas, setImportPersonas] = useState(true);
  const [importConversations, setImportConversations] = useState(true);
  const [importModels, setImportModels] = useState(true);
  const [importSettings, setImportSettings] = useState(true);
  const [mergeWithExisting, setMergeWithExisting] = useState(true);

  const bgColor = useColorModeValue("white", "gray.800");

  const handleClose = () => {
    dispatch(closeModal("import"));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file);
        setImportError(null);
      } else {
        setSelectedFile(null);
        setImportError("Please select a valid JSON file");
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setIsImporting(true);
    setImportProgress(10);
    setImportError(null);

    try {
      // Read the file
      const fileContents = await readFileAsText(selectedFile);
      setImportProgress(30);

      // Parse the JSON data
      let importData;
      try {
        importData = JSON.parse(fileContents);
      } catch (error) {
        throw new Error("Invalid JSON format");
      }

      setImportProgress(50);

      // Validate the data structure
      if (!importData || typeof importData !== "object") {
        throw new Error("Invalid import data structure");
      }

      // Import into IndexedDB
      const db = await import("../../services/db").then((module) => module.db);

      // Prepare the data to import based on selected options
      const dataToImport: any = {};

      if (importConversations && importData.conversations) {
        dataToImport.conversations = importData.conversations;
      }

      if (importPersonas && importData.personas) {
        dataToImport.personas = importData.personas;
      }

      if (importModels && importData.models) {
        dataToImport.models = importData.models;
      }

      if (importSettings && importData.settings) {
        dataToImport.settings = importData.settings;
      }

      setImportProgress(70);

      // Import the data
      if (mergeWithExisting) {
        await db.importData(dataToImport);
      } else {
        // If not merging, clear existing data first
        if (importConversations) {
          const existingConversations = await db.getConversations();
          for (const conversation of existingConversations) {
            await db.deleteConversation(conversation.id);
          }
        }

        if (importPersonas) {
          const existingPersonas = await db.getPersonas();
          for (const persona of existingPersonas) {
            await db.deletePersona(persona.id);
          }
        }

        if (importModels) {
          const existingModels = await db.getModels();
          for (const model of existingModels) {
            await db.deleteModel(model.id);
          }
        }

        // Then import the new data
        await db.importData(dataToImport);
      }

      setImportProgress(90);

      // Update Redux store with the new data
      if (importConversations && dataToImport.conversations) {
        dispatch(setConversations(dataToImport.conversations));
      }

      if (importPersonas && dataToImport.personas) {
        dispatch(setPersonas(dataToImport.personas));
      }

      if (importModels && dataToImport.models) {
        dispatch(setModels(dataToImport.models));
      }

      if (importSettings && dataToImport.settings) {
        dispatch(updateSettings(dataToImport.settings));
      }

      setImportProgress(100);
      setImportSuccess(true);

      toast({
        title: "Import Successful",
        description: "Data has been imported successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      // Close the modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (error: any) {
      setImportError(error.message || "An error occurred during import");

      toast({
        title: "Import Failed",
        description: error.message || "An error occurred during import",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsImporting(false);
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          resolve(event.target.result as string);
        } else {
          reject(new Error("Failed to read file"));
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  return (
    <Modal isOpen={true} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Import Data</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={6} align="stretch">
            <FormControl>
              <FormLabel>Select JSON File</FormLabel>
              <Input
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                ref={fileInputRef}
                hidden
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                leftIcon={<FileJson size={16} />}
                w="full"
                variant="outline"
                isDisabled={isImporting}
              >
                {selectedFile ? selectedFile.name : "Choose File"}
              </Button>
              {selectedFile && (
                <Text fontSize="sm" mt={1} color="gray.500">
                  File size: {(selectedFile.size / 1024).toFixed(2)} KB
                </Text>
              )}
            </FormControl>

            {selectedFile && (
              <>
                <FormControl>
                  <FormLabel>Import Options</FormLabel>
                  <VStack align="start" spacing={2}>
                    <Checkbox
                      isChecked={importConversations}
                      onChange={() =>
                        setImportConversations(!importConversations)
                      }
                      isDisabled={isImporting}
                    >
                      Import conversations
                    </Checkbox>
                    <Checkbox
                      isChecked={importPersonas}
                      onChange={() => setImportPersonas(!importPersonas)}
                      isDisabled={isImporting}
                    >
                      Import personas
                    </Checkbox>
                    <Checkbox
                      isChecked={importModels}
                      onChange={() => setImportModels(!importModels)}
                      isDisabled={isImporting}
                    >
                      Import model configurations
                    </Checkbox>
                    <Checkbox
                      isChecked={importSettings}
                      onChange={() => setImportSettings(!importSettings)}
                      isDisabled={isImporting}
                    >
                      Import application settings
                    </Checkbox>
                  </VStack>
                </FormControl>

                <FormControl>
                  <FormLabel>Merge Options</FormLabel>
                  <Checkbox
                    isChecked={mergeWithExisting}
                    onChange={() => setMergeWithExisting(!mergeWithExisting)}
                    isDisabled={isImporting}
                  >
                    Merge with existing data (uncheck to replace)
                  </Checkbox>
                  {!mergeWithExisting && (
                    <Alert status="warning" mt={2} size="sm">
                      <AlertIcon as={AlertTriangle} />
                      <Box>
                        <AlertTitle fontSize="sm">Warning</AlertTitle>
                        <AlertDescription fontSize="xs">
                          This will replace all existing data with the imported
                          data
                        </AlertDescription>
                      </Box>
                    </Alert>
                  )}
                </FormControl>
              </>
            )}

            {isImporting && (
              <Box>
                <Text mb={2}>Importing data...</Text>
                <Progress
                  value={importProgress}
                  size="sm"
                  colorScheme="brand"
                />
              </Box>
            )}

            {importError && (
              <Alert status="error">
                <AlertIcon />
                <Box>
                  <AlertTitle>Import Error</AlertTitle>
                  <AlertDescription>{importError}</AlertDescription>
                </Box>
              </Alert>
            )}

            {importSuccess && (
              <Alert status="success">
                <AlertIcon />
                <Box>
                  <AlertTitle>Import Successful</AlertTitle>
                  <AlertDescription>
                    Data has been imported successfully
                  </AlertDescription>
                </Box>
              </Alert>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            isDisabled={isImporting}
          >
            Cancel
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleImport}
            isLoading={isImporting}
            loadingText="Importing..."
            isDisabled={!selectedFile || isImporting}
            leftIcon={<Upload size={16} />}
          >
            Import
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ImportModal;
