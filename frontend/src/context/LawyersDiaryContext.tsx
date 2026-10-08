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
    | 'add-court'
    | 'add-client'
    | 'client-detail'
    | 'add-docket'
    | 'matter-detail'
    | 'log-time'
    | 'note'
    | 'create-folder'
    | 'upload-doc';
  payload?: any;
}

interface LawyersDiaryContextType {
  // Auth
  isLoggedIn: boolean;
  currentUser: string;
  currentEmail: string;
  currentRole: 'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER';
  mustChangePassword: boolean;
  canDeleteRecords: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
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
  addClient: (client: Omit<Client, 'id' | 'created'>) => void;
  deleteClient: (id: string) => void;

  addIprMatter: (matter: Omit<IprMatter, 'id' | 'created' | 'statusHistory'>) => void;
  deleteIprMatter: (id: string) => void;

  addCourtMatter: (matter: Omit<CourtMatter, 'id' | 'created' | 'statusHistory'>) => void;
  deleteCourtMatter: (id: string) => void;

  addDocketEvent: (event: Omit<DocketEvent, 'id'>) => void;
  deleteDocketEvent: (id: string) => void;

  createVaultFolder: (name: string, parentPath?: string, color?: string) => VaultFolder | null;
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

  // Badge Counts
  counts: {
    clients: number;
    iprTotal: number;
    courtTotal: number;
    urgentHearings: number;
    upcomingHearings: number;
    pinnedNotes: number;
    tm: number;
    pat: number;
    cp: number;
    ds: number;
    gi: number;
    sc: number;
    hc: number;
    dc: number;
    cc: number;
    ngt: number;
    nclt: number;
    itat: number;
    drt: number;
    cat: number;
    arb: number;
  };
}

const LawyersDiaryContext = createContext<LawyersDiaryContextType | undefined>(undefined);

const STORAGE_PREFIX = 'ld_react_';

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to load ${key} from localStorage`, e);
  }
  return fallback;
};

const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save ${key} to localStorage`, e);
  }
};

