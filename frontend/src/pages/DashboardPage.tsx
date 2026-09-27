import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { dDiff, MSS, bTy, bSt, aDot, printDailyCauseList } from '../utils/helpers';
import { DocketEvent } from '../types';
import {
  Users,
  Award,
  Scale,
  Landmark,
  Calendar,
  FolderOpen,
  Printer,
  Plus,
  ArrowUpRight,
  Clock,
  Layers,
  FileText,
  Shield,
  Activity,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    currentUser,
    clients,
    iprMatters,
    courtMatters,
    deadlines,
    documents,
    activities,
    openModal,
  } = useLawyersDiary();

  const [deadlineFilter, setDeadlineFilter] = useState<'all' | 'urgent' | '14d'>('all');

  const now = new Date();
  const hr = now.getHours();
  const greeting = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  const namePart = (currentUser || 'Advocate').split(' ')[0];

  const urgentDeadlines = deadlines.filter((d) => {
    const diff = dDiff(d.date);
    return diff !== null && diff >= 0 && diff <= 7;
  });

  const activeMattersCount =
    iprMatters.filter((m) => !['Registered', 'Abandoned', 'Refused'].includes(m.status)).length +
    courtMatters.filter((r) => !['Decided', 'Dismissed', 'Allowed'].includes(r.stage)).length;

  const totalEnrolled = iprMatters.length + courtMatters.length;

  const dateSub = `${now.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })}`;

  const hearingsNext14Days = deadlines.filter((d) => {
    const diff = dDiff(d.date);
    return diff !== null && diff >= 0 && diff <= 14;
  }).length;

  const stats = [
    {
      c: 'pr',
      v: activeMattersCount,
      l: 'Active Matters',
      s: `${totalEnrolled} total enrolled`,
      pct: totalEnrolled > 0 ? Math.round((activeMattersCount / totalEnrolled) * 100) : 0,
      trd: 'Active',
      Icon: Scale,
      path: '/dkt',
    },
    {
      c: 'rd',
      v: hearingsNext14Days,
      l: 'Upcoming Hearings',
      s: 'Next 14 calendar days',
      pct: deadlines.length > 0 ? Math.round((hearingsNext14Days / Math.max(deadlines.length, 1)) * 100) : 0,
      trd: `${urgentDeadlines.length} Urgent`,
      Icon: Calendar,
      path: '/dkt',
    },
    {
      c: 'gd',
      v: iprMatters.length,
      l: 'IPR Portfolio',
      s: 'TM, Patent, CR, Design, GI',
      pct: totalEnrolled > 0 ? Math.round((iprMatters.length / totalEnrolled) * 100) : 0,
      trd: 'IP Practice',
      Icon: Award,
      path: '/tm',
    },
    {
      c: 'sl',
      v: courtMatters.length,
      l: 'Court & Tribunal Cases',
      s: 'SC, HC, DC & 6 Tribunals',
      pct: totalEnrolled > 0 ? Math.round((courtMatters.length / totalEnrolled) * 100) : 0,
      trd: 'Litigation',
      Icon: Landmark,
      path: '/sc',
    },
    {
      c: 'pr',
      v: clients.length,
      l: 'Retained Clients',
      s: 'Corporate & Individual',
      pct: 100,
      trd: 'Retainers',
      Icon: Users,
      path: '/clients',
    },
    {
      c: 'gn',
      v: documents.length,
      l: 'Vault Documents',
      s: 'Synced with Document Vault',
      pct: 100,
      trd: 'Cloud Sync',
      Icon: FolderOpen,
      path: '/docs',
    },
  ];

  const sortedDeadlines = [...deadlines]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .filter((d) => {
      const diff = dDiff(d.date);
      if (deadlineFilter === 'urgent') return diff !== null && diff >= 0 && diff <= 7;
      if (deadlineFilter === '14d') return diff !== null && diff >= 0 && diff <= 14;
      return true;
    })
    .slice(0, 7);

  const portfolioItems = [
    { k: 'TM', l: 'Trademark', count: iprMatters.filter((m) => m.type === 'TM').length, path: '/tm' },
    { k: 'PAT', l: 'Patent', count: iprMatters.filter((m) => m.type === 'PAT').length, path: '/pt' },
    { k: 'COPY', l: 'Copyright', count: iprMatters.filter((m) => m.type === 'COPY').length, path: '/cp' },
    { k: 'DESIGN', l: 'Design', count: iprMatters.filter((m) => m.type === 'DESIGN').length, path: '/ds' },
    { k: 'GI', l: 'GI Tag', count: iprMatters.filter((m) => m.type === 'GI').length, path: '/gi' },
    { k: 'SC', l: 'Supreme Ct.', count: courtMatters.filter((r) => r.type === 'SC').length, path: '/sc' },
    { k: 'HC', l: 'High Court', count: courtMatters.filter((r) => r.type === 'HC').length, path: '/hc' },
    { k: 'DC', l: 'District Ct.', count: courtMatters.filter((r) => r.type === 'DC').length, path: '/dc' },
    { k: 'CC', l: 'Consumer', count: courtMatters.filter((r) => r.type === 'CC').length, path: '/cc' },
    { k: 'NGT', l: 'NGT', count: courtMatters.filter((r) => r.type === 'NGT').length, path: '/ngt' },
    { k: 'NCLT', l: 'NCLT/NCLAT', count: courtMatters.filter((r) => r.type === 'NCLT').length, path: '/nclt' },
    { k: 'ARB', l: 'Arbitration', count: courtMatters.filter((r) => r.type === 'ARB').length, path: '/arb' },
  ];

  const maxPortfolioCount = Math.max(...portfolioItems.map((p) => p.count), 1);

  const allRecentMatters = [
    ...iprMatters.map((m) => ({ ...m, _title: m.mark, _status: m.status, _no: m.appNo, _src: 'ipr' as const })),
    ...courtMatters.map((r) => ({ ...r, _title: r.caseTitle, _status: r.stage, _no: r.caseNo, _src: 'court' as const })),
  ]
    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
    .slice(0, 6);

  const renderDeadlineRow = (d: DocketEvent) => {
    const dt = new Date(d.date);
    const diff = dDiff(d.date);
    const pc = d.priority === 'ug' ? 'ug' : d.priority === 'wa' ? 'wa' : 'ok';
    const isUrgent = diff !== null && diff >= 0 && diff <= 3;
    const isOverdue = diff !== null && diff < 0;

    const lbl =
      diff === null
        ? '—'
        : diff === 0
        ? 'TODAY'
        : diff === 1
        ? 'Tomorrow'
        : isOverdue
        ? 'OVERDUE'
        : `${diff} days`;

    const dc = isUrgent || isOverdue ? 'du' : diff !== null && diff <= 14 ? 'dw' : 'dok';

    return (
      <div
        key={d.id}
        className={`di ${pc} group relative transition-all duration-150 hover:border-slate-300`}
        onClick={() => {
          if (d.matterId) openModal('matter-detail', d.matterId);
        }}
      >
        <div className="dbox">
          <div className="dday">{dt.getDate()}</div>
          <div className="dmon">{MSS[dt.getMonth()]}</div>
        </div>
        <div className="dinfo">
          <div className="flex items-center gap-2">
            {(isUrgent || isOverdue) && <span className="urgency-pulse" title="Urgent Action Required" />}
            <span className={`bg2 ${bTy(d.type)} text-[0.65rem]`}>{d.type}</span>
            <div className="dtitle text-slate-900 group-hover:text-[var(--pr)]">
              {d.matterName}
            </div>
          </div>
          <div className="dsub">
            <span className="font-semibold text-slate-700">{d.attorney}</span>
            {d.venue ? ` · ${d.venue}` : ''}
            {d.notes ? ` · ${d.notes.substring(0, 45)}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`ddys ${dc}`}>{lbl}</span>
          <ChevronRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    );
  };

  return (
    <div className="pg on">
      {/* Executive Hero Banner */}
      <div className="dash-hero">
        <div className="dash-hero-top">
          <div>
            <h1 id="dh-g" className="dash-hero-title">
              {`${greeting}, Counsel ${namePart}`}
            </h1>
            <p id="dh-d" className="dash-hero-sub">
              <span>{dateSub}</span>
              <span>·</span>
              <span className="font-medium text-amber-300">
                {urgentDeadlines.length} high-priority hearing(s) this week
              </span>
            </p>
          </div>
          <div className="dash-hero-actions">
            <button
              className="btn btn-o btn-s border-white/20 text-slate-800 bg-white hover:bg-slate-100 shadow-sm"
              onClick={() => printDailyCauseList(deadlines)}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Daily Cause List</span>
            </button>
            <button
              className="btn btn-gold btn-s shadow-md"
              onClick={() => openModal('add-ipr', 'TM')}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Docket File</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Status Bar inside Hero */}
        <div className="dash-quick-pills">
          <div className="dash-pill gold">
            <span className="urgency-pulse" />
            <span>{urgentDeadlines.length} Urgent Deadlines</span>
          </div>
          <div className="dash-pill">
            <Activity className="w-3.5 h-3.5 text-blue-300" />
            <span>{activeMattersCount} Active Matters Pending</span>
          </div>
          <div className="dash-pill">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{documents.length} Vault Documents Synced</span>
          </div>
          <div className="dash-pill cursor-pointer" onClick={() => navigate('/dkt')}>
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>{hearingsNext14Days} Hearings Next 14 Days</span>
          </div>
        </div>
      </div>

      {/* Metric Stat Cards Grid */}
      <div className="sg" id="dh-st">
        {stats.map((s, idx) => (
          <div
            key={idx}
            className={`st ${s.c} clickable`}
            onClick={() => navigate(s.path)}
          >
            <div>
              <div className="st-top">
                <div className="sl">{s.l}</div>
                <div className="si">
                  <s.Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="sv">{s.v}</div>
            </div>

            <div>
              <div className="ss">
                <span>{s.s}</span>
                <span className="st-trd">{s.trd}</span>
              </div>
              <div className="st-pbar">
                <div
                  className="st-pbar-fill"
                  style={{ width: `${s.pct}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Dashboard Grid */}
      <div className="dash-grid">
        {/* Upcoming Hearings & Deadlines */}
        <div className="cd span2">
          <div className="ch">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[var(--pr)]" />
              <span className="ct2">Upcoming Court Hearings &amp; Statutory Deadlines</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="dl-filter-bar">
                <button
                  className={`dl-filter-btn ${deadlineFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setDeadlineFilter('all')}
                >
                  All ({deadlines.length})
                </button>
                <button
                  className={`dl-filter-btn ${deadlineFilter === 'urgent' ? 'active' : ''}`}
                  onClick={() => setDeadlineFilter('urgent')}
                >
                  Urgent (≤7d)
                </button>
                <button
                  className={`dl-filter-btn ${deadlineFilter === '14d' ? 'active' : ''}`}
                  onClick={() => setDeadlineFilter('14d')}
                >
                  Next 14d
                </button>
              </div>
              <button className="btn btn-g btn-s" onClick={() => navigate('/dkt')}>
                <span>Open Calendar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="cb" id="dh-dl">
            {sortedDeadlines.length > 0 ? (
              <div className="dl2">{sortedDeadlines.map(renderDeadlineRow)}</div>
            ) : (
              <div className="em">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-600 font-medium">No deadlines match the selected filter.</p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Activity */}
        <div className="cd">
          <div className="ch">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-[var(--pr)]" />
              <span className="ct2">Audit Activity</span>
            </div>
            <button className="btn btn-g btn-s" onClick={() => navigate('/aud')}>
              Audit Trail →
            </button>
          </div>
          <div className="cb" id="dh-ac">
            {activities.slice(0, 6).map((a) => (
              <div key={a.id} className="ai">
                <div
                  className="ado"
                  style={{ background: aDot(a.color) }}
                />
                <div
                  className="at"
                  dangerouslySetInnerHTML={{ __html: a.text }}
                />
                <div className="atm">{a.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Practice Area Breakdown */}
        <div className="cd span2">
          <div className="ch">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--pr)]" />
              <span className="ct2">Practice Area Matrix</span>
            </div>
            <button className="btn btn-g btn-s" onClick={() => navigate('/rpt')}>
              Full Analytics →
            </button>
          </div>
          <div className="cb" id="dh-po">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {portfolioItems.map((p) => {
                const pct = Math.round((p.count / maxPortfolioCount) * 100);
                return (
                  <div
                    key={p.k}
                    className="po-item group hover:border-[var(--pr-border)]"
                    onClick={() => navigate(p.path)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`bg2 ${bTy(p.k)}`}>
                        {p.k}
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[var(--pr)] transition-colors" />
                    </div>
                    <div className="po-n text-[var(--pr)] my-1">
                      {p.count}
                    </div>
                    <div className="po-l text-[var(--tx2)] truncate">
                      {p.l}
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-[var(--pr)] rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(pct, p.count > 0 ? 15 : 0)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent Matters */}
        <div className="cd">
          <div className="ch">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--pr)]" />
              <span className="ct2">Recent Matters</span>
            </div>
          </div>
          <div id="dh-rm" className="p-0">
            {allRecentMatters.map((m) => (
              <div
                key={m.id}
                className="flex cursor-pointer items-center gap-3 border-b border-[var(--bd)] px-4 py-3 transition-colors hover:bg-slate-50 group"
                onClick={() => openModal('matter-detail', m.id)}
              >
                <span className={`bg2 ${bTy(m.type)}`}>{m.type}</span>
                <div className="min-w-0 flex-1">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.82rem] font-semibold text-[var(--tx)] group-hover:text-[var(--pr)]">
                    {m._title}
                  </div>
                  <div className="flex items-center gap-1.5 text-[0.72rem] text-[var(--tx2)]">
                    <span className="tm text-[0.7rem]">{m._no}</span>
                    <span>·</span>
                    <span className="truncate">{m.clientName}</span>
                  </div>
                </div>
                <span className={`bg2 ${bSt(m._status)}`}>
                  {m._status || ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
