/**
 * Typed message protocol for extension context communication.
 * All auth actions are sent to the background service worker
 * because chrome.identity.launchWebAuthFlow is only available there.
 */

export const MessageType = {
  SIGN_IN: 'SIGN_IN',
  SIGN_OUT: 'SIGN_OUT',
  GET_AUTH_STATE: 'GET_AUTH_STATE',
  AUTH_STATE_CHANGED: 'AUTH_STATE_CHANGED',
  EXPLAIN_TEXT: 'EXPLAIN_TEXT',
  RENDER_LATEX: 'RENDER_LATEX',
  NOTE_SAVED: 'NOTE_SAVED',
  TOPIC_ASSIGNED: 'TOPIC_ASSIGNED',
  SUGGEST_TOPIC: 'SUGGEST_TOPIC',
  NOTE_UPDATED: 'NOTE_UPDATED',
  SAVE_NOTE: 'SAVE_NOTE',
  DELETE_NOTE: 'DELETE_NOTE',
  MERGE_RESPONSES: 'MERGE_RESPONSES',
  APPEND_CONVERSATION: 'APPEND_CONVERSATION',
  CREATE_TOPIC: 'CREATE_TOPIC',
  ASSIGN_TOPIC: 'ASSIGN_TOPIC',
  DELETE_TOPIC: 'DELETE_TOPIC',
} as const;

export type MessageTypeValue = (typeof MessageType)[keyof typeof MessageType];

export interface SignInMessage {
  type: typeof MessageType.SIGN_IN;
}

export interface SignOutMessage {
  type: typeof MessageType.SIGN_OUT;
}

export interface GetAuthStateMessage {
  type: typeof MessageType.GET_AUTH_STATE;
}

export interface AuthStateChangedMessage {
  type: typeof MessageType.AUTH_STATE_CHANGED;
  payload: {
    isAuthenticated: boolean;
    user: {
      id: string;
      email: string;
      name: string;
    } | null;
  };
}

export interface ExplainTextMessage {
  type: typeof MessageType.EXPLAIN_TEXT;
  payload: {
    text: string;          // highlighted text
    context: string;       // surrounding paragraph(s), max ~500 chars
    sourceUrl: string;     // window.location.href
    pageTitle: string;     // document.title
  };
}

export interface ExplanationResponse {
  success: boolean;
  explanation?: string;
  error?: string;
}

export interface RenderLatexMessage {
  type: typeof MessageType.RENDER_LATEX;
  payload: { text: string };
}

export interface RenderLatexResponse {
  success: boolean;
  html?: string;
  css?: string;
  error?: string;
}

export interface NoteSavedMessage {
  type: typeof MessageType.NOTE_SAVED;
  payload: { noteId: string };
}

export interface TopicAssignedMessage {
  type: typeof MessageType.TOPIC_ASSIGNED;
  payload: { noteId: string; topicId: string };
}

export interface SuggestTopicMessage {
  type: typeof MessageType.SUGGEST_TOPIC;
  payload: {
    highlighted_text: string;
    explanation: string;
    existing_topics: string[];
  };
}

export interface NoteUpdatedMessage {
  type: typeof MessageType.NOTE_UPDATED;
  payload: { noteId: string };
}

export interface SuggestTopicResponse {
  success: boolean;
  suggested_topic?: string;
  is_existing?: boolean;
  existing_topic_id?: string | null;
  error?: string;
}

export interface SaveNoteMessage {
  type: typeof MessageType.SAVE_NOTE;
  payload: {
    highlighted_text: string;
    explanation: string;
    source_url: string;
    page_title: string;
    responses: Record<string, string>;
  };
}

export interface SaveNoteResponse {
  success: boolean;
  id?: string;
  is_duplicate?: boolean;
  has_topic?: boolean;
  error?: string;
}

export interface DeleteNoteMessage {
  type: typeof MessageType.DELETE_NOTE;
  payload: { noteId: string };
}

export interface MergeResponsesMessage {
  type: typeof MessageType.MERGE_RESPONSES;
  payload: {
    noteId: string;
    responses: Record<string, string>;
  };
}

export interface AppendConversationMessage {
  type: typeof MessageType.APPEND_CONVERSATION;
  payload: {
    noteId: string;
    turn: { question: string; answer: string };
  };
}

export interface CreateTopicMessage {
  type: typeof MessageType.CREATE_TOPIC;
  payload: { name: string };
}

export interface AssignTopicMessage {
  type: typeof MessageType.ASSIGN_TOPIC;
  payload: { noteId: string; topicId: string };
}

export interface DeleteTopicMessage {
  type: typeof MessageType.DELETE_TOPIC;
  payload: { topicId: string };
}

export type ExtensionMessage =
  | SignInMessage
  | SignOutMessage
  | GetAuthStateMessage
  | AuthStateChangedMessage
  | ExplainTextMessage
  | RenderLatexMessage
  | NoteSavedMessage
  | TopicAssignedMessage
  | SuggestTopicMessage
  | NoteUpdatedMessage
  | SaveNoteMessage
  | DeleteNoteMessage
  | MergeResponsesMessage
  | AppendConversationMessage
  | CreateTopicMessage
  | AssignTopicMessage
  | DeleteTopicMessage;

export interface AuthResponse {
  success: boolean;
  error?: string;
  user?: {
    id: string;
    email: string;
    name: string;
  } | null;
  isAuthenticated?: boolean;
}

// --- Streaming protocol types ---

export type DepthLevel = 'simple' | 'standard' | 'deep';

export type Provider = 'openai' | 'anthropic';

export interface ConversationTurn {
  question: string;
  answer: string;
  depth?: string;
}

export interface StreamRequestPayload {
  text: string;
  context: string;
  sourceUrl: string;
  pageTitle: string;
  depth: DepthLevel;
  provider: Provider;
  conversationHistory?: ConversationTurn[];
  followUpQuestion?: string;
}

export interface StreamRequestMessage {
  type: 'STREAM_REQUEST';
  payload: StreamRequestPayload;
}

export interface StreamChunkMessage {
  type: 'STREAM_CHUNK';
  depth: DepthLevel;
  token: string;
}

export interface StreamEndMessage {
  type: 'STREAM_END';
  depth: DepthLevel;
}

export interface StreamErrorMessage {
  type: 'STREAM_ERROR';
  depth: DepthLevel;
  error: string;
}

export type StreamPortMessage = StreamChunkMessage | StreamEndMessage | StreamErrorMessage;

export const STREAM_PORT_NAME = 'bubb-stream';
