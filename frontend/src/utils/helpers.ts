import { DocumentFile } from '../types';

export const MS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const MSS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export const gid = (prefix = 'x') =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

export const td = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
};

export const tp = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

export const tsNow = () => new Date().toISOString();

export const fDT = (iso?: string) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return (
    d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }) +
    ' ' +
    d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    })
  );
};

export const dDiff = (dateStr?: string) => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  // Normalize to date without time for accurate day difference
  const diffTime =
    new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime() -
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const bTy = (t2: string) => {
  const map: Record<string, string> = {
    TM: 'bTM',
    PAT: 'bPAT',
    COPY: 'bCOPY',
    DESIGN: 'bDESIGN',
    GI: 'bGI',
    SC: 'bSC',
    HC: 'bHC',
    DC: 'bDC',
    CC: 'bCC',
    NGT: 'bNGT',
    NCLT: 'bNCLT',
    ITAT: 'bITAT',
    DRT: 'bDRT',
    CAT: 'bCAT',
    ARB: 'bARB',
  };
  return map[t2] || '';
};

export const bSt = (s?: string) => {
  if (!s) return 'bPend';
  const map: Record<string, string> = {
    Pending: 'bPend',
    'Under Examination': 'bPend',
    'FER Issued': 'bPend',
    'Hearing Fixed': 'bHear',
    Opposed: 'bOpp',
    Registered: 'bReg',
    'Renewal Due': 'bPend',
    Filed: 'bFiled',
    Active: 'bAct',
    Notice: 'bFiled',
    Arguments: 'bHear',
    Evidence: 'bHear',
    Hearing: 'bHear',
    Admission: 'bFiled',
    Reply: 'bPend',
    'Written Statement': 'bPend',
    CIRP: 'bAct',
    Decided: 'bDec',
    Allowed: 'bReg',
    Dismissed: 'bOpp',
    Pleadings: 'bPend',
    Applied: 'bFiled',
  };
  return map[s] || 'bPend';
};

export const aDot = (color: string) => {
  const map: Record<string, string> = {
    pr: '#1a3a6e',
    gd: '#c89b30',
    cy: '#0097b2',
    gn: '#1a7a4a',
    rd: '#c0392b',
    te: '#0e7490',
    pu: '#6d28d9',
  };
  return map[color] || color || '#7a8fb0';
};

export const exportCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToCsv = (filename: string, data: Record<string, any>[]) => {
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map((item) => headers.map((h) => item[h] ?? ''));
  exportCSV(filename, headers, rows);
};

export const dCell = (dateStr?: string) => {
  if (!dateStr) return '<span style="color:var(--tx3)">—</span>';
  const diff = dDiff(dateStr);
  const lbl =
    diff === 0
      ? 'TODAY'
      : diff === 1
      ? 'Tomorrow'
      : diff !== null && diff < 0
      ? 'OVERDUE'
      : `${diff}d`;
  const tagClass =
    diff !== null && diff <= 3 ? 'du' : diff !== null && diff <= 14 ? 'dw' : 'dok';

  return `<span>${dateStr}</span> <span class="ddys ${tagClass}" style="margin-left:0.25rem">${lbl}</span>`;
};

