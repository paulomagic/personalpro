
import { supabase } from './supabaseCore';
import { hydrateWorkoutWithVideos } from './exerciseService';
import {
    mapDBClientToClient as mapDBClientToClientFromDomain,
    getClients as getClientsFromDomain
} from './supabase/domains/clientsDomain';
import {
    getAppointments as getAppointmentsFromDomain,
    createAppointment as createAppointmentFromDomain,
    updateAppointment as updateAppointmentFromDomain,
    deleteAppointment as deleteAppointmentFromDomain,
    getAllAppointmentsForCoach as getAllAppointmentsForCoachFromDomain,
    deleteAppointmentsBulk as deleteAppointmentsBulkFromDomain,
    createRescheduleRequest as createRescheduleRequestFromDomain,
    getPendingRescheduleRequests as getPendingRescheduleRequestsFromDomain,
    countPendingRescheduleRequests as countPendingRescheduleRequestsFromDomain,
    respondToRescheduleRequest as respondToRescheduleRequestFromDomain
} from './supabase/domains/appointmentsDomain';
import {
    getPayments as getPaymentsFromDomain,
    createPayment as createPaymentFromDomain,
    getPaymentsByClient as getPaymentsByClientFromDomain,
    updatePayment as updatePaymentFromDomain
} from './supabase/domains/paymentsDomain';
import {
    getWorkoutsByClient as getWorkoutsByClientFromDomain,
    saveAIWorkout as saveAIWorkoutFromDomain
} from './supabase/domains/workoutsDomain';
import {
    createInvitation as createInvitationFromDomain,
    getInvitationByToken as getInvitationByTokenFromDomain,
    acceptInvitation as acceptInvitationFromDomain,
    getCoachInvitations as getCoachInvitationsFromDomain,
    cancelInvitation as cancelInvitationFromDomain,
    getCoachStudents as getCoachStudentsFromDomain
} from './supabase/domains/invitationsDomain';
export { supabase };

// ============ TIPOS ============

export interface DBClient {
    id: string;
    name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    goal: string;
    level: string;
    age?: number;
    weight?: number;
    height?: number;
    body_fat?: number;
    observations?: string;
    injuries?: string;
    preferences?: string;
    status: 'active' | 'inactive' | 'at-risk';
    adherence: number;
    created_at: string;
    coach_id: string;
    // Financial fields
    monthly_fee?: number;
    payment_day?: number;
    payment_type?: 'monthly' | 'per_session';
    session_price?: number;
}

interface ClientSensitiveDataRpcRow {
    client_id?: string;
    injuries: string | null;
    observations: string | null;
    preferences: string | null;
    bmi?: number | null;
}

function mergeClientSensitiveData(
    client: DBClient,
    sensitive: ClientSensitiveDataRpcRow | null
): DBClient {
    if (!sensitive) return client;
    return {
        ...client,
        injuries: sensitive.injuries ?? client.injuries,
        observations: sensitive.observations ?? client.observations,
        preferences: sensitive.preferences ?? client.preferences
    };
}

async function getClientSensitiveData(clientId: string): Promise<ClientSensitiveDataRpcRow | null> {
    if (!supabase) return null;
    const { data, error } = await supabase
        .rpc('get_client_sensitive_data', { p_client_id: clientId })
        .maybeSingle();

    if (error) {
        // Fallback silencioso para evitar regressão quando RPC não está disponível para o papel atual.
        return null;
    }

    return (data as ClientSensitiveDataRpcRow | null) ?? null;
}

// Helper function to map DB snake_case to frontend camelCase
export function mapDBClientToClient(dbClient: DBClient & { avatar?: string }): any {
    return mapDBClientToClientFromDomain(dbClient);
}

export interface Appointment {
    id: string;
    client_id: string;
    coach_id: string;
    date: string;
    time: string;
    duration: string;
    type: 'training' | 'assessment' | 'consultation';
    status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
    notes?: string;
    created_at: string;
}

export interface Payment {
    id: string;
    client_id: string;
    coach_id: string;
    amount: number;
    due_date: string;
    paid_date?: string;
    status: 'paid' | 'pending' | 'overdue';
    plan: string;
    payment_method?: 'pix' | 'cash' | 'card' | 'transfer';
    type?: 'monthly' | 'session';
    created_at: string;
}

export interface Workout {
    id: string;
    client_id: string;
    coach_id: string;
    title: string;
    objective: string;
    duration: string;
    splits: any; // JSON
    ai_metadata?: AIWorkoutMetadata;
    created_at: string;
}