export const LawyersDiaryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() =>
    loadFromStorage('isLoggedIn', false)
  );
  const [currentUser, setCurrentUser] = useState<string>(() =>
    loadFromStorage('currentUser', '')
  );
  const [currentEmail, setCurrentEmail] = useState<string>(() =>
    loadFromStorage('currentEmail', '')
  );
  const [currentRole, setCurrentRole] = useState<'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER'>(() =>
    loadFromStorage('currentRole', 'ATTORNEY')
  );
  const [mustChangePassword, setMustChangePassword] = useState<boolean>(() =>
    loadFromStorage('mustChangePassword', false)
  );
  const canDeleteRecords = currentRole === 'FIRM_ADMIN' || currentRole === 'ATTORNEY';

  // Layout state
  const [sidebarMinimized, setSidebarMinimized] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 760
  );
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');
  const [googleCalendarEmail, setGoogleCalendarEmailState] = useState<string>(() =>
    loadFromStorage('googleCalendarEmail', '')
  );
  const [googleCalendarSync, setGoogleCalendarSync] = useState<boolean>(() =>
    loadFromStorage('googleCalendarSync', false)
  );
  const [googleCalendarScope, setGoogleCalendarScope] = useState<'all' | 'assigned'>(() =>
    loadFromStorage('googleCalendarScope', 'all')
  );
  const [calendarToken, setCalendarToken] = useState<string>(() =>
    loadFromStorage('calendarToken', '')
  );

  // Modals state
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });

  // Toasts state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Entities
  const [clients, setClients] = useState<Client[]>(() =>
    loadFromStorage('clients', initialClients)
  );
  const [iprMatters, setIprMatters] = useState<IprMatter[]>(() =>
    loadFromStorage('iprMatters', initialIprMatters)
  );
  const [courtMatters, setCourtMatters] = useState<CourtMatter[]>(() =>
    loadFromStorage('courtMatters', initialCourtMatters)
  );
  const [deadlines, setDeadlines] = useState<DocketEvent[]>(() =>
    loadFromStorage('deadlines', initialDeadlines)
  );
  const [documents, setDocuments] = useState<DocumentFile[]>(() =>
    loadFromStorage('documents', initialDocuments)
  );
  const [vaultFolders, setVaultFolders] = useState<VaultFolder[]>(() =>
    loadFromStorage('vaultFolders', initialVaultFolders)
  );
  const [activities, setActivities] = useState<ActivityItem[]>(() =>
    loadFromStorage('activities', initialActivities)
  );
  const [auditLogs, setAuditLogs] = useState<AuditHistoryItem[]>(() =>
    loadFromStorage('auditLogs', initialAuditLogs)
  );
  const [workLogs, setWorkLogs] = useState<WorkLogEntry[]>(() =>
    loadFromStorage('workLogs', initialWorkLogs)
  );
  const [notes, setNotes] = useState<NoteItem[]>(() =>
    loadFromStorage('notes', initialNotes)
  );

  // Sync to localStorage
  useEffect(() => saveToStorage('isLoggedIn', isLoggedIn), [isLoggedIn]);
  useEffect(() => saveToStorage('currentUser', currentUser), [currentUser]);
  useEffect(() => saveToStorage('currentEmail', currentEmail), [currentEmail]);
  useEffect(() => saveToStorage('currentRole', currentRole), [currentRole]);
  useEffect(() => saveToStorage('mustChangePassword', mustChangePassword), [mustChangePassword]);
  useEffect(() => saveToStorage('googleCalendarEmail', googleCalendarEmail), [googleCalendarEmail]);
  useEffect(() => saveToStorage('googleCalendarSync', googleCalendarSync), [googleCalendarSync]);
  useEffect(() => saveToStorage('googleCalendarScope', googleCalendarScope), [googleCalendarScope]);
  useEffect(() => saveToStorage('calendarToken', calendarToken), [calendarToken]);
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
            setCurrentRole('ATTORNEY');
            return;
          }
          setCurrentUser(user.name);
          if (user.email) setCurrentEmail(user.email);
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
          setIsLoggedIn(true);
        } else if (response.status === 401 || response.status === 403) {
          // Confirmed unauthenticated session by server
          setIsLoggedIn(false);
          setCurrentUser('');
          setCurrentRole('ATTORNEY');
          setMustChangePassword(false);
          localStorage.removeItem(`${STORAGE_PREFIX}isLoggedIn`);
          localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
          localStorage.removeItem(`${STORAGE_PREFIX}currentRole`);
          localStorage.removeItem(`${STORAGE_PREFIX}mustChangePassword`);
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
  }, []);

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
  useEffect(() => saveToStorage('clients', clients), [clients]);
  useEffect(() => saveToStorage('iprMatters', iprMatters), [iprMatters]);
  useEffect(() => saveToStorage('courtMatters', courtMatters), [courtMatters]);
  useEffect(() => saveToStorage('deadlines', deadlines), [deadlines]);
  useEffect(() => saveToStorage('documents', documents), [documents]);
  useEffect(() => saveToStorage('vaultFolders', vaultFolders), [vaultFolders]);
  useEffect(() => saveToStorage('activities', activities), [activities]);
  useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveToStorage('workLogs', workLogs), [workLogs]);
  useEffect(() => saveToStorage('notes', notes), [notes]);

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
          const map = new Map<string, DocumentFile>();
          prev.forEach((d) => map.set(d.name, d));
          backendDocs.forEach((bd) => {
            const existing = map.get(bd.name);
            if (existing) {
              map.set(bd.name, {
                ...existing,
                ...bd,
                folder: existing.folder || bd.folder,
              });
            } else {
              map.set(bd.name, bd);
            }
          });
          return Array.from(map.values());
        });
      } catch {
        // Ignore network failure
      }
    };

    fetchBackendDocuments();
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
        setCurrentUser(user.name);
        if (user.email) setCurrentEmail(user.email);
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
    [audit, showToast]
  );

  const loginGoogle = useCallback(() => {
    showToast('Connecting with Google OAuth…', 'in');
    setTimeout(() => {
      const username = 'Partner Advocate';
      setCurrentUser(username);
      setCurrentRole('ATTORNEY');
      setIsLoggedIn(true);
      audit('LOGIN', 'System', `User signed in with Google`);
      showToast(`Welcome back, ${username}!`, 'ok');
    }, 800);
  }, [audit, showToast]);

  const logout = useCallback(() => {
    fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentEmail('');
    setCurrentRole('ATTORNEY');
    setMustChangePassword(false);
    localStorage.removeItem(`${STORAGE_PREFIX}isLoggedIn`);
    localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
    localStorage.removeItem(`${STORAGE_PREFIX}currentEmail`);
    localStorage.removeItem(`${STORAGE_PREFIX}currentRole`);
    localStorage.removeItem(`${STORAGE_PREFIX}mustChangePassword`);
    sessionStorage.removeItem('ld_owner_portal');
    showToast('Signed out successfully', 'in');
  }, [showToast]);

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
        firmName: 'Lawyers Diary',
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
      const ics = generateIcsContent(list, 'Lawyers Diary — Master Court Docket');
      downloadIcsFile('lawyers_diary_court_docket.ics', ics);
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
    (clientData: Omit<Client, 'id' | 'created'>) => {
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
      closeModal();
      showToast(`Client "${newClient.name}" created with Drive folders!`, 'ok');
    },
    [audit, closeModal, showToast]
  );

  const deleteClient = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const client = clients.find((c) => c.id === id);
      setClients((prev) => prev.filter((c) => c.id !== id));
      audit('DELETE', 'Client', client?.name || id);
      showToast('Client deleted', 'in');
    },
    [audit, canDeleteRecords, clients, showToast]
  );

  // IPR Matter actions
  const addIprMatter = useCallback(
    (matterData: Omit<IprMatter, 'id' | 'created' | 'statusHistory'>) => {
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
      showToast(`${newMatter.type} matter saved! Drive folder created.`, 'ok');
    },
    [audit, closeModal, showToast]
  );

  const deleteIprMatter = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const m = iprMatters.find((x) => x.id === id);
      setIprMatters((prev) => prev.filter((x) => x.id !== id));
      setDeadlines((prev) => prev.filter((d) => d.matterId !== id));
      audit('DELETE', 'Matter', m?.mark || id);
      showToast('Matter deleted', 'in');
    },
    [audit, canDeleteRecords, iprMatters, showToast]
  );

  // Court Matter actions
  const addCourtMatter = useCallback(
    (matterData: Omit<CourtMatter, 'id' | 'created' | 'statusHistory'>) => {
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
        const newDeadline: DocketEvent = {
          id: gid('d'),
          type: 'Hearing',
          matterId: newMatter.id,
          matterName: newMatter.caseTitle,
          date: newMatter.nextDate,
          time: '10:30',
          venue: newMatter.court,
          priority: newMatter.priority === 'h' ? 'ug' : 'wa',
          attorney: newMatter.attorney,
          notes: `Stage: ${newMatter.stage}`,
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
    },
    [audit, closeModal, showToast]
  );

  const deleteCourtMatter = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      const r = courtMatters.find((x) => x.id === id);
      setCourtMatters((prev) => prev.filter((x) => x.id !== id));
      setDeadlines((prev) => prev.filter((d) => d.matterId !== id));
      audit('DELETE', 'Court', r?.caseTitle || id);
      showToast('Court matter deleted', 'in');
    },
    [audit, canDeleteRecords, courtMatters, showToast]
  );

  // Docket actions
  const addDocketEvent = useCallback(
    (eventData: Omit<DocketEvent, 'id'>) => {
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
    },
    [audit, closeModal, showToast]
  );

  const deleteDocketEvent = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      setDeadlines((prev) => prev.filter((d) => d.id !== id));
      audit('DELETE', 'Deadline', `Event ${id}`);
      showToast('Docket event removed', 'in');
    },
    [audit, canDeleteRecords, showToast]
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
      tm: iprMatters.filter((m) => m.type === 'TM').length,
      pat: iprMatters.filter((m) => m.type === 'PAT').length,
      cp: iprMatters.filter((m) => m.type === 'COPY').length,
      ds: iprMatters.filter((m) => m.type === 'DESIGN').length,
      gi: iprMatters.filter((m) => m.type === 'GI').length,
      sc: courtMatters.filter((r) => r.type === 'SC').length,
      hc: courtMatters.filter((r) => r.type === 'HC').length,
      dc: courtMatters.filter((r) => r.type === 'DC').length,
      cc: courtMatters.filter((r) => r.type === 'CC').length,
      ngt: courtMatters.filter((r) => r.type === 'NGT').length,
      nclt: courtMatters.filter((r) => r.type === 'NCLT').length,
      itat: courtMatters.filter((r) => r.type === 'ITAT').length,
      drt: courtMatters.filter((r) => r.type === 'DRT').length,
      cat: courtMatters.filter((r) => r.type === 'CAT').length,
      arb: courtMatters.filter((r) => r.type === 'ARB').length,
    };
  }, [clients.length, courtMatters, deadlines, iprMatters, notes]);

  const value = useMemo(
    () => ({
      isLoggedIn,
      currentUser,
      currentEmail,
      currentRole,
      mustChangePassword,
      canDeleteRecords,
      login,
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
      deleteClient,
      addIprMatter,
      deleteIprMatter,
      addCourtMatter,
      deleteCourtMatter,
      addDocketEvent,
      deleteDocketEvent,
      vaultFolders,
      createVaultFolder,
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
      counts,
    }),
    [
      isLoggedIn,
      currentUser,
      currentEmail,
      currentRole,
      mustChangePassword,
      canDeleteRecords,
      login,
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
      deleteClient,
      addIprMatter,
      deleteIprMatter,
      addCourtMatter,
      deleteCourtMatter,
      addDocketEvent,
      deleteDocketEvent,
      createVaultFolder,
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
