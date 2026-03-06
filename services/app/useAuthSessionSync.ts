import { useEffect, type Dispatch, type SetStateAction } from 'react';
import { View } from '../../types';
import { supabase } from '../supabaseCore';
import { getUserProfile, type DBUserProfile } from '../userProfileService';
import type { AppSessionUser } from '../auth/authFlow';

interface UseAuthSessionSyncParams {
    onPasswordRecovery: () => void;
    setUser: Dispatch<SetStateAction<AppSessionUser | null>>;
    setUserProfile: Dispatch<SetStateAction<DBUserProfile | null>>;
    setCurrentView: Dispatch<SetStateAction<View>>;
    requestServiceWorkerUserCachePurge: () => void;
}

export function useAuthSessionSync({
    onPasswordRecovery,
    setUser,
    setUserProfile,
    setCurrentView,
    requestServiceWorkerUserCachePurge
}: UseAuthSessionSyncParams): void {
    useEffect(() => {
        if (!supabase) return;

        const handlePasswordRecoveryRedirect = async () => {
            if (typeof window === 'undefined') return;

            const searchParams = new URLSearchParams(window.location.search);
            const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
            const searchType = searchParams.get('type');
            const hashType = hashParams.get('type');
            const recoveryCode = searchParams.get('code');
            const tokenHash = searchParams.get('token_hash');
            const searchAccessToken = searchParams.get('access_token');
            const hashAccessToken = hashParams.get('access_token');
            const searchRefreshToken = searchParams.get('refresh_token');
            const hashRefreshToken = hashParams.get('refresh_token');
            const resetFlag = searchParams.get('reset') === 'true';
            const accessToken = searchAccessToken || hashAccessToken;
            const refreshToken = searchRefreshToken || hashRefreshToken;
            const recoveryType = searchType || hashType;
            const hasRecoverySessionTokens = Boolean(accessToken) && Boolean(refreshToken);

            if (searchType === 'recovery' && recoveryCode) {
                const { error } = await supabase.auth.exchangeCodeForSession(recoveryCode);
                if (!error) {
                    setCurrentView(View.LOGIN);
                    onPasswordRecovery();
                }
                return;
            }

            if (searchType === 'recovery' && tokenHash) {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type: 'recovery'
                });
                if (!error) {
                    setCurrentView(View.LOGIN);
                    onPasswordRecovery();
                }
                return;
            }

            if (hasRecoverySessionTokens) {
                const { error } = await supabase.auth.setSession({
                    access_token: accessToken!,
                    refresh_token: refreshToken!
                });
                if (!error && (recoveryType === 'recovery' || resetFlag)) {
                    setCurrentView(View.LOGIN);
                    onPasswordRecovery();
                }
                return;
            }

            if (recoveryType === 'recovery' || resetFlag) {
                setCurrentView(View.LOGIN);
                onPasswordRecovery();
            }
        };

        void handlePasswordRecoveryRedirect();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (event, session) => {
                if (event === 'PASSWORD_RECOVERY') {
                    onPasswordRecovery();
                }

                if (event === 'SIGNED_OUT' || !session) {
                    requestServiceWorkerUserCachePurge();
                    setUser(null);
                    setUserProfile(null);
                    setCurrentView(View.LOGIN);
                } else if (event === 'SIGNED_IN' && session?.user) {
                    const signedInUser = session.user as AppSessionUser;
                    setUser(signedInUser);
                    getUserProfile(session.user.id).then((profile) => {
                        if (profile) {
                            setUserProfile(profile);
                            setUser({ ...signedInUser, profile });
                        }
                    }).catch((error) => {
                        console.error('Error loading profile on SIGNED_IN:', error);
                    });
                }
            }
        );

        return () => subscription.unsubscribe();
    }, [
        requestServiceWorkerUserCachePurge,
        onPasswordRecovery,
        setCurrentView,
        setUser,
        setUserProfile
    ]);
}
