import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Note } from './useNotes';

function escapeIlike(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export function useSearch(query: string) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  return useQuery<Note[]>({
    queryKey: ['notes', 'search', debouncedQuery],
    queryFn: async () => {
      const escaped = escapeIlike(debouncedQuery);
      const pattern = `%${escaped}%`;
      const { data, error } = await getSupabase()
        .from('notes')
        .select('id, highlighted_text, explanation, source_url, page_title, topic_id, created_at, responses, conversation_history')
        .ilike('highlighted_text', pattern)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: debouncedQuery.length >= 2,
  });
}
