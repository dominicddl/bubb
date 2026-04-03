import { useEffect, useRef, useState, useCallback } from 'react';
import { PopupHeader } from './PopupHeader';
import { PopupBody } from './PopupBody';
import { PopupFooter } from './PopupFooter';
import { SaveToast } from './SaveToast';
import { TopicSuggestionChip } from './TopicSuggestionChip';
import { DepthToggle } from './DepthToggle';
import { ChatThread } from './ChatThread';
import { MessageType } from '@/lib/messaging';
import type { DepthLevel, Provider, ConversationTurn } from '@/lib/messaging';
import type { StreamPort } from '../lib/streaming';
import { openStreamPort } from '../lib/streaming';

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
  isOnboarding?: boolean;
}

export function ExplanationPopup({
  selectedText, context, sourceUrl, pageTitle, position, onClose, abortSignal,
  initialCache, onCacheUpdate, isOnboarding,
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
  const [topicSuggestion, setTopicSuggestion] = useState<{
    suggestedTopic: string;
    isExisting: boolean;
    existingTopicId: string | null;
  } | null>(null);
  const [isLoadingTopic, setIsLoadingTopic] = useState(false);
  const [showTopicSpinner, setShowTopicSpinner] = useState(false);
  const [topicFlowComplete, setTopicFlowComplete] = useState(false);

  // Onboarding cursor guidance state
  type OnboardingCursorStep = 'waiting' | 'point-followup' | 'waiting-for-stream' | 'point-login' | 'done';
  const [onboardingCursor, setOnboardingCursor] = useState<OnboardingCursorStep>(
    isOnboarding ? 'waiting' : 'done',
  );
  const popupRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const saveToastRef = useRef<HTMLDivElement>(null);

  const streamPortRef = useRef<StreamPort | null>(null);
  const followUpDepthRef = useRef<DepthLevel | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const userScrolledUpRef = useRef(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerRef = useRef<Provider>('openai');
  const pendingResponsesRef = useRef<Record<string, string>>({});
  const pendingChatTurnsRef = useRef<Array<{ question: string; answer: string }>>([]);
  const prevDepthStreamingRef = useRef(depthStreaming);

  // Track active provider in ref for use inside stable port callbacks
  useEffect(() => {
    providerRef.current = activeProvider;
  }, [activeProvider]);

  // Auth state — check on mount and listen for changes from background
  useEffect(() => {
    chrome.runtime.sendMessage({ type: MessageType.GET_AUTH_STATE })
      .then((response: { isAuthenticated?: boolean }) => {
        setIsSignedIn(!!response?.isAuthenticated);
      })
      .catch(() => setIsSignedIn(false));

    const authListener = (message: { type: string; payload?: { isAuthenticated?: boolean } }) => {
      if (message.type === MessageType.AUTH_STATE_CHANGED && message.payload?.isAuthenticated) {
        setIsSignedIn(true);
        setSaveError(false);
        // If we have unsaved content, retry the save immediately
        if (saveAttemptedRef.current && depthCache.simple.length > 0) {
          (async () => {
            try {
              const saveResponse = await chrome.runtime.sendMessage({
                type: MessageType.SAVE_NOTE,
                payload: {
                  highlighted_text: selectedText,
                  explanation: depthCache.simple,
                  source_url: sourceUrl,
                  page_title: pageTitle,
                  responses: { simple: depthCache.simple },
                },
              });
              if (saveResponse?.success) {
                setNoteId(saveResponse.id);
                chrome.runtime.sendMessage({
                  type: MessageType.NOTE_SAVED,
                  payload: { noteId: saveResponse.id },
                }).catch(() => {});
              } else {
                setSaveError(true);
              }
            } catch {
              setSaveError(true);
            }
          })();
        }
      } else if (message.type === MessageType.AUTH_STATE_CHANGED) {
        setIsSignedIn(false);
      }
    };
    chrome.runtime.onMessage.addListener(authListener);
    return () => chrome.runtime.onMessage.removeListener(authListener);
  }, [depthCache.simple, selectedText, sourceUrl, pageTitle]);

  // Delay spinner to avoid flash for fast responses
  useEffect(() => {
    if (!isLoadingTopic) { setShowTopicSpinner(false); return; }
    const timer = setTimeout(() => setShowTopicSpinner(true), 500);
    return () => clearTimeout(timer);
  }, [isLoadingTopic]);

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
          // Save note via background → backend
          const saveResponse = await chrome.runtime.sendMessage({
            type: MessageType.SAVE_NOTE,
            payload: {
              highlighted_text: selectedText,
              explanation: depthCache.simple,
              source_url: sourceUrl,
              page_title: pageTitle,
              responses: { simple: depthCache.simple },
            },
          });

          if (!saveResponse?.success) {
            console.error('[bubb] Failed to save note:', saveResponse?.error);
            setSaveError(true);
            if (saveResponse?.error?.includes('401')) {
              setIsSignedIn(false);
            }
            return;
          }

          setIsSignedIn(true);
          const savedNoteId = saveResponse.id;
          setNoteId(savedNoteId);

          // If duplicate with existing topic, skip topic suggestion
          if (saveResponse.is_duplicate && saveResponse.has_topic) return;

          // Broadcast NOTE_SAVED to side panel
          chrome.runtime.sendMessage({
            type: MessageType.NOTE_SAVED,
            payload: { noteId: savedNoteId },
          }).catch(() => {});

          // Fetch topic suggestion via background → backend
          setIsLoadingTopic(true);
          try {
            const topicResponse = await chrome.runtime.sendMessage({
              type: MessageType.SUGGEST_TOPIC,
              payload: {
                highlighted_text: selectedText,
                explanation: depthCache.simple,
                existing_topics: [],
              },
            });

            if (topicResponse?.success) {
              setTopicSuggestion({
                suggestedTopic: topicResponse.suggested_topic,
                isExisting: topicResponse.is_existing,
                existingTopicId: topicResponse.existing_topic_id ?? null,
              });
            }
          } catch (err) {
            console.warn('[bubb] Topic suggestion failed:', err);
          } finally {
            setIsLoadingTopic(false);
          }
        } catch (err) {
          console.error('[bubb] Save error:', err);
          setSaveError(true);
        }
      };
      saveNote();
    }
  }, [depthStreaming.simple]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save depth responses to DB when non-simple depths finish streaming
  useEffect(() => {
    const prev = prevDepthStreamingRef.current;
    prevDepthStreamingRef.current = depthStreaming;

    for (const depth of ['standard', 'deep'] as const) {
      if (prev[depth] && !depthStreaming[depth] && depthCache[depth].length > 0) {
        const responseData = { [depth]: depthCache[depth] };

        if (noteId) {
          chrome.runtime.sendMessage({
            type: MessageType.MERGE_RESPONSES,
            payload: { noteId, responses: responseData },
          }).then(() => {
            chrome.runtime.sendMessage({
              type: MessageType.NOTE_UPDATED,
              payload: { noteId },
            }).catch(() => {});
          }).catch((err) => {
            console.warn(`[bubb] Failed to save ${depth} response:`, err);
          });
        } else {
          pendingResponsesRef.current = { ...pendingResponsesRef.current, ...responseData };
        }
      }
    }
  }, [depthStreaming, noteId, depthCache]);

  // Flush all pending data when noteId becomes available
  useEffect(() => {
    if (!noteId) return;

    // Flush pending depth responses
    if (Object.keys(pendingResponsesRef.current).length > 0) {
      const pending = pendingResponsesRef.current;
      pendingResponsesRef.current = {};
      chrome.runtime.sendMessage({
        type: MessageType.MERGE_RESPONSES,
        payload: { noteId, responses: pending },
      }).then(() => {
        chrome.runtime.sendMessage({
          type: MessageType.NOTE_UPDATED,
          payload: { noteId },
        }).catch(() => {});
      }).catch((err) => console.warn('[bubb] Failed to flush pending responses:', err));
    }

    // Flush pending chat turns (sequential to maintain order)
    if (pendingChatTurnsRef.current.length > 0) {
      const turns = [...pendingChatTurnsRef.current];
      pendingChatTurnsRef.current = [];
      (async () => {
        for (const turn of turns) {
          await chrome.runtime.sendMessage({
            type: MessageType.APPEND_CONVERSATION,
            payload: { noteId, turn },
          }).catch((err) => console.warn('[bubb] Failed to flush chat turn:', err));
        }
        chrome.runtime.sendMessage({
          type: MessageType.NOTE_UPDATED,
          payload: { noteId },
        }).catch(() => {});
      })();
    }
  }, [noteId]);

  // Save chat turns to DB when follow-up responses finish streaming
  const prevLastTurnStreamingRef = useRef(false);
  useEffect(() => {
    if (thread.length === 0) {
      prevLastTurnStreamingRef.current = false;
      return;
    }

    const lastTurn = thread[thread.length - 1];
    const wasStreaming = prevLastTurnStreamingRef.current;
    prevLastTurnStreamingRef.current = lastTurn.isStreaming;

    if (wasStreaming && !lastTurn.isStreaming && lastTurn.answer.length > 0) {
      const completedTurn = { question: lastTurn.question, answer: lastTurn.answer, depth: activeDepth };

      if (noteId) {
        chrome.runtime.sendMessage({
          type: MessageType.APPEND_CONVERSATION,
          payload: { noteId, turn: completedTurn },
        }).then(() => {
          chrome.runtime.sendMessage({
            type: MessageType.NOTE_UPDATED,
            payload: { noteId },
          }).catch(() => {});
        }).catch((err) => {
          console.warn('[bubb] Failed to save chat turn:', err);
        });
      } else {
        pendingChatTurnsRef.current = [...pendingChatTurnsRef.current, completedTurn];
      }
    }
  }, [thread, noteId, activeDepth]);

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
      await chrome.runtime.sendMessage({
        type: MessageType.DELETE_NOTE,
        payload: { noteId },
      });
      // Notify side panel to refresh its notes list
      chrome.runtime.sendMessage({
        type: MessageType.NOTE_UPDATED,
        payload: { noteId },
      }).catch(() => {});
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
      const saveResponse = await chrome.runtime.sendMessage({
        type: MessageType.SAVE_NOTE,
        payload: {
          highlighted_text: selectedText,
          explanation: depthCache.simple,
          source_url: sourceUrl,
          page_title: pageTitle,
          responses: { simple: depthCache.simple },
        },
      });

      if (!saveResponse?.success) {
        setSaveError(true);
        return;
      }

      setNoteId(saveResponse.id);

      // Flush any pending depth responses
      if (Object.keys(pendingResponsesRef.current).length > 0) {
        await chrome.runtime.sendMessage({
          type: MessageType.MERGE_RESPONSES,
          payload: { noteId: saveResponse.id, responses: pendingResponsesRef.current },
        });
        pendingResponsesRef.current = {};
      }
      // Flush any pending chat turns
      for (const turn of pendingChatTurnsRef.current) {
        await chrome.runtime.sendMessage({
          type: MessageType.APPEND_CONVERSATION,
          payload: { noteId: saveResponse.id, turn },
        });
      }
      pendingChatTurnsRef.current = [];
    } catch {
      setSaveError(true);
    }
  };

  // Onboarding cursor transitions
  useEffect(() => {
    if (!isOnboarding || onboardingCursor !== 'waiting') return;
    if (!depthStreaming.simple && depthCache.simple.length > 0) {
      // Delay so the user sees the explanation first
      const timer = setTimeout(() => setOnboardingCursor('point-followup'), 800);
      return () => clearTimeout(timer);
    }
  }, [isOnboarding, onboardingCursor, depthStreaming.simple, depthCache.simple]);

  // Hide follow-up cursor immediately when user sends a follow-up
  useEffect(() => {
    if (!isOnboarding || onboardingCursor !== 'point-followup') return;
    if (thread.length > 0) {
      setOnboardingCursor('waiting-for-stream');
    }
  }, [isOnboarding, onboardingCursor, thread.length]);

  // Show login cursor after follow-up finishes streaming
  useEffect(() => {
    if (!isOnboarding || onboardingCursor !== 'waiting-for-stream') return;
    if (thread.length > 0) {
      const lastTurn = thread[thread.length - 1];
      if (!lastTurn.isStreaming && lastTurn.answer.length > 0) {
        const timer = setTimeout(() => setOnboardingCursor('point-login'), 800);
        return () => clearTimeout(timer);
      }
    }
  }, [isOnboarding, onboardingCursor, thread]);

  useEffect(() => {
    if (!isOnboarding) return;
    if (isSignedIn && (onboardingCursor === 'point-login' || onboardingCursor === 'waiting-for-stream')) {
      onClose();
    }
  }, [isOnboarding, onboardingCursor, isSignedIn, onClose]);

  // Derived: is anything streaming that should block follow-up input?
  const anyStreaming = depthStreaming[activeDepth] || followUpDepthRef.current !== null;

  return (
    <div
      ref={popupRef}
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
        <div ref={footerRef}>
          <PopupFooter
            onSendFollowUp={handleFollowUp}
            isStreaming={anyStreaming}
            followUpCapReached={thread.length >= 3}
            activeProvider={activeProvider}
            onProviderChange={handleProviderChange}
            pulse={onboardingCursor === 'point-followup'}
          />
        </div>
        <div ref={saveToastRef}>
          {saveAttemptedRef.current && (noteId || saveError || !isSignedIn) && (
            <SaveToast
              noteId={noteId}
              isSignedIn={isSignedIn}
              onUndo={handleUndo}
              onLogin={handleLogin}
              onRetrySave={handleRetrySave}
              saveError={saveError}
              pulse={onboardingCursor === 'point-login'}
            />
          )}
        </div>
        {isSignedIn && noteId && showTopicSpinner && (
          <div className="flex items-center justify-center border-t border-[hsl(var(--border))] px-[16px] py-[8px]">
            <div className="w-3 h-3 border-2 border-[hsl(var(--muted-foreground))] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {isSignedIn && noteId && topicSuggestion && !topicFlowComplete && (
          <TopicSuggestionChip
            noteId={noteId}
            suggestedTopic={topicSuggestion.suggestedTopic}
            isExisting={topicSuggestion.isExisting}
            existingTopicId={topicSuggestion.existingTopicId}
            onComplete={() => setTopicFlowComplete(true)}
          />
        )}
      </div>
      {/* Floating onboarding cursors — rendered outside overflow-hidden */}
      {onboardingCursor === 'point-followup' && (
        <OnboardingFloatingCursor targetRef={footerRef} popupRef={popupRef} label="Ask a follow-up question" align="left" />
      )}
      {onboardingCursor === 'point-login' && !isSignedIn && (
        <OnboardingFloatingCursor targetRef={saveToastRef} popupRef={popupRef} label="Sign in to save your note" align="right" />
      )}
    </div>
  );
}

