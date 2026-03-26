-- Add JSONB columns for full history storage
ALTER TABLE notes
  ADD COLUMN responses jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN conversation_history jsonb NOT NULL DEFAULT '[]';

-- RPC for atomic JSONB merge (avoids read-modify-write race).
-- LANGUAGE sql executes with caller's permissions, so existing RLS
-- on notes ensures users can only update their own notes.
CREATE OR REPLACE FUNCTION merge_note_responses(
  note_id uuid,
  new_responses jsonb
) RETURNS void AS $$
  UPDATE notes SET responses = responses || new_responses WHERE id = note_id;
$$ LANGUAGE sql;

-- RPC for atomic conversation_history append.
CREATE OR REPLACE FUNCTION append_conversation_turn(
  note_id uuid,
  turn jsonb
) RETURNS void AS $$
  UPDATE notes SET conversation_history = conversation_history || turn WHERE id = note_id;
$$ LANGUAGE sql;
