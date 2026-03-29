import { signInWithGoogle, signOut, getAuthState, verifyBackendConnection } from '@/lib/auth';
import type { ExtensionMessage, AuthResponse, ExplainTextMessage, RenderLatexMessage, RenderLatexResponse, StreamRequestPayload, StreamPortMessage, SaveNoteMessage, DeleteNoteMessage, MergeResponsesMessage, AppendConversationMessage, SuggestTopicMessage, CreateTopicMessage, AssignTopicMessage } from '@/lib/messaging';
import { MessageType, STREAM_PORT_NAME } from '@/lib/messaging';
import katex from 'katex';
import katexCss from 'katex/dist/katex.min.css?inline';
import { getSupabase } from '@/lib/supabase';

export default defineBackground({
  type: 'module',
  main() {
    // Open side panel when extension icon is clicked (retires the popup per PANEL-01, D-03)
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

    // CRITICAL: Register ALL listeners synchronously (Pitfall 4)
    chrome.runtime.onMessage.addListener(
      (message: ExtensionMessage, _sender, sendResponse: (response: AuthResponse) => void) => {
        handleMessage(message).then(sendResponse);
        return true; // Keep channel open for async response
      }
    );

    chrome.runtime.onInstalled.addListener(() => {
      console.log('[bubb] Extension installed');
    });

    chrome.runtime.onConnect.addListener((port) => {
      if (port.name !== STREAM_PORT_NAME) return;

      // Track active readers so we can cancel on disconnect
      const activeReaders: ReadableStreamDefaultReader<Uint8Array>[] = [];
      let disconnected = false;

      port.onDisconnect.addListener(() => {
        disconnected = true;
        for (const reader of activeReaders) {
          reader.cancel().catch(() => {});
        }
        activeReaders.length = 0;
      });

      port.onMessage.addListener(async (msg: { type: string; payload: StreamRequestPayload }) => {
        if (msg.type !== 'STREAM_REQUEST') return;

        const payload = msg.payload;
        const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

        try {
          const { data: { session } } = await getSupabase().auth.getSession();
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (session?.access_token) {
            headers['Authorization'] = `Bearer ${session.access_token}`;
          }

          const resp = await fetch(`${BACKEND_URL}/api/explain/stream`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
              text: payload.text,
              context: payload.context,
              source_url: payload.sourceUrl,
              page_title: payload.pageTitle,
              depth: payload.depth,
              provider: payload.provider,
              conversation_history: payload.conversationHistory?.map(t => ({
                question: t.question,
                answer: t.answer,
              })) ?? [],
              follow_up_question: payload.followUpQuestion ?? null,
            }),
          });

          if (!resp.ok || !resp.body) {
            if (!disconnected) {
              port.postMessage({
                type: 'STREAM_ERROR',
                depth: payload.depth,
                error: `API error: ${resp.status}`,
              } satisfies StreamPortMessage);
            }
            return;
          }

          const reader = resp.body.getReader();
          activeReaders.push(reader);
          const decoder = new TextDecoder();
          let buffer = '';

          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done || disconnected) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (line.startsWith('data:')) {
                  // SSE data field: "data: token" or "data:" (empty = newline)
                  const raw = line.slice(5);
                  const token = raw.startsWith(' ') ? raw.slice(1) : raw;
                  if (token === '[DONE]') continue;
                  // Empty data lines represent newlines in the original text
                  const resolved = token === '' ? '\n' : token;
                  if (!disconnected) {
                    if (resolved.startsWith('[ERROR]')) {
                      port.postMessage({
                        type: 'STREAM_ERROR',
                        depth: payload.depth,
                        error: resolved.slice(8),
                      } satisfies StreamPortMessage);
                    } else {
                      port.postMessage({
                        type: 'STREAM_CHUNK',
                        depth: payload.depth,
                        token: resolved,
                      } satisfies StreamPortMessage);
                    }
                  }
                }
              }
            }

            if (!disconnected) {
              port.postMessage({
                type: 'STREAM_END',
                depth: payload.depth,
              } satisfies StreamPortMessage);
            }
          } finally {
            const idx = activeReaders.indexOf(reader);
            if (idx >= 0) activeReaders.splice(idx, 1);
          }
        } catch (err) {
          if (!disconnected) {
            port.postMessage({
              type: 'STREAM_ERROR',
              depth: payload.depth,
              error: err instanceof Error ? err.message : 'Network error',
            } satisfies StreamPortMessage);
          }
        }
      });
    });
  },
});

/**
 * Broadcast auth state change to all open extension contexts (sidepanel, popup).
 * This ensures UI stays in sync when auth changes happen in the background.
 */
