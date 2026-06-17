import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data } = await supabase
        .from('editions')
        .select('slug, title, number')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(1)
        .single();

    if (!data) return NextResponse.json(null);
    return NextResponse.json(data);
}
