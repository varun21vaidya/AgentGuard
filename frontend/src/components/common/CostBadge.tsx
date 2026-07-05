import React from 'react';
import { formatCost } from '../../utils/formatters';

interface CostBadgeProps {
  estimatedCost?: number;
  actualCost?: number;
}

export default function CostBadge({ estimatedCost, actualCost }: CostBadgeProps) {
  if (actualCost !== undefined) {
    return (
      <span className="text-xs bg-green-200 px-2 py-1 rounded font-semibold">
        {formatCost(actualCost)}
      </span>
    );
  }

  if (estimatedCost !== undefined) {
    return (
      <span className="text-xs bg-purple-200 px-2 py-1 rounded font-semibold">
        {formatCost(estimatedCost)} est.
      </span>
    );
  }

  return null;
}
