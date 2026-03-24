import type {
  DepthLevel,
  Provider,
  StreamRequestPayload,
  StreamPortMessage,
  ConversationTurn,
} from '@/lib/messaging';
import { STREAM_PORT_NAME } from '@/lib/messaging';

export interface StreamCallbacks {
  onChunk: (depth: DepthLevel, token: string) => void;
  onEnd: (depth: DepthLevel) => void;
  onError: (depth: DepthLevel, error: string) => void;
}

export interface StreamPort {
  port: chrome.runtime.Port;
  requestExplanation: (payload: StreamRequestPayload) => void;
  requestFollowUp: (params: {
    text: string;
    context: string;
    sourceUrl: string;
    pageTitle: string;
    depth: DepthLevel;
    provider: Provider;
    conversationHistory: ConversationTurn[];
    followUpQuestion: string;
  }) => void;
  disconnect: () => void;
}

export function openStreamPort(callbacks: StreamCallbacks): StreamPort {
  const port = chrome.runtime.connect({ name: STREAM_PORT_NAME });

  port.onMessage.addListener((msg: StreamPortMessage) => {
    switch (msg.type) {
      case 'STREAM_CHUNK':
        callbacks.onChunk(msg.depth, msg.token);
        break;
      case 'STREAM_END':
        callbacks.onEnd(msg.depth);
        break;
      case 'STREAM_ERROR':
        callbacks.onError(msg.depth, msg.error);
        break;
    }
  });

  const requestExplanation = (payload: StreamRequestPayload) => {
    port.postMessage({ type: 'STREAM_REQUEST', payload });
  };

  const requestFollowUp = (params: {
    text: string;
    context: string;
    sourceUrl: string;
    pageTitle: string;
    depth: DepthLevel;
    provider: Provider;
    conversationHistory: ConversationTurn[];
    followUpQuestion: string;
  }) => {
    port.postMessage({
      type: 'STREAM_REQUEST',
      payload: {
        text: params.text,
        context: params.context,
        sourceUrl: params.sourceUrl,
        pageTitle: params.pageTitle,
        depth: params.depth,
        provider: params.provider,
        conversationHistory: params.conversationHistory,
        followUpQuestion: params.followUpQuestion,
      } satisfies StreamRequestPayload,
    });
  };

  const disconnect = () => {
    port.disconnect();
  };

  return { port, requestExplanation, requestFollowUp, disconnect };
}
