import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Timer as TimerIcon } from 'lucide-react';

interface StudentRestTimerOverlayProps {
    isResting: boolean;
    restTime: number;
    formatTime: (seconds: number) => string;
    onSkip: () => void;
}

export default function StudentRestTimerOverlay({
    isResting,
    restTime,
    formatTime,
    onSkip
}: StudentRestTimerOverlayProps) {
    return (
        <AnimatePresence>
            {isResting && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto"
                >
                    <div className="rounded-[24px] p-6 shadow-2xl bg-[linear-gradient(135deg,#1E3A8A,#3B82F6)] shadow-[0_16px_48px_rgba(30,58,138,0.3)]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="size-12 rounded-full bg-white/20 flex items-center justify-center">
                                    <TimerIcon size={24} className="text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white/70">Descansando...</p>
                                    <p className="text-3xl font-black text-white">{formatTime(restTime)}</p>
                                </div>
                            </div>
                            <button
                                onClick={onSkip}
                                className="size-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                            >
                                <Play size={24} className="ml-1" />
                            </button>
                        </div>
                        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: '100%' }}
                                animate={{ width: '0%' }}
                                transition={{ duration: restTime, ease: 'linear' }}
                                className="h-full bg-white rounded-full"
                            />
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
