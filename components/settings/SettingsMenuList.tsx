import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface SettingsMenuItem {
  icon: React.ElementType;
  label: string;
  subtitle: string;
  action: () => void;
  chipClassName: string;
  iconClassName: string;
}

interface SettingsMenuListProps {
  items: SettingsMenuItem[];
}

export default function SettingsMenuList({ items }: SettingsMenuListProps) {
  return (
    <div className="px-5 space-y-2">
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.action}
          className="w-full rounded-2xl p-4 flex items-center gap-4 active:scale-[0.98] transition-all text-left group bg-[rgba(59,130,246,0.03)] border border-[rgba(59,130,246,0.06)]"
        >
          <div className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${item.chipClassName}`}>
            <item.icon size={17} className={item.iconClassName} />
          </div>
          <div className="flex-1">
            <h4 className="font-black text-white text-sm tracking-tight">{item.label}</h4>
            <p className="text-[9px] font-bold uppercase tracking-widest mt-0.5 text-[#B8D3FF]">{item.subtitle}</p>
          </div>
          <ChevronRight size={14} className="text-[#A9CAFF]" />
        </button>
      ))}
    </div>
  );
}
