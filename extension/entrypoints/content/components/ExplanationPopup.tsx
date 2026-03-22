import { useEffect, useRef, useState, useCallback } from 'react';
import { PopupHeader } from './PopupHeader';
import { PopupBody } from './PopupBody';
import { PopupFooter } from './PopupFooter';
import { SaveToast } from './SaveToast';
import { MessageType } from '@/lib/messaging';
import type { ExplanationResponse } from '@/lib/messaging';
import { getSupabase } from '@/lib/supabase';

interface ExplanationPopupProps {
  selectedText: string;
  context: string;
  sourceUrl: string;
  pageTitle: string;
  position: { top: number; left: number };
  onClose: () => void;
  abortSignal?: AbortSignal;
}

export function ExplanationPopup({
  selectedText, context, sourceUrl, pageTitle, position, onClose, abortSignal
}: ExplanationPopupProps) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    chrome.runtime.sendMessage({ type: MessageType.GET_AUTH_STATE })
      .then((response: { isAuthenticated?: boolean }) => {
        setIsSignedIn(!!response?.isAuthenticated);
      })
      .catch(() => setIsSignedIn(false));
  }, []);

  const resetDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = setTimeout(onClose, 30000);
  }, [onClose]);

  useEffect(() => {
    resetDismissTimer();
    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [resetDismissTimer]);

  useEffect(() => {
    let cancelled = false;

    chrome.runtime.sendMessage(
      {
        type: MessageType.EXPLAIN_TEXT,
        payload: { text: selectedText, context, sourceUrl, pageTitle },
      }
    ).then(async (response: ExplanationResponse) => {
      if (cancelled) return;

      if (!response?.success || !response.explanation) {
        setError(response?.error || 'Failed to get explanation');
        setIsLoading(false);
        return;
      }

      setExplanation(response.explanation);
      setIsLoading(false);

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        if (session?.user) {
          setIsSignedIn(true);
          const { data, error: insertError } = await getSupabase()
            .from('notes')
            .insert({
              highlighted_text: selectedText,
              explanation: response.explanation,
              source_url: sourceUrl,
              page_title: pageTitle,
            })
            .select('id')
            .single();

          if (insertError) {
            console.error('[bubb] Failed to save note:', insertError);
            setSaveError(true);
          } else {
            setNoteId(data.id);
          }
        } else {
          setIsSignedIn(false);
        }
      } catch (err) {
        console.error('[bubb] Save error:', err);
        setSaveError(true);
      }
    }).catch((err: unknown) => {
      if (cancelled) return;
      setError('Something went wrong');
      setIsLoading(false);
    });

    const onAbort = () => { cancelled = true; };
    abortSignal?.addEventListener('abort', onAbort);
    return () => {
      cancelled = true;
      abortSignal?.removeEventListener('abort', onAbort);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUndo = async () => {
    if (!noteId) return;
    try {
      await getSupabase().from('notes').delete().eq('id', noteId);
      setNoteId(null);
    } catch (err) {
      console.error('[bubb] Undo failed:', err);
    }
  };

  const handleLogin = () => {
    chrome.runtime.sendMessage({ type: MessageType.SIGN_IN });
  };

  const handleRetrySave = async () => {
    if (!explanation) return;
    setSaveError(false);
    try {
      const { data, error: insertError } = await getSupabase()
        .from('notes')
        .insert({
          highlighted_text: selectedText,
          explanation,
          source_url: sourceUrl,
          page_title: pageTitle,
        })
        .select('id')
        .single();

      if (insertError) {
        setSaveError(true);
      } else {
        setNoteId(data.id);
      }
    } catch {
      setSaveError(true);
    }
  };

  return (
    <div
      onMouseEnter={resetDismissTimer}
      onMouseMove={resetDismissTimer}
      onClick={resetDismissTimer}
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: '400px',
        maxHeight: '300px',
      }}
    >
      <div className="flex flex-col rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
        <PopupHeader highlightedText={selectedText} onClose={onClose} />
        <PopupBody explanation={explanation} isLoading={isLoading} error={error} />
        <PopupFooter />
        {!isLoading && !error && (
          <SaveToast
            noteId={noteId}
            isSignedIn={isSignedIn}
            onUndo={handleUndo}
            onLogin={handleLogin}
            onRetrySave={handleRetrySave}
            saveError={saveError}
          />
        )}
      </div>
    </div>
  );
}
