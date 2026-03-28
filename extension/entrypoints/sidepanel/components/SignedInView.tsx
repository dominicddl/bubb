import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentTab } from '../hooks/useCurrentTab';
import { usePageNotes, useNoteCount } from '../hooks/useNotes';
import { useTopics } from '../hooks/useTopics';
import { useSidePanelStore } from '../stores/sidePanelStore';
import { SidePanelHeader } from './SidePanelHeader';
import { TabNav } from './TabNav';
import { EmptyState } from './EmptyState';
import { NoteListItem } from './NoteListItem';
import { TopicListItem } from './TopicListItem';
import { TopicDetailView } from './TopicDetailView';
import { SearchOverlay } from './SearchOverlay';

interface SignedInViewProps {
  userName: string;
  onSignOut: () => void;
}

export function SignedInView({ userName, onSignOut }: SignedInViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const tabInfo = useCurrentTab();
  const { data: pageNotes, isLoading: isLoadingPageNotes, error: pageNotesError } = usePageNotes(tabInfo?.url ?? null);
  const { data: topics, isLoading: isLoadingTopics, error: topicsError } = useTopics();
  const { data: noteCount = 0, isLoading: isLoadingCount } = useNoteCount();

  const {
    activeTab,
    selectedTopicId,
    selectedTopicName,
    isSearchOpen,
    openTopic,
    closeTopic,
  } = useSidePanelStore();

  return (
    <div className="flex flex-col min-h-[480px] overflow-hidden">
      {/* Three-way conditional: search overlay, topic detail, or main view */}
      {isSearchOpen ? (
        <SearchOverlay />
      ) : selectedTopicId ? (
        <TopicDetailView
          topicId={selectedTopicId}
          topicName={selectedTopicName!}
          onBack={closeTopic}
        />
      ) : (
        <>
          <SidePanelHeader
            userName={userName}
            noteCount={noteCount}
            isLoadingCount={isLoadingCount}
          />

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
                    <NoteListItem key={note.id} note={note} />
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
                    <TopicListItem key={topic.id} topic={topic} onSelect={openTopic} />
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
