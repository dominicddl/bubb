-- Add updated_at to topics for "most recently updated" ordering (D-12)
ALTER TABLE public.topics ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- RPC: Atomically assign a topic to a note + update note_count on old/new topics
CREATE OR REPLACE FUNCTION assign_topic_to_note(
  p_note_id UUID,
  p_topic_id UUID
) RETURNS void AS $$
DECLARE
  v_old_topic_id UUID;
BEGIN
  SELECT topic_id INTO v_old_topic_id FROM public.notes WHERE id = p_note_id AND user_id = auth.uid();

  UPDATE public.notes SET topic_id = p_topic_id WHERE id = p_note_id AND user_id = auth.uid();

  IF v_old_topic_id IS NOT NULL THEN
    UPDATE public.topics SET note_count = GREATEST(note_count - 1, 0), updated_at = now()
    WHERE id = v_old_topic_id AND user_id = auth.uid();
  END IF;

  UPDATE public.topics SET note_count = note_count + 1, updated_at = now()
  WHERE id = p_topic_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
