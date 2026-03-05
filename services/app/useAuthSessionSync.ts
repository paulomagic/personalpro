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
