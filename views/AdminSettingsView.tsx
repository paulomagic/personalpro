import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Settings, Shield, Bell, Zap, Database, Clock } from 'lucide-react';

interface AdminSettingsViewProps {
    onBack: () => void;
}

const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({ onBack }) => {
    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                            <Settings size={20} className="text-slate-400" />
                            Configurações
                        </h1>
                        <p className="text-xs text-slate-500">Preferências do sistema</p>
                    </div>
                </div>
            </header>

            <main className="px-6 py-6 space-y-6">
                {/* AI Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Zap size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h2 className="font-bold">Inteligência Artificial</h2>
                            <p className="text-xs text-slate-500">Configurações de IA Gemini</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Modelo Primário</span>
                            <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-lg">gemini-2.5-flash</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Modelo Fallback</span>
                            <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded-lg">gemini-2.5-flash-lite</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">Logs Detalhados</span>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-emerald-400 animate-pulse" />
                                <span className="text-xs text-emerald-400">Ativo</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Security */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="glass-card rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                            <Shield size={20} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="font-bold">Segurança</h2>
                            <p className="text-xs text-slate-500">Autenticação e permissões</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Tipo de Conta</span>
                            <span className="text-sm bg-amber-500/20 text-amber-400 px-3 py-1 rounded-lg">Admin</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Autenticação</span>
                            <span className="text-sm text-slate-300">Supabase Auth</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">RLS Ativo</span>
                            <div className="flex items-center gap-2">
                                <div className="size-3 rounded-full bg-emerald-400" />
                                <span className="text-xs text-emerald-400">Sim</span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Data Management */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass-card rounded-2xl p-5"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Database size={20} className="text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="font-bold">Banco de Dados</h2>
                            <p className="text-xs text-slate-500">Supabase PostgreSQL</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Tabela ai_logs</span>
                            <span className="text-xs text-emerald-400">✓ Criada</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                            <span className="text-sm text-slate-400">Tabela activity_logs</span>
                            <span className="text-xs text-emerald-400">✓ Criada</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-sm text-slate-400">Índices</span>
                            <span className="text-xs text-emerald-400">✓ Otimizados</span>
                        </div>
                    </div>
                </motion.div>

                {/* Info Footer */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-center text-xs text-slate-600 py-4"
                >
                    <p>Apex Ultra v2.0.0</p>
                    <p className="mt-1">PersonalPro © 2024</p>
                </motion.div>
            </main>
        </div>
    );
};

export default AdminSettingsView;