export interface QueryPaginationOptions {
    limit?: number;
    offset?: number;
}

// ============ CLIENTS ============

export async function getClients(
    coachId: string,
    options: QueryPaginationOptions = {}
): Promise<DBClient[]> {
    return getClientsFromDomain(coachId, options);
}

export async function getClient(clientId: string): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url, avatar_url, body_fat')
        .eq('id', clientId)
        .single();

    if (error) {
        console.error('Error fetching client:', error);
        return null;
    }

    const client = data as DBClient;
    const sensitive = await getClientSensitiveData(client.id);
    return mergeClientSensitiveData(client, sensitive);
}

export async function createClient(client: Omit<DBClient, 'id' | 'created_at'>): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .insert(client)
        .select()
        .single();

    if (error) {
        console.error('Error creating client:', error);
        return null;
    }

    return data;
}

export async function updateClient(clientId: string, updates: Partial<DBClient>): Promise<DBClient | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('clients')
        .update(updates)
        .eq('id', clientId)
        .select()
        .single();

    if (error) {
        console.error('[updateClient] Error:', error.message, error.code, error.details, error.hint);
        return null;
    }

    return data;
}

export async function deleteClient(clientId: string): Promise<boolean> {
    if (!supabase) return false;

    try {
        // 1. Delete assessments first (foreign key dependency)
        const { error: assessError } = await supabase
            .from('assessments')
            .delete()
            .eq('client_id', clientId);

        if (assessError) {
            console.error('Error deleting assessments:', assessError);
            // Continue anyway - assessments might not exist
        }

        // 2. Delete payments
        const { error: paymentError } = await supabase
            .from('payments')
            .delete()
            .eq('client_id', clientId);

        if (paymentError) {
            console.error('Error deleting payments:', paymentError);
        }

        // 3. Delete workouts
        const { error: workoutError } = await supabase
            .from('workouts')
            .delete()
            .eq('client_id', clientId);

        if (workoutError) {
            console.error('Error deleting workouts:', workoutError);
        }

        // 4. Delete appointments
        const { error: appointmentError } = await supabase
            .from('appointments')
            .delete()
            .eq('client_id', clientId);

        if (appointmentError) {
            console.error('Error deleting appointments:', appointmentError);
        }

        // 5. Finally, delete the client
        const { error: clientError } = await supabase
            .from('clients')
            .delete()
            .eq('id', clientId);

        if (clientError) {
            console.error('Error deleting client:', clientError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteClient:', error);
        return false;
    }
}

export interface Assessment {
    id: string;
    client_id: string;
    date: string;
    weight: number;
    body_fat?: number;
    muscle_mass?: number;
    notes?: string;
    [key: string]: any;
}

export async function getAssessments(clientId: string): Promise<Assessment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching assessments:', error);
        return [];
    }

    return data || [];
}

// ============ APPOINTMENTS ============

export async function getAppointments(
    coachId: string,
    date?: string,
    options: QueryPaginationOptions = {}
): Promise<Appointment[]> {
    return getAppointmentsFromDomain(coachId, date, options);
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
    return createAppointmentFromDomain(appointment);
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    return updateAppointmentFromDomain(id, updates);
}

// Delete appointment permanently
export async function deleteAppointment(id: string): Promise<boolean> {
    return deleteAppointmentFromDomain(id);
}

// Get all appointments for a coach (for cleanup purposes)
export async function getAllAppointmentsForCoach(
    coachId: string,
    options: QueryPaginationOptions = {}
): Promise<Appointment[]> {
    return getAllAppointmentsForCoachFromDomain(coachId, options);
}

// Delete multiple appointments by IDs (bulk delete)
export async function deleteAppointmentsBulk(ids: string[]): Promise<boolean> {
    return deleteAppointmentsBulkFromDomain(ids);
}

// ============ PAYMENTS ============

export async function getPayments(coachId: string, status?: string): Promise<Payment[]> {
    return getPaymentsFromDomain(coachId, status);
}

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> {
    return createPaymentFromDomain(payment);
}

// Get payments by client ID for history
export async function getPaymentsByClient(clientId: string): Promise<Payment[]> {
    return getPaymentsByClientFromDomain(clientId);
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    return updatePaymentFromDomain(id, updates);
}

// ============ WORKOUTS ============

