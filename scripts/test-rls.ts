
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yuohwenofctcxdgqgtoo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1b2h3ZW5vZmN0Y3hkZ3FndG9vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MDE1NjcsImV4cCI6MjA4MjI3NzU2N30.KxcoGSm19zQ4jMIAgpASj7ASK8GfxpII9d0QMre-xnc';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function test() {
    console.log('Testing connection...');
    const { data, error } = await supabase
        .from('exercises')
        .select('name, video_url')
        .ilike('name', '%Leg Press%')
        .limit(5);

    if (error) {
        console.error('❌ RLS ERROR:', error);
    } else {
        console.log('✅ Success! Found exercises:', data?.length);
        if (data && data.length > 0) {
            console.log('First exercise:', data[0]);
        }
    }
}

test();
