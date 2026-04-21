import React from 'react';

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-city-amber  bg-city-amber/10  border-city-amber/20',  dot: 'bg-city-amber'  },
  in_progress: { label: 'In Progress', color: 'text-city-blue   bg-city-blue/10   border-city-blue/20',   dot: 'bg-city-blue'   },
  resolved:    { label: 'Resolved',    color: 'text-city-green  bg-city-green/10  border-city-green/20',  dot: 'bg-city-green'  },
};

const CATEGORY_CONFIG = {
  pothole:     { label: 'Pothole',      icon: '🕳️' },
  streetlight: { label: 'Streetlight',  icon: '💡' },
  flooding:    { label: 'Flooding',     icon: '🌊' },
  garbage:     { label: 'Garbage',      icon: '🗑️' },
  vandalism:   { label: 'Vandalism',    icon: '🔨' },
  other:       { label: 'Other',        icon: '📌' },
};

export const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`badge border ${cfg.color} font-mono text-[11px]`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

export const CategoryBadge = ({ category }) => {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span className="badge bg-city-surface border border-city-border text-city-subtext font-body text-[11px]">
      {cfg.icon} {cfg.label}
    </span>
  );
};

export default StatusBadge;
