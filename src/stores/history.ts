export type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

export function initHistory<T>(initial: T): HistoryState<T> {
  return { past: [], present: initial, future: [] };
}

export function pushHistory<T>(
  state: HistoryState<T>,
  next: T,
  max = 50,
): HistoryState<T> {
  const past = [...state.past, state.present];
  const trimmedPast = past.length > max ? past.slice(past.length - max) : past;
  return { past: trimmedPast, present: next, future: [] };
}

export function undoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.past.length === 0) return state;
  const previous = state.past[state.past.length - 1];
  const newPast = state.past.slice(0, -1);
  return {
    past: newPast,
    present: previous,
    future: [state.present, ...state.future],
  };
}

export function redoHistory<T>(state: HistoryState<T>): HistoryState<T> {
  if (state.future.length === 0) return state;
  const next = state.future[0];
  const newFuture = state.future.slice(1);
  return {
    past: [...state.past, state.present],
    present: next,
    future: newFuture,
  };
}
