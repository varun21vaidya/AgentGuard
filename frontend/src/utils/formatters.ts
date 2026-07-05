export function formatCost(usd: number): string {
  if (usd < 0.0001) return `$${usd.toFixed(8)}`;
  if (usd < 0.01) return `$${usd.toFixed(6)}`;
  return `$${usd.toFixed(4)}`;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}

export function formatTimestamp(date: string): string {
  return new Date(date).toLocaleString();
}
