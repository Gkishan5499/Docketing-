import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationPanel } from './NotificationPanel';
import { ToastContainer } from './ToastContainer';
import { AddIprMatterModal } from '../modals/AddIprMatterModal';
import { AddCourtMatterModal } from '../modals/AddCourtMatterModal';
import { ForcePasswordChangeModal } from '../auth/ForcePasswordChangeModal';
import { AddClientModal } from '../modals/AddClientModal';
import { ClientDetailModal } from '../modals/ClientDetailModal';
import { AddDocketModal } from '../modals/AddDocketModal';
import { MatterDetailModal } from '../modals/MatterDetailModal';
import { LogTimeModal } from '../modals/LogTimeModal';
import { NoteModal } from '../modals/NoteModal';
import { CreateFolderModal } from '../modals/CreateFolderModal';
import { UploadDocumentModal } from '../modals/UploadDocumentModal';

export const MainLayout: React.FC = () => {
  const { currentUser, isLoggedIn } = useLawyersDiary();

  if (!isLoggedIn || !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div id="app">
      <Sidebar />
      <div id="mn">
        <Topbar />
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pt-7 pb-8 md:px-8">
          <Outlet />
        </div>
      </div>

      {/* Global Slide-out Drawer */}
      <NotificationPanel />

      {/* Global Toast Container */}
      <ToastContainer />

      {/* Interactive Modal System */}
      <ForcePasswordChangeModal />
      <AddIprMatterModal />
      <AddCourtMatterModal />
      <AddClientModal />
      <ClientDetailModal />
      <AddDocketModal />
      <MatterDetailModal />
      <LogTimeModal />
      <NoteModal />
      <CreateFolderModal />
      <UploadDocumentModal />
    </div>
  );
};
