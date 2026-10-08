export type IprType = 'TM' | 'PAT' | 'COPY' | 'DESIGN' | 'GI';

export type CourtType =
  | 'SC'
  | 'HC'
  | 'DC'
  | 'CC'
  | 'NGT'
  | 'NCLT'
  | 'ITAT'
  | 'DRT'
  | 'CAT'
  | 'ARB';

export type MatterType = IprType | CourtType;

export type PriorityLevel = 'h' | 'm' | 'l';
export type DocketPriority = 'ug' | 'wa' | 'ok';

export interface StatusHistoryItem {
  status: string;
  date: string;
  note?: string;
}

export interface Client {
  id: string;
  name: string;
  type: string;
  country: string;
  contact: string;
  email: string;
  phone: string;
  attorney: string;
  created: string;
}

export interface IprMatter {
  id: string;
  type: IprType;
  clientId: string;
  clientName: string;
  appNo: string;
  mark: string;
  classes?: string;
  inventors?: string;
  nature?: string;
  designClass?: string;
  goods?: string;
  area?: string;
  filingDate: string;
  status: string;
  nextDate?: string;
  priority: PriorityLevel;
  attorney: string;
  notes?: string;
  created: string;
  statusHistory: StatusHistoryItem[];
}

export interface CourtMatter {
  id: string;
  type: CourtType;
  clientId: string;
  clientName: string;
  caseNo: string;
  caseTitle: string;
  court: string;
  bench?: string;
  nature?: string;
  filingDate: string;
  nextDate?: string;
  stage: string;
  attorney: string;
  notes?: string;
  priority: PriorityLevel;
  created: string;
  statusHistory: StatusHistoryItem[];
}

export interface DocketEvent {
  id: string;
  type: string;
  matterId: string;
  matterName: string;
  date: string;
  time?: string;
  venue?: string;
  priority: DocketPriority;
  attorney: string;
  notes?: string;
}

export interface VaultFolder {
  id: string;
  name: string;
  path: string;
  parentPath: string;
  color?: string;
  isSystem?: boolean;
  createdAt?: string;
}

export interface DocumentFile {
  id: string;
  name: string;
  matterId: string;
  matterName?: string;
  folder?: string;
  type: string;
  size: string;
  date: string;
  uploadedAt?: string;
  tags?: string[];
  fileUrl?: string;
  downloadUrl?: string;
  viewUrl?: string;
  backendId?: string;
  storageKey?: string;
  isUploaded?: boolean;
}

export interface ActivityItem {
  id: string;
  text: string;
  time: string;
  color: string;
}

export interface AuditHistoryItem {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'UPLOAD' | 'SYNC' | 'LOGIN';
  entity: string;
  detail: string;
  user: string;
  timestamp: string;
}

export interface WorkLogEntry {
  id: string;
  matterId: string;
  matterName: string;
  task: string;
  hours: number;
  date: string;
  attorney: string;
  notes?: string;
  billable: boolean;
  created: string;
}

export interface NoteItem {
  id: string;
  matterId: string;
  matterName: string;
  title: string;
  content: string;
  priority: PriorityLevel;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'ok' | 'er' | 'in';
}
