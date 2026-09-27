import React from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { exportToCsv, printDailyCauseList } from '../utils/helpers';
import {
  BarChart3,
  Printer,
  Download,
  Award,
  Landmark,
  Activity,
  FileSpreadsheet,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { clients, iprMatters, courtMatters, deadlines, workLogs } = useLawyersDiary();

  const handleExportCsv = () => {
    const data = [
      ...iprMatters.map((m) => ({
        Category: 'IPR',
        Type: m.type,
        Identifier: m.appNo,
        Title_Mark: m.mark,
        Client: m.clientName,
        FilingDate: m.filingDate,
        NextDate: m.nextDate || '',
        Status_Stage: m.status,
        Attorney: m.attorney,
      })),
      ...courtMatters.map((r) => ({
        Category: 'Court_Tribunal',
        Type: r.type,
        Identifier: r.caseNo,
        Title_Mark: r.caseTitle,
        Client: r.clientName,
        FilingDate: r.filingDate,
        NextDate: r.nextDate || '',
        Status_Stage: r.stage,
        Attorney: r.attorney,
      })),
    ];

    exportToCsv('LawyersDiary_Complete_Matters_Report.csv', data);
  };

  // Calculations
  const tmCount = iprMatters.filter((m) => m.type === 'TM').length;
  const patCount = iprMatters.filter((m) => m.type === 'PAT').length;
  const copyCount = iprMatters.filter((m) => m.type === 'COPY').length;
  const desCount = iprMatters.filter((m) => m.type === 'DESIGN').length;
  const giCount = iprMatters.filter((m) => m.type === 'GI').length;

  const scCount = courtMatters.filter((r) => r.type === 'SC').length;
  const hcCount = courtMatters.filter((r) => r.type === 'HC').length;
  const dcCount = courtMatters.filter((r) => r.type === 'DC').length;
  const ccCount = courtMatters.filter((r) => r.type === 'CC').length;
  const triCount = courtMatters.filter((r) =>
    ['NGT', 'NCLT', 'ITAT', 'DRT', 'CAT', 'ARB'].includes(r.type)
  ).length;

  const totalBillableHours = workLogs.reduce(
    (acc, l) => (l.billable ? acc + (l.hours || 0) : acc),
    0
  );

  return (
    <div className="pg on">
      {/* Header */}
      <div className="ph">
        <div>
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-slate-800" />
            <h1>Practice Reports &amp; Case Analytics</h1>
          </div>
          <p>Comprehensive portfolio breakdown, hearing summaries, billable metrics, and statutory CSV exports</p>
        </div>
        <div className="pa">
          <button className="btn btn-o btn-s" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cause List</span>
          </button>
          <button className="btn btn-p btn-s" onClick={handleExportCsv}>
            <Download className="w-3.5 h-3.5" />
            <span>Export Master CSV</span>
          </button>
        </div>
      </div>

      {/* Grid of Report Cards */}
      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* IPR Portfolio */}
        <div className="cd">
          <div className="ch">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-700" />
              <span className="ct2">IPR Portfolio</span>
            </div>
            <span className="chip gd">{iprMatters.length} Enrolled</span>
          </div>
          <div className="cb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Trademarks (TM)</span>
                <strong style={{ color: 'var(--tx)' }}>{tmCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Patents (PAT)</span>
                <strong style={{ color: 'var(--tx)' }}>{patCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Copyrights (CR)</span>
                <strong style={{ color: 'var(--tx)' }}>{copyCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Industrial Designs</span>
                <strong style={{ color: 'var(--tx)' }}>{desCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Geographical Indications</span>
                <strong style={{ color: 'var(--tx)' }}>{giCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Courts Portfolio */}
        <div className="cd">
          <div className="ch">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Landmark className="w-4 h-4 text-slate-800" />
              <span className="ct2">Courts &amp; Tribunals</span>
            </div>
            <span className="chip pr">{courtMatters.length} Total</span>
          </div>
          <div className="cb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Supreme Court of India</span>
                <strong style={{ color: 'var(--tx)' }}>{scCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>High Courts</span>
                <strong style={{ color: 'var(--tx)' }}>{hcCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>District &amp; Sessions</span>
                <strong style={{ color: 'var(--tx)' }}>{dcCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Consumer Disputes</span>
                <strong style={{ color: 'var(--tx)' }}>{ccCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Tribunals (NGT, NCLT, ITAT, etc.)</span>
                <strong style={{ color: 'var(--tx)' }}>{triCount}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Practice Performance */}
        <div className="cd">
          <div className="ch">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <Activity className="w-4 h-4 text-emerald-700" />
              <span className="ct2">Practice Metrics</span>
            </div>
            <span className="chip gn">Overview</span>
          </div>
          <div className="cb">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Active Retained Clients</span>
                <strong style={{ color: 'var(--tx)' }}>{clients.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Scheduled Hearings</span>
                <strong style={{ color: 'var(--tx)' }}>{deadlines.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Advocate Work Sessions</span>
                <strong style={{ color: 'var(--tx)' }}>{workLogs.length}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                <span style={{ color: 'var(--tx2)' }}>Billable Hours Logged</span>
                <strong style={{ color: 'var(--gd)', fontWeight: 700 }}>{totalBillableHours.toFixed(1)} hrs</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cause List Section */}
      <div className="cd">
        <div className="ch">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <FileSpreadsheet className="w-4 h-4 text-slate-700" />
            <span className="ct2">Master Cause List &amp; Appearance Summary</span>
          </div>
          <button className="btn btn-p btn-s" onClick={() => printDailyCauseList(deadlines)}>
            <Printer className="w-3.5 h-3.5" />
            <span>Print Cause List</span>
          </button>
        </div>
        <div className="cb" style={{ padding: 0 }}>
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>Date &amp; Time</th>
                  <th>Matter Type</th>
                  <th>Case / Matter Title</th>
                  <th>Venue &amp; Forum</th>
                  <th>Lead Counsel</th>
                  <th style={{ textAlign: 'right' }}>Priority Tier</th>
                </tr>
              </thead>
              <tbody>
                {deadlines.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <strong style={{ color: 'var(--tx)' }}>{d.date}</strong>{' '}
                      <span style={{ color: 'var(--tx2)', fontSize: '0.74rem' }}>{d.time ? `(${d.time})` : ''}</span>
                    </td>
                    <td>
                      <span className="chip pr">{d.type}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--tx)' }}>{d.matterName}</td>
                    <td style={{ color: 'var(--tx2)' }}>{d.venue || '—'}</td>
                    <td style={{ fontWeight: 500 }}>{d.attorney}</td>
                    <td style={{ textAlign: 'right' }}>
                      <span
                        className={`chip ${
                          d.priority === 'ug' ? 'rd' : d.priority === 'wa' ? 'gd' : 'gn'
                        }`}
                        style={{ fontWeight: 600 }}
                      >
                        {d.priority === 'ug' ? 'Urgent' : d.priority === 'wa' ? 'Normal' : 'Routine'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