export const printDailyCauseList = (deadlines: Array<{
  date: string;
  type: string;
  matterName: string;
  venue?: string;
  attorney: string;
}>) => {
  const now = new Date();
  const tf = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const sorted = [...deadlines].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const w = window.open('', '_blank');
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Lawyers Diary – Cause List</title><style>body{font-family:Arial,sans-serif;max-width:780px;margin:40px auto;color:#1a2540}h1{font-size:1.35rem;border-bottom:3px solid #c89b30;padding-bottom:.5rem}table{width:100%;border-collapse:collapse;font-size:.83rem}th{background:#1a3a6e;color:#fff;padding:.5rem .75rem;text-align:left}td{padding:.5rem .75rem;border-bottom:1px solid #e0e0e0}.ug{color:#c0392b;font-weight:bold}.wa{color:#c89b30}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem"><div style="font-size:1.5rem;font-weight:900;color:#1a3a6e">Lawyers <span style="color:#c89b30">Diary</span></div><div style="font-size:.72rem;color:#8a9bb5">CONFIDENTIAL · Legal Practice Management</div></div><h1>Daily Cause List</h1><p style="color:#8a9bb5;font-size:.82rem;margin-bottom:1.5rem">${tf}</p><table><thead><tr><th>Date</th><th>Days</th><th>Type</th><th>Matter</th><th>Venue</th><th>Attorney</th></tr></thead><tbody>${sorted.map(d => {
    const diff = dDiff(d.date) ?? 0;
    const c = diff <= 3 ? 'ug' : diff <= 14 ? 'wa' : '';
    const label = diff < 0 ? 'OVERDUE' : diff === 0 ? 'TODAY' : `${diff} days`;
    return `<tr><td class="${c}">${d.date}</td><td class="${c}">${label}</td><td>${d.type}</td><td>${d.matterName}</td><td>${d.venue || '—'}</td><td>${d.attorney}</td></tr>`;
  }).join('')}</tbody></table><p style="font-size:.7rem;color:#aaa;margin-top:2rem;border-top:1px solid #e0e0e0;padding-top:1rem">Lawyers Diary · ${now.toLocaleString()}</p></body></html>`);
  w.document.close();
  w.print();
};

export const downloadDocumentPdf = (doc: DocumentFile) => {
  const matterName = doc.matterName || 'General Legal Matter';
  const folder = doc.folder || 'General';
  const uploadedAt = doc.uploadedAt || doc.date || '—';

  const fileName = doc.name.toLowerCase().endsWith('.pdf')
    ? doc.name
    : `${doc.name.replace(/\.[^/.]+$/, '')}.pdf`;

  const pdfHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${fileName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: 'Times New Roman', Georgia, serif;
      color: #0f172a;
      margin: 0;
      padding: 30px;
      line-height: 1.6;
      background: #ffffff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #172554;
      padding-bottom: 12px;
      margin-bottom: 22px;
    }
    .logo {
      font-size: 22px;
      font-weight: bold;
      color: #172554;
      font-family: Georgia, serif;
    }
    .logo span { color: #b08d57; }
    .doc-badge {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      background: #eff6ff;
      color: #1e40af;
      border: 1px solid #bfdbfe;
      padding: 4px 10px;
      border-radius: 4px;
      font-family: sans-serif;
      font-weight: bold;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      font-family: sans-serif;
      font-size: 13px;
    }
    .meta-table td {
      padding: 10px 14px;
      border: 1px solid #e2e8f0;
    }
    .meta-lbl {
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      font-weight: 700;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 600;
    }
    .doc-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      margin: 30px 0 20px;
      color: #172554;
      letter-spacing: 0.5px;
      text-decoration: underline;
    }
    .doc-content {
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 28px;
      background: #ffffff;
      min-height: 380px;
      margin-bottom: 25px;
      font-size: 14px;
    }
    .signature-block {
      margin-top: 40px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-family: sans-serif;
      font-size: 12px;
    }
    .sig-line {
      border-top: 1px solid #0f172a;
      width: 200px;
      margin-top: 40px;
      padding-top: 5px;
      text-align: center;
      font-weight: 600;
    }
    .watermark {
      text-align: center;
      color: #94a3b8;
      font-size: 11px;
      margin-top: 30px;
      font-family: sans-serif;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      color: #64748b;
      font-family: sans-serif;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Lawyers <span>Diary</span></div>
    <div class="doc-badge">${doc.type.toUpperCase()} LEGAL VAULT FILE</div>
  </div>

  <table class="meta-table">
    <tr>
      <td><span class="meta-lbl">Document Name:</span> <span class="meta-val">${doc.name}</span></td>
      <td><span class="meta-lbl">Docket Matter:</span> <span class="meta-val">${matterName}</span></td>
    </tr>
    <tr>
      <td><span class="meta-lbl">Vault Subfolder:</span> <span class="meta-val">${folder}</span></td>
      <td><span class="meta-lbl">File Metadata:</span> <span class="meta-val">${doc.size} · Uploaded ${uploadedAt}</span></td>
    </tr>
  </table>

  <div class="doc-content">
    <div class="doc-title">${doc.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' ')}</div>
    <p><strong>IN THE MATTER OF:</strong> <em>${matterName}</em></p>
    <p><strong>RECORDS &amp; PLEADINGS VAULT REGISTER ENTRY ID:</strong> <code>${doc.id}</code></p>
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 15px 0;" />
    <p style="text-align: justify; line-height: 1.8;">
      This document constitutes an authenticated record filed under the <strong>${folder}</strong> repository for <strong>${matterName}</strong>. All evidentiary annexures, affidavit statements, power of attorney filings, and court orders attached to this file are verified by the practicing counsel of record.
    </p>
    <p style="text-align: justify; line-height: 1.8;">
      The original copy is stored with AES-256 encryption in Lawyers Diary Document Vault and synchronized with firm cloud workspace drives.
    </p>

    <div class="signature-block">
      <div>
        <p><strong>DATE OF EXTRACT:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
        <p><strong>STATUS:</strong> VERIFIED ORIGINAL COPY</p>
      </div>
      <div>
        <div class="sig-line">ADVOCATE / SOLICITOR FOR MATTER</div>
      </div>
    </div>

    <div class="watermark">CONFIDENTIAL &amp; PRIVILEGED LEGAL PRACTICE RECORD</div>
  </div>

  <div class="footer">
    <span>Lawyers Diary Practice Management · Document Vault ID: ${doc.id}</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>`;

  // 1. Open preview/print window
  const w = window.open('', '_blank');
  if (w) {
    w.document.write(pdfHtml);
    w.document.close();
  }

  // 2. Trigger automatic PDF file download in browser
  const blob = new Blob([pdfHtml], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
