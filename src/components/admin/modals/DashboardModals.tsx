
import React from 'react';
import { ExportProgressModal } from '@/components/admin/modals/ExportProgressModal';

export const DashboardModals = ({ 
  exportModal, 
  setExportModal, 
  exportFormat, 
  setExportFormat, 
  handleGlobalExport, 
  exportProgress,
  ExportProgressModal: ProgressModalComponent 
}: any) => {
  return (
    <>
      {/* Add other modals here as needed */}
      <ProgressModalComponent
        isOpen={exportModal}
        onClose={() => setExportModal(false)}
        progress={exportProgress}
      />
    </>
  );
};
