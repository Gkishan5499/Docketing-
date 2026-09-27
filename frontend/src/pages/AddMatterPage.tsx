import React from 'react';
import { useLawyersDiary } from '../context/LawyersDiaryContext';
import { Award, Landmark, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CourtType, IprType } from '../types';

const iprTabs: Array<{ type: IprType; label: string }> = [
  { type: 'TM', label: 'Trademark' },
  { type: 'PAT', label: 'Patent' },
  { type: 'COPY', label: 'Copyright' },
  { type: 'DESIGN', label: 'Design' },
  { type: 'GI', label: 'GI Tag' },
];

const courtTabs: Array<{ type: CourtType; label: string }> = [
  { type: 'SC', label: 'Supreme Court' },
  { type: 'HC', label: 'High Court' },
  { type: 'DC', label: 'District Court' },
  { type: 'CC', label: 'Consumer Forum' },
  { type: 'NGT', label: 'NGT' },
  { type: 'NCLT', label: 'NCLT / NCLAT' },
  { type: 'ITAT', label: 'ITAT' },
  { type: 'DRT', label: 'DRT / DRAT' },
  { type: 'CAT', label: 'CAT' },
  { type: 'ARB', label: 'Arbitration' },
];

export const AddMatterPage: React.FC = () => {
  const { openModal } = useLawyersDiary();
  const navigate = useNavigate();

  return (
    <div className="add-matter-page pg on">
      <div className="add-matter-heading">
        <div>
          <button className="btn btn-g btn-s add-matter-back" onClick={() => navigate('/db')}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back to dashboard
          </button>
          <h1>New Matter</h1>
          <p>Choose a practice area to open the complete matter form.</p>
        </div>
      </div>

      <section className="add-matter-section">
        <div className="add-matter-section-heading">
          <Award className="w-5 h-5" />
          <h2>Intellectual Property</h2>
        </div>
        <div className="add-matter-tabs">
          {iprTabs.map(({ type, label }) => (
            <button key={type} className="add-matter-tab" onClick={() => openModal('add-ipr', type)}>
              <span>{type}</span>{label}
            </button>
          ))}
        </div>
      </section>

      <section className="add-matter-section">
        <div className="add-matter-section-heading">
          <Landmark className="w-5 h-5" />
          <h2>Courts &amp; Tribunals</h2>
        </div>
        <div className="add-matter-tabs">
          {courtTabs.map(({ type, label }) => (
            <button key={type} className="add-matter-tab" onClick={() => openModal('add-court', type)}>
              <span>{type}</span>{label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};