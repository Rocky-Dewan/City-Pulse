import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import ReportCard from '../components/ReportCard';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// TASK 5: Feed now does a relational JOIN including profiles.points and
// profiles.badge so every ReportCard can display the gamification info.
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIES = ['all', 'pothole', 'streetlight', 'flooding', 'garbage', 'vandalism', 'other'];
const STATUSES   = ['all', 'pending', 'in_progress', 'resolved'];
const SORT_OPTS  = [
  { value: 'upvotes', label: 'Most Upvoted' },
  { value: 'newest',  label: 'Newest First' },
  { value: 'oldest',  label: 'Oldest First' },
];

const StatPill = ({ value, label, color }) => (
  <div className="flex flex-col items-center px-4 py-3 bg-city-card border border-city-border rounded-xl">
    <span className={`font-display font-bold text-xl ${color}`}>{value}</span>
    <span className="font-body text-xs text-city-muted mt-0.5">{label}</span>
  </div>
);

const Home = () => {
  const { user } = useAuth();

  const [reports,       setReports]       = useState([]);
  const [userUpvoteIds, setUserUpvoteIds] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [location,      setLocation]      = useState(null);
  const [locLoading,    setLocLoading]    = useState(false);
  const [nearbyMode,    setNearbyMode]    = useState(false);
  const [category,      setCategory]      = useState('all');
  const [status,        setStatus]        = useState('all');
  const [sort,          setSort]          = useState('upvotes');
  const [stats,         setStats]         = useState({ total: 0, pending: 0, resolved: 0 });
  const [search,        setSearch]        = useState('');
  const fetchId = useRef(0);

  // Stats hero
  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: total }, { count: pending }, { count: resolved }] = await Promise.all([
        supabase.from('reports').select('*', { count: 'exact', head: true }),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'resolved'),
      ]);
      setStats({ total: total || 0, pending: pending || 0, resolved: resolved || 0 });
    };
    fetchStats();
  }, []);

  // ── TASK 5: Full JOIN with profiles to include points + badge ─────────────
  const fetchReports = useCallback(async () => {
    const id = ++fetchId.current;
    setLoading(true);
    try {
      let query = supabase
        .from('reports')
        .select(`
          *,
          profiles (
            id,
            username,
            full_name,
            avatar_url,
            points,
            badge
          )
        `);

      if (category !== 'all') query = query.eq('category', category);
      if (status   !== 'all') query = query.eq('status',   status);

      if (sort === 'upvotes') query = query.order('upvotes',    { ascending: false }).order('created_at', { ascending: false });
      if (sort === 'newest')  query = query.order('created_at', { ascending: false });
      if (sort === 'oldest')  query = query.order('created_at', { ascending: true  });

      query = query.limit(50);

      const { data, error } = await query;
      if (fetchId.current !== id) return; // stale — discard
      if (error) throw error;

      const normalised = (data || []).map(r => ({
        ...r,
        reporter_name:   r.profiles?.full_name  || r.profiles?.username || 'Anonymous',
        reporter_avatar: r.profiles?.avatar_url  || null,
        reporter_points: r.profiles?.points      ?? 0,
        reporter_badge:  r.profiles?.badge       || 'none',
      }));

      setReports(normalised);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports.');
    } finally {
      if (fetchId.current === id) setLoading(false);
    }
  }, [category, status, sort]);

  // Nearby: use RPC which already returns reporter fields
  const fetchNearbyReports = useCallback(async (lat, lon) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_nearby_reports', {
        lat,
        lon,
        radius_meters: 10000,
      });
      if (error) throw error;

      let filtered = data || [];
      if (category !== 'all') filtered = filtered.filter(r => r.category === category);
      if (status   !== 'all') filtered = filtered.filter(r => r.status   === status);
      setReports(filtered);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load nearby reports.');
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  // Load user's upvoted IDs
  useEffect(() => {
    if (!user) { setUserUpvoteIds([]); return; }
    supabase
      .from('upvotes')
      .select('report_id')
      .eq('user_id', user.id)
      .then(({ data }) => setUserUpvoteIds((data || []).map(u => u.report_id)));
  }, [user]);

  useEffect(() => {
    if (nearbyMode && location) {
      fetchNearbyReports(location.lat, location.lon);
    } else {
      fetchReports();
    }
  }, [fetchReports, fetchNearbyReports, nearbyMode, location]);

  const handleLocate = () => {
    if (nearbyMode) { setNearbyMode(false); return; }
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported by your browser.');
      return;
    }
    setLocLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lon } = pos.coords;
        setLocation({ lat, lon });
        setNearbyMode(true);
        setLocLoading(false);
        toast.success('Showing reports within 10km of you.');
      },
      () => {
        setLocLoading(false);
        toast.error('Location denied. Showing all reports instead.');
      }
    );
  };

  const displayedReports = search.trim()
    ? reports.filter(r =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())
      )
    : reports;

  return (
    <div className="page-container">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="orange-dot" />
              <span className="font-mono text-xs text-city-orange tracking-widest uppercase">Live Feed</span>
            </div>
            <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-city-text leading-none">
              City<span className="text-city-orange text-glow">Pulse</span>
            </h1>
            <p className="font-body text-city-subtext mt-2 text-sm max-w-md">
              Report urban issues. Upvote what matters. Hold your city accountable.
            </p>
          </div>
          {!user && (
            <div className="flex items-center gap-3 self-end">
              <Link to="/signup" className="btn-primary">Start Reporting →</Link>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <StatPill value={stats.total}    label="Total Reports"   color="text-city-text"  />
          <StatPill value={stats.pending}  label="Awaiting Action" color="text-city-amber" />
          <StatPill value={stats.resolved} label="Issues Resolved" color="text-city-green" />
          {user && (
            <Link
              to="/report"
              className="flex flex-col items-center px-4 py-3 bg-city-orange/10 border border-city-orange/30 rounded-xl hover:bg-city-orange/20 transition-colors"
            >
              <span className="font-display font-bold text-xl text-city-orange">+</span>
              <span className="font-body text-xs text-city-orange/80 mt-0.5">New Report</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────── */}
      <div className="sticky top-[65px] z-40 bg-city-bg/90 backdrop-blur-sm border-b border-city-border mb-6 pb-4 -mx-4 px-4 sm:-mx-6 sm:px-6 animate-fade-in">
        <div className="flex flex-wrap items-center gap-2 pt-4">

          {/* Nearby toggle */}
          <button
            onClick={handleLocate}
            disabled={locLoading}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium transition-all ${
              nearbyMode
                ? 'bg-city-blue/10 border-city-blue/40 text-city-blue'
                : 'bg-city-card border-city-border text-city-subtext hover:border-city-blue/30 hover:text-city-blue'
            }`}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M6 1v1.5M6 9.5V11M1 6h1.5M9.5 6H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {locLoading ? 'Locating…' : nearbyMode ? 'Nearby (10km) ✕' : 'Near Me'}
          </button>

          {/* Search */}
          <input
            type="text"
            placeholder="Search reports…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-city-card border border-city-border text-city-subtext text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-city-orange w-44"
          />

          {/* Category */}
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="bg-city-card border border-city-border text-city-subtext text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-city-orange cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c === 'all' ? 'All Categories' : c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="bg-city-card border border-city-border text-city-subtext text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-city-orange cursor-pointer"
          >
            {STATUSES.map(s => (
              <option key={s} value={s}>
                {s === 'all' ? 'All Statuses' : s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            disabled={nearbyMode}
            className="bg-city-card border border-city-border text-city-subtext text-xs font-mono px-3 py-1.5 rounded-lg focus:outline-none focus:border-city-orange cursor-pointer disabled:opacity-40"
          >
            {SORT_OPTS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <span className="ml-auto font-mono text-xs text-city-muted">
            {loading ? '…' : `${displayedReports.length} report${displayedReports.length !== 1 ? 's' : ''}`}
          </span>
        </div>
      </div>

      {/* ── Report Grid ────────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-44 -mx-6 -mt-6 mb-5 bg-city-border/30 rounded-t-xl" />
              <div className="h-4 bg-city-border/30 rounded w-1/3 mb-3" />
              <div className="h-5 bg-city-border/30 rounded w-4/5 mb-2" />
              <div className="h-4 bg-city-border/30 rounded w-full mb-1" />
              <div className="h-4 bg-city-border/30 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : displayedReports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-city-card border border-city-border flex items-center justify-center">
            <span className="text-2xl">🏙️</span>
          </div>
          <div>
            <p className="font-display font-semibold text-city-text text-lg">No reports found</p>
            <p className="font-body text-sm text-city-muted mt-1">
              {nearbyMode ? 'No issues reported within 10km.' : 'Be the first to report an issue.'}
            </p>
          </div>
          {user && (
            <Link to="/report" className="btn-primary mt-2">Report an Issue</Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedReports.map((report, i) => (
            <ReportCard
              key={report.id}
              report={report}
              userUpvotedIds={userUpvoteIds}
              style={{ animationDelay: `${i * 0.05}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
