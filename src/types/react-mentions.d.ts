declare module "react-mentions" {
  import type { CSSProperties, ReactNode, RefObject } from "react";

  export interface MentionItem {
    id: string;
    display: string;
    [key: string]: unknown;
  }

  export interface MentionsInputStyle {
    control?: CSSProperties;
    input?: CSSProperties;
    highlighter?: CSSProperties;
    suggestions?: {
      list?: CSSProperties;
      item?: CSSProperties;
      itemFocused?: CSSProperties;
    };
  }

  export interface MentionsInputProps {
    value: string;
    onChange: (
      event: { target: { value: string } },
      newValue: string,
      newPlainTextValue: string,
      mentions: MentionItem[]
    ) => void;
    onKeyDown?: (event: React.KeyboardEvent) => void;
    placeholder?: string;
    disabled?: boolean;
    inputRef?: RefObject<HTMLTextAreaElement | HTMLInputElement>;
    style?: MentionsInputStyle;
    className?: string;
    children?: ReactNode;
    allowSuggestionsAboveCursor?: boolean;
    singleLine?: boolean;
  }

  export interface MentionProps {
    trigger: string | RegExp;
    data:
      | MentionItem[]
      | ((
          query: string,
          callback: (results: MentionItem[]) => void
        ) => void);
    markup?: string;
    displayTransform?: (id: string, display: string) => string;
    renderSuggestion?: (
      suggestion: MentionItem,
      search: string,
      highlightedDisplay: ReactNode,
      index: number,
      focused: boolean
    ) => ReactNode;
    appendSpaceOnAdd?: boolean;
    onAdd?: (id: string, display: string) => void;
  }

  export const MentionsInput: React.FC<MentionsInputProps>;
  export const Mention: React.FC<MentionProps>;
}
