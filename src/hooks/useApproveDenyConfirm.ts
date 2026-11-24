import { useState } from 'react';

export type ApproveDenyKind = 'approve' | 'deny';

/**
 * State for an approve/deny confirmation dialog.
 * `onConfirm` runs when the user confirms; the dialog closes only if it succeeds.
 */
export function useApproveDenyConfirm<T>(
  onConfirm: (kind: ApproveDenyKind, target: T) => Promise<void>
) {
  const [state, setState] = useState<{
    open: boolean;
    kind: ApproveDenyKind | null;
    target?: T;
  }>({ open: false, kind: null });
  const [pending, setPending] = useState(false);

  const openConfirm = (kind: ApproveDenyKind, target: T) =>
    setState({ open: true, kind, target });

  const closeConfirm = () => setState({ open: false, kind: null });

  const handleConfirm = async () => {
    if (!state.kind || state.target === undefined) return;
    try {
      setPending(true);
      await onConfirm(state.kind, state.target);
      closeConfirm();
    } catch (e) {
      console.error(e);
    } finally {
      setPending(false);
    }
  };

  return { ...state, pending, openConfirm, closeConfirm, handleConfirm };
}
