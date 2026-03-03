
import { supabase } from './supabaseCore';
import { hydrateWorkoutWithVideos } from './exerciseService';
import {
    normalizeAcceptInvitationResult,
    normalizeInvitationPreviewFromRpc,
} from './invitations/invitationUtils';
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

// Helper function to map DB snake_case to frontend camelCase
export function mapDBClientToClient(dbClient: DBClient & { avatar?: string }): any {
    return {
        id: dbClient.id,
        name: dbClient.name,
        email: dbClient.email,
        phone: dbClient.phone,
        avatar: dbClient.avatar || dbClient.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbClient.name)}&background=3b82f6&color=fff`,
        goal: dbClient.goal,
        level: dbClient.level as 'Iniciante' | 'Intermediário' | 'Avançado' | 'Atleta',
        age: dbClient.age,
        weight: dbClient.weight,  // ✅ Adicionado para preservar peso
        height: dbClient.height,  // ✅ Adicionado para preservar altura
        status: dbClient.status === 'inactive' ? 'paused' : dbClient.status,
        adherence: dbClient.adherence || 0,
        startDate: dbClient.created_at,
        lastTraining: 'Não registrado',
        observations: dbClient.observations,
        injuries: dbClient.injuries,
        preferences: dbClient.preferences,  // ✅ Adicionado para preservar preferências
        missedClasses: [],
        assessments: [],
        totalClasses: 0,
        completedClasses: 0,
        paymentStatus: 'paid',
        // Financial fields
        monthly_fee: dbClient.monthly_fee,
        payment_day: dbClient.payment_day,
        payment_type: dbClient.payment_type,
        session_price: dbClient.session_price,
        // Pass raw avatar_url so components can reference it directly
        avatar_url: dbClient.avatar_url || dbClient.avatar,
    };
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

// ============ CLIENTS ============

export async function getClients(coachId: string): Promise<DBClient[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url, avatar_url')
        .eq('coach_id', coachId)
        .order('name');

    if (error) {
        console.error('Error fetching clients:', error);
        return [];
    }

    return data || [];
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

    return data;
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

export async function getAppointments(coachId: string, date?: string): Promise<Appointment[]> {
    if (!supabase) return [];

    let query = supabase
        .from('appointments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .neq('status', 'cancelled')  // Filtrar cancelados
        .order('date')
        .order('time');

    if (date) {
        query = query.eq('date', date);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }

    return data || [];
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
        return null;
    }

    return data;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating appointment:', error);
        return null;
    }

    return data;
}

// Delete appointment permanently
export async function deleteAppointment(id: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting appointment:', error);
        return false;
    }

    return true;
}

// Get all appointments for a coach (for cleanup purposes)
export async function getAllAppointmentsForCoach(coachId: string): Promise<Appointment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('appointments')
        .select('*, clients(name)')
        .eq('coach_id', coachId)
        .neq('status', 'cancelled')
        .order('date')
        .order('time');

    if (error) {
        console.error('Error fetching all appointments:', error);
        return [];
    }

    return data || [];
}

// Delete multiple appointments by IDs (bulk delete)
export async function deleteAppointmentsBulk(ids: string[]): Promise<boolean> {
    if (!supabase || ids.length === 0) return false;

    const { error } = await supabase
        .from('appointments')
        .delete()
        .in('id', ids);

    if (error) {
        console.error('Error bulk deleting appointments:', error);
        return false;
    }

    return true;
}

// ============ PAYMENTS ============

export async function getPayments(coachId: string, status?: string): Promise<Payment[]> {
    if (!supabase) return [];

    let query = supabase
        .from('payments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .order('due_date');

    if (status) {
        query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }

    return data || [];
}

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

    if (error) {
        console.error('Error creating payment:', error);
        return null;
    }

    return data;
}

// Get payments by client ID for history
export async function getPaymentsByClient(clientId: string): Promise<Payment[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', clientId)
        .order('due_date', { ascending: false });

    if (error) {
        console.error('Error fetching payments by client:', error);
        return [];
    }

    return data || [];
}

export async function updatePayment(id: string, updates: Partial<Payment>): Promise<Payment | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating payment:', error);
        return null;
    }

    return data;
}

// ============ WORKOUTS ============

export async function getWorkouts(clientId: string): Promise<Workout[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching workouts:', error);
        return [];
    }

    return data || [];
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
    if (!supabase) return null;

    const workoutWithMetadata = {
        client_id: clientId,
        coach_id: coachId,
        title: workout.title || 'Treino IA',
        objective: workout.objective || '',
        duration: workout.duration || '60 min',
        splits: workout.splits || [],
        ai_metadata: metadata, // Extra metadata column
    };

    const { data, error } = await supabase
        .from('workouts')
        .insert(workoutWithMetadata)
        .select()
        .single();

    if (error) {
        console.error('Error saving AI workout:', error);
        return null;
    }

    return data;
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
function generateInvitationToken(): string {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

// Create invitation for a student
export async function createInvitation(
    coachId: string,
    email: string,
    clientId?: string
): Promise<DBInvitation | null> {
    if (!supabase) return null;

    const token = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const { data, error } = await supabase
        .from('invitations')
        .insert({
            coach_id: coachId,
            email: email.toLowerCase().trim(),
            client_id: clientId,
            token,
            status: 'pending',
            expires_at: expiresAt.toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating invitation:', error);
        return null;
    }

    return data;
}

// Get invitation by token
export async function getInvitationByToken(token: string): Promise<DBInvitationPreview | null> {
    if (!supabase) return null;

    const { data, error } = await supabase.rpc('get_invitation_by_token', {
        invitation_token: token
    });

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching invitation:', error);
        }
        return null;
    }

    const invitation = normalizeInvitationPreviewFromRpc(data);
    if (!invitation) return null;
    return invitation;
}

// Accept invitation and convert user to student
export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };
    void userId; // user id is resolved server-side by auth.uid() in RPC

    const { data, error } = await supabase.rpc('accept_invitation', {
        invitation_token: token
    });

    if (error) {
        console.error('Error accepting invitation:', error);
        return { success: false, error: 'Erro ao aceitar convite' };
    }

    return normalizeAcceptInvitationResult(data);
}

// Get all invitations sent by a coach
export async function getCoachInvitations(coachId: string): Promise<DBInvitation[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('coach_id', coachId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching coach invitations:', error);
        return [];
    }

    return data || [];
}

// Cancel an invitation
export async function cancelInvitation(invitationId: string, coachId: string): Promise<boolean> {
    if (!supabase) return false;

    const { error } = await supabase
        .from('invitations')
        .update({ status: 'cancelled' })
        .eq('id', invitationId)
        .eq('coach_id', coachId); // Security: only coach can cancel their own invites

    if (error) {
        console.error('Error cancelling invitation:', error);
        return false;
    }

    return true;
}

// Get students for a coach (users with student role linked to this coach)
export async function getCoachStudents(coachId: string): Promise<DBUserProfile[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('coach_id', coachId)
        .eq('role', 'student');

    if (error) {
        console.error('Error fetching coach students:', error);
        return [];
    }

    return data || [];
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
    if (!supabase) return null;

    const { data: result, error } = await supabase
        .from('reschedule_requests')
        .insert({
            appointment_id: data.appointmentId,
            client_id: data.clientId,
            coach_id: data.coachId,
            original_date: data.originalDate,
            requested_date: data.requestedDate,
            reason: data.reason,
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating reschedule request:', error);
        return null;
    }

    return result;
}

// Get pending reschedule requests for a coach
export async function getPendingRescheduleRequests(coachId: string): Promise<(DBRescheduleRequest & { client_name?: string })[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('reschedule_requests')
        .select(`
            *,
            clients!inner(name)
        `)
        .eq('coach_id', coachId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching pending requests:', error);
        return [];
    }

    // Map client name to result
    return (data || []).map(req => ({
        ...req,
        client_name: req.clients?.name
    }));
}

// Count pending reschedule requests for a coach
export async function countPendingRescheduleRequests(coachId: string): Promise<number> {
    if (!supabase) return 0;

    const { count, error } = await supabase
        .from('reschedule_requests')
        .select('*', { count: 'exact', head: true })
        .eq('coach_id', coachId)
        .eq('status', 'pending');

    if (error) {
        console.error('Error counting pending requests:', error);
        return 0;
    }

    return count || 0;
}

// Respond to a reschedule request (approve/reject)
export async function respondToRescheduleRequest(
    requestId: string,
    approved: boolean,
    responseNote?: string
): Promise<boolean> {
    if (!supabase) return false;

    // Get the request first
    const { data: request, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        console.error('Error fetching request:', fetchError);
        return false;
    }

    // Update request status
    const { error: updateError } = await supabase
        .from('reschedule_requests')
        .update({
            status: approved ? 'approved' : 'rejected',
            response_note: responseNote,
            responded_at: new Date().toISOString()
        })
        .eq('id', requestId);

    if (updateError) {
        console.error('Error updating request:', updateError);
        return false;
    }

    // If approved, update the appointment date and time
    if (approved) {
        // Extract date and time from requested_date
        // Format: "2026-01-09T18:00:00"
        const [datePart, timePart] = request.requested_date.split('T');
        const newTime = timePart ? timePart.slice(0, 5) : '00:00'; // Get HH:MM

        const { error: appointmentError } = await supabase
            .from('appointments')
            .update({
                date: request.requested_date,  // Full timestamp
                time: newTime  // Just HH:MM format
            })
            .eq('id', request.appointment_id);

        if (appointmentError) {
            console.error('Error updating appointment:', appointmentError);
            return false;
        }
    }

    return true;
}
