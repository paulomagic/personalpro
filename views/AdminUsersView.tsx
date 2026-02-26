import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Search, UserPlus, Mail, Phone, MoreVertical, Shield } from 'lucide-react';

interface AdminUsersViewProps {
    onBack: () => void;
}

// Placeholder data - in production would come from Supabase
const mockUsers = [
    { id: '1', name: 'Paulo Ricardo', email: 'paulo@personalpro.com', role: 'admin', status: 'active', lastLogin: '2024-12-28 16:00' },
];

const AdminUsersView: React.FC<AdminUsersViewProps> = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [users] = useState(mockUsers);

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="size-10 rounded-full glass-card flex items-center justify-center hover:bg-white/10 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <Users size={20} className="text-blue-400" />
                                Gestão de Usuários
                            </h1>
                            <p className="text-xs text-slate-500">{users.length} usuário(s)</p>
                        </div>
                    </div>
                    <button className="size-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors">
                        <UserPlus size={18} />
                    </button>
                </div>
            </header>

            {/* Search */}
            <div className="px-6 py-4">
                <div className="glass-card rounded-xl flex items-center gap-3 px-4 py-3">
                    <Search size={18} className="text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar usuário..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-sm placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* Users List */}
            <main className="px-6 pb-6 space-y-3">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                        <Users size={48} className="mx-auto mb-4 opacity-30" />
                        <p>Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    filteredUsers.map((user, idx) => (
                        <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass-card rounded-xl p-4"
                        >
                            <div className="flex items-start gap-4">
                                {/* Avatar */}
                                <div className="size-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
                                    {user.name.charAt(0)}
                                </div>

                                {/* Info */}
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold">{user.name}</h3>
                                        {user.role === 'admin' && (
                                            <span className="flex items-center gap-1 text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                                                <Shield size={10} />
                                                Admin
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            <Mail size={12} />
                                            {user.email}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {user.status === 'active' ? '● Ativo' : '● Inativo'}
                                        </span>
                                        <span className="text-[10px] text-slate-600">
                                            Último login: {user.lastLogin}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <button className="size-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors">
                                    <MoreVertical size={16} className="text-slate-500" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}

                {/* Add User Card */}
                <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="w-full glass-card rounded-xl p-6 border-2 border-dashed border-white/10 hover:border-blue-500/30 transition-colors text-center group"
                >
                    <div className="size-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/20 transition-colors">
                        <UserPlus size={24} className="text-blue-400" />
                    </div>
                    <p className="font-bold text-slate-400 group-hover:text-white transition-colors">Adicionar Personal Trainer</p>
                    <p className="text-xs text-slate-600 mt-1">Convite por email</p>
                </motion.button>
            </main>
        </div>
    );
};

export default AdminUsersView;
