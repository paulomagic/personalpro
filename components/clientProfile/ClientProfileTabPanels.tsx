import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Client, MissedClass } from '../../types';
import ClientProfileBioTab from './ClientProfileBioTab';
import ClientProfileEvolutionTab from './ClientProfileEvolutionTab';
import ClientProfileAssessmentsTab from './ClientProfileAssessmentsTab';
import ClientProfileWorkoutsTab from './ClientProfileWorkoutsTab';

interface ProgressAnalysis {
    summary: string;
    improvements: string[];
    concerns: string[];
    recommendations: string[];
}

interface ClientProfileTabPanelsProps {
    activeTab: 'Bio' | 'Treinos' | 'Avaliações' | 'Evolução';
    client: Client;
    chartMode: 'weight' | 'fat';
    setChartMode: (mode: 'weight' | 'fat') => void;
    progressAnalysis: ProgressAnalysis | null;
    loadingAnalysis: boolean;
    handleAnalyzeProgress: () => void;
    onStartAssessment: () => void;
    onOpenGalleryModal: () => void;
    onCreateWorkout?: () => void;
    onStartWorkout: (workout: any) => void;
    onStudentView?: () => void;
    onSportTraining?: () => void;
    onOpenMissedClassModal: () => void;
    getReasonLabel: (reason: MissedClass['reason']) => string;
    handleMarkAsReplaced: (missedClassId: string) => void;
    coachId?: string;
    onFinanceUpdate: (updates: Record<string, unknown>) => void;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    handleSaveNotes: () => void;
    onOpenContactModal: () => void;
    editedObservations: string;
    setEditedObservations: (value: string) => void;
    editedInjuries: string;
    setEditedInjuries: (value: string) => void;
    editedPreferences: string;
    setEditedPreferences: (value: string) => void;
    onUpdatePhysicalData: (data: Record<string, unknown>) => Promise<void>;
}

const ClientProfileTabPanels: React.FC<ClientProfileTabPanelsProps> = (props) => {
    return (
        <AnimatePresence mode="wait">
            {props.activeTab === 'Evolução' && (
                <ClientProfileEvolutionTab
                    client={props.client}
                    chartMode={props.chartMode}
                    setChartMode={props.setChartMode}
                    progressAnalysis={props.progressAnalysis}
                    loadingAnalysis={props.loadingAnalysis}
                    handleAnalyzeProgress={props.handleAnalyzeProgress}
                    onOpenGalleryModal={props.onOpenGalleryModal}
                    onStartAssessment={props.onStartAssessment}
                />
            )}

            {props.activeTab === 'Avaliações' && (
                <ClientProfileAssessmentsTab
                    client={props.client}
                    onStartAssessment={props.onStartAssessment}
                />
            )}

            {props.activeTab === 'Treinos' && (
                <ClientProfileWorkoutsTab
                    client={props.client}
                    onCreateWorkout={props.onCreateWorkout}
                    onStartWorkout={props.onStartWorkout}
                    onStudentView={props.onStudentView}
                    onSportTraining={props.onSportTraining}
                    onOpenMissedClassModal={props.onOpenMissedClassModal}
                    getReasonLabel={props.getReasonLabel}
                    handleMarkAsReplaced={props.handleMarkAsReplaced}
                />
            )}

            {props.activeTab === 'Bio' && (
                <ClientProfileBioTab
                    client={props.client}
                    coachId={props.coachId}
                    onFinanceUpdate={props.onFinanceUpdate}
                    isEditing={props.isEditing}
                    setIsEditing={props.setIsEditing}
                    handleSaveNotes={props.handleSaveNotes}
                    onOpenContactModal={props.onOpenContactModal}
                    editedObservations={props.editedObservations}
                    setEditedObservations={props.setEditedObservations}
                    editedInjuries={props.editedInjuries}
                    setEditedInjuries={props.setEditedInjuries}
                    editedPreferences={props.editedPreferences}
                    setEditedPreferences={props.setEditedPreferences}
                    onUpdatePhysicalData={props.onUpdatePhysicalData}
                />
            )}
        </AnimatePresence>
    );
};

export default ClientProfileTabPanels;
