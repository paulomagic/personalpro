export interface RawAssessmentLike {
    body_fat?: number;
    muscle_mass?: number;
    visceral_fat?: number;
    [key: string]: unknown;
}

export interface ClientPhysicalUpdateInput {
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    bodyFat?: number | null;
}

export interface ClientPhysicalUpdatePayload {
    age?: number | null;
    weight?: number | null;
    height?: number | null;
    body_fat?: number | null;
}

export function mapAssessmentsToClientShape<T extends RawAssessmentLike>(
    assessments: T[]
): Array<T & { bodyFat?: number; muscleMass?: number; visceralFat?: number }> {
    return assessments.map((assessment) => ({
        ...assessment,
        bodyFat: assessment.body_fat,
        muscleMass: assessment.muscle_mass,
        visceralFat: assessment.visceral_fat
    }));
}

export function buildClientPhysicalUpdatePayload(
    data: ClientPhysicalUpdateInput
): ClientPhysicalUpdatePayload {
    const payload: ClientPhysicalUpdatePayload = {};
    if (data.age !== undefined) payload.age = data.age ?? null;
    if (data.weight !== undefined) payload.weight = data.weight ?? null;
    if (data.height !== undefined) payload.height = data.height ?? null;
    if (data.bodyFat !== undefined) payload.body_fat = data.bodyFat ?? null;
    return payload;
}
