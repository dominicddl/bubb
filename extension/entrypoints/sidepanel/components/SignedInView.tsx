import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSupabase } from '@/lib/supabase';
import { useSidePanelStore } from '../stores/sidePanelStore';
import { SidePanelHeader } from './SidePanelHeader';
import { TabNav } from './TabNav';
import { EmptyState } from './EmptyState';

interface SignedInViewProps {
  userName: string;
  onSignOut: () => void;
}

export function SignedInView({ userName, onSignOut }: SignedInViewProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const activeTab = useSidePanelStore((s) => s.activeTab);
  const selectedTopicId = useSidePanelStore((s) => s.selectedTopicId);
  const isSearchOpen = useSidePanelStore((s) => s.isSearchOpen);

  // Fetch total note count for the header
  const { data: noteCount = 0, isLoading: isLoadingCount } = useQuery({
    queryKey: ['noteCount'],
    queryFn: async () => {
      const { count } = await getSupabase()
        .from('notes')
        .select('id', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  return (
    <div className="flex flex-col min-h-[480px]">
      <SidePanelHeader
        userName={userName}
        noteCount={noteCount}
        isLoadingCount={isLoadingCount}
      />

      {isSearchOpen ? (
        // Placeholder — Plan 03 implements full search overlay
        <div className="flex flex-col flex-1 px-7 pt-4">
          <p
            className="text-[12px]"
            style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
          >
            Search coming soon...
          </p>
        </div>
      ) : (
        <>
          <TabNav />
          <div className="flex flex-col flex-1">
            {selectedTopicId ? (
              // Placeholder — Plan 03 implements TopicDetailView
              <div className="flex flex-col flex-1 px-7 pt-4">
                <p
                  className="text-[12px]"
                  style={{ color: 'hsl(24 5% 52%)', fontFamily: 'var(--font-mono)' }}
                >
                  Topic detail coming soon...
                </p>
              </div>
            ) : activeTab === 'this-page' ? (
              <EmptyState
                heading="No notes on this page"
                body="Highlight text on this page to get an AI explanation. Your notes will appear here."
              />
            ) : (
              <EmptyState
                heading="No topics yet"
                body="As you save notes, AI will suggest topics to organize your learning."
              />
            )}
          </div>
        </>
      )}

      {/* Sign out footer */}
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
