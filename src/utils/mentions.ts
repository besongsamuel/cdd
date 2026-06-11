export interface ParsedMention {
  memberId: string;
  display: string;
}

/** Matches @[Display Name](member:uuid) tokens produced by react-mentions */
export const MENTION_REGEX =
  /@\[([^\]]+)\]\(member:([0-9a-f-]{36})\)/gi;

export function parseMentions(content: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  const regex = new RegExp(MENTION_REGEX.source, "gi");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    mentions.push({
      display: match[1],
      memberId: match[2],
    });
  }

  return mentions;
}

export function uniqueMentionMemberIds(
  content: string,
  excludeMemberId?: string
): string[] {
  const ids = parseMentions(content).map((m) => m.memberId);
  const unique = [...new Set(ids)];
  if (excludeMemberId) {
    return unique.filter((id) => id !== excludeMemberId);
  }
  return unique;
}

export function stripMentionMarkup(content: string): string {
  return content.replace(MENTION_REGEX, "@$1");
}

export type ContentSegment =
  | { type: "text"; value: string }
  | { type: "mention"; display: string; memberId: string };

export function splitContentWithMentions(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const regex = new RegExp(MENTION_REGEX.source, "gi");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "mention",
      display: match[1],
      memberId: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments;
}
