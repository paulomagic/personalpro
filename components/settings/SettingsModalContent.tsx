import React from 'react';
import SettingsProfileModal from './SettingsProfileModal';
import SettingsNotificationsModal from './SettingsNotificationsModal';
import SettingsSecurityModal from './SettingsSecurityModal';
import SettingsHelpModal from './SettingsHelpModal';
import SettingsAppearanceModal from './SettingsAppearanceModal';
import SettingsPrivacyModal from './SettingsPrivacyModal';
import type { ThemeMode } from '../../services/ThemeContext';
import { isPushSupported, type NotificationPrefs } from '../../services/pushNotifications';
import type { PrivacyRequestSummary } from '../../services/privacyService';

export type SettingsModalType = 'profile' | 'notifications' | 'security' | 'help' | 'appearance' | 'privacy' | null;

interface SettingsModalContentProps {
    activeModal: SettingsModalType;
    coachAvatar: string;
    coachName: string;
    profileName: string;
    coachEmail: string;
    saving: boolean;
    notifState: NotificationPrefs;
    sendingTestPush: boolean;
    isDemo: boolean;
    newPassword: string;
    confirmPassword: string;
    securitySaving: boolean;
    pendingTheme: ThemeMode;
    privacyRequests: PrivacyRequestSummary[];
    privacyLoading: boolean;
    onProfileNameChange: (value: string) => void;
    onSaveProfile: () => void;
    onToggleNotif: (key: keyof NotificationPrefs) => void;
    onSendTestPush: () => void;
    onSaveNotifications: () => void;
    onNewPasswordChange: (value: string) => void;
    onConfirmPasswordChange: (value: string) => void;
    onSaveSecurity: () => void;
    onContactSupport: () => void;
    onThemeChange: (value: ThemeMode) => void;
    onApplyTheme: () => void;
    onExportPrivacy: () => void;
    onRequestDelete: () => void;
    onRequestAccess: () => void;
    onRequestRectify: () => void;
    onCancelRequest: (requestId: string) => void;
}

const SettingsModalContent: React.FC<SettingsModalContentProps> = ({
    activeModal,
    coachAvatar,
    coachName,
    profileName,
    coachEmail,
    saving,
    notifState,
    sendingTestPush,
    isDemo,
    newPassword,
    confirmPassword,
    securitySaving,
    pendingTheme,
    privacyRequests,
    privacyLoading,
    onProfileNameChange,
    onSaveProfile,
    onToggleNotif,
    onSendTestPush,
    onSaveNotifications,
    onNewPasswordChange,
    onConfirmPasswordChange,
    onSaveSecurity,
    onContactSupport,
    onThemeChange,
    onApplyTheme,
    onExportPrivacy,
    onRequestDelete,
    onRequestAccess,
    onRequestRectify,
    onCancelRequest
}) => {
    if (activeModal === 'profile') {
        return (
            <SettingsProfileModal
                coachAvatar={coachAvatar}
                coachName={coachName}
                profileName={profileName}
                coachEmail={coachEmail}
                saving={saving}
                onProfileNameChange={onProfileNameChange}
                onSave={onSaveProfile}
            />
        );
    }

    if (activeModal === 'notifications') {
        return (
            <SettingsNotificationsModal
                isPushAvailable={isPushSupported()}
                notifState={notifState}
                sendingTestPush={sendingTestPush}
                isDemo={isDemo}
                onToggle={onToggleNotif}
                onSendTestPush={onSendTestPush}
                onSave={onSaveNotifications}
            />
        );
    }

    if (activeModal === 'security') {
        return (
            <SettingsSecurityModal
                newPassword={newPassword}
                confirmPassword={confirmPassword}
                securitySaving={securitySaving}
                onNewPasswordChange={onNewPasswordChange}
                onConfirmPasswordChange={onConfirmPasswordChange}
                onSave={onSaveSecurity}
            />
        );
    }

    if (activeModal === 'help') {
        return <SettingsHelpModal onContactSupport={onContactSupport} />;
    }

    if (activeModal === 'appearance') {
        return (
            <SettingsAppearanceModal
                pendingTheme={pendingTheme}
                onThemeChange={onThemeChange}
                onApply={onApplyTheme}
            />
        );
    }

    if (activeModal === 'privacy') {
        return (
            <SettingsPrivacyModal
                onExport={onExportPrivacy}
                onRequestDelete={onRequestDelete}
                onRequestAccess={onRequestAccess}
                onRequestRectify={onRequestRectify}
                onCancelRequest={onCancelRequest}
                requests={privacyRequests}
                loadingRequests={privacyLoading}
            />
        );
    }

    return null;
};

export default SettingsModalContent;
