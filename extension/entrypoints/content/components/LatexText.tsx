import { useState, useEffect, useRef } from 'react';
import { MessageType } from '@/lib/messaging';
import type { RenderLatexResponse } from '@/lib/messaging';

interface LatexTextProps {
  text: string;
  className?: string;
  isStreaming?: boolean;
}

const LATEX_PATTERN = /\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\)|\$\$[\s\S]*?\$\$|\$[^\$\n]+?\$/;

function hasLatex(text: string): boolean {
  return LATEX_PATTERN.test(text);
}

let cssInjected = false;

export function LatexText({ text, className, isStreaming = false }: LatexTextProps) {
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming || !hasLatex(text)) {
      setRenderedHtml(null);
      return;
    }

    chrome.runtime.sendMessage(
      { type: MessageType.RENDER_LATEX, payload: { text } },
    ).then((response: RenderLatexResponse) => {
      if (response?.success && response.html) {
        setRenderedHtml(response.html);

        // Inject KaTeX CSS into Shadow DOM once
        if (!cssInjected && response.css && containerRef.current) {
          const root = containerRef.current.getRootNode();
          if (root instanceof ShadowRoot) {
            const style = document.createElement('style');
            style.textContent = response.css;
            root.appendChild(style);
            cssInjected = true;
          }
        }
      }
    }).catch(() => {
      // If background fails, just show plain text
    });
  }, [text, isStreaming]);

  if (renderedHtml) {
    return (
      <span
        ref={containerRef}
        className={className}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
    );
  }

  return <span ref={containerRef} className={className}>{text}</span>;
}
