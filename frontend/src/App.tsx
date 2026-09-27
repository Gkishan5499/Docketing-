import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { LawyersDiaryProvider } from './context/LawyersDiaryContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { IprMatterPage } from './pages/IprMatterPage';
import { CourtMatterPage } from './pages/CourtMatterPage';
import { DocketCalendarPage } from './pages/DocketCalendarPage';
import { DriveDocumentsPage } from './pages/DriveDocumentsPage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryAuditPage } from './pages/HistoryAuditPage';
import { WorkLogPage } from './pages/WorkLogPage';
import { NotesPage } from './pages/NotesPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { LandingPage } from './pages/LandingPage';
import { TeamPage } from './pages/TeamPage';
import { OwnerLoginPage } from './pages/OwnerLoginPage';
import { OwnerDashboardPage } from './pages/OwnerDashboardPage';
import { OwnerManagementPage } from './pages/OwnerManagementPage';
import { AddMatterPage } from './pages/AddMatterPage';

function ApplicationRoutes() {
  const location = useLocation();

  if (location.pathname === '/') return <LandingPage />;

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/owner/login" element={<OwnerLoginPage />} />
      <Route path="/owner" element={<OwnerDashboardPage />} />
      <Route path="/owner/access" element={<OwnerManagementPage />} />
      <Route path="/owner/billing" element={<OwnerManagementPage />} />
      <Route path="/owner/settings" element={<OwnerManagementPage />} />

      <Route path="/" element={<MainLayout />}>
        <Route index element={<Navigate to="/db" replace />} />
        <Route path="db" element={<DashboardPage />} />
        <Route path="new-matter" element={<AddMatterPage />} />
        <Route path="cl" element={<ClientsPage />} />

          {/* IPR Practice Areas */}
          <Route path="tm" element={<IprMatterPage type="TM" />} />
          <Route path="pt" element={<IprMatterPage type="PAT" />} />
          <Route path="cp" element={<IprMatterPage type="COPY" />} />
          <Route path="ds" element={<IprMatterPage type="DESIGN" />} />
          <Route path="gi" element={<IprMatterPage type="GI" />} />

          {/* Courts & Tribunals */}
          <Route path="sc" element={<CourtMatterPage type="SC" />} />
          <Route path="hc" element={<CourtMatterPage type="HC" />} />
          <Route path="dc" element={<CourtMatterPage type="DC" />} />
          <Route path="cc" element={<CourtMatterPage type="CC" />} />
          <Route path="ngt" element={<CourtMatterPage type="NGT" />} />
          <Route path="nclt" element={<CourtMatterPage type="NCLT" />} />
          <Route path="itat" element={<CourtMatterPage type="ITAT" />} />
          <Route path="drt" element={<CourtMatterPage type="DRT" />} />
          <Route path="cat" element={<CourtMatterPage type="CAT" />} />
          <Route path="arb" element={<CourtMatterPage type="ARB" />} />

        {/* Practice Management Utilities */}
        <Route path="dkt" element={<DocketCalendarPage />} />
        <Route path="drv" element={<DriveDocumentsPage />} />
        <Route path="rpt" element={<ReportsPage />} />
        <Route path="aud" element={<HistoryAuditPage />} />
        <Route path="wl" element={<WorkLogPage />} />
        <Route path="not" element={<NotesPage />} />
        <Route path="notif" element={<NotificationsPage />} />
        <Route path="team" element={<TeamPage />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/db" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <LawyersDiaryProvider>
      <BrowserRouter>
        <ApplicationRoutes />
      </BrowserRouter>
    </LawyersDiaryProvider>
  );
}
