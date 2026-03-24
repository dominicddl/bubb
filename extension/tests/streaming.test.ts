import { describe, it, expect, vi, beforeEach } from 'vitest';
import { openStreamPort } from '@/entrypoints/content/lib/streaming';
import type { StreamCallbacks } from '@/entrypoints/content/lib/streaming';
import type { StreamRequestPayload } from '@/lib/messaging';

// Mock chrome.runtime with a mock port
const mockPort = {
  name: 'bubb-stream',
  postMessage: vi.fn(),
  disconnect: vi.fn(),
  onMessage: { addListener: vi.fn() },
  onDisconnect: { addListener: vi.fn() },
};

vi.stubGlobal('chrome', {
  runtime: {
    connect: vi.fn(() => mockPort),
  },
});

describe('streaming port utility', () => {
  let callbacks: StreamCallbacks;

  beforeEach(() => {
    vi.clearAllMocks();
    callbacks = {
      onChunk: vi.fn(),
      onEnd: vi.fn(),
      onError: vi.fn(),
    };
  });

  it('dispatches onChunk per depth', () => {
    openStreamPort(callbacks);

    // Capture the message listener registered on the port
    const listener = mockPort.onMessage.addListener.mock.calls[0][0];

    // Simulate 3 STREAM_CHUNK messages with different depths
    listener({ type: 'STREAM_CHUNK', depth: 'simple', token: 'Hello' });
    listener({ type: 'STREAM_CHUNK', depth: 'standard', token: 'World' });
    listener({ type: 'STREAM_CHUNK', depth: 'deep', token: 'Advanced' });

    expect(callbacks.onChunk).toHaveBeenCalledTimes(3);
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(1, 'simple', 'Hello');
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(2, 'standard', 'World');
    expect(callbacks.onChunk).toHaveBeenNthCalledWith(3, 'deep', 'Advanced');
  });

  it('dispatches onEnd per depth', () => {
    openStreamPort(callbacks);

    const listener = mockPort.onMessage.addListener.mock.calls[0][0];

    listener({ type: 'STREAM_END', depth: 'simple' });
    listener({ type: 'STREAM_END', depth: 'standard' });
    listener({ type: 'STREAM_END', depth: 'deep' });

    expect(callbacks.onEnd).toHaveBeenCalledTimes(3);
    expect(callbacks.onEnd).toHaveBeenNthCalledWith(1, 'simple');
    expect(callbacks.onEnd).toHaveBeenNthCalledWith(2, 'standard');
    expect(callbacks.onEnd).toHaveBeenNthCalledWith(3, 'deep');
  });

  it('dispatches onError per depth', () => {
    openStreamPort(callbacks);

    const listener = mockPort.onMessage.addListener.mock.calls[0][0];

    listener({ type: 'STREAM_ERROR', depth: 'standard', error: 'Network timeout' });

    expect(callbacks.onError).toHaveBeenCalledTimes(1);
    expect(callbacks.onError).toHaveBeenCalledWith('standard', 'Network timeout');
  });

  it('requestExplanation posts STREAM_REQUEST to port', () => {
    const streamPort = openStreamPort(callbacks);

    const payload: StreamRequestPayload = {
      text: 'quantum entanglement',
      context: 'Physics lecture notes',
      sourceUrl: 'https://example.com/physics',
      pageTitle: 'Physics 101',
      depth: 'simple',
      provider: 'openai',
    };

    streamPort.requestExplanation(payload);

    expect(mockPort.postMessage).toHaveBeenCalledWith({
      type: 'STREAM_REQUEST',
      payload,
    });
  });

  it('requestFollowUp posts STREAM_REQUEST with followUpQuestion', () => {
    const streamPort = openStreamPort(callbacks);

    streamPort.requestFollowUp({
      text: 'quantum entanglement',
      context: 'Physics lecture notes',
      sourceUrl: 'https://example.com/physics',
      pageTitle: 'Physics 101',
      depth: 'deep',
      provider: 'anthropic',
      conversationHistory: [{ question: 'What is this?', answer: 'It is a phenomenon.' }],
      followUpQuestion: 'Can you explain further?',
    });

    expect(mockPort.postMessage).toHaveBeenCalledWith({
      type: 'STREAM_REQUEST',
      payload: expect.objectContaining({
        followUpQuestion: 'Can you explain further?',
        depth: 'deep',
        provider: 'anthropic',
        conversationHistory: [{ question: 'What is this?', answer: 'It is a phenomenon.' }],
      }),
    });
  });

  it('disconnect calls port.disconnect', () => {
    const streamPort = openStreamPort(callbacks);

    streamPort.disconnect();

    expect(mockPort.disconnect).toHaveBeenCalledTimes(1);
  });
});
