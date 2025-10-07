import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import './App.css';

const isProd = process.env.NODE_ENV === 'production';
const API_BASE = isProd
  ? 'https://clinicflow-v75g.onrender.com'   // Render backend
  : 'http://localhost:5000';                 // Local backend

// Format date nicely or fallback to "—"
function fmtDateTime(input) {
  try {
    if (!input) return '—';
    const d = typeof input === 'string' ? new Date(input) : input;
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

// Derive date from Mongo ObjectId when createdAt is missing
function idToDate(oid) {
  if (!oid || typeof oid !== 'string' || oid.length < 8) return null;
  try {
    const seconds = parseInt(oid.slice(0, 8), 16);
    if (!isFinite(seconds)) return null;
    return new Date(seconds * 1000);
  } catch {
    return null;
  }
}

// Sort helpers
const SORTERS = {
  name: (a, b) => String(a.patientName).localeCompare(String(b.patientName)),
  appt: (a, b) => String(a.appointmentTime).localeCompare(String(b.appointmentTime)),
  created: (a, b) => a.createdTs - b.createdTs, // numeric
  status: (a, b) => String(a.intakeStatus).localeCompare(String(b.intakeStatus)),
  chief: (a, b) => String(a.chiefComplaint).localeCompare(String(b.chiefComplaint)),
};

export default function App() {
  const [intakes, setIntakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [selected, setSelected] = useState(null); // for modal
  const [lastUpdated, setLastUpdated] = useState(null);

  // filters / preferences
  const [query, setQuery] = useState(() => localStorage.getItem('cf_q') || '');
  const [statusFilter, setStatusFilter] = useState(() => localStorage.getItem('cf_status') || 'ALL'); // ALL | Complete | In Progress
  const [onlyUnreviewed, setOnlyUnreviewed] = useState(() => (localStorage.getItem('cf_unrev') || 'false') === 'true');

  const [showLatestOnly, setShowLatestOnly] = useState(() => {
    const v = localStorage.getItem('showLatestOnly');
    return v === null ? true : v === 'true';
  });
  useEffect(() => {
    localStorage.setItem('showLatestOnly', String(showLatestOnly));
  }, [showLatestOnly]);

  const [sortBy, setSortBy] = useState(() => localStorage.getItem('cf_sortBy') || 'created'); // name|appt|created|status|chief
  const [sortDir, setSortDir] = useState(() => localStorage.getItem('cf_sortDir') || 'desc'); // asc|desc

  useEffect(() => localStorage.setItem('cf_q', query), [query]);
  useEffect(() => localStorage.setItem('cf_status', statusFilter), [statusFilter]);
  useEffect(() => localStorage.setItem('cf_unrev', String(onlyUnreviewed)), [onlyUnreviewed]);
  useEffect(() => localStorage.setItem('cf_sortBy', sortBy), [sortBy]);
  useEffect(() => localStorage.setItem('cf_sortDir', sortDir), [sortDir]);

  // track in-flight fetch so we can cancel
  const activeAbortRef = useRef(null);

  const fetchIntakes = useCallback(async () => {
    try { activeAbortRef.current?.abort?.(); } catch {}
    const ctrl = new AbortController();
    activeAbortRef.current = ctrl;

    try {
      setErr('');
      setLoading(true);
      const { data } = await axios.get(`${API_BASE}/api/intakes`, {
        signal: ctrl.signal,
      });
      setIntakes(Array.isArray(data) ? data : []);
      setLastUpdated(new Date());
    } catch (e) {
      if (e.name !== 'CanceledError' && e.name !== 'AbortError') {
        setErr(e?.message || 'Failed to load intakes');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + poll while tab is visible
  useEffect(() => {
    fetchIntakes();

    const id = setInterval(() => {
      if (document.visibilityState === 'visible') fetchIntakes();
    }, 10000);

    const onVis = () => {
      if (document.visibilityState === 'visible') fetchIntakes();
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVis);
      try { activeAbortRef.current?.abort?.(); } catch {}
    };
  }, [fetchIntakes]);

  // Normalize rows
  const rows = useMemo(
    () =>
      intakes.map((x) => {
        const createdAt = x.createdAt ? new Date(x.createdAt) : idToDate(x._id);
        const reviewedAtDate = x.reviewedAt ? new Date(x.reviewedAt) : null;
        return {
          id: x._id,
          patientName: x.patientName || '—',
          appointmentTime: x.appointmentTime || '—',
          intakeStatus: x.intakeStatus || 'In Progress',
          chiefComplaint: x.chiefComplaint || '—',
          symptoms: x.symptoms || [],
          medicalHistory: x.medicalHistory || [],
          createdAt,
          createdAtDisplay: fmtDateTime(createdAt),
          createdTs: createdAt ? createdAt.getTime() : 0,
          reviewed: !!x.reviewed,
          reviewedBy: x.reviewedBy || '',
          reviewedAt: reviewedAtDate,
          reviewedAtDisplay: fmtDateTime(reviewedAtDate),
        };
      }),
    [intakes]
  );

  // apply filters
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== 'ALL' && r.intakeStatus !== statusFilter) return false;
      if (onlyUnreviewed && r.reviewed) return false;

      if (!q) return true;
      return (
        String(r.patientName).toLowerCase().includes(q) ||
        String(r.chiefComplaint).toLowerCase().includes(q) ||
        String(r.intakeStatus).toLowerCase().includes(q) ||
        String(r.id).toLowerCase().includes(q)
      );
    });
  }, [rows, query, statusFilter, onlyUnreviewed]);

  // group by patient if needed
  const latestPerPatient = useMemo(() => {
    const byPatient = new Map();
    for (const r of filtered) {
      const key = r.patientName;
      const existing = byPatient.get(key);
      if (!existing || r.createdTs > existing.createdTs) {
        byPatient.set(key, r);
      }
    }
    return Array.from(byPatient.values());
  }, [filtered]);

  const baseRows = showLatestOnly ? latestPerPatient : filtered;

  // sort
  const displayRows = useMemo(() => {
    const arr = [...baseRows];
    const sorter = SORTERS[sortBy] || SORTERS.created;
    arr.sort((a, b) => {
      const cmp = sorter(a, b);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [baseRows, sortBy, sortDir]);

  //download as JSON
  const downloadJson = (row) => {
    const blob = new Blob([JSON.stringify(row, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `intake-${row.id}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const toggleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };

  // update reviewed status (toggle both ways)
  const setReviewed = async (row, reviewed) => {
    try {
      const { data } = await axios.patch(
        `${API_BASE}/api/intakes/${row.id}/review`,
        {
          reviewed,
          reviewedBy: reviewed ? 'Staff' : '',
        }
      );
      setIntakes((prev) => prev.map((x) => (x._id === data._id ? data : x)));

      setSelected((sel) =>
        sel && sel.id === data._id
          ? {
              ...sel,
              reviewed: data.reviewed,
              reviewedBy: data.reviewedBy || '',
              reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : null,
              reviewedAtDisplay: fmtDateTime(data.reviewedAt),
            }
          : sel
      );
    } catch (e) {
      alert(e?.response?.data?.error || e?.message || 'Failed to update review status');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="title">[Clinic Name] Dashboard</div>
        <div className="toolbar">
          {lastUpdated && (
            <span className="muted mr12">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}

          <label className="inline-check mr12" title="Show latest encounter per patient">
            <input
              type="checkbox"
              checked={showLatestOnly}
              onChange={(e) => setShowLatestOnly(e.target.checked)}
            />
            <span className="muted">
              Showing: {showLatestOnly ? 'Latest per patient' : 'All encounters'}
            </span>
          </label>

          <button className="btn" onClick={fetchIntakes} disabled={loading}>
            {loading ? 'Loading…' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Controls row */}
      <div className="controls">
        <input
          className="input"
          placeholder="Search name, complaint, status, or ID…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="ALL">All statuses</option>
          <option value="Complete">Complete</option>
          <option value="In Progress">In Progress</option>
        </select>

        <label className="inline-check">
          <input
            type="checkbox"
            checked={onlyUnreviewed}
            onChange={(e) => setOnlyUnreviewed(e.target.checked)}
          />
          <span>Unreviewed only</span>
        </label>
      </div>

      {err && <div className="error">Error: {err}</div>}

      {!err && !loading && displayRows.length === 0 && (
        <div className="empty">
          No intakes match your filters.
          <div className="sub">
            Try clearing the search or filters, or finish a conversation in the mobile app (reach the end of the flow).
          </div>
        </div>
      )}

      <table className="intake-table">
        <thead>
          <tr>
            <th className={`sortable ${sortBy === 'name' ? sortDir : ''}`} onClick={() => toggleSort('name')}>
              Patient Name
            </th>
            <th className={`sortable ${sortBy === 'appt' ? sortDir : ''}`} onClick={() => toggleSort('appt')}>
              Appointment Time
            </th>
            <th className={`sortable ${sortBy === 'created' ? sortDir : ''}`} onClick={() => toggleSort('created')}>
              Created At
            </th>
            <th className={`sortable ${sortBy === 'status' ? sortDir : ''}`} onClick={() => toggleSort('status')}>
              Intake Status
            </th>
            <th className={`sortable ${sortBy === 'chief' ? sortDir : ''}`} onClick={() => toggleSort('chief')}>
              Chief Complaint
            </th>
            <th style={{ width: 220 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {displayRows.map((r) => (
            <tr key={r.id} className={r.reviewed ? '' : 'row-unreviewed'}>
              <td>{r.patientName}</td>
              <td>{r.appointmentTime}</td>
              <td>{r.createdAtDisplay}</td>
              <td>
                <span
                  className={
                    r.intakeStatus === 'Complete'
                      ? 'badge badge-complete'
                      : 'badge badge-progress'
                  }
                >
                  {r.intakeStatus}
                </span>
                {' '}
                {r.reviewed ? (
                  <span className="badge badge-reviewed" title={r.reviewedAtDisplay || ''}>
                    Reviewed{r.reviewedBy ? ` • ${r.reviewedBy}` : ''}
                  </span>
                ) : (
                  <span className="badge badge-unreviewed">New</span>
                )}
              </td>
              <td>{r.chiefComplaint}</td>
              <td>
                <div className="actions">
                  <div className="action-line">
                    <button className="link" onClick={() => setSelected(r)}>
                      View Summary
                    </button>
                    <span className="muted mono">ID: {String(r.id).slice(-6)}</span>
                  </div>
                  <div className="action-line">
                    <button className="link" onClick={() => downloadJson(r)}>
                      Download JSON
                    </button>
                    {r.reviewed ? (
                      <button className="link" onClick={() => setReviewed(r, false)}>
                        Unmark reviewed
                      </button>
                    ) : (
                      <button className="link danger" onClick={() => setReviewed(r, true)}>
                        Mark reviewed
                      </button>
                    )}
                  </div>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal */}
      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Patient: {selected.patientName}</div>
              <button className="close" onClick={() => setSelected(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="kv">
                <div className="k">Encounter ID</div>
                <div className="v mono">{selected.id}</div>
              </div>
              <div className="kv">
                <div className="k">Created</div>
                <div className="v">{selected.createdAtDisplay}</div>
              </div>
              <div className="kv">
                <div className="k">Appointment</div>
                <div className="v">{selected.appointmentTime}</div>
              </div>
              <div className="kv">
                <div className="k">Status</div>
                <div className="v">
                  {selected.intakeStatus}
                  {' '}
                  {selected.reviewed ? (
                    <span className="badge badge-reviewed ml6">
                      Reviewed{selected.reviewedBy ? ` • ${selected.reviewedBy}` : ''}
                    </span>
                  ) : (
                    <span className="badge badge-unreviewed ml6">New</span>
                  )}
                </div>
              </div>

              {selected.reviewed && (
                <div className="kv">
                  <div className="k">Reviewed at</div>
                  <div className="v">
                    {selected.reviewedAtDisplay}
                    {selected.reviewedBy ? ` • ${selected.reviewedBy}` : ''}
                  </div>
                </div>
              )}

              <div className="kv">
                <div className="k">Chief Complaint</div>
                <div className="v">{selected.chiefComplaint}</div>
              </div>

              <div className="section">
                <div className="section-title">Symptoms</div>
                {selected.symptoms.length ? (
                  <ul>{selected.symptoms.map((s, i) => <li key={i}>{s}</li>)}</ul>
                ) : (
                  <div className="muted">—</div>
                )}
              </div>

              <div className="section">
                <div className="section-title">Medical History</div>
                {selected.medicalHistory.length ? (
                  <ul>{selected.medicalHistory.map((m, i) => <li key={i}>{m}</li>)}</ul>
                ) : (
                  <div className="muted">—</div>
                )}
              </div>

              <div className="section">
                <div className="section-title">Raw JSON</div>
                <pre className="json">{JSON.stringify(selected, null, 2)}</pre>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
