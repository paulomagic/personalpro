import React from 'react';
import { CheckCircle, Dumbbell } from 'lucide-react';

interface ClientProfileStatsCardsProps {
  adherence: number;
  completedClasses?: number;
  totalClasses?: number;
}

const ClientProfileStatsCards: React.FC<ClientProfileStatsCardsProps> = ({
  adherence,
  completedClasses = 0,
  totalClasses = 0
}) => {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
        <div className="size-10 rounded-[12px] bg-cyan-500/10 flex items-center justify-center mx-auto mb-3 border border-cyan-500/20">
          <CheckCircle size={18} className="text-cyan-400" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">{adherence}<span className="text-sm text-slate-500 ml-1">%</span></p>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Aderência</p>
        {adherence >= 80 && (
          <div className="absolute bottom-0 left-0 right-0 bg-emerald-500/10 text-emerald-400 text-[9px] py-1 font-black tracking-widest uppercase">Excelente</div>
        )}
      </div>

      <div className="glass-card p-5 text-center rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all" />
        <div className="size-10 rounded-[12px] bg-blue-500/10 flex items-center justify-center mx-auto mb-3 border border-blue-500/20">
          <Dumbbell size={18} className="text-blue-400" />
        </div>
        <p className="text-3xl font-black text-white tracking-tight">{completedClasses}<span className="text-sm font-black text-slate-500 ml-1">/{totalClasses}</span></p>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">Treinos</p>
      </div>
    </div>
  );
};

export default ClientProfileStatsCards;
