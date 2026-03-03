export interface AdaptiveTrainingSignal {
    readinessScore: number;
    fatigueLevel: 'low' | 'moderate' | 'high';
    recommendedVolumeDeltaPct: number;
    recommendedIntensityDeltaPct: number;
    recommendedDaysPerWeek: number;
    confidence: number;
    sourceSessions: number;
    rationale: string;
}