export async function getWorkouts(
    clientId: string,
    options: QueryPaginationOptions = {}
): Promise<Workout[]> {
    return getWorkoutsByClientFromDomain(clientId, options);
}

export async function saveWorkout(workout: Omit<Workout, 'id' | 'created_at'>): Promise<Workout | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('workouts')
        .insert(workout)
        .select()
        .single();

    if (error) {
        console.error('Error saving workout:', error);
        return null;
    }

    return data;
}

// Buscar o treino atual do cliente (mais recente) com splits
export async function getClientCurrentWorkout(clientId: string): Promise<Workout | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error) {
        // Não logar erro se for "not found" - é esperado se o cliente não tem treino
        if (error.code !== 'PGRST116') {
            console.error('Error fetching client workout:', error);
        }
        return null;
    }

    if (data) {
        try {
            return await hydrateWorkoutWithVideos(data);
        } catch (err) {
            console.error('Error hydrating workout:', err);
            return data;
        }
    }

    return data;
}

// Save AI-generated workout with metadata
export interface AIWorkoutMetadata {
    model: string;
    optionSelected?: string;
    generatedAt: string;
    coldStartMode?: boolean;
    calibrationPlan?: {
        sessions: number;
        objectives?: string[];
    } | null;
    clientData?: {
        injuries?: string;
        preferences?: string;
        adherence?: number;
    };
    injuryRisk?: {
        score: number;
        level: string;
    } | null;
    precisionProfile?: {
        segment: string;
        label: string;
        targetPrecisionScore: number;
        maxMeanRpeError: number;
        maxMeanRirError: number;
        maxPainRate: number;
    } | null;
}

export async function saveAIWorkout(
    clientId: string,
    coachId: string,
    workout: any,
    metadata: AIWorkoutMetadata
): Promise<Workout | null> {
    return saveAIWorkoutFromDomain(clientId, coachId, workout, metadata);
}

// ============ WORKOUT HISTORY ============

export interface CompletedWorkoutInput {
    client_id: string;
    workout_id?: string;
    title: string;
    duration: string;
    exercises_count: number;
    sets_completed: number;
    total_load_volume: number;
    feedback_notes?: string;
}

export async function saveCompletedWorkout(workoutData: CompletedWorkoutInput): Promise<any | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('completed_workouts')
        .insert(workoutData)
        .select()
        .single();

    if (error) {
        console.error('Error saving completed workout:', error);
        return null;
    }

    return data;
}

export async function getCompletedWorkouts(clientId: string): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('completed_workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching completed workouts:', error);
        return [];
    }

    return data || [];
}

// ============ AUTH ============

export async function signIn(email: string, password: string) {
    if (!supabase) return { user: null, error: 'Supabase not configured' };

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    return { user: data?.user, error: error?.message };
}

export async function signUp(email: string, password: string, name: string) {
    if (!supabase) return { user: null, error: 'Supabase not configured' };

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: { name }
        }
    });

    return { user: data?.user, error: error?.message };
}

export async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    return data?.user;
}

// Check if Supabase is configured
export function isSupabaseConfigured(): boolean {
    return !!supabase;
}

// ============ PHOTO STORAGE ============

const STORAGE_BUCKET = 'assessment-photos';
const AVATARS_BUCKET = 'avatars';

/**
 * Converte uma imagem para base64 data URL otimizada (200x200, JPEG 80%)
 * Armazena diretamente no campo avatar_url da tabela clients — sem Storage.
 */
export async function uploadAvatar(
    file: File,
    _coachId: string,
    _clientId: string = 'new'
): Promise<string | null> {
    try {
        console.log('[uploadAvatar] Convertendo imagem para base64...');
        console.log('[uploadAvatar] Arquivo original:', file.name, file.size, 'bytes');

        const dataUrl = await compressImageToDataUrl(file, 200, 0.8);

        console.log('[uploadAvatar] Data URL gerada, tamanho:', dataUrl.length, 'chars (~', Math.round(dataUrl.length / 1024), 'KB)');

        return dataUrl;
    } catch (error) {
        console.error('[uploadAvatar] Erro ao processar imagem:', error);
        return null;
    }
}

/**
 * Comprime uma imagem usando canvas para redimensionar e converter em JPEG base64.
 */
