import { useEffect, useRef, useState, useCallback } from 'react';
import { PopupHeader } from './PopupHeader';
import { PopupBody } from './PopupBody';
import { PopupFooter } from './PopupFooter';
import { SaveToast } from './SaveToast';
import { DepthToggle } from './DepthToggle';
import { ChatThread } from './ChatThread';
import { MessageType } from '@/lib/messaging';
import type { DepthLevel, Provider, ConversationTurn } from '@/lib/messaging';
import type { StreamPort } from '../lib/streaming';
import { openStreamPort } from '../lib/streaming';
import { getSupabase } from '@/lib/supabase';

interface ExplanationPopupProps {
  selectedText: string;
  context: string;
  sourceUrl: string;
  pageTitle: string;
  position: { top: number; left: number };
  onClose: () => void;
  abortSignal?: AbortSignal;
  initialCache?: Record<DepthLevel, string>;
  onCacheUpdate?: (cache: Record<DepthLevel, string>) => void;
}

export function ExplanationPopup({
  selectedText, context, sourceUrl, pageTitle, position, onClose, abortSignal,
  initialCache, onCacheUpdate,
}: ExplanationPopupProps) {
  const hasCachedResult = initialCache && Object.values(initialCache).some(v => v.length > 0);
  const [activeDepth, setActiveDepth] = useState<DepthLevel>('simple');
  const [activeProvider, setActiveProvider] = useState<Provider>('openai');
  const [depthCache, setDepthCache] = useState<Record<DepthLevel, string>>(
    hasCachedResult ? initialCache : { simple: '', standard: '', deep: '' },
  );
  const [depthStreaming, setDepthStreaming] = useState<Record<DepthLevel, boolean>>(
    hasCachedResult
      ? { simple: !initialCache.simple, standard: !initialCache.standard, deep: !initialCache.deep }
      : { simple: true, standard: true, deep: true },
  );
  const [depthErrors, setDepthErrors] = useState<Record<DepthLevel, string | null>>({
    simple: null,
    standard: null,
    deep: null,
  });
  const [thread, setThread] = useState<Array<ConversationTurn & { isStreaming: boolean }>>([]);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);
  const saveAttemptedRef = useRef(false);

  const streamPortRef = useRef<StreamPort | null>(null);
  const followUpDepthRef = useRef<DepthLevel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<Provider>('openai');

  // Track active provider in ref for use inside stable port callbacks
  useEffect(() => {
    providerRef.current = activeProvider;
  }, [activeProvider]);

  // Auth state
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

  // Auto-scroll on new content (use scrollTop, not scrollIntoView — the latter
  // scrolls ALL ancestor containers including the host page, causing the page to jump)
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!userScrolledUpRef.current && container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [depthCache, thread]);

  // When switching depths, always scroll to bottom so user sees the chat thread
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeDepth]);

  // Track user scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const distFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      userScrolledUpRef.current = distFromBottom > 50;
    };
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  // Build callbacks outside the effect so they stay stable per port instance
  const openPort = useCallback((provider: Provider) => {
    const onChunk = (depth: DepthLevel, token: string) => {
      if (followUpDepthRef.current === depth) {
        setThread(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, answer: last.answer + token };
          return updated;
        });
      } else {
        setDepthCache(prev => ({ ...prev, [depth]: prev[depth] + token }));
      }
    };

    const onEnd = (depth: DepthLevel) => {
      if (followUpDepthRef.current === depth) {
        followUpDepthRef.current = null;
        setThread(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) updated[updated.length - 1] = { ...last, isStreaming: false };
          return updated;
        });
      } else {
        setDepthStreaming(prev => ({ ...prev, [depth]: false }));
      }
    };

    const onError = (depth: DepthLevel, error: string) => {
      if (followUpDepthRef.current === depth) {
        followUpDepthRef.current = null;
        setThread(prev => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last) {
            updated[updated.length - 1] = {
              ...last,
              isStreaming: false,
              answer: last.answer + ' [Error: ' + error + ']',
            };
          }
          return updated;
        });
      } else {
        setDepthErrors(prev => ({ ...prev, [depth]: error }));
        setDepthStreaming(prev => ({ ...prev, [depth]: false }));
      }
    };

    const streamPort = openStreamPort({ onChunk, onEnd, onError });
    streamPortRef.current = streamPort;

    // Fire 3 parallel depth requests
    (['simple', 'standard', 'deep'] as DepthLevel[]).forEach(depth => {
      streamPort.requestExplanation({
        text: selectedText,
        context,
        sourceUrl,
        pageTitle,
        depth,
        provider,
      });
    });

    return streamPort;
  }, [selectedText, context, sourceUrl, pageTitle]);

  // Initial port lifecycle — skip if we have cached results
  useEffect(() => {
    if (abortSignal?.aborted || hasCachedResult) return;

    const streamPort = openPort(activeProvider);

    const onAbort = () => streamPort.disconnect();
    abortSignal?.addEventListener('abort', onAbort);

    return () => {
      streamPort.disconnect();
      abortSignal?.removeEventListener('abort', onAbort);
    };
  }, [selectedText]); // eslint-disable-line react-hooks/exhaustive-deps

  // Persist completed explanations to external cache
  useEffect(() => {
    const allDone = !depthStreaming.simple && !depthStreaming.standard && !depthStreaming.deep;
    const hasContent = depthCache.simple || depthCache.standard || depthCache.deep;
    if (allDone && hasContent && onCacheUpdate) {
      onCacheUpdate(depthCache);
    }
  }, [depthStreaming, depthCache, onCacheUpdate]);

  // Auto-save after simple explanation finishes streaming
  useEffect(() => {
    if (!depthStreaming.simple && depthCache.simple.length > 0 && !saveAttemptedRef.current) {
      saveAttemptedRef.current = true;
      const saveNote = async () => {
        try {
          const { data: { session } } = await getSupabase().auth.getSession();
          if (session?.user) {
            setIsSignedIn(true);
            const { data, error: insertError } = await getSupabase()
              .from('notes')
              .insert({
                highlighted_text: selectedText,
                explanation: depthCache.simple,
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
      };
      saveNote();
    }
  }, [depthStreaming.simple]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDepthChange = useCallback((newDepth: DepthLevel) => {
    setActiveDepth(newDepth);
  }, []);

  const handleProviderChange = useCallback((newProvider: Provider) => {
    setActiveProvider(newProvider);
    providerRef.current = newProvider;

    // Disconnect existing port
    streamPortRef.current?.disconnect();
    streamPortRef.current = null;

    // Reset all depth state
    setDepthCache({ simple: '', standard: '', deep: '' });
    setDepthStreaming({ simple: true, standard: true, deep: true });
    setDepthErrors({ simple: null, standard: null, deep: null });
    // Thread is preserved per D-17

    // Open new port and fire requests
    openPort(newProvider);
  }, [openPort]);

  const handleFollowUp = useCallback((inputText: string) => {
    if (thread.length >= 3) return;
    if (followUpDepthRef.current !== null) return;
    if (!streamPortRef.current) return;

    const currentDepth = activeDepth;
    // Always include the initial explanation as the first conversation turn
    // so the AI knows what it already told the user and avoids repeating itself
    const initialTurn: ConversationTurn = {
      question: selectedText,
      answer: depthCache[currentDepth],
    };
    const priorTurns = thread
      .filter(t => !t.isStreaming)
      .map(({ question, answer }) => ({ question, answer }));
    const completedTurns = [initialTurn, ...priorTurns];

    // Add new turn
    setThread(prev => [...prev, { question: inputText, answer: '', isStreaming: true }]);
    followUpDepthRef.current = currentDepth;

    streamPortRef.current.requestFollowUp({
      text: selectedText,
      context,
      sourceUrl,
      pageTitle,
      depth: currentDepth,
      provider: providerRef.current,
      conversationHistory: completedTurns,
      followUpQuestion: inputText,
    });
  }, [thread, activeDepth, selectedText, context, sourceUrl, pageTitle]);

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
    if (!depthCache.simple) return;
    setSaveError(false);
    try {
      const { data, error: insertError } = await getSupabase()
        .from('notes')
        .insert({
          highlighted_text: selectedText,
          explanation: depthCache.simple,
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

  // Derived: is anything streaming that should block follow-up input?
  const anyStreaming = depthStreaming[activeDepth] || followUpDepthRef.current !== null;

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
        maxHeight: '500px',
      }}
    >
      <div className="flex flex-col rounded-[12px] border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[0_4px_24px_rgba(0,0,0,0.12)] overflow-hidden">
        <PopupHeader highlightedText={selectedText} onClose={onClose} />
        <DepthToggle
          activeDepth={activeDepth}
          onDepthChange={handleDepthChange}
          errorDepths={depthErrors}
        />
        <div
          className="overflow-y-auto"
          style={{ maxHeight: '380px' }}
          ref={scrollContainerRef}
        >
          <PopupBody
            explanationText={depthCache[activeDepth]}
            isStreaming={depthStreaming[activeDepth]}
            error={depthErrors[activeDepth]}
            isLoading={!depthCache[activeDepth] && depthStreaming[activeDepth]}
          />
          {thread.length > 0 && (
            <ChatThread
              turns={thread}
              followUpCapReached={thread.length >= 3}
              bottomRef={bottomRef}
            />
          )}
          <div ref={bottomRef} />
        </div>
        <PopupFooter
          onSendFollowUp={handleFollowUp}
          isStreaming={anyStreaming}
          followUpCapReached={thread.length >= 3}
          activeProvider={activeProvider}
          onProviderChange={handleProviderChange}
        />
        {saveAttemptedRef.current && (noteId || saveError || !isSignedIn) && (
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
