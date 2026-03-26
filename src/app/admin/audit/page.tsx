'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { Loader2, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface AuditRow {
  _id:          string;
  user_email:   string;
  user_name?:   string;
  action:       string;
  target_type?: string;
  target_id?:   string;
  detail?:      string;
  meta?:        Record<string, unknown>;
  ip?:          string;
  createdAt:    string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:              { label: 'Login',             color: '#0284c7' },
  logout:             { label: 'Logout',            color: '#64748b' },
  view_session:       { label: 'ดู session',        color: '#64748b' },
  analyze:            { label: 'AI Analyze',        color: '#7c3aed' },
  flag:               { label: 'Flag',              color: '#e11d48' },
  unflag:             { label: 'Unflag',            color: '#64748b' },
  add_annotation:     { label: 'เพิ่ม Annotation', color: '#059669' },
  update_annotation:  { label: 'แก้ Annotation',   color: '#d97706' },
  add_note:           { label: 'เพิ่ม Note',        color: '#0284c7' },
  add_tag:            { label: 'เพิ่ม Tag',         color: '#0284c7' },
  remove_tag:         { label: 'ลบ Tag',            color: '#e11d48' },
  edit_chat:          { label: 'แก้ไข Chat',        color: '#d97706' },
  export:             { label: 'Export',            color: '#059669' },
  user_create:        { label: 'สร้าง User',        color: '#059669' },
  user_update:        { label: 'แก้ไข User',        color: '#d97706' },
  user_delete:        { label: 'ลบ User',           color: '#e11d48' },
  user_approve:       { label: 'Approve User',      color: '#059669' },
};

const ALL_ACTIONS = Object.keys(ACTION_LABELS);

export default function AuditLogPage() {
  const [data,       setData]       = useState<{ data: AuditRow[]; total: number; totalPages: number } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [action,     setAction]     = useState('');
  const [dateFrom,   setDateFrom]   = useState('');
  const [dateTo,     setDateTo]     = useState('');
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '30' });
    if (search)   p.set('user_email', search);
    if (action)   p.set('action',     action);
    if (dateFrom) p.set('dateFrom',   dateFrom);
    if (dateTo)   p.set('dateTo',     dateTo);
    try {
      const res = await fetch('/api/audit-logs?' + p);
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, search, action, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  function clearFilters() { setSearch(''); setAction(''); setDateFrom(''); setDateTo(''); setPage(1); }
  const hasFilters = !!(search || action || dateFrom || dateTo);

  const actionBadge = (a: string) => {
    const cfg = ACTION_LABELS[a] ?? { label: a, color: '#64748b' };
    return (
      <span style={{ background: cfg.color + '18', color: cfg.color, border: `1px solid ${cfg.color}35`, padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
        {cfg.label}
      </span>
    );
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Audit Log</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>
              {data ? `${data.total.toLocaleString()} รายการ` : ''}
            </p>
          </div>
        </div>

        {/* Filter bar */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {/* Search by email */}
            <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหา email user..." className="input-dark" style={{ paddingLeft: 40 }} />
            </div>
            {/* Action filter */}
            <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}
              className="input-dark" style={{ width: 180 }}>
              <option value="">Action ทั้งหมด</option>
              {ALL_ACTIONS.map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a].label}</option>
              ))}
            </select>
            {/* Date range */}
            <input type="date" value={dateFrom} max={dateTo || undefined}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="input-dark" style={{ width: 160 }} />
            <span style={{ alignSelf: 'center', color: 'var(--text-muted)', fontSize: 15 }}>ถึง</span>
            <input type="date" value={dateTo} min={dateFrom || undefined}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="input-dark" style={{ width: 160 }} />
            {hasFilters && (
              <button onClick={clearFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: '1px solid rgba(225,29,72,0.3)', background: 'rgba(225,29,72,0.08)', color: 'var(--rose)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                <X style={{ width: 14, height: 14 }} /> ล้าง
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="glass overflow-hidden">
          {loading ? (
            <div style={{ display: 'flex', height: 240, alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 160 }}>เวลา</th>
                  <th>User</th>
                  <th style={{ width: 160 }}>Action</th>
                  <th>Detail</th>
                  <th style={{ width: 120 }}>IP</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((row) => (
                  <React.Fragment key={row._id}>
                    <tr
                      onClick={() => setExpanded(expanded === row._id ? null : row._id)}
                      style={{ cursor: row.meta ? 'pointer' : 'default' }}
                    >
                      <td style={{ fontSize: 14, whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                        {formatDate(row.createdAt, 'dd/MM/yyyy HH:mm:ss')}
                      </td>
                      <td>
                        <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 15 }}>{row.user_email}</p>
                        {row.user_name && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.user_name}</p>}
                      </td>
                      <td>{actionBadge(row.action)}</td>
                      <td style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
                        {row.detail ?? '—'}
                        {row.target_id && (
                          <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 8 }}>
                            #{row.target_id.slice(0, 12)}
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{row.ip ?? '—'}</td>
                    </tr>

                    {/* Expanded meta */}
                    {expanded === row._id && row.meta && (
                      <tr>
                        <td colSpan={5} style={{ padding: 0 }}>
                          <div style={{ background: 'var(--surface-2)', borderTop: '1px solid var(--border)', padding: '14px 20px' }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>Meta</p>
                            <pre style={{ fontSize: 13, color: 'var(--cyan)', fontFamily: 'JetBrains Mono, monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all', margin: 0 }}>
                              {JSON.stringify(row.meta, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {data?.data.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>ไม่พบข้อมูล</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>หน้า {page} / {data.totalPages}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))} disabled={page >= data.totalPages}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page >= data.totalPages ? 0.4 : 1 }}>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}