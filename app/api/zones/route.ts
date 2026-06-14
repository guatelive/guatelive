import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
        .from('places')
        .select('zone')
        .eq('is_published', true)
        .not('zone', 'is', null);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Contar manualmente por zona
    const counts: Record<string, number> = {};
    for (const row of data ?? []) {
        const z = (row.zone as string).trim();
        if (z) counts[z] = (counts[z] ?? 0) + 1;
    }

    const zones = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map(([zone, count]) => ({ zone, count }));

    return NextResponse.json(zones, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
}
