import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const UpvoteButton = ({ reportId, initialCount = 0, initialUpvoted = false }) => {
  const { user, getToken } = useAuth();
  const navigate = useNavigate();
  const [count, setCount]       = useState(initialCount);
  const [upvoted, setUpvoted]   = useState(initialUpvoted);
  const [loading, setLoading]   = useState(false);

  const handleUpvote = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Sign in to upvote reports.');
      navigate('/login');
      return;
    }
    if (loading) return;
    setLoading(true);

    // Optimistic update
    const prev = { count, upvoted };
    setCount(c => upvoted ? c - 1 : c + 1);
    setUpvoted(v => !v);

    try {
      const token = await getToken();
      const { data } = await axios.put(
        `${API}/api/reports/${reportId}/upvote`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCount(data.upvotes);
      setUpvoted(data.userUpvoted);
    } catch (err) {
      // Rollback on error
      setCount(prev.count);
      setUpvoted(prev.upvoted);
      toast.error(err.response?.data?.error || 'Failed to upvote.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleUpvote}
      disabled={loading}
      className={`group flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 font-mono text-sm font-medium
        ${upvoted
          ? 'bg-city-orange/10 border-city-orange/40 text-city-orange'
          : 'bg-city-surface border-city-border text-city-subtext hover:border-city-orange/30 hover:text-city-orange hover:bg-city-orange/5'
        }
        ${loading ? 'opacity-60 cursor-wait' : 'cursor-pointer'}
      `}
      title={upvoted ? 'Remove upvote' : 'Upvote this issue'}
    >
      {/* Arrow icon */}
      <svg
        width="14" height="14" viewBox="0 0 14 14" fill="none"
        className={`transition-transform duration-200 ${upvoted ? 'scale-110' : 'group-hover:-translate-y-0.5'}`}
      >
        <path
          d="M7 2L13 9H1L7 2Z"
          fill={upvoted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <rect x="5.5" y="9" width="3" height="3" rx="0.5"
          fill={upvoted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
      <span className={`transition-all duration-200 ${loading ? 'opacity-50' : ''}`}>
        {count}
      </span>
    </button>
  );
};

export default UpvoteButton;