function broadcastAuthStateChanged(
  isAuthenticated: boolean,
  user: { id: string; email: string; name: string } | null,
) {
  chrome.runtime.sendMessage({
    type: MessageType.AUTH_STATE_CHANGED,
    payload: { isAuthenticated, user },
  }).catch(() => {
    // Ignore errors when no listeners are active (e.g., sidepanel is closed)
  });
}

async function handleMessage(message: ExtensionMessage): Promise<AuthResponse> {
  switch (message.type) {
    case MessageType.SIGN_IN: {
      const result = await signInWithGoogle();
      if (result.success && result.user) {
        const user = {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
        };

        // Broadcast to all open UI contexts
        broadcastAuthStateChanged(true, user);

        // Verify backend connectivity after successful sign-in
        const backendOk = await verifyBackendConnection();
        if (!backendOk) {
          console.warn('[bubb] Backend connection verification failed — backend may be offline');
        }

        return {
          success: true,
          isAuthenticated: true,
          user,
        };
      }
      return { success: false, error: result.error };
    }

    case MessageType.SIGN_OUT: {
      const result = await signOut();

      // Broadcast signed-out state to all open UI contexts
      broadcastAuthStateChanged(false, null);

      return {
        success: result.success,
        error: result.error,
        isAuthenticated: false,
        user: null,
      };
    }

    case MessageType.GET_AUTH_STATE: {
      const state = await getAuthState();
      return {
        success: true,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      };
    }

    case MessageType.RENDER_LATEX: {
      const { text } = (message as RenderLatexMessage).payload;
      try {
        const html = renderLatexText(text);
        return { success: true, html, css: getKatexCss() } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Render error';
        return { success: false, error: msg };
      }
    }

    case MessageType.EXPLAIN_TEXT: {
      const { text, context, sourceUrl, pageTitle } = (message as ExplainTextMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/explain`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            text,
            context,
            source_url: sourceUrl,
            page_title: pageTitle,
          }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        const data = await resp.json();
        return { success: true, explanation: data.explanation } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.SAVE_NOTE: {
      const { highlighted_text, explanation, source_url, page_title, responses } =
        (message as SaveNoteMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/notes`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            highlighted_text,
            explanation,
            source_url,
            page_title,
            responses,
          }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        const data = await resp.json();
        return { success: true, ...data } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.DELETE_NOTE: {
      const { noteId } = (message as DeleteNoteMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/notes/${noteId}`, {
          method: 'DELETE',
          headers,
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        return { success: true } as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.MERGE_RESPONSES: {
      const { noteId, responses } = (message as MergeResponsesMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/notes/${noteId}/responses`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ responses }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        return { success: true } as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.APPEND_CONVERSATION: {
      const { noteId, turn } = (message as AppendConversationMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/notes/${noteId}/conversation`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ turn }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        return { success: true } as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.SUGGEST_TOPIC: {
      const { highlighted_text, explanation, existing_topics } =
        (message as SuggestTopicMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/topics/suggest`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ highlighted_text, explanation, existing_topics }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        const data = await resp.json();
        return { success: true, ...data } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.CREATE_TOPIC: {
      const { name } = (message as CreateTopicMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/topics`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        const data = await resp.json();
        return { success: true, id: data.id } as unknown as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    case MessageType.ASSIGN_TOPIC: {
      const { noteId, topicId } = (message as AssignTopicMessage).payload;
      const BACKEND_URL = import.meta.env.WXT_BACKEND_URL || 'http://127.0.0.1:8000';

      try {
        const { data: { session } } = await getSupabase().auth.getSession();
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const resp = await fetch(`${BACKEND_URL}/api/notes/${noteId}/topic`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ topic_id: topicId }),
        });

        if (!resp.ok) {
          return { success: false, error: `API error: ${resp.status}` } as AuthResponse;
        }

        return { success: true } as AuthResponse;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Network error';
        return { success: false, error: msg };
      }
    }

    default:
      return { success: false, error: 'Unknown message type' };
  }
}

// --- LaTeX rendering helpers ---

const LATEX_PATTERN = /\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\)|\$\$([\s\S]*?)\$\$|\$([^\$\n]+?)\$/g;

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderLatexText(text: string): string {
  const regex = new RegExp(LATEX_PATTERN.source, 'g');
  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    result += escapeHtml(text.slice(lastIndex, match.index));

    const [fullMatch, display1, inline1, display2, inline2] = match;
    const isDisplay = display1 != null || display2 != null;
    const latex = display1 ?? inline1 ?? display2 ?? inline2 ?? '';

    try {
      result += katex.renderToString(latex, {
        displayMode: isDisplay,
        throwOnError: false,
        output: 'html',
      });
    } catch {
      result += escapeHtml(fullMatch);
    }
    lastIndex = regex.lastIndex;
  }

  result += escapeHtml(text.slice(lastIndex));
  return result;
}

function getKatexCss(): string {
  return katexCss;
}
