import React, { useState, useEffect } from 'react';
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
  ChevronDown,
} from 'lucide-react';

interface SubMenuItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: SubMenuItem[];
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    sidebarMinimized,
    toggleSidebar,
    currentUser,
    logout,
  } = useLawyersDiary();

  const pathname = location.pathname === '/' ? '/db' : location.pathname;

  const sections: NavSection[] = [
    {
      id: 'command-center',
      label: 'Command Center',
      icon: LayoutDashboard,
      items: [
        { path: '/db', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/cl', label: 'Clients', icon: Users },
      ],
    },
    {
      id: 'ipr-practice',
      label: 'IPR Practice',
      icon: Award,
      items: [
        { path: '/tm', label: 'Trademark', icon: Award },
        { path: '/pt', label: 'Patent', icon: Lightbulb },
        { path: '/cp', label: 'Copyright', icon: FileCheck2 },
        { path: '/ds', label: 'Design', icon: Boxes },
        { path: '/gi', label: 'GI Tag', icon: MapPin },
      ],
    },
    {
      id: 'courts',
      label: 'Courts',
      icon: Landmark,
      items: [
        { path: '/sc', label: 'Supreme Court', icon: Landmark },
        { path: '/hc', label: 'High Court', icon: Building2 },
        { path: '/dc', label: 'District Court', icon: Scale },
        { path: '/cc', label: 'Consumer Forum', icon: ShieldAlert },
      ],
    },
    {
      id: 'tribunals',
      label: 'Tribunals',
      icon: Gavel,
      items: [
        { path: '/ngt', label: 'NGT', icon: Trees },
        { path: '/nclt', label: 'NCLT / NCLAT', icon: Briefcase },
        { path: '/itat', label: 'ITAT', icon: ReceiptText },
        { path: '/drt', label: 'DRT / DRAT', icon: Landmark },
        { path: '/cat', label: 'CAT', icon: Layers },
        { path: '/arb', label: 'Arbitration', icon: Gavel },
      ],
    },
    {
      id: 'docket-ops',
      label: 'Docket & Ops',
      icon: Calendar,
      items: [
        { path: '/dkt', label: 'Docket Calendar', icon: Calendar },
        { path: '/drv', label: 'Document Vault', icon: FolderOpen },
        { path: '/rpt', label: 'Cause List & Reports', icon: BarChart3 },
      ],
    },
    {
      id: 'compliance-time',
      label: 'Compliance',
      icon: Clock,
      items: [
        { path: '/aud', label: 'Audit Trail', icon: CheckCircle2 },
        { path: '/wl', label: 'Work Log', icon: Clock },
        { path: '/not', label: 'Legal Notes', icon: StickyNote },
        { path: '/notif', label: 'Notifications', icon: Bell },
      ],
    },
    {
      id: 'firm-admin',
      label: 'Firm Admin',
      icon: UserPlus,
      items: [{ path: '/team', label: 'Team Access', icon: UserPlus }],
    },
  ];

  // Open/close state: ONLY the first menu section is open by default
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(() => ({
    [sections[0]?.id || 'command-center']: true,
  }));

  // Ensure whichever section contains the current active pathname is open
  useEffect(() => {
    const activeSection = sections.find((sec) =>
      sec.items.some((item) => item.path === pathname)
    );
    if (activeSection) {
      setOpenSections((prev) => ({
        ...prev,
        [activeSection.id]: true,
      }));
    }
  }, [pathname]);

  const toggleSection = (sectionId: string) => {
    if (sidebarMinimized) {
      toggleSidebar();
      setOpenSections((prev) => ({
        ...prev,
        [sectionId]: true,
      }));
      return;
    }

    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
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
      <nav className="sn" aria-label="Main practice navigation">
        {sections.map((section) => {
          const SectionIcon = section.icon;
          const isOpen = Boolean(openSections[section.id]);
          const hasActiveItem = section.items.some((item) => item.path === pathname);

          return (
            <div key={section.id} className="sb-section-group">
              {/* Main Menu Item (Dropdown Trigger) */}
              <button
                type="button"
                className={`sb-main-item ${isOpen ? 'is-open' : ''} ${
                  hasActiveItem ? 'has-active' : ''
                }`}
                onClick={() => toggleSection(section.id)}
                title={sidebarMinimized ? section.label : undefined}
                aria-expanded={isOpen}
              >
                <span className="sb-main-ic">
                  <SectionIcon className="w-[18px] h-[18px]" />
                </span>
                <span className="sb-main-label">{section.label}</span>

                <ChevronDown
                  className={`sb-chevron ${isOpen ? 'open' : 'closed'}`}
                />
              </button>

              {/* Sub Menu Items (Dropdown Body) */}
              {isOpen && !sidebarMinimized && (
                <div className="sb-sub-menu">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    const active = pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        type="button"
                        className={`sb-sub-item ${active ? 'on' : ''}`}
                        onClick={() => navigate(item.path)}
                      >
                        <span className="sb-sub-ic">
                          <ItemIcon className="w-4 h-4" />
                        </span>
                        <span className="sb-sub-label">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
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
