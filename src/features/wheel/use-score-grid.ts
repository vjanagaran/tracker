"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { saveScores } from "./actions";
import { scoreQueryKey, touchedQueryKey } from "./query-keys";
import type { ScoreTriple } from "./types";

type ScoreMap = Record<string, ScoreTriple>;

const emptyScore = (): ScoreTriple => ({
  scoreNow: null,
  target1y: null,
  target5y: null,
});

function touchKey(spokeId: string, field: keyof ScoreTriple) {
  return `${spokeId}:${field}`;
}

export function useScoreGrid(
  cycleId: string | null,
  initialScores: ScoreMap,
  spokeIds: string[],
) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);
  const scoresKey = cycleId ? scoreQueryKey(cycleId) : ["wheel-scores", "none"];
  const touchedKey = cycleId
    ? touchedQueryKey(cycleId)
    : ["wheel-scores-touched", "none"];

  const scoresQuery = useQuery({
    queryKey: scoresKey,
    queryFn: () => initialScores,
    initialData: initialScores,
    staleTime: Infinity,
    enabled: Boolean(cycleId),
  });

  const touchedQuery = useQuery({
    queryKey: touchedKey,
    queryFn: () => new Set<string>(),
    initialData: new Set<string>(),
    staleTime: Infinity,
    enabled: Boolean(cycleId),
  });

  const scores = scoresQuery.data ?? initialScores;
  const touched = touchedQuery.data ?? new Set<string>();

  const persist = useMutation({
    mutationFn: async (next: ScoreMap) => {
      if (!cycleId) {
        throw new Error("Start a cycle before saving a rating.");
      }
      const result = await saveScores({
        cycleId,
        scores: spokeIds.map((spokeId) => {
          const score = next[spokeId] ?? emptyScore();
          return {
            spokeId,
            scoreNow: score.scoreNow,
            target1y: score.target1y,
            target5y: score.target5y,
          };
        }),
      });
      if (result && "error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: scoresKey });
      const previous = queryClient.getQueryData<ScoreMap>(scoresKey);
      queryClient.setQueryData(scoresKey, next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(scoresKey, context.previous);
      }
    },
  });

  function markTouched(spokeId: string, field: keyof ScoreTriple) {
    const next = new Set(touched);
    next.add(touchKey(spokeId, field));
    queryClient.setQueryData(touchedKey, next);
  }

  function updateScore(
    spokeId: string,
    field: keyof ScoreTriple,
    value: number | null,
  ) {
    const next: ScoreMap = {
      ...scores,
      [spokeId]: {
        ...(scores[spokeId] ?? emptyScore()),
        [field]: value,
      },
    };
    setSaved(false);
    markTouched(spokeId, field);
    persist.mutate(next);
  }

  function saveAll() {
    persist.mutate(scores, {
      onSuccess: () => setSaved(true),
    });
  }

  function isTouched(spokeId: string, field: keyof ScoreTriple) {
    return touched.has(touchKey(spokeId, field));
  }

  return {
    scores,
    updateScore,
    saveAll,
    isTouched,
    isSaving: persist.isPending,
    saveError: persist.error instanceof Error ? persist.error.message : null,
    saved,
  };
}
