import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Client,
  IprMatter,
  CourtMatter,
  DocketEvent,
  DocumentFile,
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
  initialActivities,
  initialAuditLogs,
  initialWorkLogs,
  initialNotes,
} from '../data/seedData';
import { gid, tsNow, dDiff } from '../utils/helpers';

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
    | 'note';
  payload?: any;
}

interface LawyersDiaryContextType {
  // Auth
  isLoggedIn: boolean;
  currentUser: string;
  currentRole: 'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER';
  canDeleteRecords: boolean;
  login: (email: string, pass: string) => Promise<boolean>;
  loginGoogle: () => void;
  logout: () => void;

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
  activities: ActivityItem[];
  auditLogs: AuditHistoryItem[];
  workLogs: WorkLogEntry[];
  notes: NoteItem[];

  // Sync
  syncStatus: 'synced' | 'syncing';
  syncDriveAndCalendar: () => void;

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

  uploadDocuments: (files: FileList | File[]) => void;
  deleteDocument: (id: string) => void;

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
    loadFromStorage('currentUser', 'Advocate')
  );
  const [currentRole, setCurrentRole] = useState<'FIRM_ADMIN' | 'ATTORNEY' | 'PARALEGAL' | 'STAFF' | 'VIEWER'>(() =>
    loadFromStorage('currentRole', 'ATTORNEY')
  );
  const canDeleteRecords = currentRole === 'FIRM_ADMIN' || currentRole === 'ATTORNEY';

  // Layout state
  const [sidebarMinimized, setSidebarMinimized] = useState<boolean>(() =>
    typeof window !== 'undefined' && window.innerWidth <= 760
  );
  const [isNotifPanelOpen, setIsNotifPanelOpen] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing'>('synced');

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
  useEffect(() => saveToStorage('currentRole', currentRole), [currentRole]);
  useEffect(() => {
    fetch('/api/v1/auth/me', { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Session expired');
        const result = await response.json();
        const user = result.data;
        setCurrentUser(user.name);
        setCurrentRole(user.role);
        setIsLoggedIn(true);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setCurrentUser('');
        setCurrentRole('ATTORNEY');
        localStorage.removeItem(`${STORAGE_PREFIX}isLoggedIn`);
        localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
        localStorage.removeItem(`${STORAGE_PREFIX}currentRole`);
      });
  }, []);
  useEffect(() => saveToStorage('clients', clients), [clients]);
  useEffect(() => saveToStorage('iprMatters', iprMatters), [iprMatters]);
  useEffect(() => saveToStorage('courtMatters', courtMatters), [courtMatters]);
  useEffect(() => saveToStorage('deadlines', deadlines), [deadlines]);
  useEffect(() => saveToStorage('documents', documents), [documents]);
  useEffect(() => saveToStorage('activities', activities), [activities]);
  useEffect(() => saveToStorage('auditLogs', auditLogs), [auditLogs]);
  useEffect(() => saveToStorage('workLogs', workLogs), [workLogs]);
  useEffect(() => saveToStorage('notes', notes), [notes]);

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
        setCurrentUser(user.name);
        setCurrentRole(user.role);
        setIsLoggedIn(true);
        audit('LOGIN', 'System', `User ${user.name} logged in`);
        showToast(`Welcome, ${user.name.split(' ')[0]}!`, 'ok');
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
      const username = 'Advocate';
      setCurrentUser(username);
      setCurrentRole('ATTORNEY');
      setIsLoggedIn(true);
      audit('LOGIN', 'System', `User signed in with Google`);
      showToast(`Welcome back, ${username}!`, 'ok');
    }, 800);
  }, [audit, showToast]);

  const logout = useCallback(() => {
    setIsLoggedIn(false);
    setCurrentUser('');
    setCurrentRole('ATTORNEY');
    localStorage.removeItem(`${STORAGE_PREFIX}isLoggedIn`);
    localStorage.removeItem(`${STORAGE_PREFIX}currentUser`);
    localStorage.removeItem(`${STORAGE_PREFIX}currentRole`);
    sessionStorage.removeItem('ld_owner_portal');
    showToast('Signed out successfully', 'in');
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

  // Drive & Calendar Sync
  const syncDriveAndCalendar = useCallback(() => {
    setSyncStatus('syncing');
    showToast('Syncing Google Calendar & Drive folders…', 'in');
    setTimeout(() => {
      setSyncStatus('synced');
      audit('SYNC', 'System', `Google Calendar sync – ${deadlines.length} events synced`);
      showToast(`Calendar & Drive synced! ${deadlines.length} events up to date.`, 'ok');
    }, 1500);
  }, [audit, deadlines.length, showToast]);

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

  // Documents
  const uploadDocuments = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const added: DocumentFile[] = [];
      fileArray.forEach((f) => {
        const ext = f.name.split('.').pop()?.toLowerCase() || 'doc';
        const doc: DocumentFile = {
          id: gid('f'),
          name: f.name,
          matterId: '',
          matterName: 'Unassigned Matter',
          folder: 'Pleadings',
          type: ext,
          size: `${(f.size / (1024 * 1024)).toFixed(1)} MB`,
          date: new Date().toISOString().split('T')[0],
          uploadedAt: new Date().toISOString().split('T')[0],
          tags: ['Uploaded'],
        };
        added.push(doc);
      });
      setDocuments((prev) => [...added, ...prev]);
      audit('UPLOAD', 'Document', `${added.length} file(s) uploaded`);
      showToast(`${added.length} file(s) uploaded to Drive!`, 'ok');
    },
    [audit, showToast]
  );

  const deleteDocument = useCallback(
    (id: string) => {
      if (!canDeleteRecords) return;
      setDocuments((prev) => prev.filter((d) => d.id !== id));
      audit('DELETE', 'Document', `Doc ${id}`);
      showToast('Document deleted', 'in');
    },
    [audit, canDeleteRecords, showToast]
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
      currentRole,
      canDeleteRecords,
      login,
      loginGoogle,
      logout,
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
      uploadDocuments,
      deleteDocument,
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
      currentRole,
      canDeleteRecords,
      login,
      loginGoogle,
      logout,
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
      uploadDocuments,
      deleteDocument,
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
