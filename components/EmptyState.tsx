import React from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    variant?: 'default' | 'minimal';
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon,
    title,
    description,
    actionLabel,
    onAction,
    variant = 'default'
}) => {
    if (variant === 'minimal') {
        return (
            <div className="py-8 text-center">
                <span className="material-symbols-outlined text-3xl text-slate-600 mb-2 block">{icon}</span>
                <p className="text-slate-500 text-sm">{description}</p>
                {actionLabel && onAction && (
                    <button
                        onClick={onAction}
                        className="mt-3 text-blue-400 text-xs font-bold uppercase tracking-wider hover:text-blue-300"
                    >
                        {actionLabel}
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className="glass-card rounded-3xl p-8 text-center">
            <div className="size-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-slate-500">{icon}</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm mb-6 max-w-xs mx-auto">{description}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors flex items-center gap-2 mx-auto"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
