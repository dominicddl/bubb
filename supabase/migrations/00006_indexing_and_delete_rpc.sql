-- Composite index for duplicate detection in POST /notes
-- Covers: .eq("user_id", ...).eq("highlighted_text", ...).eq("source_url", ...)
CREATE INDEX IF NOT EXISTS idx_notes_user_highlighted_source
    ON public.notes (user_id, highlighted_text, source_url);

-- Composite index for case-insensitive topic name matching
-- Covers: .eq("user_id", ...).ilike("name", ...) in POST /topics and POST /topics/suggest
CREATE INDEX IF NOT EXISTS idx_topics_user_name
    ON public.topics (user_id, name);

-- RPC: Delete a note and decrement its topic's note_count atomically
-- Replaces the 3-query pattern in DELETE /notes/{id}
CREATE OR REPLACE FUNCTION delete_note_with_cleanup(p_note_id UUID)
RETURNS void AS $$
DECLARE
  v_topic_id UUID;
BEGIN
  -- Read the note's topic before deleting
  SELECT topic_id INTO v_topic_id
    FROM public.notes
    WHERE id = p_note_id AND user_id = auth.uid();

  -- Delete the note (RLS also enforces ownership)
  DELETE FROM public.notes
    WHERE id = p_note_id AND user_id = auth.uid();

  -- Decrement topic count if note had a topic
  IF v_topic_id IS NOT NULL THEN
    UPDATE public.topics
      SET note_count = GREATEST(note_count - 1, 0), updated_at = now()
      WHERE id = v_topic_id AND user_id = auth.uid();
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
