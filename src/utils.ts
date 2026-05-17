export const formatNumber = (n: number): string => {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
};

export const formatDuration = (m: number): string => {
  if (m >= 60) return Math.round(m / 60) + 'h';
  return m + 'm';
};

export const formatCost = (c: number): string => {
  if (c === 0) return '$0.00';
  if (c >= 1) return '$' + c.toFixed(2);
  if (c >= 0.01) return '$' + c.toFixed(3);
  if (c >= 0.000001) return '$' + c.toFixed(6);
  return '< $0.000001';
};

export const COLORS = [
  '#60a5fa', '#f472b6', '#a78bfa', '#fbbf24', '#34d399',
  '#fb923c', '#22d3ee', '#f87171', '#818cf8', '#a3e635'
];
