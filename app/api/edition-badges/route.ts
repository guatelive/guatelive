import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase.from('edition_places').select('badges');
    const seen = new Set<string>();
    (data ?? []).forEach(row => {
        ((row.badges as string[]) ?? []).forEach(b => seen.add(b));
    });
    return NextResponse.json([...seen].sort());
}