function compressImageToDataUrl(file: File, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');

                // Calcular dimensões mantendo proporção
                let width = img.width;
                let height = img.height;
                if (width > height) {
                    if (width > maxSize) {
                        height = Math.round((height * maxSize) / width);
                        width = maxSize;
                    }
                } else {
                    if (height > maxSize) {
                        width = Math.round((width * maxSize) / height);
                        height = maxSize;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export async function uploadAssessmentPhoto(
    file: File,
    clientId: string,
    coachId: string
): Promise<string | null> {
    if (!supabase) {
        console.warn('Supabase not configured - photo upload skipped');
        return null;
    }

    try {
        // Create unique filename
        const timestamp = Date.now();
        const extension = file.name.split('.').pop() || 'jpg';
        const filePath = `${coachId}/${clientId}/${timestamp}.${extension}`;

        // Upload to Supabase Storage
        const { data, error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('Error uploading photo:', error.message);
            // If bucket doesn't exist, return a demo URL
            if (error.message.includes('Bucket not found') || error.message.includes('not found')) {
                console.warn('Storage bucket not configured - using placeholder');
                return `https://ui-avatars.com/api/?name=Photo&background=3b82f6&color=fff&size=400`;
            }
            return null;
        }

        // Use signed URL to avoid exposing permanent public links
        const { data: signedData, error: signedError } = await supabase.storage
            .from(STORAGE_BUCKET)
            .createSignedUrl(data.path, 60 * 60 * 24 * 7); // 7 days

        if (signedError) {
            console.error('Error creating signed URL:', signedError.message);
            return null;
        }

        return signedData.signedUrl;
    } catch (error) {
        console.error('Error in uploadAssessmentPhoto:', error);
        return null;
    }
}

export async function deleteAssessmentPhoto(photoUrl: string): Promise<boolean> {
    if (!supabase) return false;

    try {
        // Extract file path from URL
        const urlParts = photoUrl.split(`${STORAGE_BUCKET}/`);
        if (urlParts.length < 2) return false;

        const filePath = urlParts[1];
        const cleanPath = filePath.split('?')[0];
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([cleanPath]);

        return !error;
    } catch (error) {
        console.error('Error deleting photo:', error);
        return false;
    }
}

// ============ ASSESSMENTS (Create & Update) ============

export interface CreateAssessmentData {
    client_id: string;
    coach_id: string;
    date: string;
    weight?: number;
    body_fat?: number;
    muscle_mass?: number;
    measures?: Record<string, number>;
    skinfolds?: Record<string, number>;
    photos?: string[];
    notes?: string;
}

export async function createAssessment(data: CreateAssessmentData): Promise<any | null> {
    if (!supabase) {
        console.warn('Supabase not configured - assessment not saved');
        return null;
    }

    try {
        const { data: result, error } = await supabase
            .from('assessments')
            .insert({
                client_id: data.client_id,
                coach_id: data.coach_id,
                date: data.date,
                weight: data.weight,
                body_fat: data.body_fat,
                muscle_mass: data.muscle_mass,
                measures: data.measures || {},
                skinfolds: data.skinfolds || {},
                photos: data.photos || [],
                notes: data.notes
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating assessment:', error.message);
            return null;
        }

        return result;
    } catch (error) {
        console.error('Error in createAssessment:', error);
        return null;
    }
}

export async function getAssessmentsWithPhotos(clientId: string): Promise<any[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('assessments')
        .select('*')
        .eq('client_id', clientId)
        .order('date', { ascending: false });

    if (error) {
        console.error('Error fetching assessments with photos:', error);
        return [];
    }

    // Auto-refresh signed URLs for photos to prevent broken images after 7 days
    if (data && data.length > 0) {
        const pathsToSign: string[] = [];
        const pathRefMap = new Map<string, { objIndex: number, photoIndex: number }[]>();

        data.forEach((assessment, objIndex) => {
            if (assessment.photos && Array.isArray(assessment.photos)) {
                assessment.photos.forEach((photoUrl: string, photoIndex: number) => {
                    if (typeof photoUrl === 'string' && photoUrl.includes(`${STORAGE_BUCKET}/`)) {
                        const urlParts = photoUrl.split(`${STORAGE_BUCKET}/`);
                        if (urlParts.length >= 2) {
                            // avoid decoding if it's already url encoded, split by ? handles params
                            const cleanPath = urlParts[1].split('?')[0];

                            // only add if not already in list to avoid duplicate requests for same path
                            if (!pathRefMap.has(cleanPath)) {
                                pathsToSign.push(cleanPath);
                            }

                            const refs = pathRefMap.get(cleanPath) || [];
                            refs.push({ objIndex, photoIndex });
                            pathRefMap.set(cleanPath, refs);
                        }
                    }
                });
            }
        });

        if (pathsToSign.length > 0) {
            const { data: signedUrls, error: signError } = await supabase.storage
                .from(STORAGE_BUCKET)
                .createSignedUrls(pathsToSign, 60 * 60 * 24 * 7); // 7 days

            if (!signError && signedUrls) {
                signedUrls.forEach((signedItem, index) => {
                    const cleanPath = pathsToSign[index];
                    if (signedItem.signedUrl && cleanPath) {
                        const refs = pathRefMap.get(cleanPath) || [];
                        refs.forEach(ref => {
                            data[ref.objIndex].photos[ref.photoIndex] = signedItem.signedUrl;
                        });
                    }
                });
            } else if (signError) {
                console.error('Error refreshing signed urls:', signError);
            }
        }
    }

    return data || [];
}

// ============ USER PROFILES & INVITATIONS ============

export interface DBUserProfile {
    id: string;
    role: 'admin' | 'coach' | 'student';
    coach_id?: string;
    client_id?: string;
    full_name?: string;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}

export interface DBInvitation {
    id: string;
    coach_id: string;
    email: string;
    client_id?: string;
    token: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expires_at: string;
    accepted_at?: string;
    created_at: string;
}

export interface DBInvitationPreview {
    id: string;
    email: string;
    client_id?: string;
    status: 'pending' | 'accepted' | 'expired' | 'cancelled';
    expires_at: string;
}

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<DBUserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error || !data) {
        if (error?.code !== 'PGRST116') {
            console.error('[getUserProfile] Error fetching profile:', error);
        }
        return null;
    }

    return data;
}

// Create or update user profile (internal use only)
async function upsertUserProfile(profile: Partial<DBUserProfile> & { id: string }): Promise<DBUserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .upsert({
            ...profile,
            updated_at: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error upserting user profile:', error);
        return null;
    }

    return data;
}

// Generate secure random token for invitations
// Create invitation for a student
export async function createInvitation(
    coachId: string,
    email: string,
    clientId?: string
): Promise<DBInvitation | null> {
    return createInvitationFromDomain(coachId, email, clientId);
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<DBInvitationPreview | null> {
    return getInvitationByTokenFromDomain(token);
}

// Accept invitation and convert user to student
export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    return acceptInvitationFromDomain(token, userId);
}

// Get all invitations sent by a coach
export async function getCoachInvitations(coachId: string): Promise<DBInvitation[]> {
    return getCoachInvitationsFromDomain(coachId);
}

// Cancel an invitation
export async function cancelInvitation(invitationId: string, coachId: string): Promise<boolean> {
    return cancelInvitationFromDomain(invitationId, coachId);
}

// Get students for a coach (users with student role linked to this coach)
export async function getCoachStudents(coachId: string): Promise<DBUserProfile[]> {
    return getCoachStudentsFromDomain(coachId);
}

// ============ RESCHEDULE REQUESTS ============

// Type for reschedule request
export interface DBRescheduleRequest {
    id: string;
    appointment_id: string;
    client_id: string;
    coach_id: string;
    original_date: string;
    requested_date: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    response_note?: string;
    created_at: string;
    responded_at?: string;
}

// Get student's appointments (for students to view their schedule)
export async function getStudentAppointments(clientId: string): Promise<Appointment[]> {
    if (!supabase) return [];

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', today)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching student appointments:', error);
        return [];
    }

    return data || [];
}

// Create a reschedule request (by student)
export async function createRescheduleRequest(data: {
    appointmentId: string;
    clientId: string;
    coachId: string;
    originalDate: string;
    requestedDate: string;
    reason?: string;
}): Promise<DBRescheduleRequest | null> {
    return createRescheduleRequestFromDomain(data);
}

// Get pending reschedule requests for a coach
export async function getPendingRescheduleRequests(coachId: string): Promise<(DBRescheduleRequest & { client_name?: string })[]> {
    return getPendingRescheduleRequestsFromDomain(coachId);
}

// Count pending reschedule requests for a coach
export async function countPendingRescheduleRequests(coachId: string): Promise<number> {
    return countPendingRescheduleRequestsFromDomain(coachId);
}

// Respond to a reschedule request (approve/reject)
export async function respondToRescheduleRequest(
    requestId: string,
    approved: boolean,
    responseNote?: string
): Promise<boolean> {
    return respondToRescheduleRequestFromDomain(requestId, approved, responseNote);
}
