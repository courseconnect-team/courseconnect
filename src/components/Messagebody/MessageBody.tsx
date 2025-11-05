import React from 'react';
import MDEditor, { commands, ICommand } from '@uiw/react-md-editor';

// Add a custom "Underline" command (wraps with <u>...</u> since MD has no underline)
const underlineCommand: ICommand = {
  name: 'underline',
  keyCommand: 'underline',
  buttonProps: { 'aria-label': 'Add underline' },
  icon: <span style={{ textDecoration: 'underline' }}>U</span>,
  execute: (state, api) => {
    const sel = state.selectedText || '';
    const result = `<u>${sel || 'text'}</u>`;
    api.replaceSelection(result);
    // position cursor inside tags if there was no selection
    if (!sel) {
      const pos = state.selection.start + 3;
      api.setSelectionRange({ start: pos, end: pos + 4 });
    }
  },
};

export default function MessageBody({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v || '')}
        // Keep the toolbar to just what you asked for
        commands={[
          commands.bold,
          commands.italic,
          underlineCommand,
          commands.strikethrough, // optional
          commands.divider,
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.divider,
          commands.link,
        ]}
        textareaProps={{
          placeholder: 'Message Body',
        }}
        // Optional: hide the extra right-side commands
        extraCommands={[]}
        preview="edit" // or "live" for side-by-side preview
        height={320}
      />
    </div>
  );
}
