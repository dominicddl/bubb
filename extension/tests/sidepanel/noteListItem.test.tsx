// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NoteListItem } from '../../entrypoints/sidepanel/components/NoteListItem';

const simpleNote = {
  id: '1',
  highlighted_text: 'test text',
  explanation: 'simple explanation',
  source_url: 'https://example.com',
  page_title: 'Test',
  topic_id: null,
  created_at: new Date().toISOString(),
  responses: { simple: 'simple explanation' },
  conversation_history: [],
};

const richNote = {
  ...simpleNote,
  id: '2',
  responses: {
    simple: 'simple explanation',
    standard: 'standard explanation with more detail',
    deep: 'deep dive explanation',
  },
  conversation_history: [
    { question: 'What is X?', answer: 'X is a concept that...' },
  ],
};

describe('NoteListItem', () => {
  it('renders simple note without tabs', () => {
    render(<NoteListItem note={simpleNote} />);
    fireEvent.click(screen.getByText('test text'));
    expect(screen.getByText('simple explanation')).toBeTruthy();
    expect(screen.queryByText('Standard')).toBeNull();
    expect(screen.queryByText('Deep')).toBeNull();
  });

  it('renders rich note with depth tabs', () => {
    render(<NoteListItem note={richNote} />);
    fireEvent.click(screen.getByText('test text'));
    expect(screen.getByText('simple')).toBeTruthy();
    expect(screen.getByText('standard')).toBeTruthy();
    expect(screen.getByText('deep')).toBeTruthy();
  });

  it('switches depth tab content', () => {
    render(<NoteListItem note={richNote} />);
    fireEvent.click(screen.getByText('test text'));
    expect(screen.getByText('simple explanation')).toBeTruthy();
    fireEvent.click(screen.getByText('standard'));
    expect(screen.getByText('standard explanation with more detail')).toBeTruthy();
  });

  it('shows chat thread on rich note', () => {
    render(<NoteListItem note={richNote} />);
    fireEvent.click(screen.getByText('test text'));
    expect(screen.getByText(/What is X\?/)).toBeTruthy();
    expect(screen.getByText(/X is a concept that/)).toBeTruthy();
  });

  it('hides chat thread when conversation_history is empty', () => {
    const noteNoChatButMultiDepth = { ...richNote, conversation_history: [] };
    render(<NoteListItem note={noteNoChatButMultiDepth} />);
    fireEvent.click(screen.getByText('test text'));
    expect(screen.getByText('standard')).toBeTruthy();
    expect(screen.queryByText(/What is X\?/)).toBeNull();
  });
});
