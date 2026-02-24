import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    isStudent?: boolean;
    pendingRequests?: number;
}

interface NavItem {
    icon: React.ElementType;
    label: string;
    tab: string;
    action: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onNavigate, isStudent = false, pendingRequests = 0 }) => {
    const coachNavItems: NavItem[] = [
        { icon: Home, label: 'Home', tab: 'home', action: 'home' },
        { icon: CalendarDays, label: 'Agenda', tab: 'calendar', action: 'calendar' },
        { icon: Users, label: 'Alunos', tab: 'clients', action: 'clients' },
        { icon: User, label: 'Perfil', tab: 'settings', action: 'settings' },
    ];

    const studentNavItems: NavItem[] = [
        { icon: Home, label: 'Home', tab: 'student_home', action: 'student_home' },
        { icon: CalendarDays, label: 'Agenda', tab: 'calendar', action: 'calendar' },
        { icon: User, label: 'Perfil', tab: 'settings', action: 'student_profile' },
    ];

    const navItems = isStudent ? studentNavItems : coachNavItems;

    return (
        <div className="relative min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
            <div className="pb-28 min-h-screen">
                {children}
            </div>

            {/* Bottom Navigation - Floating Pill Design */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-6 px-4">
                <div
                    className="flex items-center gap-1 px-3 py-2.5 rounded-[28px] max-w-xs w-full"
                    style={{
                        background: 'rgba(15, 23, 42, 0.92)',
                        backdropFilter: 'blur(24px)',
                        WebkitBackdropFilter: 'blur(24px)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        boxShadow: '0 -4px 60px rgba(0,0,0,0.5), 0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                >
                    {navItems.map((item) => {
                        const isActive = activeTab === item.tab ||
                            (item.tab === 'student_home' && activeTab === 'home');
                        const showBadge = item.tab === 'calendar' && !isStudent && pendingRequests > 0;

                        return (
                            <NavButton
                                key={item.tab}
                                icon={item.icon}
                                label={item.label}
                                isActive={isActive}
                                badge={showBadge ? pendingRequests : 0}
                                onClick={() => onNavigate(item.action)}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface NavButtonProps {
    icon: React.ElementType;
    label: string;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
}

const NavButton: React.FC<NavButtonProps> = ({ icon: Icon, label, isActive, onClick, badge = 0 }) => (
    <button
        onClick={onClick}
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
        className="relative flex-1 flex flex-col items-center justify-center gap-1 py-1 rounded-2xl transition-all duration-300 group"
    >
        {/* Active background pill */}
        <AnimatePresence>
            {isActive && (
                <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-0 rounded-2xl"
                    style={{
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                        border: '1px solid rgba(59,130,246,0.2)',
                    }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
            )}
        </AnimatePresence>

        {/* Icon container */}
        <div className="relative z-10">
            <motion.div
                animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
                <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.75}
                    className={`transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-400'}`}
                />
            </motion.div>

            {/* Notification Badge */}
            {badge > 0 && (
                <span
                    className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full text-[9px] font-black text-white flex items-center justify-center shadow-lg shadow-red-500/40 animate-pulse"
                    aria-hidden="true"
                >
                    {badge > 9 ? '9+' : badge}
                </span>
            )}
        </div>

        {/* Label */}
        <motion.span
            animate={{ opacity: isActive ? 1 : 0.5 }}
            className={`relative z-10 text-[10px] font-bold tracking-wide transition-colors duration-300 ${isActive ? 'text-blue-400' : 'text-slate-500'}`}
        >
            {label}
        </motion.span>

        {/* Active dot indicator */}
        {isActive && (
            <motion.div
                layoutId="nav-dot"
                className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-blue-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
            />
        )}
    </button>
);

export default Layout;
