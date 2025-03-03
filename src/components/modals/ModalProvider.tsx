import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";

// Import all modal components
import CreateConversationModal from "./CreateConversationModal";
import CreatePersonaModal from "./CreatePersonaModal";
import ModelConfigModal from "./ModelConfigModal";
import SettingsModal from "./SettingsModal";
import ExportModal from "./ExportModal";
import ImportModal from "./ImportModal";

/**
 * ModalProvider renders the appropriate modal based on Redux UI state
 * Acts as a central manager for all modals in the application
 */
const ModalProvider: React.FC = () => {
  const modalState = useSelector((state: RootState) => state.ui.modalOpen);
  const { activeModelId } = useSelector((state: RootState) => state.models);

  return (
    <>
      {modalState.createConversation && <CreateConversationModal />}
      {modalState.createPersona && <CreatePersonaModal />}
      {modalState.editPersona && <CreatePersonaModal isEditing />}
      {modalState.modelConfig && (
        <ModelConfigModal modelId={activeModelId || undefined} />
      )}
      {modalState.settings && <SettingsModal />}
      {modalState.export && <ExportModal />}
      {modalState.import && <ImportModal />}
    </>
  );
};

export default ModalProvider;
