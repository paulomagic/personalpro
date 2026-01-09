
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração Supabase - defina suas credenciais no arquivo .env
// @ts-ignore - Vite env
const SUPABASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || '';
// @ts-ignore - Vite env  
const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || '';

let supabase: SupabaseClient | null = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

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
        status: dbClient.status === 'inactive' ? 'paused' : dbClient.status,
        adherence: dbClient.adherence || 0,
        startDate: dbClient.created_at,
        lastTraining: 'Não registrado',
        observations: dbClient.observations,
        missedClasses: [],
        assessments: [],
        totalClasses: 0,
        completedClasses: 0,
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
    created_at: string;
}

// ============ CLIENTS ============

export async function getClients(coachId: string): Promise<DBClient[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
        .from('clients')
        .select('*, avatar:avatar_url')
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
        .select('*, avatar:avatar_url')
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

    console.log('[updateClient] Updating client:', clientId, 'with:', updates);

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

    console.log('[updateClient] Success:', data);
    return data;
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

    return data;
}

// Save AI-generated workout with metadata
export interface AIWorkoutMetadata {
    model: string;
    optionSelected?: string;
    generatedAt: string;
    clientData?: {
        injuries?: string;
        preferences?: string;
        adherence?: number;
    };
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

        // Get public URL
        const { data: urlData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(data.path);

        return urlData.publicUrl;
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
        const { error } = await supabase.storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);

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

// Get user profile by ID
export async function getUserProfile(userId: string): Promise<DBUserProfile | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        // Profile might not exist yet - this is expected for new users
        if (error.code !== 'PGRST116') {
            console.error('Error fetching user profile:', error);
        }
        return null;
    }

    return data;
}

// Create or update user profile
export async function upsertUserProfile(profile: Partial<DBUserProfile> & { id: string }): Promise<DBUserProfile | null> {
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
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 32; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
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
export async function getInvitationByToken(token: string): Promise<DBInvitation | null> {
    if (!supabase) return null;

    const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error('Error fetching invitation:', error);
        }
        return null;
    }

    return data;
}

// Accept invitation and convert user to student
export async function acceptInvitation(token: string, userId: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase not configured' };

    // Get invitation
    const invitation = await getInvitationByToken(token);
    if (!invitation) {
        return { success: false, error: 'Convite inválido ou expirado' };
    }

    // Update invitation status
    const { error: invError } = await supabase
        .from('invitations')
        .update({
            status: 'accepted',
            accepted_at: new Date().toISOString()
        })
        .eq('id', invitation.id);

    if (invError) {
        console.error('Error accepting invitation:', invError);
        return { success: false, error: 'Erro ao aceitar convite' };
    }

    // Create/update user profile as student
    const profile = await upsertUserProfile({
        id: userId,
        role: 'student',
        coach_id: invitation.coach_id,
        client_id: invitation.client_id
    });

    if (!profile) {
        return { success: false, error: 'Erro ao criar perfil' };
    }

    return { success: true };
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

    // Get today at midnight local time for filtering
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', clientId)
        .gte('date', today.toISOString())
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
