import { useCallback, useState } from 'react';
import { supabase } from '../supabaseCore';

interface UsePasswordRecoveryResult {
    showRecoveryModal: boolean;
    newPassword: string;
    recoveryError: string | null;
    isUpdatingPassword: boolean;
    setNewPassword: (value: string) => void;
    openPasswordRecoveryModal: () => void;
    handleUpdatePassword: () => Promise<void>;
}

export function usePasswordRecovery(): UsePasswordRecoveryResult {
    const [showRecoveryModal, setShowRecoveryModal] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [recoveryError, setRecoveryError] = useState<string | null>(null);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    const openPasswordRecoveryModal = useCallback(() => {
        setShowRecoveryModal(true);
        setRecoveryError(null);
        setNewPassword('');
    }, []);

    const handleUpdatePassword = useCallback(async () => {
        if (!newPassword || newPassword.length < 6) {
            setRecoveryError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setIsUpdatingPassword(true);
        setRecoveryError(null);

        try {
            if (!supabase) return;

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                setRecoveryError(error.message);
                return;
            }

            setShowRecoveryModal(false);
            setNewPassword('');
            window.history.replaceState({}, document.title, window.location.pathname);
        } catch {
            setRecoveryError('Erro ao atualizar senha. Tente novamente.');
        } finally {
            setIsUpdatingPassword(false);
        }
    }, [newPassword]);

    return {
        showRecoveryModal,
        newPassword,
        recoveryError,
        isUpdatingPassword,
        setNewPassword,
        openPasswordRecoveryModal,
        handleUpdatePassword
    };
}
