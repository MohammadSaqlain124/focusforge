// src/components/SessionHistory.jsx
// Paginated list of session history with status filter.

import { useState, useEffect } from 'react';
import { fetchSessions } from '../services/sessionService';
import SessionRow from './SessionRow';

function SessionHistory({ refreshKey }) {
  const [sessions, setSessions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pages: 1,
  });
  const [statusFilter, setStatusFilter] = useState(''); // '' = all
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // === Load page 1 whenever filter or refreshKey changes ===
  useEffect(() => {
    loadFirstPage();
  }, [statusFilter, refreshKey]);

  const loadFirstPage = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchSessions({
        status: statusFilter || undefined,
        page: 1,
        limit: 5,
      });
      setSessions(res.data);
      setPagination(res.pagination);
    } catch (err) {
      setError('Could not load sessions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    setError('');
    try {
      const nextPage = pagination.page + 1;
      const res = await fetchSessions({
        status: statusFilter || undefined,
        page: nextPage,
        limit: 5,
      });
      // APPEND new sessions to the existing list
      setSessions((prev) => [...prev, ...res.data]);
      setPagination(res.pagination);
    } catch (err) {
      setError('Could not load more sessions.');
      console.error(err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Whether there are more pages to load
  const hasMore = pagination.page < pagination.pages;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header with filter pills */}
      <div
        style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #2a2a2e',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h2 style={{ marginBottom: '0.25rem' }}>📋 Session history</h2>
          <p className="text-muted" style={{ fontSize: '0.85rem' }}>
            {pagination.total} total {pagination.total === 1 ? 'session' : 'sessions'}
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <FilterPill
            label="All"
            active={statusFilter === ''}
            onClick={() => setStatusFilter('')}
          />
          <FilterPill
            label="Active"
            active={statusFilter === 'active'}
            onClick={() => setStatusFilter('active')}
          />
          <FilterPill
            label="Completed"
            active={statusFilter === 'completed'}
            onClick={() => setStatusFilter('completed')}
          />
          <FilterPill
            label="Abandoned"
            active={statusFilter === 'abandoned'}
            onClick={() => setStatusFilter('abandoned')}
          />
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '1.5rem' }}>
          <p className="text-muted">Loading sessions…</p>
        </div>
      ) : error ? (
        <div style={{ padding: '1.5rem' }}>
          <p className="text-error">{error}</p>
          <button className="btn btn-secondary" onClick={loadFirstPage} style={{ marginTop: '0.5rem' }}>
            Retry
          </button>
        </div>
      ) : sessions.length === 0 ? (
        <div style={{ padding: '1.5rem' }}>
          <p className="text-muted">No sessions found.</p>
        </div>
      ) : (
        <>
          {sessions.map((session) => (
            <SessionRow key={session._id} session={session} />
          ))}

          {/* Load more button */}
          {hasMore && (
            <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid #2a2a2e' }}>
              <button
                className="btn btn-secondary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading…' : `Load more (${pagination.total - sessions.length} left)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Small filter pill component
function FilterPill({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '0.4rem 0.9rem',
        borderRadius: 999,
        border: 'none',
        fontSize: '0.85rem',
        fontWeight: 500,
        background: active ? '#7c5cff' : '#232328',
        color: active ? 'white' : '#a0a0a8',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );
}

export default SessionHistory;