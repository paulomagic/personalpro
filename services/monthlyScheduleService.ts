import { supabase } from './supabaseClient';
import { MonthlyScheduleConfig, MonthlyScheduleBatch, ConflictInfo } from '../types';

/**
 * Generate dates for a month based on weekly pattern
 * @param year Year (e.g., 2026)
 * @param month Month (1-12)
 * @param weekDays Array of weekdays (1=MON, 7=SUN)
 * @param exceptions Array of date strings to exclude (ISO format)
 * @returns Array of Date objects
 */
export function generateMonthlyDates(
    year: number,
    month: number,
    weekDays: number[],
    exceptions: string[] = []
): Date[] {
    const dates: Date[] = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const dayOfWeek = date.getDay(); // 0=SUN, 1=MON, ..., 6=SAT

        // Convert to Monday-based (1=MON, 7=SUN)
        const mondayBased = dayOfWeek === 0 ? 7 : dayOfWeek;

        // Check if this day is in the pattern
        if (weekDays.includes(mondayBased)) {
            const dateStr = date.toISOString().split('T')[0];

            // Check if not in exceptions
            if (!exceptions.includes(dateStr)) {
                dates.push(date);
            }
        }
    }

    return dates;
}

/**
 * Detect scheduling conflicts for given dates and times
 */
export async function detectScheduleConflicts(
    coachId: string,
    dates: Date[],
    times: Record<number, string>
): Promise<ConflictInfo[]> {
    const conflicts: ConflictInfo[] = [];

    for (const date of dates) {
        const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
        const time = times[dayOfWeek];

        if (!time) continue;

        const dateStr = date.toISOString().split('T')[0];

        // Check for existing appointments
        const { data: existingAppointments, error } = await supabase
            .from('appointments')
            .select(`
        id,
        time,
        client_id,
        clients:client_id (
          name
        ),
        type
      `)
            .eq('coach_id', coachId)
            .eq('date', dateStr)
            .eq('time', time);

        if (error) {
            console.error('Error checking conflicts:', error);
            continue;
        }

        if (existingAppointments && existingAppointments.length > 0) {
            const existing = existingAppointments[0];
            conflicts.push({
                date: dateStr,
                time: time,
                conflictingAppointment: {
                    id: existing.id,
                    clientName: (existing.clients as any)?.name || 'Unknown',
                    type: existing.type
                },
                suggestedAlternatives: generateAlternativeTimes(time)
            });
        }
    }

    return conflicts;
}

/**
 * Generate alternative time suggestions
 */
