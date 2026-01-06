import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strip markdown formatting from text.
 * Removes bold, italic, headers, backticks, etc.
 * Useful for displaying AI-generated content that may contain markdown.
 */
export function stripMarkdown(text: string): string {
  if (!text) return text;
  return text
    // Remove bold: **text** or __text__
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // Remove italic: *text* or _text_
    .replace(/(?<!\w)\*([^*]+)\*(?!\w)/g, '$1')
    .replace(/(?<!\w)_([^_]+)_(?!\w)/g, '$1')
    // Remove inline code: `text`
    .replace(/`([^`]+)`/g, '$1')
    // Remove headers: # ## ### etc
    .replace(/^#{1,6}\s+/gm, '')
    // Remove strikethrough: ~~text~~
    .replace(/~~(.+?)~~/g, '$1')
    // Clean up any remaining asterisks at start/end
    .replace(/^\*+|\*+$/g, '')
    .trim();
}
