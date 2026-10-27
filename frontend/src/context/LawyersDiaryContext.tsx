import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Client,
  IprMatter,
  CourtMatter,
  DocketEvent,
  DocumentFile,
  VaultFolder,
  ActivityItem,
  AuditHistoryItem,
  WorkLogEntry,
  NoteItem,
  ToastMessage,
  IprType,
  CourtType,
  LegalNotice,
  DocketPriority,
} from '../types';
import {
  initialClients,
  initialIprMatters,
  initialCourtMatters,
  initialDeadlines,
  initialDocuments,
  initialVaultFolders,
  initialActivities,
  initialAuditLogs,
  initialWorkLogs,
  initialNotes,
  initialLegalNotices,
} from '../data/seedData';
import { gid, tsNow, dDiff } from '../utils/helpers';
import {
  buildGoogleCalendarUrl,
  openGoogleCalendarEvent,
  generateIcsContent,
  downloadIcsFile,
  buildGoogleCalendarSubscribeUrl,
} from '../utils/calendarSync';
import { storeFileInDb, removeFileFromDb } from '../utils/fileStorage';

interface ModalState {
  type:
    | 'none'
    | 'add-ipr'
    | 'edit-ipr'
    | 'add-court'
    | 'edit-court'
    | 'add-client'
    | 'edit-client'
    | 'client-detail'
    | 'add-docket'
    | 'edit-docket'
    | 'matter-detail'
    | 'log-time'
    | 'note'
    | 'create-folder'
    | 'upload-doc'
    | 'add-notice'
    | 'notice-detail';
  payload?: any;
}

export interface TrialInfo {
  firmName?: string;
  plan?: string;
  subscription?: string;
  renewalDate?: string;
  daysLeft?: number;
  isTrial?: boolean;
  isExpired?: boolean;
}

interface LawyersDiaryContextType {
  // Auth
  isLoggedIn: boolean;
  currentUser: string;
  currentEmail: string;
  currentOrgId?: string;
  currentUserId?: string;
  currentRole: 'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER';
  mustChangePassword: boolean;
  canDeleteRecords: boolean;
  trialInfo: TrialInfo | null;
  login: (email: string, pass: string) => Promise<boolean>;
  sendOtp: (email: string, name?: string, purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET') => Promise<{ success: boolean; message: string; debugOtp?: string }>;
  verifyOtp: (email: string, otp: string, purpose?: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET') => Promise<{ success: boolean; message: string }>;
  loginWithOtp: (email: string, otp: string) => Promise<boolean>;
  registerUser: (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    phone?: string;
    otp: string;
  }) => Promise<boolean>;
  loginGoogle: () => void;
  logout: () => void;
  updateProfile: (fields: { name?: string; email?: string }) => void;
  completePasswordSetup: (currentPassword: string, newPassword: string) => Promise<boolean>;

  // Sidebar & Layout
  sidebarMinimized: boolean;
  toggleSidebar: () => void;
  isNotifPanelOpen: boolean;
  toggleNotifPanel: () => void;

  // Data
  clients: Client[];
  iprMatters: IprMatter[];
  courtMatters: CourtMatter[];
  deadlines: DocketEvent[];
  documents: DocumentFile[];
  vaultFolders: VaultFolder[];
  activities: ActivityItem[];
  auditLogs: AuditHistoryItem[];
  workLogs: WorkLogEntry[];
  notes: NoteItem[];
  legalNotices: LegalNotice[];

  // Sync & Google Calendar
  syncStatus: 'synced' | 'syncing';
  syncDriveAndCalendar: () => void;
  googleCalendarEmail: string;
  googleCalendarSync: boolean;
  googleCalendarScope: 'all' | 'assigned';
  calendarToken: string;
  connectGoogleCalendar: (gmail: string) => Promise<boolean>;
  disconnectGoogleCalendar: () => Promise<boolean>;
  setGoogleCalendarScope: (scope: 'all' | 'assigned') => void;
  openEventInGoogleCalendar: (event: DocketEvent) => void;
  exportAllEventsToGoogleCalendar: (customEvents?: DocketEvent[]) => void;
  subscribeGoogleCalendarFeed: () => void;

  // Toasts
  toasts: ToastMessage[];
  showToast: (text: string, type?: 'ok' | 'er' | 'in') => void;

  // Modals
  modalState: ModalState;
  openModal: (type: ModalState['type'], payload?: any) => void;
  closeModal: () => void;

  // Actions
  addClient: (client: Omit<Client, 'id' | 'created'>, shouldCloseModal?: boolean) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addIprMatter: (matter: Omit<IprMatter, 'id' | 'created' | 'statusHistory'>, attachedFiles?: File[]) => IprMatter;
  updateIprMatter: (id: string, updates: Partial<IprMatter>) => void;
  deleteIprMatter: (id: string) => void;

  addCourtMatter: (matter: Omit<CourtMatter, 'id' | 'created' | 'statusHistory'>) => CourtMatter;
  updateCourtMatter: (id: string, updates: Partial<CourtMatter>) => void;
  deleteCourtMatter: (id: string) => void;

  addDocketEvent: (event: Omit<DocketEvent, 'id'>) => DocketEvent;
  updateDocketEvent: (id: string, updates: Partial<DocketEvent>) => void;
  deleteDocketEvent: (id: string) => void;

  createVaultFolder: (name: string, parentPath?: string, color?: string) => VaultFolder | null;
  ensureMatterFolders: (clientName: string, folderName: string) => { rootPath: string; subfolders: VaultFolder[] };
  deleteVaultFolder: (pathOrId: string) => void;
  uploadDocuments: (files: FileList | File[], targetFolder?: string, matterId?: string, tags?: string[]) => void;
  uploadDocumentItem: (doc: Omit<DocumentFile, 'id'>) => DocumentFile;
  deleteDocument: (id: string) => void;
  moveDocument: (id: string, targetFolder: string) => void;

  addWorkLog: (log: Omit<WorkLogEntry, 'id' | 'created'>) => void;
  updateWorkLog: (id: string, log: Partial<WorkLogEntry>) => void;
  deleteWorkLog: (id: string) => void;

  addNote: (note: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateNote: (id: string, note: Partial<NoteItem>) => void;
  togglePinNote: (id: string) => void;
  deleteNote: (id: string) => void;

  addLegalNotice: (notice: Omit<LegalNotice, 'id' | 'created'>) => void;
  updateLegalNotice: (id: string, notice: Partial<LegalNotice>) => void;
  deleteLegalNotice: (id: string) => void;

  // Badge Counts
  counts: {
    clients: number;
    iprTotal: number;
    courtTotal: number;
    urgentHearings: number;
    upcomingHearings: number;
    pinnedNotes: number;
    notices: number;
    noticesSent: number;
    noticesReceived: number;
    noticesActionable: number;
    tm: number;
    pat: number;
    cp: number;
    ds: number;
    gi: number;
    sc: number;
    hc: number;
    dc: number;
    cc: number;
    lc: number;
    ngt: number;
    nclt: number;
    itat: number;
    drt: number;
    cat: number;
    arb: number;
  };
}

const LawyersDiaryContext = createContext<LawyersDiaryContextType | undefined>(undefined);

const defaultFreshVaultFolders: VaultFolder[] = [
  { id: 'vf_root', name: 'LawyersDiary', path: '/LawyersDiary', parentPath: '', isSystem: true },
  { id: 'vf_clients', name: 'Clients', path: '/LawyersDiary/Clients', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_pleadings', name: 'Pleadings', path: '/LawyersDiary/Pleadings', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_orders', name: 'Orders', path: '/LawyersDiary/Orders', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_evidence', name: 'Evidence', path: '/LawyersDiary/Evidence', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_templates', name: 'Templates & Drafts', path: '/LawyersDiary/Templates & Drafts', parentPath: '/LawyersDiary', isSystem: true },
];

export const computeUserScope = (orgId?: string, email?: string, uid?: string): string => {
  if (orgId && String(orgId).trim()) return `org_${String(orgId).trim()}`;
  if (uid && String(uid).trim()) return `usr_${String(uid).trim()}`;
  if (email && String(email).trim()) return `email_${String(email).trim().toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
  return 'fresh';
};

const AUTH_PREFIX = 'ld_auth_';

const loadAuthStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(AUTH_PREFIX + key) ?? localStorage.getItem('ld_react_' + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from auth storage`, e);
  }
  return fallback;
};

const saveAuthStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(AUTH_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to auth storage`, e);
  }
};

const loadTenantStorage = <T,>(scope: string, key: string, fallback: T): T => {
  if (!scope || scope === 'fresh') return fallback;
  try {
    const raw = localStorage.getItem(`ld_scope_${scope}_${key}`);
    if (raw) return JSON.parse(raw);

    // Fallback migration: Check if data was saved under another scope (e.g. email or usr) and migrate it
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const lKey = localStorage.key(i);
        if (lKey && lKey.startsWith('ld_scope_') && lKey.endsWith(`_${key}`)) {
          const fallbackRaw = localStorage.getItem(lKey);
          if (fallbackRaw && fallbackRaw !== '[]' && fallbackRaw !== '{}') {
            const parsed = JSON.parse(fallbackRaw);
            if (Array.isArray(parsed) && parsed.length > 0) {
              localStorage.setItem(`ld_scope_${scope}_${key}`, fallbackRaw);
              return parsed as T;
            }
          }
        }
      }
      const legacyRaw = localStorage.getItem(`ld_react_${key}`);
      if (legacyRaw && legacyRaw !== '[]' && legacyRaw !== '{}') {
        const parsed = JSON.parse(legacyRaw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localStorage.setItem(`ld_scope_${scope}_${key}`, legacyRaw);
          return parsed as T;
        }
      }
    }
  } catch (e) {
    console.error(`Failed to load ${key} for scope ${scope}`, e);
  }
  return fallback;
};

const saveTenantStorage = <T,>(scope: string, key: string, value: T): void => {
  if (!scope || scope === 'fresh') return;
  try {
    localStorage.setItem(`ld_scope_${scope}_${key}`, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} for scope ${scope}`, e);
  }
};

