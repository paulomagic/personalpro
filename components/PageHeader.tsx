import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    onBack?: () => void;
    rightSlot?: React.ReactNode;
    /** Adiciona um gradiente de topo sutil com a cor do tema */
    accentColor?: 'cyan' | 'blue' | 'green' | 'amber' | 'red';
}

const accentMap: Record<string, { glowClass: string; textClass: string; borderClass: string }> = {
    cyan: { glowClass: 'page-header-glow-cyan', textClass: 'text-[#3B82F6]', borderClass: 'border-[rgba(59,130,246,0.15)]' },
    blue: { glowClass: 'page-header-glow-blue', textClass: 'text-[#0099FF]', borderClass: 'border-[rgba(30,58,138,0.15)]' },
    green: { glowClass: 'page-header-glow-green', textClass: 'text-[#00FF88]', borderClass: 'border-[rgba(0,255,136,0.12)]' },
    amber: { glowClass: 'page-header-glow-amber', textClass: 'text-[#FFB800]', borderClass: 'border-[rgba(255,184,0,0.15)]' },
    red: { glowClass: 'page-header-glow-red', textClass: 'text-[#FF3366]', borderClass: 'border-[rgba(255,51,102,0.12)]' },
};

/**
 * PageHeader — cabeçalho premium compartilhado por todas as telas internas.
 * Responsável pela consistência visual AI-first em todo o app.
 */
const PageHeader: React.FC<PageHeaderProps> = ({
    title,
    subtitle,
    onBack,
    rightSlot,
    accentColor = 'cyan',
}) => {
    const accent = accentMap[accentColor] ?? accentMap.cyan;

    return (
        <motion.header
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="px-5 pt-14 pb-5 relative z-20"
        >
            {/* Top glow bar */}
            <div className={`absolute top-0 left-0 right-0 h-32 pointer-events-none ${accent.glowClass}`} />

            <div className="flex items-center justify-between relative z-10">
                {/* Back button */}
                {onBack ? (
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className={`size-11 rounded-2xl flex items-center justify-center transition-all shrink-0 bg-[rgba(59,130,246,0.05)] border ${accent.borderClass}`}
                        aria-label="Voltar"
                    >
                        <ArrowLeft size={18} className={accent.textClass} strokeWidth={2.5} />
                    </motion.button>
                ) : (
                    <div className="size-11" />
                )}

                {/* Title block */}
                <div className="flex-1 text-center px-3">
                    <h1 className="text-[17px] font-black text-white tracking-tight leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className={`text-[10px] font-black uppercase tracking-[0.15em] mt-0.5 ${accent.textClass}`}>
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Right slot (actions) */}
                <div className="flex items-center gap-2 shrink-0 min-w-[44px] justify-end">
                    {rightSlot ?? <div className="size-11" />}
                </div>
            </div>
        </motion.header>
    );
};

export default PageHeader;
