import React from 'react';
import { FlaskConical } from 'lucide-react';

interface DemoModeNoticeProps {
  title?: string;
  description: string;
  className?: string;
}

const DemoModeNotice: React.FC<DemoModeNoticeProps> = ({
  title = 'Modo demonstração',
  description,
  className = '',
}) => {
  return (
    <div
      className={`mx-5 mb-4 rounded-2xl border border-[rgba(59,130,246,0.16)] bg-[rgba(30,58,138,0.14)] px-4 py-3 text-left shadow-[0_10px_30px_-18px_rgba(30,58,138,0.55)] ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-[rgba(59,130,246,0.18)] bg-[rgba(59,130,246,0.1)]">
          <FlaskConical size={16} className="text-[#7DB4FF]" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#9EC5FF]">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-200">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DemoModeNotice;
