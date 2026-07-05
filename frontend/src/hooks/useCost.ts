import { useState, useCallback } from 'react';
import { CostEstimate } from '../types/cost';

export function useCost() {
  const [estimates, setEstimates] = useState<Record<string, CostEstimate>>({});
  const [actualCosts, setActualCosts] = useState<Record<string, number>>({});
  const [totalCost, setTotalCost] = useState(0);

  const setEstimatesFromEvent = useCallback((estimatesData: Record<string, CostEstimate>) => {
    setEstimates(estimatesData);
  }, []);

  const addActualCost = useCallback((nodeId: string, cost: number) => {
    setActualCosts((prev) => ({ ...prev, [nodeId]: cost }));
    setTotalCost((prev) => prev + cost);
  }, []);

  const reset = useCallback(() => {
    setEstimates({});
    setActualCosts({});
    setTotalCost(0);
  }, []);

  return { estimates, actualCosts, totalCost, setEstimatesFromEvent, addActualCost, reset };
}
