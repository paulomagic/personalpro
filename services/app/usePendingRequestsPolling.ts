import { useEffect, useState } from 'react';
import type { AppSessionUser } from '../auth/authFlow';
import { countPendingRescheduleRequests, type DBUserProfile } from '../userProfileService';

interface UsePendingRequestsPollingParams {
    user: AppSessionUser | null;
    userProfile: DBUserProfile | null;
    pollIntervalMs?: number;
}

export function usePendingRequestsPolling({
    user,
    userProfile,
    pollIntervalMs = 30000
}: UsePendingRequestsPollingParams): number {
    const [pendingRequests, setPendingRequests] = useState(0);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        let cancelled = false;

        const fetchPendingRequests = async () => {
            if (!user || userProfile?.role !== 'coach') {
                if (!cancelled) {
                    setPendingRequests(0);
                }
                return;
            }

            const count = await countPendingRescheduleRequests(user.id);
            if (!cancelled) {
                setPendingRequests(count);
            }
        };

        void fetchPendingRequests();
        const intervalId = window.setInterval(() => {
            void fetchPendingRequests();
        }, pollIntervalMs);

        return () => {
            cancelled = true;
            window.clearInterval(intervalId);
        };
    }, [pollIntervalMs, user?.id, userProfile?.role]);

    return pendingRequests;
}
