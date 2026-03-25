import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';

export interface Topic {
  id: string;
  name: string;
  note_count: number;
  created_at: string;
  updated_at: string;
}

export function useTopics() {
  return useQuery<Topic[]>({
    queryKey: ['topics'],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('topics')
        .select('id, name, note_count, created_at, updated_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}
