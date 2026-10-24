export type IprType = 'TM' | 'PAT' | 'COPY' | 'DESIGN' | 'GI';

export type CourtType =
  | 'SC'
  | 'HC'
  | 'DC'
  | 'CC'
  | 'LC'
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
  typeOfMark?: string;
  markImage?: string;
  markFileName?: string;
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
  courtNo?: string;
  judgeName?: string;
  vcLink?: string;
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
  courtNo?: string;
  judgeName?: string;
  vcLink?: string;
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

export type NoticeDirection = 'SENT' | 'RECEIVED';

export type NoticeStatus =
  | 'Draft'
  | 'Dispatched'
  | 'Delivered / Served'
  | 'Reply Received'
  | 'Replied'
  | 'Settled / Complied'
  | 'Escalated to Litigation'
  | 'Expired / Actionable'
  | 'Closed';

export type NoticeCategory =
  | 'Cheque Bounce (Sec 138 NI Act)'
  | 'Demand Notice (Sec 8 IBC)'
  | 'Eviction & Lease (Sec 106 TPA)'
  | 'Government Notice (Sec 80 CPC)'
  | 'Recovery of Dues / Money Demand'
  | 'Breach of Contract & Damages'
  | 'Consumer Deficiency & Refund'
  | 'IPR Cease & Desist (TM / Copyright / Patent)'
  | 'Employment & Salary / Non-Compete'
  | 'Defamation & Apology'
  | 'Arbitration Invocation (Sec 21)'
  | 'Family & Matrimonial Dispute'
  | 'Other Legal Notice';

export type DispatchMode =
  | 'Speed Post (India Post)'
  | 'Registered Post AD (RPAD)'
  | 'Courier (Blue Dart / DTDC)'
  | 'Hand Delivery / Dasti'
  | 'Email / Electronic'
  | 'WhatsApp / Electronic';

export interface LegalNotice {
  id: string;
  noticeNo: string;
  direction: NoticeDirection;
  category: NoticeCategory;
  subject: string;
  clientId?: string;
  clientName: string;
  senderName: string;
  senderDesignation?: string;
  senderAddress?: string;
  senderPhone?: string;
  senderEmail?: string;
  senderAdvocate?: string;
  senderAdvocateDetails?: string;
  recipientName: string;
  recipientDesignation?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  recipientEmail?: string;
  recipientAdvocate?: string;
  summary?: string;
  claimAmount?: string;
  demands?: string;
  noticeDate: string;
  dispatchDate?: string;
  serviceDate?: string;
  curePeriodDays?: number;
  replyDueDate?: string;
  dispatchMode?: DispatchMode;
  trackingNo?: string;
  postalStatus?: string;
  trackingUrl?: string;
  status: NoticeStatus;
  priority: PriorityLevel;
  attorney: string;
  replyReceived?: boolean;
  replyDate?: string;
  replyRefNo?: string;
  replySummary?: string;
  connectedMatterId?: string;
  connectedMatterTitle?: string;
  notes?: string;
  created: string;
  statusHistory?: StatusHistoryItem[];
}
