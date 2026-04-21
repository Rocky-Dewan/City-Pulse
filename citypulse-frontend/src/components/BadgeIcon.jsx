import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5: Badge tiers (none → bronze → silver → gold → platinum)
// Thresholds: 1,000 / 5,000 / 10,000 / 100,000 points
// ─────────────────────────────────────────────────────────────────────────────

const BADGE_CONFIG = {
  none:     { label: 'Newcomer',  emoji: '🌱', color: 'text-city-muted    bg-city-surface  border-city-border'  },
  bronze:   { label: 'Bronze',    emoji: '🥉', color: 'text-amber-600    bg-amber-900/20  border-amber-700/30' },
  silver:   { label: 'Silver',    emoji: '🥈', color: 'text-slate-300    bg-slate-700/20  border-slate-500/30' },
  gold:     { label: 'Gold',      emoji: '🥇', color: 'text-yellow-400   bg-yellow-900/20 border-yellow-600/30' },
  platinum: { label: 'Platinum',  emoji: '💎', color: 'text-cyan-300     bg-cyan-900/20   border-cyan-500/30'  },
};

const BadgeIcon = ({ badge = 'none', size = 'md', showLabel = false }) => {
  const cfg = BADGE_CONFIG[badge] || BADGE_CONFIG.none;

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-mono font-medium ${cfg.color}`}>
        {cfg.emoji} {showLabel && cfg.label}
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-mono font-semibold ${cfg.color}`}>
        <span className="text-lg">{cfg.emoji}</span>
        {showLabel && cfg.label}
      </span>
    );
  }

  // md (default)
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-medium ${cfg.color}`}>
      {cfg.emoji} {showLabel && cfg.label}
    </span>
  );
};

export default BadgeIcon;
