import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { StatusBadge, CategoryBadge } from './StatusBadge';
import UpvoteButton from './UpvoteButton';
import BadgeIcon from './BadgeIcon';
import { useAuth } from '../context/AuthContext';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5: ReportCard now displays full reporter profile:
//   • Reporter name
//   • Reporter avatar (with fallback initial)
//   • Reporter total points
//   • Reporter badge (visual icon + label)
//
// Supports both the regular feed (report.profiles join) and the RPC feed
// (report.reporter_name etc.) from get_nearby_reports.
// ─────────────────────────────────────────────────────────────────────────────

const ReportCard = ({ report, userUpvotedIds = [], style = {} }) => {
  const { user } = useAuth();
  const userUpvoted = userUpvotedIds.includes(report.id);

  const timeAgo = formatDistanceToNow(new Date(report.created_at), { addSuffix: true });

  // Normalise reporter data — works for both join and RPC shapes
  const reporterName   = report.reporter_name   || report.profiles?.full_name    || report.profiles?.username || 'Anonymous';
  const reporterAvatar = report.reporter_avatar  || report.profiles?.avatar_url   || null;
  const reporterPoints = report.reporter_points  ?? report.profiles?.points       ?? 0;
  const reporterBadge  = report.reporter_badge   || report.profiles?.badge        || 'none';

  const initials = reporterName.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase() || 'A';

  return (
    <article
      className="card hover:border-city-orange/30 transition-all duration-300 hover:shadow-orange-glow group animate-slide-up"
      style={style}
    >
      {/* Image */}
      {report.image_url && (
        <div className="relative -mx-6 -mt-6 mb-5 overflow-hidden rounded-t-xl h-44">
          <img
            src={report.image_url}
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-city-card/80 to-transparent" />
          <div className="absolute bottom-3 left-4">
            <CategoryBadge category={report.category} />
          </div>
        </div>
      )}

      {/* Header badges */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-2">
          {!report.image_url && <CategoryBadge category={report.category} />}
          <StatusBadge status={report.status} />
        </div>
        <span className="font-mono text-[11px] text-city-muted whitespace-nowrap flex-shrink-0">
          {timeAgo}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display font-semibold text-base text-city-text leading-snug mb-2 group-hover:text-city-orange transition-colors line-clamp-2">
        {report.title}
      </h3>

      {/* Description */}
      <p className="font-body text-sm text-city-subtext leading-relaxed line-clamp-2 mb-4">
        {report.description}
      </p>

      {/* ── TASK 5: Reporter info row ──────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2.5 bg-city-surface/60 rounded-lg border border-city-border/60">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {reporterAvatar ? (
            <img
              src={reporterAvatar}
              alt={reporterName}
              className="w-7 h-7 rounded-full object-cover border border-city-border"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-city-orange/20 border border-city-orange/30 flex items-center justify-center">
              <span className="font-mono text-[10px] text-city-orange font-bold">{initials}</span>
            </div>
          )}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="font-body text-xs text-city-subtext truncate block">{reporterName}</span>
          <span className="font-mono text-[10px] text-city-muted">{reporterPoints.toLocaleString()} pts</span>
        </div>

        {/* Badge */}
        <BadgeIcon badge={reporterBadge} size="sm" showLabel />
      </div>

      {/* Footer: location + upvote */}
      <div className="flex items-center justify-between pt-3 border-t border-city-border/60">
        {/* Location */}
        <div className="flex items-center gap-1 text-city-muted min-w-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="flex-shrink-0">
            <circle cx="5" cy="4" r="1.5" stroke="currentColor" strokeWidth="1"/>
            <path d="M5 1C3.34 1 2 2.34 2 4c0 2.5 3 5 3 5s3-2.5 3-5c0-1.66-1.34-3-3-3z" stroke="currentColor" strokeWidth="1" fill="none"/>
          </svg>
          <span className="font-mono text-[10px] truncate">
            {report.location_text
              ? report.location_text.split(',').slice(0, 2).join(',')
              : (report.latitude && report.longitude)
                ? `${parseFloat(report.latitude).toFixed(3)}, ${parseFloat(report.longitude).toFixed(3)}`
                : 'Location not specified'}
          </span>
        </div>

        {/* Upvote button */}
        <UpvoteButton
          reportId={report.id}
          initialCount={report.upvotes}
          initialUpvoted={userUpvoted}
        />
      </div>
    </article>
  );
};

export default ReportCard;
