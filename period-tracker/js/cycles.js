// Cycle prediction and period type determination
import { addDays, diffDays, fromISO, toISO, today } from "./dateUtils.js";

// These will be set by the main app to reference the global state
let state = null;
export function setState(stateObj) {
  state = stateObj;
}

export function getCycleInfo() {
  if (!state.lastPeriodStart) return null;

  const todayD = fromISO(today());
  const cl = state.cycleLength;
  const pd = state.periodDuration;

  // Always derive cycleStart from state.lastPeriodStart — the same source
  // calculatePredictions() uses, updated by applySettings() whenever the
  // user edits settings.
  let cycleStart = fromISO(state.lastPeriodStart);
  if (cycleStart > todayD) {
    while (cycleStart > todayD) cycleStart = addDays(cycleStart, -cl);
  } else {
    while (addDays(cycleStart, cl) <= todayD)
      cycleStart = addDays(cycleStart, cl);
  }

  const cycleDay = diffDays(cycleStart, todayD) + 1;
  const nextPeriod = addDays(cycleStart, cl);

  const daysUntilNext = diffDays(todayD, nextPeriod);

  const fertileStart = Math.max(8, cl - 18);
  const fertileEnd = cl - 11;
  const ovulationDay = cl - 14;

  // Check ovulation before fertile window and before follicular so it is
  // reachable even for short cycles where ovulationDay < fertileStart.
  let phase = "Luteal";
  let phaseColor = "var(--lavender)";
  if (cycleDay >= 1 && cycleDay <= pd) {
    phase = "Menstruation";
    phaseColor = "var(--rose)";
  } else if (cycleDay === ovulationDay) {
    phase = "Ovulation Day";
    phaseColor = "var(--ovulation)";
  } else if (cycleDay >= fertileStart && cycleDay <= fertileEnd) {
    phase = "Fertile Window";
    phaseColor = "var(--fertile-green)";
  } else if (cycleDay < fertileStart) {
    phase = "Follicular";
    phaseColor = "var(--amber)";
  }

  return {
    cycleStart,
    cycleDay,
    nextPeriod,
    daysUntilNext,
    cl,
    pd,
    fertileStart,
    fertileEnd,
    ovulationDay,
    phase,
    phaseColor,
  };
}

export function calculatePredictions() {
  if (!state || !state.lastPeriodStart) return [];

  // state.lastPeriodStart is set by applySettings() when the user edits settings.
  // Always read from it so predictions are consistent with getCycleInfo().
  const cl = state.cycleLength;
  const pd = state.periodDuration;
  const ovOffset = cl - 14;
  const fertStartOff = Math.max(8, cl - 18);
  const fertEndOff = cl - 11;
  const base = fromISO(state.lastPeriodStart);
  const predictions = [];

  for (let i = 0; i < 6; i++) {
    const periodStart = addDays(base, cl * i);
    const periodEnd = addDays(periodStart, pd - 1);
    const ovulation = addDays(periodStart, ovOffset);
    const fertileStart = addDays(periodStart, fertStartOff);
    const fertileEnd = addDays(periodStart, fertEndOff);
    predictions.push({
      periodStart,
      periodEnd,
      ovulation,
      fertileStart,
      fertileEnd,
    });
  }
  return predictions;
}

export function getDayType(dateStr) {
  if (!state) return "normal";

  const preds = calculatePredictions();
  if (preds.length === 0) return "normal";

  const d = fromISO(dateStr);

  for (const p of preds) {
    if (d >= p.periodStart && d <= p.periodEnd) return "period";
    if (toISO(d) === toISO(p.ovulation)) return "ovulation";
    if (d >= p.fertileStart && d <= p.fertileEnd) return "fertile";
  }
  return "normal";
}

export function isPredictedFuturePeriod(dateStr) {
  const d = fromISO(dateStr);
  const todayD = fromISO(today());
  if (d <= todayD) return false;
  return getDayType(dateStr) === "period";
}
