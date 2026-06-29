import type { ReactNode } from 'react';

export interface DocBlock {
  title: string;
  paragraphs?: string[];
  items?: string[];
  children?: ReactNode;
}
