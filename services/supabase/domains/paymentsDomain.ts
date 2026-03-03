import { supabase } from '../../supabaseCore';

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

export async function getPayments(coachId: string, status?: string): Promise<Payment[]> {
    if (!supabase) return [];
    let query = supabase
        .from('payments')
        .select('*, clients(name, avatar_url, phone)')
        .eq('coach_id', coachId)
        .order('due_date');
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) {
        console.error('Error fetching payments:', error);
        return [];
    }
    return data || [];
}

export async function createPayment(payment: Omit<Payment, 'id' | 'created_at'>): Promise<Payment | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('payments').insert(payment).select().single();
    if (error) {
        console.error('Error creating payment:', error);
        return null;
    }
    return data;
}

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