function generateAlternativeTimes(originalTime: string): string[] {
    const [hours, minutes] = originalTime.split(':').map(Number);
    const alternatives: string[] = [];

    // Suggest +1h, +2h, -1h
    for (const offset of [1, 2, -1]) {
        const newHour = hours + offset;
        if (newHour >= 6 && newHour <= 22) {
            alternatives.push(`${String(newHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
        }
    }

    return alternatives;
}

/**
 * Create a batch of monthly appointments
 */
export async function createMonthlyScheduleBatch(
    coachId: string,
    config: MonthlyScheduleConfig
): Promise<MonthlyScheduleBatch | null> {
    try {
        // 1. Generate dates based on pattern
        let dates: Date[] = [];

        if (config.patternType === 'weekly' && config.weekDays && config.times) {
            dates = generateMonthlyDates(
                config.year,
                config.month,
                config.weekDays,
                config.exceptions
            );
        } else if (config.patternType === 'specific_dates' && config.specificDates) {
            dates = config.specificDates.map(d => new Date(d));
        }

        if (dates.length === 0) {
            throw new Error('No dates generated');
        }

        // 2. Check for conflicts with existing appointments
        const dateStrings = dates.map(d => d.toISOString().split('T')[0]);
        const timeValues = Object.values(config.times || {});

        const { data: existingAppointments, error: conflictError } = await supabase
            .from('appointments')
            .select('date, time')
            .eq('coach_id', coachId)
            .in('date', dateStrings)
            .in('time', timeValues)
            .neq('status', 'cancelled');

        if (conflictError) {
            console.error('Error checking conflicts:', conflictError);
        }

        if (existingAppointments && existingAppointments.length > 0) {
            const conflicts = existingAppointments.map(a => `${a.date} às ${a.time}`).join(', ');
            throw new Error(`Conflito de horário! Já existem agendamentos em: ${conflicts}`);
        }

        // 2. Create batch record
        const { data: batch, error: batchError } = await supabase
            .from('monthly_schedule_batches')
            .insert({
                coach_id: coachId,
                client_id: config.clientId,
                month: config.month,
                year: config.year,
                total_sessions: dates.length,
                pattern_type: config.patternType,
                week_days: config.weekDays || null,
                times: config.times || null,
                session_type: config.sessionType,
                duration: config.duration,
                exceptions: config.exceptions || []
            })
            .select()
            .single();

        if (batchError) {
            console.error('Error creating batch:', batchError);
            throw batchError;
        }

        // 3. Create appointments in batch
        const appointments = dates.map(date => {
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
            const time = config.times?.[dayOfWeek] || config.times?.[Object.keys(config.times)[0] as any] || '09:00';

            return {
                coach_id: coachId,
                client_id: config.clientId,
                date: date.toISOString().split('T')[0],
                time: time,
                duration: config.duration,
                type: config.sessionType,
                status: 'confirmed',
                batch_id: batch.id
            };
        });

        const { error: appointmentsError } = await supabase
            .from('appointments')
            .insert(appointments);

        if (appointmentsError) {
            console.error('Error creating appointments:', appointmentsError);
            // Rollback: delete batch
            await supabase.from('monthly_schedule_batches').delete().eq('id', batch.id);
            throw appointmentsError;
        }

        // 4. Save as template if requested
        if (config.saveAsTemplate && config.templateName) {
            await supabase
                .from('monthly_schedule_templates')
                .insert({
                    coach_id: coachId,
                    client_id: config.clientId,
                    name: config.templateName,
                    pattern_type: config.patternType,
                    week_days: config.weekDays || null,
                    times: config.times || null,
                    session_type: config.sessionType,
                    duration: config.duration,
                    is_active: true,
                    last_used_at: new Date().toISOString()
                });
        }

        return batch;
    } catch (error) {
        console.error('Error in createMonthlyScheduleBatch:', error);
        return null;
    }
}

/**
 * Update a monthly schedule batch
 */
export async function updateMonthlyScheduleBatch(
    batchId: string,
    updates: Partial<MonthlyScheduleConfig>
): Promise<boolean> {
    try {
        // Get existing batch
        const { data: batch, error: fetchError } = await supabase
            .from('monthly_schedule_batches')
            .select('*')
            .eq('id', batchId)
            .single();

        if (fetchError || !batch) {
            console.error('Error fetching batch:', fetchError);
            return false;
        }

        // Delete existing appointments
        await supabase
            .from('appointments')
            .delete()
            .eq('batch_id', batchId);

        // Recreate with new configuration
        const config: MonthlyScheduleConfig = {
            clientId: batch.client_id,
            patternType: updates.patternType || batch.pattern_type || 'weekly',
            month: batch.month,
            year: batch.year,
            weekDays: updates.weekDays || batch.week_days || [],
            times: updates.times || batch.times || {},
            sessionType: (updates.sessionType || batch.session_type || 'training') as any,
            duration: updates.duration || batch.duration || '1h',
            exceptions: updates.exceptions || batch.exceptions || []
        };

        // Generate new dates
        let dates: Date[] = [];
        if (config.patternType === 'weekly' && config.weekDays && config.times) {
            dates = generateMonthlyDates(
                config.year,
                config.month,
                config.weekDays,
                config.exceptions
            );
        }

        // Create new appointments
        const appointments = dates.map(date => {
            const dayOfWeek = date.getDay() === 0 ? 7 : date.getDay();
            const time = config.times?.[dayOfWeek] || '09:00';

            return {
                coach_id: batch.coach_id,
                client_id: config.clientId,
                date: date.toISOString().split('T')[0],
                time: time,
                duration: config.duration,
                type: config.sessionType,
                status: 'confirmed',
                batch_id: batchId
            };
        });

        const { error: appointmentsError } = await supabase
            .from('appointments')
            .insert(appointments);

        if (appointmentsError) {
            console.error('Error updating appointments:', appointmentsError);
            return false;
        }

        // Update batch metadata
        await supabase
            .from('monthly_schedule_batches')
            .update({
                week_days: config.weekDays,
                times: config.times,
                session_type: config.sessionType,
                duration: config.duration,
                exceptions: config.exceptions,
                total_sessions: dates.length
            })
            .eq('id', batchId);

        return true;
    } catch (error) {
        console.error('Error in updateMonthlyScheduleBatch:', error);
        return false;
    }
}

/**
 * Delete a monthly schedule batch and all associated appointments
 */
export async function deleteMonthlyScheduleBatch(batchId: string): Promise<boolean> {
    try {
        // Delete appointments (cascade will handle this, but being explicit)
        await supabase
            .from('appointments')
            .delete()
            .eq('batch_id', batchId);

        // Delete batch
        const { error } = await supabase
            .from('monthly_schedule_batches')
            .delete()
            .eq('id', batchId);

        if (error) {
            console.error('Error deleting batch:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteMonthlyScheduleBatch:', error);
        return false;
    }
}

/**
 * Get appointments for a batch
 */
export async function getAppointmentsByBatch(batchId: string) {
    const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('batch_id', batchId)
        .order('date', { ascending: true });

    if (error) {
        console.error('Error fetching batch appointments:', error);
        return [];
    }

    return data || [];
}

/**
 * Get monthly batches for a client in a specific month
 */
export async function getMonthlyBatches(
    clientId: string,
    year: number,
    month: number
): Promise<MonthlyScheduleBatch[]> {
    const { data, error } = await supabase
        .from('monthly_schedule_batches')
        .select('*')
        .eq('client_id', clientId)
        .eq('year', year)
        .eq('month', month);

    if (error) {
        console.error('Error fetching monthly batches:', error);
        return [];
    }

    return data || [];
}

/**
 * Get all monthly batches for a coach in a specific month
 */
export async function getAllBatchesForCoach(
    coachId: string,
    year: number,
    month: number
): Promise<MonthlyScheduleBatch[]> {
    const { data, error } = await supabase
        .from('monthly_schedule_batches')
        .select('*')
        .eq('coach_id', coachId)
        .eq('year', year)
        .eq('month', month);

    if (error) {
        console.error('Error fetching coach batches:', error);
        return [];
    }

    return data || [];
}

/**
 * Get active templates for a client
 */
export async function getTemplatesForClient(
    coachId: string,
    clientId: string
) {
    const { data, error } = await supabase
        .from('monthly_schedule_templates')
        .select('*')
        .eq('coach_id', coachId)
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

    if (error) {
        console.error('Error fetching templates:', error);
        return [];
    }

    return data || [];
}
