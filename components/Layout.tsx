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
    pendingRequests?: number;  // Number of pending reschedule requests
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, isStudent = false, pendingRequests = 0 }) => {
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
                        badge={!isStudent ? pendingRequests : 0}  // Only show badge for coaches
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

const NavButton = ({ icon: Icon, label, isActive, onClick, badge = 0 }: any) => (
    <button
        onClick={onClick}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className={`relative flex flex-col items-center justify-center gap-1 w-14 h-14 transition-colors ${isActive ? 'text-blue-500' : 'text-slate-400 hover:text-slate-300'}`}
    >
        <div className="relative">
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "scale-110 transition-transform shadow-glow-sm" : ""} />
            {/* Notification Badge */}
            {badge > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-lg animate-pulse" aria-hidden="true">
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>
        <span className="text-xs font-bold tracking-wide">{label}</span>
    </button>
);

export default Layout;