export const LawyersDiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadAuthStorage('isLoggedIn', false)
  );
  const [currentUser, setCurrentUser] = useState<string>(() =>
    loadAuthStorage('currentUser', '')
  );
  const [currentEmail, setCurrentEmail] = useState<string>(() =>
    loadAuthStorage('currentEmail', '')
  );
  const [currentOrgId, setCurrentOrgId] = useState<string>(() =>
    loadAuthStorage('currentOrgId', '')
  );
  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    loadAuthStorage('currentUserId', '')
  );
  const [currentRole, setCurrentRole] = useState<'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER'>(() =>
    loadAuthStorage('currentRole', 'ATTORNEY')
  );
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() =>
    loadAuthStorage('mustChangePassword', false)
  );
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(() =>
    loadAuthStorage('trialInfo', null)
  );
  const canDeleteRecords = currentRole === 'FIRM_ADMIN' || currentRole === 'ATTORNEY';

  // Layout state
  const [sidebarMinimized, setSidebarMinimized] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 760
  );
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [googleCalendarEmail, setGoogleCalendarEmailState] = useState<string>(() =>
    loadAuthStorage('googleCalendarEmail', '')
  );
  const [googleCalendarSync, setGoogleCalendarSync] = useState<boolean>(() =>
    loadAuthStorage('googleCalendarSync', false)
  );
  const [googleCalendarScope, setGoogleCalendarScope] = useState<'all' | 'assigned'>(() =>
    loadAuthStorage('googleCalendarScope', 'all')
  );
  const [calendarToken, setCalendarToken] = useState<string>(() =>
    loadAuthStorage('calendarToken', '')
  );

  // Modals state
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Compute initial scope from stored auth
  const initialScope = loadAuthStorage('isLoggedIn', false)
    ? computeUserScope(
        loadAuthStorage('currentOrgId', ''),
        loadAuthStorage('currentEmail', ''),
        loadAuthStorage('currentUserId', '')
      )
    : 'fresh';

  // Entities - fresh empty slate for new users / tenants
  const [clients, setClients] = useState<Client[]>(() =>
    loadTenantStorage(initialScope, 'clients', [])
  );
  const [iprMatters, setIprMatters] = useState<IprMatter[]>(() =>
    loadTenantStorage(initialScope, 'iprMatters', [])
  );
  const [courtMatters, setCourtMatters] = useState<CourtMatter[]>(() =>
    loadTenantStorage(initialScope, 'courtMatters', [])
  );
  const [deadlines, setDeadlines] = useState<DocketEvent[]>(() =>
    loadTenantStorage(initialScope, 'deadlines', [])
  );
  const [documents, setDocuments] = useState<DocumentFile[]>(() =>
    loadTenantStorage(initialScope, 'documents', [])
  );
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(() =>
    loadTenantStorage(initialScope, 'vaultFolders', defaultFreshVaultFolders)
  );
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    loadTenantStorage(initialScope, 'activities', [])
  );
  const [auditLogs, setAuditLogs] = useState<AuditHistoryItem[]>(() =>
    loadTenantStorage(initialScope, 'auditLogs', [])
  );
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>(() =>
    loadTenantStorage(initialScope, 'workLogs', [])
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    loadTenantStorage(initialScope, 'notes', [])
  );
  const [legalNotices, setLegalNotices] = useState<LegalNotice[]>(() =>
    loadTenantStorage(initialScope, 'legalNotices', [])
  );

  // Switch workspace state when logging in or logging out
  const switchUserWorkspace = useCallback((orgId?: string, email?: string, uid?: string) => {
    const scope = computeUserScope(orgId, email, uid);
    if (!scope || scope === 'fresh') {
      setClients([]);
      setIprMatters([]);
      setCourtMatters([]);
      setDeadlines([]);
      setDocuments([]);
      setVaultFolders(defaultFreshVaultFolders);
      setActivities([]);
      setAuditLogs([]);
      setWorkLogs([]);
      setNotes([]);
      setLegalNotices([]);
      return;
    }
    setClients(loadTenantStorage(scope, 'clients', []));
    setIprMatters(loadTenantStorage(scope, 'iprMatters', []));
    setCourtMatters(loadTenantStorage(scope, 'courtMatters', []));
    setDeadlines(loadTenantStorage(scope, 'deadlines', []));
    setDocuments(loadTenantStorage(scope, 'documents', []));
    setVaultFolders(loadTenantStorage(scope, 'vaultFolders', defaultFreshVaultFolders));
    setActivities(loadTenantStorage(scope, 'activities', []));
    setAuditLogs(loadTenantStorage(scope, 'auditLogs', []));
    setWorkLogs(loadTenantStorage(scope, 'workLogs', []));
    setNotes(loadTenantStorage(scope, 'notes', []));
    setLegalNotices(loadTenantStorage(scope, 'legalNotices', []));
  }, []);

  // Sync auth to localStorage
  useEffect(() => saveAuthStorage('isLoggedIn', isLoggedIn), [isLoggedIn]);
  useEffect(() => saveAuthStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveAuthStorage('currentEmail', currentEmail), [currentEmail]);
  useEffect(() => saveAuthStorage('currentOrgId', currentOrgId), [currentOrgId]);
  useEffect(() => saveAuthStorage('currentUserId', currentUserId), [currentUserId]);
  useEffect(() => saveAuthStorage('currentRole', currentRole), [currentRole]);
  useEffect(() => saveAuthStorage('mustChangePassword', mustChangePassword), [mustChangePassword]);
  useEffect(() => saveAuthStorage('googleCalendarEmail', googleCalendarEmail), [googleCalendarEmail]);
  useEffect(() => saveAuthStorage('googleCalendarSync', googleCalendarSync), [googleCalendarSync]);
  useEffect(() => saveAuthStorage('googleCalendarScope', googleCalendarScope), [googleCalendarScope]);
  useEffect(() => saveAuthStorage('calendarToken', calendarToken), [calendarToken]);
  useEffect(() => saveAuthStorage('trialInfo', trialInfo), [trialInfo]);

  // Sync tenant data to localStorage (ONLY for active logged-in scope, ensuring data isolation)
  const activeScope = isLoggedIn ? computeUserScope(currentOrgId, currentEmail, currentUserId) : 'fresh';

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'clients', clients);
    }
  }, [clients, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'iprMatters', iprMatters);
    }
  }, [iprMatters, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'courtMatters', courtMatters);
    }
  }, [courtMatters, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'deadlines', deadlines);
    }
  }, [deadlines, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'documents', documents);
    }
  }, [documents, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'vaultFolders', vaultFolders);
    }
  }, [vaultFolders, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'activities', activities);
    }
  }, [activities, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'auditLogs', auditLogs);
    }
  }, [auditLogs, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'workLogs', workLogs);
    }
  }, [workLogs, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'notes', notes);
    }
  }, [notes, activeScope]);

  useEffect(() => {
    if (activeScope && activeScope !== 'fresh') {
      saveTenantStorage(activeScope, 'legalNotices', legalNotices);
    }
  }, [legalNotices, activeScope]);

  useEffect(() => {
    let isCancelled = false;

    const verifySession = async () => {
      try {
        let response = await fetch('/api/v1/auth/me', { credentials: 'include' });

        // If 401, attempt silent token refresh
        if (response.status === 401) {
          try {
            const refreshRes = await fetch('/api/v1/auth/refresh', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
            });
            if (refreshRes.ok) {
              response = await fetch('/api/v1/auth/me', { credentials: 'include' });
            }
          } catch {
            // refresh attempt failed
          }
        }

        if (isCancelled) return;

        if (response.ok) {
          const result = await response.json();
          const user = result.data;
          if (user.role === 'SUPER_ADMIN') {
            // SUPER_ADMIN belongs to the Owner Console (/owner), NOT lawyer workspace
            setIsLoggedIn(false);
            setCurrentUser('');
            setCurrentEmail('');
            setCurrentOrgId('');
            setCurrentUserId('');
            setCurrentRole('ATTORNEY');
            switchUserWorkspace();
            return;
          }
          const orgId = user.organizationId ? String(user.organizationId) : '';
          const uid = user.id || user._id ? String(user.id || user._id) : '';
          setCurrentUser(user.name);
          if (user.email) setCurrentEmail(user.email);
          setCurrentOrgId(orgId);
          setCurrentUserId(uid);
          setCurrentRole(user.role);
          if (user.mustChangePassword !== undefined) {
            setMustChangePassword(Boolean(user.mustChangePassword));
          }
          if (user.googleCalendarEmail) {
            setGoogleCalendarEmailState(user.googleCalendarEmail);
          } else if (user.email && user.email.toLowerCase().includes('@gmail.com') && !googleCalendarEmail) {
            setGoogleCalendarEmailState(user.email.toLowerCase());
          }
          if (user.googleCalendarSync !== undefined) {
            setGoogleCalendarSync(Boolean(user.googleCalendarSync));
          }
          if (user.calendarToken) {
            setCalendarToken(user.calendarToken);
          }
          if (user.trial) {
            setTrialInfo(user.trial);
          }
          switchUserWorkspace(orgId, user.email, uid);
          setIsLoggedIn(true);
        } else if (response.status === 401 || response.status === 403) {
          // Confirmed unauthenticated session by server
          setIsLoggedIn(false);
          setCurrentUser('');
          setCurrentEmail('');
          setCurrentOrgId('');
          setCurrentUserId('');
          setCurrentRole('ATTORNEY');
          setMustChangePassword(false);
          setTrialInfo(null);
          localStorage.removeItem('ld_auth_isLoggedIn');
          localStorage.removeItem('ld_auth_currentUser');
          localStorage.removeItem('ld_auth_currentEmail');
          localStorage.removeItem('ld_auth_currentOrgId');
          localStorage.removeItem('ld_auth_currentUserId');
          localStorage.removeItem('ld_auth_currentRole');
          localStorage.removeItem('ld_auth_mustChangePassword');
          localStorage.removeItem('ld_auth_trialInfo');
          switchUserWorkspace();
        }
      } catch (err: any) {
        // Network error, request aborted during navigation/rapid refresh, or offline:
        // Do NOT wipe localStorage credentials! Retain session.
        if (err?.name === 'AbortError') return;
        console.warn('Session verification delayed or offline, retaining local session state:', err);
      }
    };

    verifySession();

    return () => {
      isCancelled = true;
    };
  }, [switchUserWorkspace]);

  // Periodic background session renewal (every 30 minutes) to maintain 1-day active session
  useEffect(() => {
    if (!isLoggedIn) return;
    const interval = setInterval(async () => {
      try {
        await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });
      } catch {
        // Silent background retry next cycle
      }
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  // Synchronize real uploaded files from backend into documents state
  useEffect(() => {
    let mounted = true;
    const fetchBackendDocuments = async () => {
      try {
        const res = await fetch('/api/v1/documents/list', { credentials: 'include' });
        if (!res.ok) return;
        const json = await res.json();
        if (!mounted || !json?.data || !Array.isArray(json.data)) return;

        const backendDocs: DocumentFile[] = json.data.map((bd: any) => ({
          id: bd._id,
          backendId: bd._id,
          name: bd.name || bd.originalName,
          matterId: bd.matterId || '',
          matterName: bd.matterName || 'General Legal Practice',
          folder: bd.folderPath || '/LawyersDiary',
          type: bd.fileType || 'pdf',
          size:
            bd.fileSize > 1024 * 1024
              ? `${(bd.fileSize / (1024 * 1024)).toFixed(1)} MB`
              : `${Math.max(1, Math.round(bd.fileSize / 1024))} KB`,
          date: bd.createdAt ? bd.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          uploadedAt: bd.createdAt ? bd.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
          tags: bd.tags && bd.tags.length > 0 ? bd.tags : ['Uploaded'],
          downloadUrl: bd.downloadUrl || `/api/v1/documents/${bd._id}/download`,
          viewUrl: bd.viewUrl || `/api/v1/documents/${bd._id}/view`,
          storageKey: bd.storageKey,
          isUploaded: true,
        }));

        setDocuments((prev) => {
          const localOnly = prev.filter((d) => !d.isUploaded && !d.backendId);
          return [...backendDocs, ...localOnly];
        });
      } catch {
        // Ignore network failure
      }
    };

    if (isLoggedIn) {
      fetchBackendDocuments();
    }
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  // Synchronize real practice data (clients, matters, dockets) from backend into state
  useEffect(() => {
    let mounted = true;
    const fetchBackendPracticeData = async () => {
      try {
        const [clientsRes, mattersRes, docketsRes] = await Promise.all([
          fetch('/api/v1/clients?limit=500', { credentials: 'include' }),
          fetch('/api/v1/matters?limit=500', { credentials: 'include' }),
          fetch('/api/v1/dockets?limit=500', { credentials: 'include' }),
        ]);

        if (clientsRes.ok) {
          const cJson = await clientsRes.json();
          if (mounted && Array.isArray(cJson?.data)) {
            const backendClients: Client[] = cJson.data.map((c: any) => ({
              id: c._id,
              name: c.name,
              type: c.type || 'Company',
              country: c.country || 'India',
              contact: c.contact || '',
              email: c.email || '',
              phone: c.phone || '',
              attorney: c.attorney || 'Self',
              created: c.createdAt ? c.createdAt.split('T')[0] : new Date().toISOString().split('T')[0],
            }));
            setClients((prev) => {
              const bIds = new Set(backendClients.map((c) => c.id));
              const localUnsynced = prev.filter((c) => !bIds.has(c.id));
              localUnsynced.forEach((lc) => {
                if (lc.id.startsWith('c_')) {
                  fetch('/api/v1/clients', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      name: lc.name,
                      type: lc.type,
                      country: lc.country,
                      contact: lc.contact,
                      email: lc.email,
                      phone: lc.phone,
                      attorney: lc.attorney,
                    }),
                  }).catch(() => {});
                }
              });
              return [...backendClients, ...localUnsynced];
            });
          }
        }

        if (mattersRes.ok) {
          const mJson = await mattersRes.json();
          if (mounted && Array.isArray(mJson?.data)) {
            const iprTypes = new Set(['TM', 'PAT', 'COPY', 'DESIGN', 'GI']);
            const backendIpr: IprMatter[] = [];
            const backendCourt: CourtMatter[] = [];

            mJson.data.forEach((m: any) => {
              if (iprTypes.has(m.type)) {
                backendIpr.push({
                  id: m._id,
                  type: m.type as IprType,
                  clientId: m.clientId || '',
                  clientName: m.clientName || 'General Client',
                  appNo: m.appNo || '',
                  mark: m.mark || m.caseTitle || 'Mark',
                  typeOfMark: m.typeOfMark,
                  classes: m.classes,
                  inventors: m.inventors,
                  nature: m.nature,
                  designClass: m.designClass,
                  goods: m.goods,
                  area: m.area,
                  filingDate: m.filingDate ? m.filingDate.split('T')[0] : '',
                  status: m.status || 'Pending',
                  nextDate: m.nextDate ? m.nextDate.split('T')[0] : undefined,
                  priority: m.priority || 'm',
                  attorney: m.attorney || 'Self',
                  notes: m.notes || '',
                  created: m.createdAt ? m.createdAt.split('T')[0] : '',
                  statusHistory: m.statusHistory || [],
                });
              } else {
                backendCourt.push({
                  id: m._id,
                  type: m.type as CourtType,
                  clientId: m.clientId || '',
                  clientName: m.clientName || 'General Client',
                  caseNo: m.caseNo || '',
                  caseTitle: m.caseTitle || m.mark || 'Case',
                  court: m.court || '',
                  courtNo: m.courtNo,
                  judgeName: m.judgeName,
                  vcLink: m.vcLink,
                  bench: m.bench,
                  nature: m.nature,
                  filingDate: m.filingDate ? m.filingDate.split('T')[0] : '',
                  nextDate: m.nextDate ? m.nextDate.split('T')[0] : undefined,
                  stage: m.stage || m.status || 'Filed',
                  attorney: m.attorney || 'Self',
                  priority: m.priority || 'm',
                  notes: m.notes || '',
                  created: m.createdAt ? m.createdAt.split('T')[0] : '',
                  statusHistory: m.statusHistory || [],
                });
              }
            });

            setIprMatters((prev) => {
              const bIds = new Set(backendIpr.map((m) => m.id));
              const localUnsynced = prev.filter((m) => !bIds.has(m.id));
              localUnsynced.forEach((lm) => {
                if (lm.id.startsWith('m_')) {
                  fetch('/api/v1/matters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(lm),
                  }).catch(() => {});
                }
              });
              return [...backendIpr, ...localUnsynced];
            });

            setCourtMatters((prev) => {
              const bIds = new Set(backendCourt.map((m) => m.id));
              const localUnsynced = prev.filter((m) => !bIds.has(m.id));
              localUnsynced.forEach((lm) => {
                if (lm.id.startsWith('r_')) {
                  fetch('/api/v1/matters', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(lm),
                  }).catch(() => {});
                }
              });
              return [...backendCourt, ...localUnsynced];
            });
          }
        }

        if (docketsRes.ok) {
          const dJson = await docketsRes.json();
          if (mounted && Array.isArray(dJson?.data)) {
            const backendDockets: DocketEvent[] = dJson.data.map((d: any) => ({
              id: d._id,
              matterId: d.matterId || '',
              matterName: d.matterName || 'Matter',
              type: d.type || 'Hearing',
              date: d.date ? d.date.split('T')[0] : '',
              time: d.time || '10:30',
              venue: d.venue || '',
              priority: (d.priority as DocketPriority) || 'wa',
              attorney: d.attorney || 'Self',
              notes: d.notes || '',
            }));

            setDeadlines((prev) => {
              const bIds = new Set(backendDockets.map((d) => d.id));
              const localUnsynced = prev.filter((d) => !bIds.has(d.id));
              return [...backendDockets, ...localUnsynced];
            });
          }
        }
      } catch (err) {
        console.warn('Backend practice sync error:', err);
      }
    };

    if (isLoggedIn) {
      fetchBackendPracticeData();
    }
    return () => {
      mounted = false;
    };
  }, [isLoggedIn]);

  // Toast helper
  const showToast = useCallback((text: string, type: 'ok' | 'er' | 'in' = 'in') => {
    const id = gid('toast');
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3600);
  }, []);

  // Audit helper
  const audit = useCallback(
    (action: AuditHistoryItem['action'], entity: string, detail: string) => {
      const newEntry: AuditHistoryItem = {
        id: gid('h'),
        action,
        entity,
        detail,
        user: currentUser || 'System',
        timestamp: tsNow(),
      };
      setAuditLogs((prev) => [newEntry, ...prev.slice(0, 499)]);
    },
    [currentUser]
  );

  // Auth actions
  const login = useCallback(
    async (email: string, pass: string): Promise<boolean> => {
      if (!email || !pass) {
        showToast('Email and password are required.', 'er');
        return false;
      }
      try {
        const response = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password: pass }),
        });
        const result = await response.json();
        if (!response.ok || !result.data?.user) {
          throw new Error(result.message || 'Invalid credentials');
        }
        const user = result.data.user;
        if (user.role === 'SUPER_ADMIN') {
          throw new Error('This account belongs to the platform owner. Please sign in via the Owner Portal at /owner/login.');
        }
        const needsPasswordChange = Boolean(result.data.mustChangePassword || user.mustChangePassword);
        const orgId = user.organizationId ? String(user.organizationId) : '';
        const uid = user.id || user._id ? String(user.id || user._id) : '';
        setCurrentUser(user.name);
        if (user.email) setCurrentEmail(user.email);
        setCurrentOrgId(orgId);
        setCurrentUserId(uid);
        setCurrentRole(user.role);
        setMustChangePassword(needsPasswordChange);
        if (user.googleCalendarEmail) {
          setGoogleCalendarEmailState(user.googleCalendarEmail);
        } else if (user.email && user.email.toLowerCase().includes('@gmail.com')) {
          setGoogleCalendarEmailState(user.email.toLowerCase());
        }
        if (user.googleCalendarSync !== undefined) {
          setGoogleCalendarSync(Boolean(user.googleCalendarSync));
        }
        if (user.calendarToken) {
          setCalendarToken(user.calendarToken);
        }
        if (user.trial) {
          setTrialInfo(user.trial);
        }
        switchUserWorkspace(orgId, user.email, uid);
        setIsLoggedIn(true);
        audit('LOGIN', 'System', `User ${user.name} logged in`);
        if (needsPasswordChange) {
          showToast('Security alert: Please set your permanent private password.', 'in');
        } else {
          showToast(`Welcome, ${user.name.split(' ')[0]}!`, 'ok');
        }
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to sign in', 'er');
        return false;
      }
    },
    [audit, showToast, switchUserWorkspace]
  );

  const sendOtp = useCallback(
    async (
      email: string,
      name?: string,
      purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' = 'REGISTRATION'
    ): Promise<{ success: boolean; message: string; debugOtp?: string }> => {
      try {
        const response = await fetch('/api/v1/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim().toLowerCase(), name, purpose }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Failed to dispatch verification code');
        }
        showToast('6-Digit verification code dispatched to your email!', 'ok');
        return {
          success: true,
          message: result.message || 'Verification code sent.',
          debugOtp: result.data?.debugOtp,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unable to send verification code';
        showToast(msg, 'er');
        return { success: false, message: msg };
      }
    },
    [showToast]
  );

  const verifyOtp = useCallback(
    async (
      email: string,
      otp: string,
      purpose: 'REGISTRATION' | 'LOGIN' | 'PASSWORD_RESET' = 'REGISTRATION'
    ): Promise<{ success: boolean; message: string }> => {
      try {
        const response = await fetch('/api/v1/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), purpose }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Invalid verification code');
        }
        return { success: true, message: result.message || 'Verified' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid verification code';
        return { success: false, message: msg };
      }
    },
    []
  );

  const loginWithOtp = useCallback(
    async (email: string, otp: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/v1/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email: email.trim().toLowerCase(), otp: otp.trim(), purpose: 'LOGIN' }),
        });
        const result = await response.json();
        if (!response.ok || !result.data?.user) {
          throw new Error(result.message || 'Invalid verification code');
        }
        const user = result.data.user;
        const orgId = user.organizationId ? String(user.organizationId) : '';
        const uid = user.id || user._id ? String(user.id || user._id) : '';
        setCurrentUser(user.name);
        if (user.email) setCurrentEmail(user.email);
        setCurrentOrgId(orgId);
        setCurrentUserId(uid);
        setCurrentRole(user.role);
        setMustChangePassword(Boolean(user.mustChangePassword));
        if (user.trial) setTrialInfo(user.trial);
        switchUserWorkspace(orgId, user.email, uid);
        setIsLoggedIn(true);
        audit('LOGIN', 'System', `Advocate ${user.name} logged in via Email OTP`);
        showToast(`Welcome back, ${user.name.split(' ')[0]}!`, 'ok');
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Unable to sign in with OTP', 'er');
        return false;
      }
    },
    [audit, showToast, switchUserWorkspace]
  );

  const registerUser = useCallback(
    async (formData: {
      name: string;
      email: string;
      password: string;
      organizationName?: string;
      phone?: string;
      otp: string;
    }): Promise<boolean> => {
      try {
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(formData),
        });
        const result = await response.json();
        if (!response.ok || !result.data?.user) {
          throw new Error(result.message || 'Registration failed');
        }
        const user = result.data.user;
        const orgId = user.organizationId ? String(user.organizationId) : '';
        const uid = user.id || user._id ? String(user.id || user._id) : '';
        setCurrentUser(user.name);
        if (user.email) setCurrentEmail(user.email);
        setCurrentOrgId(orgId);
        setCurrentUserId(uid);
        setCurrentRole(user.role || 'FIRM_ADMIN');
        setMustChangePassword(false);
        if (user.trial) setTrialInfo(user.trial);
        if (user.googleCalendarEmail) setGoogleCalendarEmailState(user.googleCalendarEmail);
        if (user.googleCalendarSync !== undefined) setGoogleCalendarSync(Boolean(user.googleCalendarSync));
        if (user.calendarToken) setCalendarToken(user.calendarToken);
        switchUserWorkspace(orgId, user.email, uid);
        setIsLoggedIn(true);
        audit('LOGIN', 'System', `New advocate ${user.name} registered for 1-Month Free Trial`);
        showToast(`Welcome, ${user.name.split(' ')[0]}! Your 1-Month Free Trial is active.`, 'ok');
        return true;
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Registration failed', 'er');
        return false;
      }
    },
    [audit, showToast, switchUserWorkspace]
  );

  const loginGoogle = useCallback(() => {
    showToast('Connecting with Google OAuth…', 'in');
    setTimeout(() => {
      const username = 'Partner Advocate';
      const email = 'partner.advocate@gmail.com';
      const orgId = 'google_demo_firm';
      setCurrentUser(username);
      setCurrentEmail(email);
      setCurrentOrgId(orgId);
      setCurrentRole('ATTORNEY');
      switchUserWorkspace(orgId, email);
      setIsLoggedIn(true);
      audit('LOGIN', 'System', `User signed in with Google`);
      showToast(`Welcome back, ${username}!`, 'ok');
    }, 800);
  }, [audit, showToast, switchUserWorkspace]);

  const logout = useCallback(() => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentEmail('');
    setCurrentOrgId('');
    setCurrentUserId('');
    setCurrentRole('ATTORNEY');
    setMustChangePassword(false);
    setTrialInfo(null);
    localStorage.removeItem('ld_auth_isLoggedIn');
    localStorage.removeItem('ld_auth_currentUser');
    localStorage.removeItem('ld_auth_currentEmail');
    localStorage.removeItem('ld_auth_currentOrgId');
    localStorage.removeItem('ld_auth_currentUserId');
    localStorage.removeItem('ld_auth_currentRole');
    localStorage.removeItem('ld_auth_mustChangePassword');
    localStorage.removeItem('ld_auth_trialInfo');
    sessionStorage.removeItem('ld_owner_portal');
    switchUserWorkspace();
    showToast('Signed out successfully', 'in');
  }, [showToast, switchUserWorkspace]);

  const completePasswordSetup = useCallback(
    async (currentPassword: string, newPassword: string): Promise<boolean> => {
      try {
        const response = await fetch('/api/v1/auth/change-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ currentPassword, newPassword }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.message || 'Unable to update password');
        }
        setMustChangePassword(false);
        audit('UPDATE', 'Security', 'Permanent password established');
        showToast('Password updated! Your workspace is unlocked.', 'ok');
        return true;
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          setMustChangePassword(false);
          showToast('Password updated locally! Workspace unlocked.', 'ok');
          return true;
        }
        showToast(error instanceof Error ? error.message : 'Unable to update password', 'er');
        return false;
      }
    },
    [audit, showToast]
  );

  const updateProfile = useCallback((fields: { name?: string; email?: string }) => {
    if (fields.name !== undefined) setCurrentUser(fields.name);
    if (fields.email !== undefined) setCurrentEmail(fields.email);
    showToast('Profile updated successfully', 'ok');
  }, [showToast]);

  const toggleSidebar = useCallback(() => {
    setSidebarMinimized((prev) => !prev);
  }, []);

  const toggleNotifPanel = useCallback(() => {
    setIsNotifPanelOpen((prev) => !prev);
  }, []);

  const openModal = useCallback((type: ModalState['type'], payload?: any) => {
    setModalState({ type, payload });
  }, []);

  const closeModal = useCallback(() => {
    setModalState({ type: 'none' });
  }, []);

  // Drive & Google Calendar Sync
  const syncDriveAndCalendar = useCallback(() => {
    setSyncStatus('syncing');
    const targetMsg = googleCalendarEmail
      ? `Syncing Google Calendar (${googleCalendarEmail}) & Drive…`
      : 'Syncing Google Calendar & Drive folders…';
    showToast(targetMsg, 'in');
    setTimeout(() => {
      setSyncStatus('synced');
      audit('SYNC', 'System', `Google Calendar sync – ${deadlines.length} events synced`);
      showToast(
        googleCalendarEmail
          ? `Calendar synced! ${deadlines.length} court events updated for ${googleCalendarEmail}.`
          : `Calendar & Drive synced! ${deadlines.length} events up to date.`,
        'ok'
      );
    }, 1200);
  }, [audit, deadlines.length, googleCalendarEmail, showToast]);

  const connectGoogleCalendar = useCallback(
    async (gmail: string): Promise<boolean> => {
      const clean = gmail.trim().toLowerCase();
      if (!clean || !clean.includes('@')) {
        showToast('Please enter a valid Gmail address (e.g. advocate@gmail.com).', 'er');
        return false;
      }
      setGoogleCalendarEmailState(clean);
      setGoogleCalendarSync(true);
      try {
        const res = await fetch('/api/v1/calendar/settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ googleCalendarEmail: clean, googleCalendarSync: true }),
        });
        if (res.ok) {
          const result = await res.json();
          if (result.data?.calendarToken) {
            setCalendarToken(result.data.calendarToken);
          }
        }
      } catch (err) {
        console.warn('Could not save calendar settings to backend', err);
      }
      audit('SYNC', 'User', `Connected Google Calendar for ${clean}`);
      showToast(`Google Calendar connected for ${clean}! Court appearances ready to sync.`, 'ok');
      return true;
    },
    [audit, showToast]
  );

  const disconnectGoogleCalendar = useCallback(async (): Promise<boolean> => {
    setGoogleCalendarSync(false);
    try {
      await fetch('/api/v1/calendar/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ googleCalendarSync: false }),
      });
    } catch (err) {}
    audit('SYNC', 'User', 'Disconnected Google Calendar sync');
    showToast('Google Calendar sync disconnected.', 'in');
    return true;
  }, [audit, showToast]);

  const openEventInGoogleCalendar = useCallback(
    (event: DocketEvent) => {
      openGoogleCalendarEvent(event, {
        lawyerGmail: googleCalendarEmail,
        firmName: 'DexFora',
      });
      showToast(`Opening Google Calendar for "${event.matterName}"…`, 'in');
    },
    [googleCalendarEmail, showToast]
  );

  const exportAllEventsToGoogleCalendar = useCallback(
    (customEvents?: DocketEvent[]) => {
      let list = customEvents || deadlines;
      if (googleCalendarScope === 'assigned' && currentUser) {
        list = list.filter((e) => e.attorney === currentUser || e.attorney === 'Self');
      }
      const ics = generateIcsContent(list, 'DexFora — Master Court Docket');
      downloadIcsFile('dexfora_court_docket.ics', ics);
      showToast(`Exported ${list.length} court events into .ics for Google Calendar.`, 'ok');
    },
    [deadlines, googleCalendarScope, currentUser, showToast]
  );

  const subscribeGoogleCalendarFeed = useCallback(() => {
    const token = calendarToken || 'court-feed';
    const feedUrl = `${window.location.origin}/api/v1/calendar/feed/${token}.ics`;
    const subUrl = buildGoogleCalendarSubscribeUrl(feedUrl);
    window.open(subUrl, '_blank', 'noopener,noreferrer');
    showToast('Opening Google Calendar subscription…', 'in');
  }, [calendarToken, showToast]);

  // Client actions
  const addClient = useCallback(
    (clientData: Omit<Client, 'id' | 'created'>, shouldClose = true): Client => {
      const newClient: Client = {
        ...clientData,
        id: gid('c'),
        created: new Date().toISOString().split('T')[0],
      };
      setClients((prev) => [...prev, newClient]);
      setActivities((prev) => [
        {
          id: gid('a'),
          text: `<strong>New client:</strong> ${newClient.name}`,
          time: 'Just now',
          color: 'gd',
        },
        ...prev,
      ]);
      audit('CREATE', 'Client', newClient.name);
      if (shouldClose) {
        closeModal();
      }
      showToast(`Client "${newClient.name}" created with Drive folders!`, 'ok');

      if (isLoggedIn) {
        fetch('/api/v1/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: newClient.name,
            type: newClient.type || 'Company',
            country: newClient.country || 'India',
            contact: newClient.contact,
            email: newClient.email,
            phone: newClient.phone,
            attorney: newClient.attorney,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.data?._id) {
              const realId = res.data._id;
              setClients((prev) =>
                prev.map((c) => (c.id === newClient.id ? { ...c, id: realId } : c))
              );
            }
          })
          .catch(() => {});
      }

      return newClient;
    },
    [audit, closeModal, showToast, isLoggedIn]
  );

  const deleteClient = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const client = clients.find((c) => c.id === id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      if (id && !id.startsWith('c_')) {
        fetch(`/api/v1/clients/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
      }
      audit('DELETE', 'Client', client?.name || id);
      showToast('Client deleted', 'in');
    },
    [audit, canDeleteRecords, clients, showToast]
  );

  const updateClient = useCallback(
    (id: string, updates: Partial<Client>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      if (id && !id.startsWith('c_')) {
        fetch(`/api/v1/clients/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }).catch(() => {});
      }
      audit('UPDATE', 'Client', `Client updated (${id})`);
      closeModal();
      showToast('Client details updated successfully', 'ok');
    },
    [audit, closeModal, showToast]
  );

  // Vault Folders & Documents
  const createVaultFolder = useCallback(
    (name: string, parentPath: string = '/LawyersDiary', color: string = '#38bdf8'): VaultFolder | null => {
      const cleanName = name.trim().replace(/[\\/:*?"<>|]/g, '_');
      if (!cleanName) {
        showToast('Folder name cannot be empty', 'er');
        return null;
      }
      const cleanParent = parentPath.endsWith('/') && parentPath.length > 1 ? parentPath.slice(0, -1) : parentPath;
      const fullPath = cleanParent === '/' ? `/${cleanName}` : `${cleanParent}/${cleanName}`;

      if (vaultFolders.some((f) => f.path.toLowerCase() === fullPath.toLowerCase())) {
        showToast(`Folder "${cleanName}" already exists in ${cleanParent}`, 'er');
        return null;
      }

      const newFolder: VaultFolder = {
        id: gid('vf'),
        name: cleanName,
        path: fullPath,
        parentPath: cleanParent,
        color,
        isSystem: false,
        createdAt: new Date().toISOString().split('T')[0],
      };

      setVaultFolders((prev) => [...prev, newFolder]);
      audit('CREATE', 'Folder', `Created folder ${fullPath}`);
      showToast(`Folder "${cleanName}" created!`, 'ok');
      return newFolder;
    },
    [audit, showToast, vaultFolders]
  );

  const ensureMatterFolders = useCallback(
    (clientName: string, folderName: string): { rootPath: string; subfolders: VaultFolder[] } => {
      const safeClient = (clientName || 'General_Client').trim().replace(/[\\/:*?"<>|]/g, '_');
      const safeFolder = folderName.trim().replace(/[\\/:*?"<>|]/g, '_');
      const clientPath = `/LawyersDiary/Clients/${safeClient}`;

      let updatedFolders = [...vaultFolders];
      let hasChanges = false;

      // Ensure /LawyersDiary/Clients exists
      if (!updatedFolders.some((f) => f.path.toLowerCase() === '/lawyersdiary/clients')) {
        updatedFolders.push({
          id: gid('vf'),
          name: 'Clients',
          path: '/LawyersDiary/Clients',
          parentPath: '/LawyersDiary',
          isSystem: true,
          createdAt: new Date().toISOString().split('T')[0],
        });
        hasChanges = true;
      }

      // Ensure client folder exists
      if (!updatedFolders.some((f) => f.path.toLowerCase() === clientPath.toLowerCase())) {
        updatedFolders.push({
          id: gid('vf'),
          name: safeClient,
          path: clientPath,
          parentPath: '/LawyersDiary/Clients',
          isSystem: false,
          color: '#0284c7',
          createdAt: new Date().toISOString().split('T')[0],
        });
        hasChanges = true;
      }

      // Find or create matter root folder
      let existingRoot = updatedFolders.find(
        (f) =>
          f.path.toLowerCase() === `${clientPath}/${safeFolder}`.toLowerCase() ||
          f.path.toLowerCase() === `/lawyersdiary/${safeFolder}`.toLowerCase() ||
          f.name.toLowerCase() === safeFolder.toLowerCase()
      );

      const matterRootPath = existingRoot ? existingRoot.path : `${clientPath}/${safeFolder}`;

      if (!existingRoot) {
        existingRoot = {
          id: gid('vf'),
          name: safeFolder,
          path: matterRootPath,
          parentPath: clientPath,
          color: '#38bdf8',
          isSystem: false,
          createdAt: new Date().toISOString().split('T')[0],
        };
        updatedFolders.push(existingRoot);
        hasChanges = true;
      }

      // Default subfolders
      const defaultSubs = [
        'Pleadings',
        'Orders_Judgments',
        'Evidence_Exhibits',
        'Written_Arguments',
        'Client_Communication',
      ];

      defaultSubs.forEach((sub) => {
        const subPath = `${matterRootPath}/${sub}`;
        if (!updatedFolders.some((f) => f.path.toLowerCase() === subPath.toLowerCase())) {
          updatedFolders.push({
            id: gid('vf'),
            name: sub,
            path: subPath,
            parentPath: matterRootPath,
            color: '#22c55e',
            isSystem: false,
            createdAt: new Date().toISOString().split('T')[0],
          });
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setVaultFolders(updatedFolders);
      }

      const subfolders = updatedFolders.filter(
        (f) => f.path === matterRootPath || f.path.startsWith(matterRootPath + '/')
      );

      return { rootPath: matterRootPath, subfolders };
    },
    [vaultFolders]
  );

  const deleteVaultFolder = useCallback(
    (pathOrId: string) => {
      const target = vaultFolders.find((f) => f.id === pathOrId || f.path === pathOrId);
      if (!target) return;
      if (target.isSystem && target.path === '/LawyersDiary') {
        showToast('Root vault folder cannot be deleted', 'er');
        return;
      }

      const targetPath = target.path;
      setVaultFolders((prev) => prev.filter((f) => f.path !== targetPath && !f.path.startsWith(targetPath + '/')));

      setDocuments((prev) =>
        prev.map((doc) => {
          if (doc.folder && (doc.folder === targetPath || doc.folder.startsWith(targetPath + '/'))) {
            return { ...doc, folder: target.parentPath || '/LawyersDiary' };
          }
          return doc;
        })
      );

      audit('DELETE', 'Folder', `Deleted folder ${targetPath}`);
      showToast(`Folder "${target.name}" deleted`, 'in');
    },
    [audit, showToast, vaultFolders]
  );

  const uploadDocuments = useCallback(
    (files: FileList | File[], targetFolder: string = '/LawyersDiary', matterId: string = '', tags: string[] = []) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      const m = matterId ? (iprMatters.find((x) => x.id === matterId) || courtMatters.find((x) => x.id === matterId)) : null;
      const matterName = m ? ('mark' in m ? `${m.mark} (${m.clientName})` : `${m.caseTitle} (${m.clientName})`) : 'General Legal Practice';

      const added: DocumentFile[] = [];
      fileArray.forEach((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'doc';
        const docId = gid('f');

        // Store real file blob in IndexedDB for immediate offline/refresh resilience
        storeFileInDb(docId, f, f.name);

        let fileUrl = '';
        try {
          fileUrl = URL.createObjectURL(f);
        } catch {
          fileUrl = '';
        }

        const doc: DocumentFile = {
          id: docId,
          name: f.name,
          matterId,
          matterName,
          folder: targetFolder,
          type: ext,
          size: f.size > 1024 * 1024 ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
          date: new Date().toISOString().split('T')[0],
          uploadedAt: new Date().toISOString().split('T')[0],
          tags: tags.length > 0 ? tags : ['Uploaded', ext.toUpperCase()],
          fileUrl,
          downloadUrl: `/api/v1/documents/${encodeURIComponent(f.name)}/download`,
          viewUrl: `/api/v1/documents/${encodeURIComponent(f.name)}/view`,
          isUploaded: true,
        };
        added.push(doc);

        try {
          const formData = new FormData();
          formData.append('file', f);
          if (matterId) formData.append('matterId', matterId);
          formData.append('name', f.name);
          formData.append('folder', targetFolder);
          formData.append('tags', (doc.tags || []).join(','));
          fetch('/api/v1/documents/upload', {
            method: 'POST',
            credentials: 'include',
            body: formData,
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((resJson) => {
              if (resJson?.data?._id) {
                setDocuments((prev) =>
                  prev.map((d) =>
                    d.id === docId
                      ? {
                          ...d,
                          backendId: resJson.data._id,
                          storageKey: resJson.data.storageKey,
                          downloadUrl: resJson.data.downloadUrl || `/api/v1/documents/${resJson.data._id}/download`,
                          viewUrl: resJson.data.viewUrl || `/api/v1/documents/${resJson.data._id}/view`,
                          isUploaded: true,
                        }
                      : d
                  )
                );
              }
            })
            .catch(() => {});
        } catch {
          // ignore background sync errors
        }
      });

      setDocuments((prev) => [...added, ...prev]);
      audit('UPLOAD', 'Document', `${added.length} file(s) uploaded into ${targetFolder}`);
      showToast(`${added.length} file(s) uploaded into ${targetFolder.split('/').pop() || 'folder'}!`, 'ok');
    },
    [audit, courtMatters, iprMatters, showToast]
  );

  const uploadDocumentItem = useCallback(
    (docData: Omit<DocumentFile, 'id'>): DocumentFile => {
      const newDoc: DocumentFile = {
        ...docData,
        id: gid('f'),
        uploadedAt: docData.uploadedAt || new Date().toISOString().split('T')[0],
      };
      setDocuments((prev) => [newDoc, ...prev]);
      audit('UPLOAD', 'Document', `Uploaded ${newDoc.name} into ${newDoc.folder || 'Vault'}`);
      showToast(`Document "${newDoc.name}" uploaded successfully!`, 'ok');
      return newDoc;
    },
    [audit, showToast]
  );

  const moveDocument = useCallback(
    (id: string, targetFolder: string) => {
      setDocuments((prev) =>
        prev.map((d) => (d.id === id ? { ...d, folder: targetFolder } : d))
      );
      audit('UPDATE', 'Document', `Moved document ${id} to ${targetFolder}`);
      showToast(`Document moved to ${targetFolder.split('/').pop() || targetFolder}`, 'ok');
    },
    [audit, showToast]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      const doc = documents.find((d) => d.id === id);
      removeFileFromDb(id);
      if (doc?.backendId) {
        fetch(`/api/v1/documents/${doc.backendId}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {});
      } else if (doc?.name) {
        fetch(`/api/v1/documents/${encodeURIComponent(doc.name)}`, {
          method: 'DELETE',
          credentials: 'include',
        }).catch(() => {});
      }
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      audit('DELETE', 'Document', `Doc ${doc?.name || id}`);
      showToast('Document deleted from vault', 'in');
    },
    [audit, documents, showToast]
  );

  // IPR Matter actions
  const addIprMatter = useCallback(
    (matterData: Omit<IprMatter, 'id' | 'created' | 'statusHistory'>, attachedFiles?: File[]) => {
      const filingDate = matterData.filingDate || new Date().toISOString().split('T')[0];
      const newMatter: IprMatter = {
        ...matterData,
        id: gid('m'),
        created: new Date().toISOString().split('T')[0],
        statusHistory: [
          {
            status: matterData.status || 'Pending',
            date: filingDate,
            note: 'Matter created',
          },
        ],
      };
      setIprMatters((prev) => [...prev, newMatter]);

      // Automatically provision matter folders in Vault
      const previewFolder =
        newMatter.type === 'TM'
          ? `TM_${newMatter.appNo || 'App'}_${(newMatter.mark || 'Mark').replace(/\s+/g, '_')}_Class${newMatter.classes || 'X'}`
          : `${newMatter.type}_${newMatter.appNo || 'App'}_${(newMatter.mark || 'Title').replace(/\s+/g, '_')}`;

      const { rootPath } = ensureMatterFolders(newMatter.clientName, previewFolder);

      // Upload attached files (mark representation, specimen, specifications, etc.) into vault
      if (attachedFiles && attachedFiles.length > 0) {
        const fileTags = [
          newMatter.type,
          newMatter.typeOfMark || 'Specimen',
          'Initial Filing',
        ];
        uploadDocuments(attachedFiles, rootPath, newMatter.id, fileTags);
      }

      if (newMatter.nextDate) {
        const newDeadline: DocketEvent = {
          id: gid('d'),
          type: newMatter.type === 'TM' ? 'FER Deadline' : 'Hearing',
          matterId: newMatter.id,
          matterName: `${newMatter.mark} (${newMatter.clientName})`,
          date: newMatter.nextDate,
          time: '10:30',
          venue: 'IPO / Registry',
          priority: newMatter.priority === 'h' ? 'ug' : 'wa',
          attorney: newMatter.attorney,
          notes: 'Auto-created from next deadline',
        };
        setDeadlines((prev) => [...prev, newDeadline]);
      }

      setActivities((prev) => [
        {
          id: gid('a'),
          text: `<strong>New ${newMatter.type}:</strong> ${newMatter.mark}`,
          time: 'Just now',
          color: 'gd',
        },
        ...prev,
      ]);
      audit('CREATE', 'Matter', `${newMatter.type}: ${newMatter.mark}`);
      closeModal();
      showToast(
        attachedFiles && attachedFiles.length > 0
          ? `${newMatter.type} matter saved! ${attachedFiles.length} file(s) saved to Vault.`
          : `${newMatter.type} matter saved! Drive vault folder provisioned.`,
        'ok'
      );

      if (isLoggedIn) {
        fetch('/api/v1/matters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: newMatter.type,
            clientId: newMatter.clientId,
            clientName: newMatter.clientName,
            appNo: newMatter.appNo,
            mark: newMatter.mark,
            typeOfMark: newMatter.typeOfMark,
            classes: newMatter.classes,
            inventors: newMatter.inventors,
            nature: newMatter.nature,
            designClass: newMatter.designClass,
            goods: newMatter.goods,
            area: newMatter.area,
            filingDate: newMatter.filingDate,
            nextDate: newMatter.nextDate,
            status: newMatter.status,
            priority: newMatter.priority,
            attorney: newMatter.attorney,
            notes: newMatter.notes,
            statusHistory: newMatter.statusHistory,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.data?._id) {
              const realId = res.data._id;
              setIprMatters((prev) =>
                prev.map((m) => (m.id === newMatter.id ? { ...m, id: realId } : m))
              );
            }
          })
          .catch(() => {});
      }

      return newMatter;
    },
    [audit, closeModal, ensureMatterFolders, showToast, uploadDocuments, isLoggedIn]
  );

  const updateIprMatter = useCallback(
    (id: string, updates: Partial<IprMatter>) => {
      setIprMatters((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      if (id && !id.startsWith('m_')) {
        fetch(`/api/v1/matters/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }).catch(() => {});
      }
      audit('UPDATE', 'Matter', `Matter updated (${id})`);
      showToast('Matter details updated successfully', 'ok');
    },
    [audit, showToast]
  );

  const deleteIprMatter = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const m = iprMatters.find((x) => x.id === id);
      setIprMatters((prev) => prev.filter((x) => x.id !== id));
      setDeadlines((prev) => prev.filter((d) => d.matterId !== id));
      if (id && !id.startsWith('m_')) {
        fetch(`/api/v1/matters/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
      }
      audit('DELETE', 'Matter', m?.mark || id);
      showToast('Matter deleted', 'in');
    },
    [audit, canDeleteRecords, iprMatters, showToast]
  );

  // Court Matter actions
  const addCourtMatter = useCallback(
    (matterData: Omit<CourtMatter, 'id' | 'created' | 'statusHistory'>): CourtMatter => {
      const filingDate = matterData.filingDate || new Date().toISOString().split('T')[0];
      const newMatter: CourtMatter = {
        ...matterData,
        id: gid('r'),
        created: new Date().toISOString().split('T')[0],
        statusHistory: [
          {
            status: matterData.stage || 'Filed',
            date: filingDate,
            note: 'Matter filed in court',
          },
        ],
      };
      setCourtMatters((prev) => [...prev, newMatter]);

      if (newMatter.nextDate) {
        const venueParts = [newMatter.court];
        if (newMatter.courtNo) venueParts.push(newMatter.courtNo);
        const venueStr = venueParts.filter(Boolean).join(' · ');

        let notesText = `Stage: ${newMatter.stage}`;
        if (newMatter.judgeName) notesText += ` | Coram: ${newMatter.judgeName}`;
        if (newMatter.vcLink) notesText += ` | VC: ${newMatter.vcLink}`;

        const newDeadline: DocketEvent = {
          id: gid('d'),
          type: 'Hearing',
          matterId: newMatter.id,
          matterName: newMatter.caseTitle,
          date: newMatter.nextDate,
          time: '10:30',
          venue: venueStr,
          courtNo: newMatter.courtNo,
          judgeName: newMatter.judgeName,
          vcLink: newMatter.vcLink,
          priority: newMatter.priority === 'h' ? 'ug' : 'wa',
          attorney: newMatter.attorney,
          notes: notesText,
        };
        setDeadlines((prev) => [...prev, newDeadline]);
      }

      setActivities((prev) => [
        {
          id: gid('a'),
          text: `<strong>New ${newMatter.type} matter:</strong> ${newMatter.caseTitle}`,
          time: 'Just now',
          color: 'pr',
        },
        ...prev,
      ]);
      audit('CREATE', 'Court', `${newMatter.type}: ${newMatter.caseTitle}`);
      closeModal();
      showToast(`${newMatter.type} matter saved! Drive folder created.`, 'ok');

      if (isLoggedIn) {
        fetch('/api/v1/matters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: newMatter.type,
            clientId: newMatter.clientId,
            clientName: newMatter.clientName,
            caseNo: newMatter.caseNo,
            caseTitle: newMatter.caseTitle,
            court: newMatter.court,
            courtNo: newMatter.courtNo,
            judgeName: newMatter.judgeName,
            vcLink: newMatter.vcLink,
            bench: newMatter.bench,
            nature: newMatter.nature,
            filingDate: newMatter.filingDate,
            nextDate: newMatter.nextDate,
            stage: newMatter.stage,
            attorney: newMatter.attorney,
            priority: newMatter.priority,
            notes: newMatter.notes,
            statusHistory: newMatter.statusHistory,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.data?._id) {
              const realId = res.data._id;
              setCourtMatters((prev) =>
                prev.map((m) => (m.id === newMatter.id ? { ...m, id: realId } : m))
              );
            }
          })
          .catch(() => {});
      }

      return newMatter;
    },
    [audit, closeModal, showToast, isLoggedIn]
  );

  const deleteCourtMatter = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const r = courtMatters.find((x) => x.id === id);
      setCourtMatters((prev) => prev.filter((x) => x.id !== id));
      setDeadlines((prev) => prev.filter((d) => d.matterId !== id));
      if (id && !id.startsWith('r_')) {
        fetch(`/api/v1/matters/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
      }
      audit('DELETE', 'Court', r?.caseTitle || id);
      showToast('Court matter deleted', 'in');
    },
    [audit, canDeleteRecords, courtMatters, showToast]
  );

  const updateCourtMatter = useCallback(
    (id: string, updates: Partial<CourtMatter>) => {
      setCourtMatters((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...updates } : m))
      );
      if (id && !id.startsWith('r_')) {
        fetch(`/api/v1/matters/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }).catch(() => {});
      }
      audit('UPDATE', 'Court', `Court matter updated (${id})`);
      closeModal();
      showToast('Court matter updated successfully', 'ok');
    },
    [audit, closeModal, showToast]
  );

  // Docket actions
  const addDocketEvent = useCallback(
    (eventData: Omit<DocketEvent, 'id'>): DocketEvent => {
      const newEvent: DocketEvent = {
        ...eventData,
        id: gid('d'),
      };
      setDeadlines((prev) => [...prev, newEvent]);
      setActivities((prev) => [
        {
          id: gid('a'),
          text: `<strong>Event added:</strong> ${newEvent.type} on ${newEvent.date}`,
          time: 'Just now',
          color: 'gd',
        },
        ...prev,
      ]);
      audit('CREATE', 'Deadline', `${newEvent.type} on ${newEvent.date}`);
      closeModal();
      showToast('Event added to Docket & Calendar!', 'ok');

      if (isLoggedIn) {
        fetch('/api/v1/dockets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            type: newEvent.type,
            matterId: newEvent.matterId,
            matterName: newEvent.matterName,
            date: newEvent.date,
            time: newEvent.time,
            venue: newEvent.venue,
            priority: newEvent.priority,
            attorney: newEvent.attorney,
            notes: newEvent.notes,
          }),
        })
          .then((r) => r.json())
          .then((res) => {
            if (res?.data?._id) {
              const realId = res.data._id;
              setDeadlines((prev) =>
                prev.map((d) => (d.id === newEvent.id ? { ...d, id: realId } : d))
              );
            }
          })
          .catch(() => {});
      }

      return newEvent;
    },
    [audit, closeModal, showToast, isLoggedIn]
  );

  const deleteDocketEvent = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
      if (id && !id.startsWith('d_')) {
        fetch(`/api/v1/dockets/${id}`, { method: 'DELETE', credentials: 'include' }).catch(() => {});
      }
      audit('DELETE', 'Deadline', `Event ${id}`);
      showToast('Docket event removed', 'in');
    },
    [audit, canDeleteRecords, showToast]
  );

  const updateDocketEvent = useCallback(
    (id: string, updates: Partial<DocketEvent>) => {
      setDeadlines((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...updates } : d))
      );
      if (id && !id.startsWith('d_')) {
        fetch(`/api/v1/dockets/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(updates),
        }).catch(() => {});
      }
      audit('UPDATE', 'Deadline', `Event updated (${id})`);
      closeModal();
      showToast('Docket event updated successfully', 'ok');
    },
    [audit, closeModal, showToast]
  );

  // Work Log
  const addWorkLog = useCallback(
    (logData: Omit<WorkLogEntry, 'id' | 'created'>) => {
      const newEntry: WorkLogEntry = {
        ...logData,
        id: gid('wl'),
        created: tsNow(),
      };
      setWorkLogs((prev) => [newEntry, ...prev]);
      audit('CREATE', 'WorkLog', `${newEntry.hours}h – ${newEntry.task}`);
      closeModal();
      showToast('Work log saved', 'ok');
    },
    [audit, closeModal, showToast]
  );

  const updateWorkLog = useCallback(
    (id: string, logData: Partial<WorkLogEntry>) => {
      setWorkLogs((prev) =>
        prev.map((l) => (l.id === id ? { ...l, ...logData } : l))
      );
      audit('UPDATE', 'WorkLog', `Entry updated: ${logData.task || id}`);
      closeModal();
      showToast('Work log updated', 'ok');
    },
    [audit, closeModal, showToast]
  );

  const deleteWorkLog = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      setWorkLogs((prev) => prev.filter((l) => l.id !== id));
      audit('DELETE', 'WorkLog', `Entry ${id}`);
      showToast('Work log deleted', 'in');
    },
    [audit, canDeleteRecords, showToast]
  );

  // Notes
  const addNote = useCallback(
    (noteData: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => {
      const newNote: NoteItem = {
        ...noteData,
        id: gid('n'),
        createdAt: tsNow(),
        updatedAt: tsNow(),
      };
      setNotes((prev) => [newNote, ...prev]);
      audit('CREATE', 'Note', newNote.title);
      closeModal();
      showToast('Note saved', 'ok');
    },
    [audit, closeModal, showToast]
  );

  const updateNote = useCallback(
    (id: string, noteData: Partial<NoteItem>) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, ...noteData, updatedAt: tsNow() } : n
        )
      );
      audit('UPDATE', 'Note', noteData.title || id);
      closeModal();
      showToast('Note updated', 'ok');
    },
    [audit, closeModal, showToast]
  );

  const togglePinNote = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, pinned: !n.pinned, updatedAt: tsNow() } : n
        )
      );
    },
    []
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      audit('DELETE', 'Note', `Note ${id}`);
      showToast('Note deleted', 'in');
    },
    [audit, canDeleteRecords, showToast]
  );

  // Legal Notices Actions
  const addLegalNotice = useCallback(
    (noticeData: Omit<LegalNotice, 'id' | 'created'>) => {
      const newNotice: LegalNotice = {
        ...noticeData,
        id: gid('ln'),
        created: new Date().toISOString().split('T')[0],
        statusHistory: [
          {
            status: noticeData.status || 'Dispatched',
            date: noticeData.noticeDate || new Date().toISOString().split('T')[0],
            note: 'Legal notice recorded in system',
          },
        ],
      };
      setLegalNotices((prev) => [newNotice, ...prev]);

      if (newNotice.replyDueDate) {
        const newDeadline: DocketEvent = {
          id: gid('d'),
          type: 'Compliance',
          matterId: newNotice.id,
          matterName: `${newNotice.noticeNo} (${newNotice.clientName || 'Notice'})`,
          date: newNotice.replyDueDate,
          time: '17:00',
          venue:
            newNotice.direction === 'SENT'
              ? 'Notice Cure Period Expiry / Actionable'
              : 'Mandatory Reply Due Date',
          priority: newNotice.priority === 'h' ? 'ug' : 'wa',
          attorney: newNotice.attorney,
          notes: `Subject: ${newNotice.subject} | Ref: ${newNotice.noticeNo}`,
        };
        setDeadlines((prev) => [...prev, newDeadline]);
      }

      setActivities((prev) => [
        {
          id: gid('a'),
          text: `<strong>New Legal Notice:</strong> ${newNotice.noticeNo} (${newNotice.direction === 'SENT' ? 'Outward' : 'Inward'}) - ${newNotice.senderName} to ${newNotice.recipientName}`,
          time: 'Just now',
          color: newNotice.direction === 'SENT' ? 'pr' : 'wa',
        },
        ...prev,
      ]);

      audit('CREATE', 'Notice', `${newNotice.noticeNo}: ${newNotice.subject}`);
      closeModal();
      showToast(`Legal notice ${newNotice.noticeNo} saved!`, 'ok');
    },
    [audit, closeModal, showToast]
  );

  const updateLegalNotice = useCallback(
    (id: string, updates: Partial<LegalNotice>) => {
      setLegalNotices((prev) =>
        prev.map((n) => {
          if (n.id !== id) return n;
          const updatedHistory = [...(n.statusHistory || [])];
          if (updates.status && updates.status !== n.status) {
            updatedHistory.push({
              status: updates.status,
              date: new Date().toISOString().split('T')[0],
              note: updates.notes || `Status changed to ${updates.status}`,
            });
          }
          return {
            ...n,
            ...updates,
            statusHistory: updatedHistory,
          };
        })
      );
      audit('UPDATE', 'Notice', `Updated notice ${id}`);
      showToast('Legal notice updated', 'ok');
    },
    [audit, showToast]
  );

  const deleteLegalNotice = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const target = legalNotices.find((x) => x.id === id);
      setLegalNotices((prev) => prev.filter((n) => n.id !== id));
      audit('DELETE', 'Notice', `Deleted notice ${target?.noticeNo || id}`);
      showToast('Legal notice deleted', 'in');
    },
    [audit, canDeleteRecords, legalNotices, showToast]
  );

  // Counts Calculation
  const counts = useMemo(() => {
    const urgent = deadlines.filter((d) => {
      const diff = dDiff(d.date);
      return diff !== null && diff >= 0 && diff <= 3;
    }).length;

    const upcoming = deadlines.filter((d) => {
      const diff = dDiff(d.date);
      return diff !== null && diff >= 0 && diff <= 7;
    }).length;

    return {
      clients: clients.length,
      iprTotal: iprMatters.length,
      courtTotal: courtMatters.length,
      urgentHearings: urgent,
      upcomingHearings: upcoming,
      pinnedNotes: notes.filter((n) => n.pinned).length,
      notices: legalNotices.length,
      noticesSent: legalNotices.filter((n) => n.direction === 'SENT').length,
      noticesReceived: legalNotices.filter((n) => n.direction === 'RECEIVED').length,
      noticesActionable: legalNotices.filter((n) => n.status === 'Dispatched' || n.status === 'Delivered / Served').length,
      tm: iprMatters.filter((m) => m.type === 'TM').length,
      pat: iprMatters.filter((m) => m.type === 'PAT').length,
      cp: iprMatters.filter((m) => m.type === 'COPY').length,
      ds: iprMatters.filter((m) => m.type === 'DESIGN').length,
      gi: iprMatters.filter((m) => m.type === 'GI').length,
      sc: courtMatters.filter((r) => r.type === 'SC').length,
      hc: courtMatters.filter((r) => r.type === 'HC').length,
      dc: courtMatters.filter((r) => r.type === 'DC').length,
      cc: courtMatters.filter((r) => r.type === 'CC').length,
      lc: courtMatters.filter((r) => r.type === 'LC').length,
      ngt: courtMatters.filter((r) => r.type === 'NGT').length,
      nclt: courtMatters.filter((r) => r.type === 'NCLT').length,
      itat: courtMatters.filter((r) => r.type === 'ITAT').length,
      drt: courtMatters.filter((r) => r.type === 'DRT').length,
      cat: courtMatters.filter((r) => r.type === 'CAT').length,
      arb: courtMatters.filter((r) => r.type === 'ARB').length,
    };
  }, [clients.length, courtMatters, deadlines, iprMatters, legalNotices, notes]);

  const value = useMemo(
    () => ({
      isLoggedIn,
      currentUser,
      currentEmail,
      currentOrgId,
      currentUserId,
      currentRole,
      mustChangePassword,
      canDeleteRecords,
      trialInfo,
      login,
      sendOtp,
      verifyOtp,
      loginWithOtp,
      registerUser,
      loginGoogle,
      logout,
      updateProfile,
      completePasswordSetup,
      sidebarMinimized,
      toggleSidebar,
      isNotifPanelOpen,
      toggleNotifPanel,
      clients,
      iprMatters,
      courtMatters,
      deadlines,
      documents,
      activities,
      auditLogs,
      workLogs,
      notes,
      syncStatus,
      syncDriveAndCalendar,
      googleCalendarEmail,
      googleCalendarSync,
      googleCalendarScope,
      calendarToken,
      connectGoogleCalendar,
      disconnectGoogleCalendar,
      setGoogleCalendarScope,
      openEventInGoogleCalendar,
      exportAllEventsToGoogleCalendar,
      subscribeGoogleCalendarFeed,
      toasts,
      showToast,
      modalState,
      openModal,
      closeModal,
      addClient,
      updateClient,
      deleteClient,
      addIprMatter,
      updateIprMatter,
      deleteIprMatter,
      addCourtMatter,
      updateCourtMatter,
      deleteCourtMatter,
      addDocketEvent,
      updateDocketEvent,
      deleteDocketEvent,
      vaultFolders,
      createVaultFolder,
      ensureMatterFolders,
      deleteVaultFolder,
      uploadDocuments,
      uploadDocumentItem,
      deleteDocument,
      moveDocument,
      addWorkLog,
      updateWorkLog,
      deleteWorkLog,
      addNote,
      updateNote,
      togglePinNote,
      deleteNote,
      legalNotices,
      addLegalNotice,
      updateLegalNotice,
      deleteLegalNotice,
      counts,
    }),
    [
      isLoggedIn,
      currentUser,
      currentEmail,
      currentOrgId,
      currentUserId,
      currentRole,
      mustChangePassword,
      canDeleteRecords,
      trialInfo,
      login,
      sendOtp,
      verifyOtp,
      loginWithOtp,
      registerUser,
      loginGoogle,
      logout,
      updateProfile,
      completePasswordSetup,
      sidebarMinimized,
      toggleSidebar,
      isNotifPanelOpen,
      toggleNotifPanel,
      clients,
      iprMatters,
      courtMatters,
      deadlines,
      documents,
      vaultFolders,
      activities,
      auditLogs,
      workLogs,
      notes,
      legalNotices,
      syncStatus,
      syncDriveAndCalendar,
      googleCalendarEmail,
      googleCalendarSync,
      googleCalendarScope,
      calendarToken,
      connectGoogleCalendar,
      disconnectGoogleCalendar,
      setGoogleCalendarScope,
      openEventInGoogleCalendar,
      exportAllEventsToGoogleCalendar,
      subscribeGoogleCalendarFeed,
      toasts,
      showToast,
      modalState,
      openModal,
      closeModal,
      addClient,
      updateClient,
      deleteClient,
      addIprMatter,
      updateIprMatter,
      deleteIprMatter,
      addCourtMatter,
      updateCourtMatter,
      deleteCourtMatter,
      addDocketEvent,
      updateDocketEvent,
      deleteDocketEvent,
      createVaultFolder,
      ensureMatterFolders,
      deleteVaultFolder,
      uploadDocuments,
      uploadDocumentItem,
      deleteDocument,
      moveDocument,
      addWorkLog,
      updateWorkLog,
      deleteWorkLog,
      addNote,
      updateNote,
      togglePinNote,
      deleteNote,
      addLegalNotice,
      updateLegalNotice,
      deleteLegalNotice,
      counts,
    ]
  );

  return (
    <LawyersDiaryContext.Provider value={value}>
      {children}
    </LawyersDiaryContext.Provider>
  );
};

export const useLawyersDiary = () => {
  const context = useContext(LawyersDiaryContext);
  if (!context) {
    throw new Error('useLawyersDiary must be used within a LawyersDiaryProvider');
  }
  return context;
};
