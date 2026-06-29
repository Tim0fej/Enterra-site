import { Fragment, type ReactNode } from 'react';

function formatInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*\n]+\*\*)/g);
  return parts
    .map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        return <strong key={`${keyPrefix}-strong-${index}`}>{part.slice(2, -2)}</strong>;
      }
      return part ? <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment> : null;
    })
    .filter(Boolean) as ReactNode[];
}

function stripListMarker(line: string): string {
  return line.replace(/^\s*(?:[•\-]|\d+\.)\s+/, '');
}

function isBulletLine(line: string): boolean {
  return /^\s*[•\-]\s/.test(line);
}

function isNumberedLine(line: string): boolean {
  return /^\s*\d+\.\s/.test(line);
}

function renderList(items: string[], key: string, ordered: boolean): ReactNode {
  const Tag = ordered ? 'ol' : 'ul';
  return (
    <Tag key={key} className={`formatted-message__list${ordered ? ' formatted-message__list--ordered' : ''}`}>
      {items.map((line, index) => (
        <li key={index}>{formatInline(stripListMarker(line), `${key}-${index}`)}</li>
      ))}
    </Tag>
  );
}

function renderBlock(block: string, blockIndex: number): ReactNode {
  const lines = block.split('\n').filter((line) => line.trim() !== '');
  if (lines.length === 0) return null;

  const nodes: ReactNode[] = [];
  let bulletBuffer: string[] = [];
  let numberedBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    nodes.push(renderList(bulletBuffer, `b${blockIndex}-ul-${nodes.length}`, false));
    bulletBuffer = [];
  };

  const flushNumbered = () => {
    if (numberedBuffer.length === 0) return;
    nodes.push(renderList(numberedBuffer, `b${blockIndex}-ol-${nodes.length}`, true));
    numberedBuffer = [];
  };

  const flushLists = () => {
    flushBullets();
    flushNumbered();
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      flushNumbered();
      bulletBuffer.push(line);
      continue;
    }
    if (isNumberedLine(line)) {
      flushBullets();
      numberedBuffer.push(line);
      continue;
    }

    flushLists();
    nodes.push(
      <p key={`b${blockIndex}-p-${nodes.length}`}>{formatInline(line, `b${blockIndex}-p-${nodes.length}`)}</p>,
    );
  }

  flushLists();

  return <Fragment key={`block-${blockIndex}`}>{nodes}</Fragment>;
}

export function FormattedMessage({ text, className }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}/);

  return (
    <div className={className ? `formatted-message ${className}` : 'formatted-message'}>
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}
