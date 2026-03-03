import { supabase } from '../../supabaseCore';

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

export async function getAppointments(coachId: string, date?: string): Promise<Appointment[]> {
    if (!supabase) return [];

    let query = supabase
        .from('appointments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .neq('status', 'cancelled')
        .order('date')
        .order('time');

    if (date) query = query.eq('date', date);

    const { data, error } = await query;
    if (error) {
        console.error('Error fetching appointments:', error);
        return [];
    }
    return data || [];
}

export async function createAppointment(appointment: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('appointments').insert(appointment).select().single();
    if (error) {
        console.error('Error creating appointment:', error);
        return null;
    }
    return data;
}

export async function updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('appointments').update(updates).eq('id', id).select().single();
    if (error) {
        console.error('Error updating appointment:', error);
        return null;
    }
    return data;
}

export async function deleteAppointment(id: string): Promise<boolean> {
    if (!supabase) return false;
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) {
        console.error('Error deleting appointment:', error);
        return false;
    }
    return true;
}

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

export async function deleteAppointmentsBulk(ids: string[]): Promise<boolean> {
    if (!supabase || ids.length === 0) return false;
    const { error } = await supabase.from('appointments').delete().in('id', ids);
    if (error) {
        console.error('Error bulk deleting appointments:', error);
        return false;
    }
    return true;
}

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
    return (data || []).map(req => ({ ...req, client_name: req.clients?.name }));
}

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

export async function respondToRescheduleRequest(
    requestId: string,
    approved: boolean,
    responseNote?: string
): Promise<boolean> {
    if (!supabase) return false;

    const { data: request, error: fetchError } = await supabase
        .from('reschedule_requests')
        .select('*')
        .eq('id', requestId)
        .single();

    if (fetchError || !request) {
        console.error('Error fetching request:', fetchError);
        return false;
    }

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

    if (approved) {
        const [_datePart, timePart] = request.requested_date.split('T');
        const newTime = timePart ? timePart.slice(0, 5) : '00:00';

        const { error: appointmentError } = await supabase
            .from('appointments')
            .update({
                date: request.requested_date,
                time: newTime
            })
            .eq('id', request.appointment_id);

        if (appointmentError) {
            console.error('Error updating appointment:', appointmentError);
            return false;
        }
    }

    return true;
}
