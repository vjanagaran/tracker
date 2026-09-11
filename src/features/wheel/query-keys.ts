export function scoreQueryKey(cycleId: string) {
  return ["wheel-scores", cycleId] as const;
}

export function touchedQueryKey(cycleId: string) {
  return ["wheel-scores-touched", cycleId] as const;
}
