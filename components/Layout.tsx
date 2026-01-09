import React from 'react';
import { motion } from 'framer-motion';
import {
    Home,
    CalendarDays,
    Users,
    User
} from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    onNavigate: (tab: string) => void;
    isStudent?: boolean;  // Hide coach-only features
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, isStudent = false }) => {
    return (
        <div className="relative min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
            <div className="pb-24 min-h-screen">
                {children}
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-50 nav-bar-dark pb-safe">
                <div className="flex justify-between items-end px-6 py-2 pb-5 max-w-md mx-auto relative">

                    <NavButton
                        icon={Home}
                        label="Home"
                        isActive={activeTab === 'home'}
                        onClick={() => onNavigate('home')}
                    />

                    <NavButton
                        icon={CalendarDays}
                        label="Agenda"
                        isActive={activeTab === 'calendar'}
                        onClick={() => onNavigate('calendar')}
                    />

                    {/* Alunos - only for coaches/personal, not students */}
                    {!isStudent && (
                        <NavButton
                            icon={Users}
                            label="Alunos"
                            isActive={activeTab === 'clients'}
                            onClick={() => onNavigate('clients')}
                        />
                    )}

                    <NavButton
                        icon={User}
                        label="Perfil"
                        isActive={activeTab === 'settings'}
                        onClick={() => onNavigate(isStudent ? 'student_profile' : 'settings')}
                    />
                </div>
            </div>
        </div>
    );
};

const NavButton = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-1 w-14 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
    >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "scale-110 transition-transform shadow-glow-sm" : ""} />
        <span className="text-[10px] font-bold tracking-wide">{label}</span>
    </button>
);

export default Layout;