function OnboardingFloatingCursor({
  targetRef,
  popupRef,
  label,
  align = 'left',
}: {
  targetRef: React.RefObject<HTMLDivElement | null>;
  popupRef: React.RefObject<HTMLDivElement | null>;
  label: string;
  align?: 'left' | 'right';
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const update = () => {
      const target = targetRef.current;
      const popup = popupRef.current;
      if (!target || !popup) return;
      const popupRect = popup.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();
      setPos({
        top: targetRect.bottom - popupRect.top,
        left: align === 'left'
          ? targetRect.left - popupRect.left + 16
          : targetRect.right - popupRect.left - 80,
      });
    };
    update();
    const timer = setInterval(update, 500);
    return () => clearInterval(timer);
  }, [targetRef, popupRef, align]);

  if (!pos) return null;

  return (
    <div
      className="animate-[cursorBounce_1.5s_ease-in-out_infinite]"
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      <svg
        width="18"
        height="22"
        viewBox="0 0 20 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}
      >
        <path
          d="M5.5 0L5.5 17.5L9.3 13.7L13.2 21.5L15.8 20.3L11.9 12.5L17 12.5L5.5 0Z"
          fill="hsl(4 58% 58%)"
          stroke="white"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
      <div
        className="whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-medium"
        style={{
          background: 'hsl(4 58% 58%)',
          color: 'white',
          fontFamily: 'var(--font-sans)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          marginTop: '2px',
          marginLeft: '-4px',
        }}
      >
        {label}
      </div>
      <style>{`
        @keyframes cursorBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

