import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { printDailyCauseList } from '../../utils/helpers';
import {
  Menu,
  Search,
  Bell,
  Calendar,
  Printer,
  Plus,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

const pageTitles: Record<string, string> = {
  '/': 'Command Dashboard',
  '/db': 'Command Dashboard',
  '/cl': 'Client Directory',
  '/tm': 'Trademark Docket (TM)',
  '/pt': 'Patent Docket (PAT)',
  '/cp': 'Copyright Docket (CR)',
  '/ds': 'Industrial Design Docket',
  '/gi': 'Geographical Indications (GI)',
  '/sc': 'Supreme Court of India',
  '/hc': 'High Court of Judicature',
  '/dc': 'District & Sessions Court',
  '/cc': 'Consumer Disputes Forum',
  '/ngt': 'National Green Tribunal',
  '/nclt': 'NCLT & NCLAT',
  '/itat': 'Income Tax Appellate Tribunal',
  '/drt': 'Debt Recovery Tribunal',
  '/cat': 'Central Administrative Tribunal',
  '/arb': 'Arbitration & Conciliation',
  '/dkt': 'Master Docket & Calendar',
  '/drv': 'Document Vault',
  '/rpt': 'Cause List & Practice Reports',
  '/aud': 'Compliance & Audit Trail',
  '/wl': 'Advocate Work Log & Hours',
  '/not': 'Case Notes & Strategy',
  '/notif': 'Urgent Hearings & Alerts',
};

export const Topbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    toggleSidebar,
    syncStatus,
    syncDriveAndCalendar,
    toggleNotifPanel,
    counts,
    openModal,
    showToast,
    iprMatters,
    courtMatters,
    clients,
    deadlines,
  } = useLawyersDiary();

  const [searchQuery, setSearchQuery] = useState('');

  const currentTitle = pageTitles[location.pathname] || 'Lawyers Diary';

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    if (!q || q.trim().length < 2) return;

    const query = q.toLowerCase();
    const matchesIpr = iprMatters.filter(
      (m) =>
        m.mark.toLowerCase().includes(query) ||
        m.appNo.toLowerCase().includes(query) ||
        m.clientName.toLowerCase().includes(query)
    );
    const matchesCourt = courtMatters.filter(
      (r) =>
        r.caseTitle.toLowerCase().includes(query) ||
        r.caseNo.toLowerCase().includes(query) ||
        r.clientName.toLowerCase().includes(query)
    );
    const matchesClients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
    );

    const total = matchesIpr.length + matchesCourt.length + matchesClients.length;
    showToast(
      `Found ${total} result(s) for "${q}" across IPR, Courts & Clients`,
      total > 0 ? 'ok' : 'in'
    );
  };

  const handleGenerateCauseList = () => {
    printDailyCauseList(deadlines);
    showToast('Daily Cause list generated for printing', 'ok');
  };

  return (
    <header id="tb">
      {/* Left: Hamburger & Breadcrumbs */}
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <button
          className="tbb"
          onClick={toggleSidebar}
          title="Toggle Navigation Menu"
        >
          <Menu className="w-4 h-4" />
        </button>
        <div className="bc">
          <span className="font-medium text-[var(--tx2)]">Practice</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="bcc" id="bcc">
            {currentTitle}
          </span>
        </div>
      </div>

      {/* Center: Global Search */}
      <div className="sw2">
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <input
          type="text"
          placeholder="Search case #, mark, client, party..."
          id="gs"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* Right Controls */}
      <div className="tbr">
        {/* Sync Pill */}
        <div
          className={`stp ${syncStatus}`}
          id="sync-pill"
          onClick={syncDriveAndCalendar}
          title="Click to sync Drive and Google Calendar"
        >
          <RefreshCw className={`w-3 h-3 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
          <span id="sync-txt">
            {syncStatus === 'syncing' ? 'Syncing...' : 'Cloud Synced'}
          </span>
        </div>

        {/* Notifications Bell */}
        <button
          className="tbb"
          onClick={toggleNotifPanel}
          title="Notifications & Upcoming Hearings"
        >
          <Bell className="w-4 h-4" />
          {counts.urgentHearings > 0 && (
            <div className="ndbdg" id="notif-dot">
              {counts.urgentHearings}
            </div>
          )}
        </button>

        {/* Calendar Shortcut */}
        <button
          className="tbb"
          onClick={() => navigate('/dkt')}
          title="Open Docket Calendar"
        >
          <Calendar className="w-4 h-4" />
        </button>

        {/* Daily Cause List */}
        <button
          className="tbb"
          onClick={handleGenerateCauseList}
          title="Print Daily Cause List"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Add Matter Button */}
        <button
          className="bam"
          onClick={() => navigate('/new-matter')}
        >
          <Plus className="w-4 h-4" />
          <span>New Matter</span>
        </button>
      </div>
    </header>
  );
};
