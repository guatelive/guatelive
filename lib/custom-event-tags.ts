import { createClient } from '@/lib/supabase/server';
import { EVENT_TAG_GROUPS } from '@/lib/event-tags';
import type { TagGroup } from '@/components/admin/tag-picker';

// Tags creados a mano desde el CMS ("Agregar tag nuevo…") que no están en
// EVENT_TAG_GROUPS. Se leen de lo ya usado en events + activities para que un tag
// creado una vez aparezca como chip la próxima vez, sin tabla de tags aparte.
export async function getEventTagGroupsWithCustom(): Promise<TagGroup[]> {
    const supabase = await createClient();
    const [{ data: events }, { data: activities }] = await Promise.all([
        supabase.from('events').select('tags'),
        supabase.from('activities').select('tags'),
    ]);

    const known = new Set(EVENT_TAG_GROUPS.flatMap(g => g.tags));
    const custom = new Set<string>();
    for (const row of [...(events ?? []), ...(activities ?? [])]) {
        for (const tag of (row.tags ?? []) as string[]) {
            if (!known.has(tag)) custom.add(tag);
        }
    }

    if (custom.size === 0) return EVENT_TAG_GROUPS;
    return [...EVENT_TAG_GROUPS, { label: 'Creados por vos', tags: [...custom].sort() }];
}
