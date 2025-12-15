import { useEffect, useRef } from 'react';
import MDEditor from '@uiw/react-md-editor';
import { Box, FormLabel } from '@mui/material';
import '@uiw/react-md-editor/markdown-editor.css';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  label?: string;
  minHeight?: number;
}

export const MarkdownEditor = ({
  value,
  onChange,
  label,
  minHeight = 200,
}: MarkdownEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure the editor container has proper styling
    if (editorRef.current) {
      const editorContainer = editorRef.current.querySelector('.w-md-editor');
      if (editorContainer) {
        (editorContainer as HTMLElement).style.minHeight = `${minHeight}px`;
      }
    }
  }, [minHeight, value]);

  return (
    <Box sx={{ mt: 2, mb: 1 }}>
      {label && (
        <FormLabel sx={{ mb: 1, display: 'block' }}>{label}</FormLabel>
      )}
      <Box ref={editorRef} sx={{ '& .w-md-editor': { width: '100%' } }}>
        <MDEditor
          value={value}
          onChange={onChange}
          preview="edit"
          hideToolbar={false}
          visibleDragbar={false}
          data-color-mode="light"
        />
      </Box>
    </Box>
  );
};

