// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { extractSurroundingContext } from '../../entrypoints/content/lib/context';

describe('extractSurroundingContext', () => {
  it('returns empty string when anchorNode is null', () => {
    expect(extractSurroundingContext(null as unknown as Node)).toBe('');
  });

  it('walks up to nearest block-level parent element (P tag)', () => {
    const p = document.createElement('p');
    p.textContent = 'This is the paragraph context.';
    document.body.appendChild(p);

    const textNode = p.firstChild!;
    const result = extractSurroundingContext(textNode);

    expect(result).toBe('This is the paragraph context.');
    document.body.removeChild(p);
  });

  it('walks up to nearest block-level parent element (ARTICLE tag)', () => {
    const article = document.createElement('article');
    const span = document.createElement('span');
    span.textContent = 'Article content here.';
    article.appendChild(span);
    document.body.appendChild(article);

    const textNode = span.firstChild!;
    const result = extractSurroundingContext(textNode);

    expect(result).toBe('Article content here.');
    document.body.removeChild(article);
  });

  it('grabs adjacent siblings if block parent content is short (< 200 chars)', () => {
    const wrapper = document.createElement('div');
    const prevP = document.createElement('p');
    prevP.textContent = 'Previous paragraph content.';
    const targetP = document.createElement('p');
    targetP.textContent = 'Short.';
    const nextP = document.createElement('p');
    nextP.textContent = 'Next paragraph content.';

    wrapper.appendChild(prevP);
    wrapper.appendChild(targetP);
    wrapper.appendChild(nextP);
    document.body.appendChild(wrapper);

    const textNode = targetP.firstChild!;
    const result = extractSurroundingContext(textNode);

    expect(result).toContain('Previous paragraph content.');
    expect(result).toContain('Short.');
    expect(result).toContain('Next paragraph content.');
    document.body.removeChild(wrapper);
  });

  it('does NOT grab siblings when block parent content is >= 200 chars', () => {
    const wrapper = document.createElement('div');
    const prevP = document.createElement('p');
    prevP.textContent = 'This should NOT appear in context.';
    const targetP = document.createElement('p');
    // Build a string of exactly 200+ characters
    targetP.textContent = 'A'.repeat(201);
    const nextP = document.createElement('p');
    nextP.textContent = 'This should also NOT appear.';

    wrapper.appendChild(prevP);
    wrapper.appendChild(targetP);
    wrapper.appendChild(nextP);
    document.body.appendChild(wrapper);

    const textNode = targetP.firstChild!;
    const result = extractSurroundingContext(textNode);

    expect(result).not.toContain('This should NOT appear in context.');
    expect(result).not.toContain('This should also NOT appear.');
    document.body.removeChild(wrapper);
  });

  it('caps output at 500 characters (per D-18)', () => {
    const p = document.createElement('p');
    p.textContent = 'X'.repeat(600);
    document.body.appendChild(p);

    const textNode = p.firstChild!;
    const result = extractSurroundingContext(textNode);

    // 500 chars + '...' = 503 characters
    expect(result.length).toBe(503);
    expect(result.endsWith('...')).toBe(true);
    document.body.removeChild(p);
  });

  it('returns empty string when no block-level parent is found', () => {
    // Create a node with no block-level ancestor
    const span = document.createElement('span');
    const textNode = document.createTextNode('inline text');
    span.appendChild(textNode);
    // Do NOT attach to document -- no block parent in the chain

    const result = extractSurroundingContext(textNode);
    expect(result).toBe('');
  });

  it('handles Element nodes (not just text nodes) as anchorNode', () => {
    const p = document.createElement('p');
    p.textContent = 'Element anchor context.';
    document.body.appendChild(p);

    // Pass the element itself (not a text node)
    const result = extractSurroundingContext(p);

    expect(result).toBe('Element anchor context.');
    document.body.removeChild(p);
  });
});
