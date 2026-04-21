import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, CategoryBadge } from '../components/StatusBadge';
import BadgeIcon from '../components/BadgeIcon';
import { formatDistanceToNow, format } from 'date-fns';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const STATUSES      = ['pending', 'in_progress', 'resolved'];
const STATUS_LABELS = { pending: 'Pending', in_progress: 'In Progress', resolved: 'Resolved' };
const STATUS_COLORS = {
  pending:     'text-city-amber  bg-city-amber/10  border-city-amber/20',
  in_progress: 'text-city-blue   bg-city-blue/10   border-city-blue/20',
  resolved:    'text-city-green  bg-city-green/10  border-city-green/20',
};

const MetricCard = ({ label, value, color, icon }) => (
  <div className="card flex items-center gap-4">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg`}>{icon}</div>
    <div>
      <p className="font-mono text-2xl font-bold text-city-text">{value}</p>
      <p className="font-body text-xs text-city-muted">{label}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { getToken } = useAuth();
  const [reports,     setReports]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [updating,    setUpdating]    = useState(null);
  const [filter,      setFilter]      = useState('all');
  const [search,      setSearch]      = useState('');
  const [sortBy,      setSortBy]      = useState('newest');
  const [expanded,    setExpanded]    = useState(null);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const PER_PAGE = 15;

  const fetchAllReports = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const token = await getToken();
      const { data } = await axios.get(
        `${API}/api/reports?limit=${PER_PAGE}&page=${pageNum}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(data.reports || []);
      setTotalPages(data.pagination.pages);
    } catch {
      toast.error('Failed to load reports.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAllReports(page); }, [fetchAllReports, page]);

  const handleStatusChange = async (reportId, newStatus) => {
    if (updating) return;
    setUpdating(reportId);
    try {
      const token = await getToken();
      const { data } = await axios.put(
        `${API}/api/reports/${reportId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReports(prev =>
        prev.map(r => r.id === reportId ? { ...r, status: data.report.status } : r)
      );
      // Note: resolving triggers the DB gamification trigger automatically
      toast.success(
        newStatus === 'resolved'
          ? `✅ Marked resolved — reporter awarded 100 pts!`
          : `Status updated to "${STATUS_LABELS[newStatus]}"`
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const filtered = reports
    .filter(r => filter === 'all' || r.status === filter)
    .filter(r => {
      const q = search.toLowerCase();
      return !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.category.includes(q);
    })
    .sort((a, b) => {
      if (sortBy === 'newest')  return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest')  return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'upvotes') return b.upvotes - a.upvotes;
      return 0;
    });

  const paginated = filtered;

  const counts = {
    total:       reports.length,
    pending:     reports.filter(r => r.status === 'pending').length,
    in_progress: reports.filter(r => r.status === 'in_progress').length,
    resolved:    reports.filter(r => r.status === 'resolved').length,
  };

  const catEmoji = (cat) =>
    ({ pothole:'🕳️', flooding:'🌊', streetlight:'💡', garbage:'🗑️', vandalism:'🔨', other:'📌' }[cat] || '📌');

  return (
    <div className="page-container">

      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-2 mb-2">
          <span className="badge bg-city-amber/10 border border-city-amber/20 text-city-amber font-mono text-[10px] tracking-widest">
            ADMIN PANEL
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-city-text">Dashboard</h1>
        <p className="font-body text-sm text-city-subtext mt-1">Manage and resolve reported city issues.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-fade-in">
        <MetricCard label="Total Reports"   value={counts.total}       icon="📊" />
        <MetricCard label="Pending Review"  value={counts.pending}     icon="⏳" />
        <MetricCard label="In Progress"     value={counts.in_progress} icon="🔧" />
        <MetricCard label="Resolved"        value={counts.resolved}    icon="✅" />
      </div>

      {/* Gamification reminder */}
      <div className="flex items-center gap-3 px-4 py-3 bg-city-orange/5 border border-city-orange/20 rounded-xl mb-6 animate-fade-in">
        <span className="text-lg">🎮</span>
        <p className="font-body text-sm text-city-subtext">
          <span className="text-city-orange font-medium">Gamification active: </span>
          Marking a report as Resolved automatically awards the reporter <span className="font-mono text-city-orange">+100 points</span> via database trigger.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5 animate-fade-in">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-city-muted" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            placeholder="Search reports…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-8 py-2 text-sm"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1 bg-city-card border border-city-border rounded-lg p-1">
          {['all', ...STATUSES].map(s => (
            <button
              key={s}
              onClick={() => { setFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                filter === s ? 'bg-city-orange text-white' : 'text-city-subtext hover:text-city-text'
              }`}
            >
              {s === 'all' ? `All (${counts.total})` : `${STATUS_LABELS[s]} (${counts[s]})`}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value)}
          className="bg-city-card border border-city-border text-city-subtext text-xs font-mono px-3 py-2 rounded-lg focus:outline-none focus:border-city-orange cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="upvotes">Most Upvoted</option>
        </select>

        {/* Refresh */}
        <button onClick={() => fetchAllReports(page)} disabled={loading} className="btn-ghost text-xs flex items-center gap-1.5 py-2">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className={loading ? 'animate-spin' : ''}>
            <path d="M11 6.5A4.5 4.5 0 012.5 9M2 6.5A4.5 4.5 0 0110.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            <path d="M10.5 4l1-2M2.5 9l-1 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Report list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-city-card border border-city-border rounded-xl animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="card text-center py-16">
          <p className="font-display font-semibold text-city-text text-lg">No reports found</p>
          <p className="font-body text-sm text-city-muted mt-1">Try adjusting your filters.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((report, i) => (
              <div
                key={report.id}
                className="bg-city-card border border-city-border rounded-xl overflow-hidden transition-all duration-200 hover:border-city-orange/30 animate-slide-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {/* Row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Expand */}
                  <button
                    onClick={() => setExpanded(expanded === report.id ? null : report.id)}
                    className="text-city-muted hover:text-city-subtext flex-shrink-0"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                      style={{ transform: expanded === report.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                      <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>

                  {/* Thumbnail */}
                  {report.image_url ? (
                    <img src={report.image_url} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0 border border-city-border" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-city-surface border border-city-border flex items-center justify-center text-lg flex-shrink-0">
                      {catEmoji(report.category)}
                    </div>
                  )}

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="font-display text-sm font-semibold text-city-text truncate">{report.title}</span>
                      <CategoryBadge category={report.category} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-city-muted font-mono flex-wrap">
                      <span>↑ {report.upvotes}</span>
                      <span>{formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}</span>
                      <span className="hidden sm:inline">
                        {report.profiles?.username || report.profiles?.full_name || 'anon'}
                      </span>
                      {/* Reporter badge inline */}
                      {report.profiles?.badge && report.profiles.badge !== 'none' && (
                        <BadgeIcon badge={report.profiles.badge} size="sm" showLabel />
                      )}
                    </div>
                  </div>

                  {/* Status changer */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {updating === report.id ? (
                      <div className="w-5 h-5 border-2 border-city-orange border-t-transparent rounded-full animate-spin" />
                    ) : (
                      STATUSES.map(s => (
                        <button
                          key={s}
                          onClick={() => report.status !== s && handleStatusChange(report.id, s)}
                          disabled={report.status === s}
                          title={`Set to ${STATUS_LABELS[s]}`}
                          className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-medium transition-all ${
                            report.status === s
                              ? STATUS_COLORS[s] + ' cursor-default'
                              : 'bg-city-surface border-city-border text-city-muted hover:border-city-orange/30 hover:text-city-subtext cursor-pointer'
                          }`}
                        >
                          {s === 'in_progress' ? '↻' : s === 'pending' ? '⏳' : '✓'}
                          <span className="hidden sm:inline ml-1">{STATUS_LABELS[s]}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {expanded === report.id && (
                  <div className="border-t border-city-border px-5 py-4 bg-city-surface/50 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-1">Description</p>
                        <p className="font-body text-sm text-city-subtext leading-relaxed">{report.description}</p>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-1">Location</p>
                          <p className="font-mono text-xs text-city-subtext">
                            {report.location_text || (
                              report.latitude && report.longitude
                                ? `${parseFloat(report.latitude).toFixed(5)}, ${parseFloat(report.longitude).toFixed(5)}`
                                : 'N/A'
                            )}
                          </p>
                        </div>
                        <div>
                          <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-1">Submitted</p>
                          <p className="font-mono text-xs text-city-subtext">{format(new Date(report.created_at), 'MMM d, yyyy HH:mm')}</p>
                        </div>
                        <div>
                          <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-1">Report ID</p>
                          <p className="font-mono text-[10px] text-city-muted break-all">{report.id}</p>
                        </div>
                        {/* Reporter gamification info */}
                        {report.profiles && (
                          <div>
                            <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-1">Reporter</p>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs text-city-subtext">{report.profiles.username}</span>
                              <span className="font-mono text-xs text-city-orange">{report.profiles.points ?? 0} pts</span>
                              <BadgeIcon badge={report.profiles.badge || 'none'} size="sm" showLabel />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {report.image_url && (
                      <div className="mt-4">
                        <p className="font-body text-xs text-city-muted uppercase tracking-wider mb-2">Photo Evidence</p>
                        <img src={report.image_url} alt="Evidence" className="rounded-lg max-h-48 object-cover border border-city-border" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">← Prev</button>
              <span className="font-mono text-xs text-city-muted">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="btn-secondary px-3 py-2 text-xs disabled:opacity-40">Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
