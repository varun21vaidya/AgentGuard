import React from 'react';

const config: Record<string, { label: string; color: string }> = {
  safe:         { label: 'Safe',         color: 'bg-green-500' },
  reversible:   { label: 'Reversible',   color: 'bg-yellow-500' },
  irreversible: { label: 'Irreversible', color: 'bg-red-500' },
};

export default function RiskBadge({ level }: { level: string }) {
  const { label, color } = config[level] || config.safe;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold text-white px-1.5 py-0.5 rounded ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
      {label}
    </span>
  );
}
