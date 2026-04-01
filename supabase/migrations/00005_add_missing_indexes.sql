-- Add composite indexes for common query patterns and missing FK index.
--
-- idx_notes_user_created: covers .eq("user_id", ...).order("created_at", desc=True)
--   used by GET /api/notes (notes.py)
--
-- idx_topics_user_updated: covers .eq("user_id", ...).order("updated_at", desc=True)
--   used by GET /api/topics (topics.py)
--
-- idx_user_preferences_user_id: FK column that was missing an index
--   needed for JOIN/lookup performance on user_preferences

CREATE INDEX idx_notes_user_created
    ON public.notes (user_id, created_at DESC);

CREATE INDEX idx_topics_user_updated
    ON public.topics (user_id, updated_at DESC);

CREATE INDEX idx_user_preferences_user_id
    ON public.user_preferences (user_id);
