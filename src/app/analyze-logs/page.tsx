'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { formatDate } from '@/lib/utils';
import { Loader2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, ChevronDown, ChevronUp } from 'lucide-react';

interface AnalyzeLogRow {
  _id:             string;
  conversation_id: string;
  chat_id?:        number;
  triggered_by:    string;
  admin_email?:    string;
  model:           string;
  result?: {
    sentiment:   string;
    topic:       string;
    summary:     string;
    is_answered: boolean;
    should_flag: boolean;
  };
  success:     boolean;
  error_msg?:  string;
  duration_ms: number;
  createdAt:   string;
}

const sentimentStyle = (s: string) => {
  if (s === 'positive') return { background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' };
  if (s === 'negative') return { background: 'rgba(244,63,94,0.15)',  color: '#fb7185', border: '1px solid rgba(244,63,94,0.3)' };
  return { background: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: '1px solid rgba(148,163,184,0.2)' };
};

export default function AnalyzeLogsPage() {
  const [data,       setData]       = useState<{ data: AnalyzeLogRow[]; total: number; totalPages: number } | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [onlyFailed, setOnlyFailed] = useState(false);
  const [expanded,   setExpanded]   = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (onlyFailed) p.set('failed', 'true');
    try {
      const res = await fetch('/api/analyze-logs?' + p);
      setData(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, onlyFailed]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Analyze Logs</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>
              {data ? `${data.total.toLocaleString()} รายการ` : ''}
            </p>
          </div>
          <button
            onClick={() => { setOnlyFailed(!onlyFailed); setPage(1); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 18px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer',
              border: onlyFailed ? '1px solid rgba(244,63,94,0.4)' : '1px solid var(--border)',
              background: onlyFailed ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.06)',
              color: onlyFailed ? '#fb7185' : 'var(--text-secondary)',
              transition: 'all 0.18s',
            }}>
            <XCircle className="h-4 w-4" />
            {onlyFailed ? 'แสดง Failed เท่านั้น' : 'แสดงทั้งหมด'}
          </button>
        </div>

        {/* Table */}
        <div className="glass overflow-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}></th>
                  <th>Conversation</th>
                  <th style={{ width: 120 }}>Sentiment</th>
                  <th>Topic</th>
                  <th style={{ width: 160 }}>By</th>
                  <th style={{ width: 100 }}>Duration</th>
                  <th style={{ width: 160 }}>เวลา</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((log) => (
                  <React.Fragment key={log._id}>
                    {/* Main row */}
                    <tr
                      onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        {log.success
                          ? <CheckCircle2 className="h-5 w-5" style={{ color: '#34d399' }} />
                          : <XCircle className="h-5 w-5" style={{ color: '#fb7185' }} />}
                      </td>
                      <td>
                        <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                          {log.conversation_id.slice(0, 22)}...
                        </span>
                        {log.chat_id && (
                          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--text-muted)' }}>#{log.chat_id}</span>
                        )}
                      </td>
                      <td>
                        {log.result?.sentiment ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center',
                            padding: '3px 10px', borderRadius: 999,
                            fontSize: 13, fontWeight: 600,
                            ...sentimentStyle(log.result.sentiment),
                          }}>
                            {log.result.sentiment}
                          </span>
                        ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {log.result?.topic ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}
                      </td>
                      <td style={{ fontSize: 14 }}>{log.admin_email ?? log.triggered_by}</td>
                      <td style={{ fontSize: 14, color: 'var(--cyan)' }}>
                        {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : '—'}
                      </td>
                      <td style={{ fontSize: 14, whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          {formatDate(log.createdAt, 'dd/MM/yyyy HH:mm')}
                          {expanded === log._id
                            ? <ChevronUp className="h-4 w-4 ml-2" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                            : <ChevronDown className="h-4 w-4 ml-2" style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {expanded === log._id && (
                      <tr>
                        <td colSpan={7} style={{ padding: 0 }}>
                          <div style={{ background: 'rgba(255,255,255,0.03)', borderTop: '1px solid var(--border)', padding: '20px 24px' }}>
                            {log.success && log.result ? (
                              <div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20, marginBottom: 16 }}>
                                  <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Model</p>
                                    <p className="font-mono" style={{ fontSize: 14, color: 'var(--cyan)' }}>{log.model}</p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Answered</p>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: log.result.is_answered ? '#34d399' : '#fbbf24' }}>
                                      {log.result.is_answered ? 'Yes' : 'No'}
                                    </p>
                                  </div>
                                  <div>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Flagged</p>
                                    <p style={{ fontSize: 15, fontWeight: 600, color: log.result.should_flag ? '#fb7185' : 'var(--text-muted)' }}>
                                      {log.result.should_flag ? 'Yes' : 'No'}
                                    </p>
                                  </div>
                                </div>
                                {log.result.summary && (
                                  <div style={{ borderTop: '1px solid var(--border)', paddingTop: 14 }}>
                                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 6 }}>Summary</p>
                                    <p style={{ fontSize: 16, color: 'var(--text-primary)', lineHeight: 1.65 }}>{log.result.summary}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '14px 18px' }}>
                                <p style={{ fontSize: 14, fontWeight: 600, color: '#fb7185', marginBottom: 6 }}>Error</p>
                                <p className="font-mono" style={{ fontSize: 13, color: '#fca5a5' }}>{log.error_msg}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                      ไม่พบข้อมูล
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>หน้า {page} / {data.totalPages}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1 }}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page >= data.totalPages ? 0.4 : 1 }}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}