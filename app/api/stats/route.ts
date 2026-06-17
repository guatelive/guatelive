import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const COOKIE = 'glv_visited';
const COOKIE_TTL = 60 * 60 * 24;

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET() {
    try {
        const supabase = getSupabase();
        const cookieStore = await cookies();
        const hasVisited = cookieStore.get(COOKIE);

        let total: number = 0;

        if (!hasVisited) {
            const { data, error } = await supabase.rpc('increment_visits');
            if (error) throw error;
            total = (data as number) ?? 0;
        } else {
            const { data, error } = await supabase
                .from('site_stats')
                .select('total_visits')
                .eq('id', 1)
                .single();
            if (error) throw error;
            total = data?.total_visits ?? 0;
        }

        const res = NextResponse.json({ total_visits: total });

        if (!hasVisited) {
            res.cookies.set(COOKIE, '1', {
                maxAge: COOKIE_TTL,
                path: '/',
                sameSite: 'lax',
            });
        }

        return res;
    } catch {
        return NextResponse.json({ total_visits: null });
    }
}
