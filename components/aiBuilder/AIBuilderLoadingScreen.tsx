import React from 'react';

interface AIBuilderLoadingScreenProps {
    messages: string[];
    loadingMessageIndex: number;
}

const AIBuilderLoadingScreen: React.FC<AIBuilderLoadingScreenProps> = ({
    messages,
    loadingMessageIndex
}) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-void)]">
            <div className="w-full max-w-md h-full flex flex-col items-center justify-center p-8 overflow-hidden relative bg-[var(--bg-void)]">
                <div className="absolute inset-0 opacity-40">
                    <div className="absolute top-1/4 left-1/4 size-64 rounded-full blur-[100px] animate-pulse bg-[#1E3A8A]"></div>
                    <div className="absolute bottom-1/4 right-1/4 size-64 rounded-full blur-[100px] animate-pulse delay-1000 bg-[#3B82F6]"></div>
                </div>

                <div className="relative z-10 text-center flex flex-col items-center">
                    <div className="size-24 rounded-[32px] flex items-center justify-center mb-10 animate-bounce bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_0_60px_rgba(30,58,138,0.5)]">
                        <span className="material-symbols-outlined text-white text-[48px]">psychology</span>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-4 tracking-tight">PersonalPro IA</h2>
                    <div className="h-6 overflow-hidden">
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-[#3B82F6]">
                            {messages[loadingMessageIndex]}
                        </p>
                    </div>

                    <div className="mt-12 w-64 h-1.5 rounded-full overflow-hidden bg-[rgba(59,130,246,0.1)]">
                        <svg viewBox="0 0 100 6" preserveAspectRatio="none" className="h-full w-full rounded-full">
                            <defs>
                                <linearGradient id="ai-builder-loading-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#1E3A8A" />
                                    <stop offset="100%" stopColor="#3B82F6" />
                                </linearGradient>
                            </defs>
                            <rect x="0" y="0" width={(loadingMessageIndex + 1) * 20} height="6" rx="3" fill="url(#ai-builder-loading-gradient)" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIBuilderLoadingScreen;
