import { useEffect, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { Client, MissedClass } from '../types';
import { analyzeClientProgressWithRouter } from '../services/ai/aiRouter';
import { getClientById, updateClientById, deleteClientCascade } from '../services/supabase/domains/clientsDomain';
import { getAssessmentsByClient } from '../services/supabase/domains/assessmentsDomain';
import { getWorkoutsByClient } from '../services/supabase/domains/workoutsDomain';
import { uploadAvatar } from '../services/supabase/domains/storageDomain';
import { buildClientPhysicalUpdatePayload, mapAssessmentsToClientShape } from '../services/clientProfileUtils';
import { createScopedLogger } from '../services/appLogger';

interface UseClientProfileControllerParams {
    initialClient: Client;
    coachId?: string;
    onBack: () => void;
}

interface ProgressAnalysis {
    summary: string;
    improvements: string[];
    concerns: string[];
    recommendations: string[];
}
const clientProfileLogger = createScopedLogger('ClientProfileController');

export function getReasonLabel(reason: MissedClass['reason']) {
    const labels = { sick: 'Doença', travel: 'Viagem', personal: 'Pessoal', other: 'Outro' };
    return labels[reason] || reason;
}

export function useClientProfileController({
    initialClient,
    coachId,
    onBack
}: UseClientProfileControllerParams) {
    const [client, setClient] = useState<Client>({
        assessments: [],
        missedClasses: [],
        workouts: [],
        ...initialClient
    });
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [editedEmail, setEditedEmail] = useState(initialClient.email || '');
    const [editedPhone, setEditedPhone] = useState(initialClient.phone || '');
    const [editedObservations, setEditedObservations] = useState(initialClient.observations || '');
    const [editedInjuries, setEditedInjuries] = useState(initialClient.injuries || '');
    const [editedPreferences, setEditedPreferences] = useState(initialClient.preferences || '');
    const [missedDate, setMissedDate] = useState(new Date().toISOString().split('T')[0]);
    const [missedReason, setMissedReason] = useState<MissedClass['reason']>('sick');
    const [missedNotes, setMissedNotes] = useState('');
    const [progressAnalysis, setProgressAnalysis] = useState<ProgressAnalysis | null>(null);
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [chartMode, setChartMode] = useState<'weight' | 'fat'>('weight');

    useEffect(() => {
        const loadFullData = async () => {
            try {
                const [clientData, assessmentsData, workoutsData] = await Promise.all([
                    getClientById(initialClient.id),
                    getAssessmentsByClient(initialClient.id),
                    getWorkoutsByClient(initialClient.id, { limit: 50 })
                ]);

                const mappedAssessments = mapAssessmentsToClientShape(assessmentsData);

                setClient((prev) => ({
                    ...prev,
                    bodyFat: clientData?.body_fat ?? prev.bodyFat,
                    age: clientData?.age ?? prev.age,
                    weight: clientData?.weight ?? prev.weight,
                    height: clientData?.height ?? prev.height,
                    avatar: (clientData as any)?.avatar || clientData?.avatar_url || prev.avatar,
                    avatar_url: clientData?.avatar_url || prev.avatar_url,
                    assessments: mappedAssessments as any[],
                    workouts: workoutsData
                }));
            } catch (error) {
                clientProfileLogger.error('Error loading client details', error, { clientId: initialClient.id });
            }
        };

        if (initialClient.id) {
            void loadFullData();
        }
    }, [initialClient.id]);

    useEffect(() => {
        setEditedEmail(client.email || '');
        setEditedPhone(client.phone || '');
        setEditedObservations(client.observations || '');
        setEditedInjuries(client.injuries || '');
        setEditedPreferences(client.preferences || '');
    }, [client.email, client.injuries, client.observations, client.phone, client.preferences]);

    const handleAnalyzeProgress = async () => {
        if (!client.assessments || client.assessments.length === 0) return;

        setLoadingAnalysis(true);
        try {
            const analysis = await analyzeClientProgressWithRouter({
                name: client.name,
                assessments: client.assessments.map((assessment) => ({
                    date: assessment.date,
                    weight: assessment.weight,
                    bodyFat: assessment.bodyFat,
                    measures: assessment.measures
                })),
                goal: client.goal
            });
            setProgressAnalysis(analysis);
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleSaveNotes = async () => {
        try {
            await updateClientById(client.id, {
                observations: editedObservations,
                injuries: editedInjuries,
                preferences: editedPreferences
            });

            setClient((prev) => ({
                ...prev,
                observations: editedObservations,
                injuries: editedInjuries,
                preferences: editedPreferences
            }));
            setIsEditing(false);
        } catch (error) {
            clientProfileLogger.error('Error updating client notes', error, { clientId: client.id });
        }
    };

    const handleToggleStatus = async (newStatus: Client['status'], reason?: Client['suspensionReason']) => {
        try {
            await updateClientById(client.id, {
                status: newStatus,
                suspensionReason: reason,
            } as any);

            setClient((prev) => ({
                ...prev,
                status: newStatus,
                suspensionReason: reason,
                suspensionStartDate: newStatus === 'paused' ? new Date().toISOString() : undefined,
                suspensionEndDate: undefined
            }));
        } catch (error) {
            clientProfileLogger.error('Error updating client status', error, { clientId: client.id, newStatus });
        }
    };

    const handleAddMissedClass = () => {
        const newMissedClass: MissedClass = {
            id: Math.random().toString(36).slice(2, 11),
            date: missedDate,
            reason: missedReason,
            replaced: false,
            notes: missedNotes
        };

        setClient((prev) => ({
            ...prev,
            missedClasses: [...prev.missedClasses, newMissedClass]
        }));
        setMissedNotes('');
    };

    const handleMarkAsReplaced = (missedClassId: string) => {
        setClient((prev) => ({
            ...prev,
            missedClasses: prev.missedClasses.map((missedClass) =>
                missedClass.id === missedClassId
                    ? { ...missedClass, replaced: true, replacementDate: new Date().toISOString() }
                    : missedClass
            )
        }));
    };

    const handleDeleteClient = async () => {
        setIsDeleting(true);
        const success = await deleteClientCascade(client.id);
        setIsDeleting(false);

        if (success) {
            onBack();
            return true;
        }

        return false;
    };

    const handleSaveContact = async () => {
        try {
            const updates: Partial<Client> = {
                email: editedEmail || null,
                phone: editedPhone || null
            };

            const updateResult = await updateClientById(client.id, updates as any);
            if (!updateResult) {
                clientProfileLogger.error('Contact update returned null result', undefined, { clientId: client.id });
                return false;
            }

            setClient((prev) => ({
                ...prev,
                email: editedEmail,
                phone: editedPhone
            }));
            return true;
        } catch (error) {
            clientProfileLogger.error('Error saving contact data', error, { clientId: client.id });
            return false;
        }
    };

    const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !coachId) {
            return;
        }

        setIsUploadingAvatar(true);
        try {
            const publicUrl = await uploadAvatar(file, coachId, client.id);
            if (!publicUrl) return false;

            await updateClientById(client.id, { avatar_url: publicUrl } as any);
            setClient((prev) => ({ ...prev, avatar: publicUrl, avatar_url: publicUrl }));
            return true;
        } catch (error) {
            clientProfileLogger.error('Unexpected avatar upload error', error, { clientId: client.id, coachId });
            return false;
        } finally {
            setIsUploadingAvatar(false);
            event.target.value = '';
        }
    };

    const handlePhysicalDataUpdate = async (data: Record<string, unknown>) => {
        setClient((prev) => ({ ...prev, ...data }));

        try {
            const updateData = buildClientPhysicalUpdatePayload(data as any);
            if (Object.keys(updateData).length === 0) return;

            const updateResult = await updateClientById(client.id, updateData as any);
            if (!updateResult) {
                clientProfileLogger.error('Physical data update returned null result', undefined, { clientId: client.id });
            }
        } catch (error) {
            clientProfileLogger.error('Error saving physical data', error, { clientId: client.id });
        }
    };

    return {
        client,
        setClient,
        isEditing,
        setIsEditing,
        isDeleting,
        isUploadingAvatar,
        editedEmail,
        setEditedEmail,
        editedPhone,
        setEditedPhone,
        editedObservations,
        setEditedObservations,
        editedInjuries,
        setEditedInjuries,
        editedPreferences,
        setEditedPreferences,
        missedDate,
        setMissedDate,
        missedReason,
        setMissedReason,
        missedNotes,
        setMissedNotes,
        progressAnalysis,
        loadingAnalysis,
        chartMode,
        setChartMode,
        handleAnalyzeProgress,
        handleSaveNotes,
        handleToggleStatus,
        handleAddMissedClass,
        handleMarkAsReplaced,
        handleDeleteClient,
        handleSaveContact,
        handleAvatarChange,
        handlePhysicalDataUpdate
    };
}
