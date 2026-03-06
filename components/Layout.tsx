import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Home,
    CalendarDays,
    Users,
    User,
} from 'lucide-react';
import { useTheme } from '../services/ThemeContext';

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

const Layout: React.FC<LayoutProps> = ({
    children,
    activeTab,
    onNavigate,
    isStudent = false,
    pendingRequests = 0,
}) => {
    const { resolvedTheme } = useTheme();
    const isLightTheme = resolvedTheme === 'light';

    const coachNavItems: NavItem[] = [
        { icon: Home, label: 'Home', tab: 'home', action: 'home' },
        { icon: CalendarDays, label: 'Agenda', tab: 'calendar', action: 'calendar' },
        { icon: Users, label: 'Alunos', tab: 'clients', action: 'clients' },
        { icon: User, label: 'Perfil', tab: 'settings', action: 'settings' },
    ];

    const studentNavItems: NavItem[] = [
        { icon: Home, label: 'Home', tab: 'home', action: 'student_home' },
        { icon: CalendarDays, label: 'Agenda', tab: 'calendar', action: 'calendar' },
        { icon: User, label: 'Perfil', tab: 'settings', action: 'student_profile' },
    ];

    const navItems = isStudent ? studentNavItems : coachNavItems;

    return (
        <div className="relative min-h-screen text-white font-sans bg-[var(--bg-void)]">
            {/* Content */}
            <div className="pb-32 min-h-screen relative z-10">
                {children}
            </div>

            {/* Floating Pill Navigation */}
            <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-7 px-6">
                <div
                    className={`flex items-stretch w-full max-w-[320px] rounded-[28px] p-1.5 relative nav-shell ${isLightTheme ? 'nav-shell-light' : 'nav-shell-dark-theme'}`}
                >
                    {navItems.map((item) => {
                        const isActive = activeTab === item.tab;
                        const showBadge = item.tab === 'calendar' && !isStudent && pendingRequests > 0;

                        return (
                            <NavButton
                                key={item.tab}
                                icon={item.icon}
                                label={item.label}
                                isActive={isActive}
                                badge={showBadge ? pendingRequests : 0}
                                isLightTheme={isLightTheme}
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
    isLightTheme: boolean;
}

const NavButton: React.FC<NavButtonProps> = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    badge = 0,
    isLightTheme,
}) => {
    const inactiveIconClassName = isLightTheme ? 'text-[#89AFDF]' : 'text-[#9FC4FF]';
    const inactiveLabelClassName = isLightTheme ? 'text-[#89AFDF]' : 'text-[#C2DAFF]';

    return (
        <button
            onClick={onClick}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-[22px] transition-all duration-300"
        >
            {/* Active pill highlight */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        layoutId="nav-pill"
                        className={`absolute inset-0 rounded-[22px] ${isLightTheme ? 'nav-pill-light' : 'nav-pill-dark'}`}
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85 }}
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    />
                )}
            </AnimatePresence>

            {/* Icon */}
            <div className="relative z-10">
                <motion.div
                    animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -1 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 28 }}
                >
                    <Icon
                        size={21}
                        strokeWidth={isActive ? 2.5 : 1.8}
                        className={`transition-colors duration-200 ${isActive ? 'text-[#5EA2FF]' : inactiveIconClassName}`}
                    />
                </motion.div>

                {/* Badge */}
                {badge > 0 && (
                    <span
                        aria-hidden="true"
                        className="absolute -top-1.5 -right-1.5 min-w-[15px] h-[15px] px-0.5 rounded-full text-[8px] font-black flex items-center justify-center text-white bg-[#FF3366] shadow-[0_0_8px_rgba(255,51,102,0.5)]"
                    >
                        {badge > 9 ? '9+' : badge}
                    </span>
                )}
            </div>

            {/* Label */}
            <motion.span
                animate={{ opacity: isActive ? 1 : 0.9 }}
                transition={{ duration: 0.2 }}
                className={`relative z-10 text-[10px] font-bold tracking-wide ${isActive ? 'text-[#5EA2FF]' : inactiveLabelClassName}`}
            >
                {label}
            </motion.span>

            {/* Active dot */}
            {isActive && (
                <motion.div
                    layoutId="nav-dot"
                    className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#5EA2FF] shadow-[0_0_6px_#5EA2FF]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                />
            )}
        </button>
    );
};

export default Layout;
