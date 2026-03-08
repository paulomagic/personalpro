import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
    // Prevent scrolling when open
    useEffect(() => {
        if (isOpen) {
            document.body.classList.add('body-lock-scroll');
        } else {
            document.body.classList.remove('body-lock-scroll');
        }
        return () => {
            document.body.classList.remove('body-lock-scroll');
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        drag="y"
                        dragConstraints={{ top: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, { offset, velocity }) => {
                            if (offset.y > 100 || velocity.y > 500) {
                                onClose();
                            }
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label={title || 'Painel'}
                        className="fixed bottom-0 left-0 right-0 z-[70] border-t border-white/10 rounded-t-[32px] overflow-hidden shadow-2xl safe-area-bottom w-full max-w-md mx-auto bg-[var(--bg-surface)]"
                    >
                        {/* Drag Handle */}
                        <div className="w-full flex justify-center py-4 cursor-grab active:cursor-grabbing">
                            <div className="w-12 h-1.5 rounded-full bg-slate-700" />
                        </div>

                        {title && (
                            <div className="px-6 pb-2 text-center">
                                <h3 className="text-xl font-display font-black text-white">{title}</h3>
                            </div>
                        )}

                        <div className="px-6 pb-[calc(11rem+env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto custom-scrollbar">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
