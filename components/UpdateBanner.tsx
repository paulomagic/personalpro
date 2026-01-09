import React from 'react';

interface UpdateBannerProps {
    onUpdate: () => void;
    onDismiss?: () => void;
}

/**
 * Banner fixo no topo da tela notificando que uma nova versão está disponível.
 * Aparece quando o Service Worker detecta uma atualização pendente.
 */
const UpdateBanner: React.FC<UpdateBannerProps> = ({ onUpdate, onDismiss }) => {
    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] animate-slide-down">
            <div className="max-w-md mx-auto">
                <div className="bg-gradient-to-r from-blue-600 to-blue-500 px-4 py-3 shadow-lg">
                    <div className="flex items-center justify-between gap-3">
                        {/* Icon + Message */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                                <span className="material-symbols-rounded text-white text-xl">
                                    system_update
                                </span>
                            </div>
                            <p className="text-white text-sm font-medium truncate">
                                Nova versão disponível!
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                                onClick={onUpdate}
                                className="bg-white text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold 
                         hover:bg-blue-50 active:scale-95 transition-all duration-150
                         shadow-sm"
                            >
                                Atualizar
                            </button>

                            {onDismiss && (
                                <button
                                    onClick={onDismiss}
                                    className="text-white/80 hover:text-white p-1 transition-colors"
                                    aria-label="Fechar"
                                >
                                    <span className="material-symbols-rounded text-lg">close</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateBanner;
