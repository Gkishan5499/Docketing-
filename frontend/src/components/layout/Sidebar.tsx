import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import {
  LayoutDashboard,
  Users,
  Award,
  Lightbulb,
  FileCheck2,
  Boxes,
  MapPin,
  Landmark,
  Building2,
  Scale,
  ShieldAlert,
  Trees,
  Briefcase,
  ReceiptText,
  Gavel,
  Calendar,
  FolderOpen,
  BarChart3,
  Clock,
  StickyNote,
  Bell,
  LogOut,
  Layers,
  CheckCircle2,
  UserPlus,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarMinimized,
    toggleSidebar,
    currentUser,
    logout,
    counts,
  } = useLawyersDiary();

  const pathname = location.pathname === '/' ? '/db' : location.pathname;

  const isActive = (path: string) => pathname === path;

  const navItem = (
    path: string,
    label: string,
    IconComponent: React.ComponentType<{ className?: string }>,
    badge?: { count: number; colorClass?: string }
  ) => {
    const active = isActive(path);
    return (
      <button
        key={path}
        className={`ni ${active ? 'on' : ''}`}
        onClick={() => navigate(path)}
        title={sidebarMinimized ? label : undefined}
      >
        <span className="ic">
          <IconComponent className="w-4 h-4" />
        </span>
        <span className="nl">{label}</span>
        {badge && badge.count > 0 && (
          <span className={`nbd ${badge.colorClass || ''}`}>
            {badge.count}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside id="sb" className={sidebarMinimized ? 'mi' : ''}>
      {/* Brand Header */}
      <div className="bw" onClick={toggleSidebar} title="Toggle Sidebar">
        <div className="logo-sq">LD</div>
        <div className="btx">
          <div className="bn2">
            Lawyers <span>Diary</span>
          </div>
          <div className="bsb">Legal Practice Mgmt</div>
        </div>
      </div>

      {/* Navigation list */}
      <nav className="sn">
        <div className="sec">Command Center</div>
        {navItem('/db', 'Dashboard', LayoutDashboard)}
        {navItem('/cl', 'Clients', Users, { count: counts.clients, colorClass: 'sl' })}

        <div className="sec">IPR Practice</div>
        {navItem('/tm', 'Trademark', Award, { count: counts.tm })}
        {navItem('/pt', 'Patent', Lightbulb, { count: counts.pat, colorClass: 'sl' })}
        {navItem('/cp', 'Copyright', FileCheck2, { count: counts.cp, colorClass: 'sl' })}
        {navItem('/ds', 'Design', Boxes, { count: counts.ds, colorClass: 'sl' })}
        {navItem('/gi', 'GI Tag', MapPin, { count: counts.gi, colorClass: 'sl' })}

        <div className="sec">Courts</div>
        {navItem('/sc', 'Supreme Court', Landmark, { count: counts.sc, colorClass: 'pr' })}
        {navItem('/hc', 'High Court', Building2, { count: counts.hc, colorClass: 'pr' })}
        {navItem('/dc', 'District Court', Scale, { count: counts.dc, colorClass: 'pr' })}
        {navItem('/cc', 'Consumer Forum', ShieldAlert, { count: counts.cc, colorClass: 'sl' })}

        <div className="sec">Tribunals</div>
        {navItem('/ngt', 'NGT', Trees, { count: counts.ngt, colorClass: 'sl' })}
        {navItem('/nclt', 'NCLT / NCLAT', Briefcase, { count: counts.nclt, colorClass: 'sl' })}
        {navItem('/itat', 'ITAT', ReceiptText, { count: counts.itat, colorClass: 'sl' })}
        {navItem('/drt', 'DRT / DRAT', Landmark, { count: counts.drt, colorClass: 'rd' })}
        {navItem('/cat', 'CAT', Layers, { count: counts.cat, colorClass: 'sl' })}
        {navItem('/arb', 'Arbitration', Gavel, { count: counts.arb, colorClass: 'sl' })}

        <div className="sec">Docket &amp; Operations</div>
        {navItem('/dkt', 'Docket Calendar', Calendar, {
          count: counts.upcomingHearings,
          colorClass: 'rd',
        })}
        {navItem('/drv', 'Document Vault', FolderOpen)}
        {navItem('/rpt', 'Cause List & Reports', BarChart3)}

        <div className="sec">Compliance &amp; Time</div>
        {navItem('/aud', 'Audit Trail', CheckCircle2)}
        {navItem('/wl', 'Work Log', Clock)}
        {navItem('/not', 'Legal Notes', StickyNote, { count: counts.pinnedNotes })}
        {navItem('/notif', 'Notifications', Bell, {
          count: counts.urgentHearings,
          colorClass: 'rd',
        })}

        <div className="sec">Firm Administration</div>
        {navItem('/team', 'Team Access', UserPlus)}
      </nav>

      {/* User profile footer */}
      <div className="sft">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            borderRadius: '8px',
            padding: '0.45rem 0.5rem',
            transition: 'background 0.15s ease',
          }}
          onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseOut={(e) => (e.currentTarget.style.background = '')}
        >
          <div className="ua">
            {currentUser ? currentUser.charAt(0).toUpperCase() : 'A'}
          </div>
          <div className="udt">
            <div className="un">{currentUser || 'Advocate'}</div>
            <div className="uro">Senior Counsel</div>
          </div>
          <button
            className="blo"
            onClick={() => {
              if (window.confirm('Sign out of Lawyers Diary?')) {
                logout();
                navigate('/login');
              }
            }}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
