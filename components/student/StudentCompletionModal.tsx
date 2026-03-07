import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

interface StudentCompletionModalProps {
    show: boolean;
    studentName: string;
    exerciseCount: number;
    totalSets: number;
    onClose: () => void;
}

export default function StudentCompletionModal({
    show,
    studentName,
    exerciseCount,
    totalSets,
    onClose
}: StudentCompletionModalProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-md flex items-center justify-center p-4"
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', bounce: 0.6, delay: 0.2 }}
                            className="size-32 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-2xl shadow-emerald-500/50"
                        >
                            <Trophy size={64} className="text-white" />
                        </motion.div>

                        <motion.h2
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="text-3xl font-black text-white mb-2"
                        >
                            Treino Concluído! 🎉
                        </motion.h2>

                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="text-slate-400 mb-8"
                        >
                            Excelente trabalho, {studentName.split(' ')[0]}!
                        </motion.p>

                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="grid grid-cols-3 gap-4 mb-8"
                        >
                            <div className="bg-white/5 rounded-2xl p-4">
                                <p className="text-2xl font-black text-emerald-400">{exerciseCount}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Exercícios</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4">
                                <p className="text-2xl font-black text-blue-400">{totalSets}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Séries</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4">
                                <div className="flex items-center justify-center gap-1">
                                    <Flame size={20} className="text-orange-400" />
                                    <span className="text-2xl font-black text-orange-400">45</span>
                                </div>
                                <p className="text-[9px] font-black text-slate-500 uppercase">Minutos</p>
                            </div>
                        </motion.div>

                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            onClick={onClose}
                            className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-black rounded-2xl shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
                        >
                            Fechar
                        </motion.button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
