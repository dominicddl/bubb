import { useQuery } from '@tanstack/react-query';
import { getSupabase } from '@/lib/supabase';
import type { ConversationTurn } from '@/lib/messaging';

export interface Note {
  id: string;
  highlighted_text: string;
  explanation: string;
  source_url: string;
  page_title: string | null;
  topic_id: string | null;
  created_at: string;
  responses: Record<string, string>;
  conversation_history: ConversationTurn[];
}

export function usePageNotes(sourceUrl: string | null) {
  return useQuery<Note[]>({
    queryKey: ['notes', 'page', sourceUrl],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notes')
        .select('id, highlighted_text, explanation, source_url, page_title, topic_id, created_at, responses, conversation_history')
        .eq('source_url', sourceUrl!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!sourceUrl,
  });
}

export function useTopicNotes(topicId: string | null) {
  return useQuery<Note[]>({
    queryKey: ['notes', 'topic', topicId],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from('notes')
        .select('id, highlighted_text, explanation, source_url, page_title, topic_id, created_at, responses, conversation_history')
        .eq('topic_id', topicId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!topicId,
  });
}

export function useNoteCount() {
  return useQuery<number>({
    queryKey: ['noteCount'],
    queryFn: async () => {
      const { count, error } = await getSupabase()
        .from('notes')
        .select('id', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}
