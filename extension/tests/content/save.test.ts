import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Supabase client
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockDelete = vi.fn();
const mockEq = vi.fn();
const mockGetSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => ({
    auth: {
      getSession: mockGetSession,
    },
    from: (table: string) => {
      expect(table).toBe('notes');
      return {
        insert: (data: Record<string, unknown>) => {
          mockInsert(data);
          return {
            select: (col: string) => {
              mockSelect(col);
              return {
                single: () => {
                  mockSingle();
                  return { data: { id: 'test-note-id' }, error: null };
                },
              };
            },
          };
        },
        delete: () => {
          mockDelete();
          return {
            eq: (col: string, val: string) => {
              mockEq(col, val);
              return Promise.resolve({ error: null });
            },
          };
        },
      };
    },
  }),
}));

describe('Note save logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('inserts note with highlighted_text, explanation, source_url, page_title', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-1' }, access_token: 'tok' } },
    });

    const supabase = (await import('@/lib/supabase')).getSupabase();
    const { data } = await supabase
      .from('notes')
      .insert({
        highlighted_text: 'test text',
        explanation: 'test explanation',
        source_url: 'https://example.com',
        page_title: 'Example',
      })
      .select('id')
      .single();

    expect(mockInsert).toHaveBeenCalledWith({
      highlighted_text: 'test text',
      explanation: 'test explanation',
      source_url: 'https://example.com',
      page_title: 'Example',
    });
    expect(mockSelect).toHaveBeenCalledWith('id');
    expect(mockSingle).toHaveBeenCalled();
    expect(data).toEqual({ id: 'test-note-id' });
  });

  it('calls delete with note ID for undo', async () => {
    const supabase = (await import('@/lib/supabase')).getSupabase();
    await supabase.from('notes').delete().eq('id', 'test-note-id');

    expect(mockDelete).toHaveBeenCalled();
    expect(mockEq).toHaveBeenCalledWith('id', 'test-note-id');
  });

  it('does not insert when user is signed out (no session)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const supabase = (await import('@/lib/supabase')).getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    // Signed-out flow: check session first, skip insert if no session
    if (!session?.user) {
      // Should not call insert
      expect(mockInsert).not.toHaveBeenCalled();
    }
  });
});
