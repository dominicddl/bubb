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

export type ExtensionMessage =
  | SignInMessage
  | SignOutMessage
  | GetAuthStateMessage
  | AuthStateChangedMessage
  | ExplainTextMessage;

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
