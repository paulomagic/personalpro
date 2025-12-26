import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    Wallet,
    CalendarDays,
    BarChart3,
    Dumbbell
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onNavigate: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate }) => {
    const navItems = [
        { id: 'home', icon: LayoutDashboard, label: 'Home' },
        { id: 'calendar', icon: CalendarDays, label: 'Agenda' },
        { id: 'clients', icon: Users, label: 'Alunos' },
        { id: 'finance', icon: Wallet, label: 'Finanças' },
        { id: 'metrics', icon: BarChart3, label: 'Métricas' },
    ];

    return (
        <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden font-sans selection:bg-blue-500/30">

            {/* Main Content Area with Transitions */}
            <div className="pb-28 min-h-screen">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }} // smooth apple-like ease
                    className="h-full"
                >
                    {children}
                </motion.div>
            </div>

            {/* Floating Dock Navigation */}
            <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
                <div className="pointer-events-auto flex items-center gap-2 p-2 rounded-[24px] bg-slate-900/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-blue-500/10 ring-1 ring-white/5">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`relative flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 group
                  ${isActive ? 'bg-blue-600 text-white shadow-glow' : 'text-slate-400 hover:text-white hover:bg-white/5'}
                `}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 bg-blue-600 rounded-2xl -z-10"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <item.icon
                                    size={24}
                                    strokeWidth={isActive ? 2.5 : 2}
                                    className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default Layout;
