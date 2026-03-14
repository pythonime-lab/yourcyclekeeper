// Log cleanup logic
let state = null;
export function setState(stateObj) {
  state = stateObj;
}

export function cleanupEmptyLogs() {
  if (!state) return;

  for (const dateStr in state.logs) {
    const log = state.logs[dateStr];
    const empty =
      !log.flow &&
      !log.pain &&
      (log.mood === undefined || log.mood === null) &&
      !(log.note && log.note.trim());
    if (empty) delete state.logs[dateStr];
  }
}
