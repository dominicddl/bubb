import { useState, useCallback, useRef } from 'react';
import { LogOut } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageType } from '@/lib/messaging';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { usePageNotes } from '../hooks/useNotes';
import { useTopics } from '../hooks/useTopics';
import { useSidePanelStore } from '../stores/sidePanelStore';
import { SidePanelHeader } from './SidePanelHeader';
import { TabNav } from './TabNav';
import { EmptyState } from './EmptyState';
import { NoteListItem } from './NoteListItem';
import { TopicListItem } from './TopicListItem';
import { TopicDetailView } from './TopicDetailView';
import { SearchOverlay } from './SearchOverlay';
import { UndoToast } from './UndoToast';

interface SignedInViewProps {
  userName: string;
  onSignOut: () => void;
}

interface PendingDelete {
  type: 'note' | 'topic';
  id: string;
  label: string;
}

export function SignedInView({ userName, onSignOut }: SignedInViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();

  const tabInfo = useCurrentTab();
  const { data: pageNotes, isLoading: isLoadingPageNotes, error: pageNotesError } = usePageNotes(tabInfo?.url ?? null);
  const { data: topics, isLoading: isLoadingTopics, error: topicsError } = useTopics();
  const {
    activeTab,
    selectedTopicId,
    selectedTopicName,
    isSearchOpen,
    openTopic,
    closeTopic,
  } = useSidePanelStore();

  const pendingDeleteRef = useRef<PendingDelete | null>(null);

  const fireDelete = useCallback((pending: PendingDelete) => {
    const msg = pending.type === 'note'
      ? { type: MessageType.DELETE_NOTE, payload: { noteId: pending.id } }
      : { type: MessageType.DELETE_TOPIC, payload: { topicId: pending.id } };

    chrome.runtime.sendMessage(msg).then((resp: { success: boolean }) => {
      if (resp?.success) {
        // Invalidate topics so note_count refreshes from server
        queryClient.invalidateQueries({ queryKey: ['topics'] });
      }
    }).catch((err) => {
      console.error(`[bubb] Failed to delete ${pending.type}:`, err);
      queryClient.invalidateQueries({ queryKey: ['notes'] });
      queryClient.invalidateQueries({ queryKey: ['topics'] });
      queryClient.invalidateQueries({ queryKey: ['noteCount'] });
    });
  }, [queryClient]);

  // Flush the previous pending delete immediately (used when spamming delete)
  const flushPendingDelete = useCallback(() => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    const prev = pendingDeleteRef.current;
    if (prev) {
      fireDelete(prev);
      pendingDeleteRef.current = null;
    }
  }, [fireDelete]);

  const handleDeleteNote = useCallback((noteId: string) => {
    // Execute any previous pending delete immediately
    flushPendingDelete();

    // Find the note's label and topic_id from cache
    const allNoteQueries = queryClient.getQueriesData<{ id: string; highlighted_text: string; topic_id: string | null }[]>({ queryKey: ['notes'] });
    let label = 'Note';
    let topicId: string | null = null;
    for (const [, data] of allNoteQueries) {
      const found = data?.find((n) => n.id === noteId);
      if (found) {
        label = found.highlighted_text.length > 30
          ? found.highlighted_text.slice(0, 30) + '...'
          : found.highlighted_text;
        topicId = found.topic_id;
        break;
      }
    }

    // Optimistically remove from all note caches
    queryClient.setQueriesData<{ id: string }[]>({ queryKey: ['notes'] }, (old) =>
      old ? old.filter((n) => n.id !== noteId) : old,
    );
    queryClient.setQueryData<number>(['noteCount'], (old) =>
      old != null ? Math.max(0, old - 1) : old,
    );

    // Decrement the topic's note_count badge
    if (topicId) {
      queryClient.setQueryData<{ id: string; note_count: number }[]>(['topics'], (old) =>
        old?.map((t) =>
          t.id === topicId ? { ...t, note_count: Math.max(0, t.note_count - 1) } : t,
        ),
      );
    }

    const pending: PendingDelete = { type: 'note', id: noteId, label };
    pendingDeleteRef.current = pending;
    setPendingDelete(pending);
  }, [queryClient, flushPendingDelete]);

  const handleDeleteTopic = useCallback((topicId: string) => {
    flushPendingDelete();

    const topicsData = queryClient.getQueryData<{ id: string; name: string }[]>(['topics']);
    const label = topicsData?.find((t) => t.id === topicId)?.name ?? 'Topic';

    queryClient.setQueryData<{ id: string }[]>(['topics'], (old) =>
      old ? old.filter((t) => t.id !== topicId) : old,
    );

    if (selectedTopicId === topicId) {
      closeTopic();
    }

    const pending: PendingDelete = { type: 'topic', id: topicId, label };
    pendingDeleteRef.current = pending;
    setPendingDelete(pending);
  }, [queryClient, selectedTopicId, closeTopic, flushPendingDelete]);

  const handleUndoDelete = useCallback(() => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    pendingDeleteRef.current = null;
    setPendingDelete(null);
    // Refetch from server — item still exists there
    queryClient.invalidateQueries({ queryKey: ['notes'] });
    queryClient.invalidateQueries({ queryKey: ['topics'] });
    queryClient.invalidateQueries({ queryKey: ['noteCount'] });
  }, [queryClient]);

  const handleDeleteExpire = useCallback(() => {
    const pending = pendingDeleteRef.current;
    if (pending) {
      fireDelete(pending);
      pendingDeleteRef.current = null;
    }
    setPendingDelete(null);
  }, [fireDelete]);

  return (
    <div className="relative flex flex-col min-h-[480px] overflow-hidden">
      {/* Three-way conditional: search overlay, topic detail, or main view */}
      {isSearchOpen ? (
        <SearchOverlay />
      ) : selectedTopicId ? (
        <TopicDetailView
          topicId={selectedTopicId}
          topicName={selectedTopicName!}
          onBack={closeTopic}
          onDeleteTopic={handleDeleteTopic}
          onDeleteNote={handleDeleteNote}
        />
      ) : (
        <>
          <SidePanelHeader userName={userName} />

          <TabNav />

          <div className="flex flex-col flex-1 min-w-0">
            {activeTab === 'this-page' ? (
              isLoadingPageNotes ? (
                <div className="flex flex-col gap-2 px-7 py-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : pageNotesError ? (
                <EmptyState
                  heading="Could not load notes"
                  body="Check your connection and try again."
                />
              ) : pageNotes && pageNotes.length > 0 ? (
                <ScrollArea className="flex-1">
                  {pageNotes.map((note) => (
                    <NoteListItem key={note.id} note={note} onDelete={handleDeleteNote} />
                  ))}
                </ScrollArea>
              ) : (
                <EmptyState
                  heading="No notes on this page"
                  body="Highlight text on this page to get an AI explanation. Your notes will appear here."
                />
              )
            ) : (
              isLoadingTopics ? (
                <div className="flex flex-col gap-2 px-7 py-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : topicsError ? (
                <EmptyState
                  heading="Could not load topics"
                  body="Check your connection and try again."
                />
              ) : topics && topics.length > 0 ? (
                <ScrollArea className="flex-1">
                  {topics.map((topic) => (
                    <TopicListItem key={topic.id} topic={topic} onSelect={openTopic} onDelete={handleDeleteTopic} />
                  ))}
                </ScrollArea>
              ) : (
                <EmptyState
                  heading="No topics yet"
                  body="As you save notes, AI will suggest topics to organize your learning."
                />
              )
            )}
          </div>
        </>
      )}

      {/* Sign out footer — only shown in main view (not in overlays) */}
      {!isSearchOpen && !selectedTopicId && (
        <div className="mt-auto px-7 pb-6">
          <div className="h-px w-full mb-4" style={{ background: 'hsl(var(--border))' }} />

          {showConfirm ? (
            <div
              className="rounded-xl p-4 animate-[fadeIn_0.15s_ease-out]"
              style={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
              }}
            >
              <p
                className="text-[12px] font-medium mb-3 tracking-[0.02em]"
                style={{ fontFamily: 'var(--font-sans)', color: 'hsl(24 8% 28%)' }}
              >
                Sign out of bubb?
              </p>
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  className="h-8 text-[11px] rounded-lg px-4"
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.03em' }}
                  onClick={() => { setShowConfirm(false); onSignOut(); }}
                >
                  Sign out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-[11px] rounded-lg px-4"
                  onClick={() => setShowConfirm(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 text-[11px] hover:opacity-60 transition-opacity"
              style={{
                color: 'hsl(24 5% 52%)',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.03em',
              }}
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          )}
        </div>
      )}

      {pendingDelete && (
        <UndoToast
          key={pendingDelete.id}
          message={`Deleted "${pendingDelete.label}"`}
          onUndo={handleUndoDelete}
          onExpire={handleDeleteExpire}
        />
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(8px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
