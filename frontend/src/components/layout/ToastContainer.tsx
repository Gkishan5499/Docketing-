import React from 'react';
import { useLawyersDiary } from '../../context/LawyersDiaryContext';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts } = useLawyersDiary();

  if (toasts.length === 0) return null;

  return (
    <div id="tw">
      {toasts.map((toast) => (
        <div key={toast.id} className={`tos ${toast.type}`}>
          <span className="shrink-0">
            {toast.type === 'ok' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {toast.type === 'er' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {toast.type === 'in' && <Info className="w-4 h-4 text-amber-300" />}
          </span>
          <span className="text-[0.82rem] font-medium">{toast.text}</span>
        </div>
      ))}
    </div>
  );
};
