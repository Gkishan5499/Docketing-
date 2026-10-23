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
  LegalNotice,
} from '../types';

export const initialClients: Client[] = [];

export const initialIprMatters: IprMatter[] = [];

export const initialCourtMatters: CourtMatter[] = [];

export const initialDeadlines: DocketEvent[] = [];

export const initialVaultFolders: VaultFolder[] = [
  { id: 'vf_root', name: 'LawyersDiary', path: '/LawyersDiary', parentPath: '', isSystem: true },
  { id: 'vf_clients', name: 'Clients', path: '/LawyersDiary/Clients', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_pleadings', name: 'Pleadings', path: '/LawyersDiary/Pleadings', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_orders', name: 'Orders', path: '/LawyersDiary/Orders', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_evidence', name: 'Evidence', path: '/LawyersDiary/Evidence', parentPath: '/LawyersDiary', isSystem: true },
  { id: 'vf_templates', name: 'Templates & Drafts', path: '/LawyersDiary/Templates & Drafts', parentPath: '/LawyersDiary', isSystem: true },
];

export const initialDocuments: DocumentFile[] = [];

export const initialActivities: ActivityItem[] = [];

export const initialAuditLogs: AuditHistoryItem[] = [];

export const initialWorkLogs: WorkLogEntry[] = [];

export const initialNotes: NoteItem[] = [];

export const initialLegalNotices: LegalNotice[] = [];
