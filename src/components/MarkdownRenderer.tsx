import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // 1. Normalize escaped newlines and line breaks
  const normalized = content
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\r\n/g, '\n');

  // 2. Parse inline tokens: **bold**, *italic*, `code`, and [link](url)
  const renderInline = (text: string) => {
    // Regex for bold, italic, code, link
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="text-[#f1f4f8] font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return (
          <em key={idx} className="text-[#e2e8f0] italic">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1.5 py-0.5 rounded bg-[#1a2230] text-[#d4af37] text-xs font-medium">
            {part.slice(1, -1)}
          </code>
        );
      }
      const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#d4af37] hover:underline"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
  };

  // 3. Process structure block by block
  const lines = normalized.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let listType: 'ul' | 'ol' | null = null;
  let elementKey = 0;

  const flushList = () => {
    if (!currentList.length) return;
    const items = [...currentList];
    const type = listType;
    currentList = [];
    listType = null;

    if (type === 'ul') {
      elements.push(
        <ul key={`ul-${elementKey++}`} className="space-y-3 my-4 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#8b9bb4] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] mt-2.5 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    } else {
      elements.push(
        <ol key={`ol-${elementKey++}`} className="space-y-3 my-4 pl-1">
          {items.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#8b9bb4] leading-relaxed">
              <span className="text-[#d4af37] font-semibold text-xs mt-1 shrink-0 min-w-[1.25rem]">
                {idx + 1}.
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) {
      flushList();
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={`h2-${elementKey++}`} className="font-serif text-2xl sm:text-3xl text-[#f1f4f8] pt-8 pb-3 border-b border-[#1e2638] mt-4">
          {renderInline(line.slice(3).trim())}
        </h2>
      );
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={`h3-${elementKey++}`} className="font-serif text-xl sm:text-2xl text-[#f1f4f8] pt-6 pb-2 mt-3">
          {renderInline(line.slice(4).trim())}
        </h3>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote key={`quote-${elementKey++}`} className="p-4 bg-[#121720] border-l-2 border-[#d4af37] rounded-r text-sm text-[#e2e8f0] italic my-4 leading-relaxed">
          {renderInline(line.slice(2).trim())}
        </blockquote>
      );
      continue;
    }

    // Unordered List (- or *)
    if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'ul') flushList();
      listType = 'ul';
      currentList.push(line.slice(2).trim());
      continue;
    }

    // Ordered List (1. , 2. )
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      if (listType !== 'ol') flushList();
      listType = 'ol';
      currentList.push(numberedMatch[2].trim());
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${elementKey++}`} className="text-base sm:text-lg text-[#8b9bb4] leading-relaxed font-normal my-4">
        {renderInline(line)}
      </p>
    );
  }

  flushList();

  return <div className={`space-y-2 ${className}`}>{elements}</div>;
};
