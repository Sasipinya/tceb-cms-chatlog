'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { DateRangePicker, defaultRange } from '@/components/ui/DateRangePicker';
import type { DateRange } from '@/components/ui/DateRangePicker';
import { formatDate } from '@/lib/utils';
import { AnnotationButton } from '@/components/ui/AnnotationButton';
import { FlagButton } from '@/components/ui/FlagButton';
import { Search, Download, Loader2, ChevronLeft, ChevronRight, Eye, MessageSquare, X } from 'lucide-react';
import type { IChatLog, PaginatedResponse } from '@/types';

interface Annotation { id: string; question: string; answer: string; }
interface ChatFlagDoc { chat_id: number; is_flagged: boolean; reason?: string; }
type AnnotationFilter = 'all' | 'has' | 'none';
type FlagFilter = 'all' | 'flagged' | 'unflagged';

export default function SessionsPage() {
  const router = useRouter();
  const [data,        setData]        = useState<PaginatedResponse<IChatLog> | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [convId,      setConvId]      = useState('');
  const [range,       setRange]       = useState<DateRange>(defaultRange());
  const [annoFilter,  setAnnoFilter]  = useState<AnnotationFilter>('all');
  const [flagFilter,  setFlagFilter]  = useState<FlagFilter>('all');
  const [page,        setPage]        = useState(1);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [flags,       setFlags]       = useState<Map<number, ChatFlagDoc>>(new Map());

  const fetchAnnotations = useCallback(async () => {
    try {
      const res  = await fetch('/api/annotations?limit=100');
      const data = await res.json();
      if (Array.isArray(data))                  setAnnotations(data);
      else if (Array.isArray(data.data))        setAnnotations(data.data);
      else if (Array.isArray(data.annotations)) setAnnotations(data.annotations);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchAnnotations(); }, [fetchAnnotations]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (search)         p.set('search',          search);
    if (convId)         p.set('conversation_id', convId);
    if (range.dateFrom) p.set('dateFrom',        range.dateFrom);
    if (range.dateTo)   p.set('dateTo',          range.dateTo);
    p.set('page', String(page));
    p.set('pageSize', '20');
    try {
      const res = await fetch('/api/sessions?' + p);
      if (!res.ok) throw new Error();
      const json = await res.json();
      setData(json);

      // Batch load flags for current page
      if (json.data?.length) {
        const ids = json.data.map((r: IChatLog) => r.id).join(',');
        const flagRes  = await fetch(`/api/flags?chat_ids=${ids}`);
        const flagData = await flagRes.json() as ChatFlagDoc[];
        const map = new Map<number, ChatFlagDoc>();
        flagData.forEach((f) => map.set(f.chat_id, f));
        setFlags(map);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, convId, range, page]);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  function clearFilters() {
    setSearch(''); setConvId('');
    setAnnoFilter('all'); setFlagFilter('all');
    setRange(defaultRange()); setPage(1);
  }

  const hasFilters = !!(search || convId || annoFilter !== 'all' || flagFilter !== 'all');

  function download(fmt: 'csv' | 'xlsx') {
    const p = new URLSearchParams({ format: fmt, search, conversation_id: convId, dateFrom: range.dateFrom, dateTo: range.dateTo });
    window.location.href = '/api/export?' + p;
  }

  const annoSet = new Set(annotations.map((a) => a.question.trim().toLowerCase()));

  const filteredData = (data?.data ?? []).filter((row) => {
    if (annoFilter === 'has'      && !annoSet.has(row.query.trim().toLowerCase())) return false;
    if (annoFilter === 'none'     && annoSet.has(row.query.trim().toLowerCase()))  return false;
    if (flagFilter === 'flagged'  && !flags.get(row.id)?.is_flagged)               return false;
    if (flagFilter === 'unflagged' && flags.get(row.id)?.is_flagged)               return false;
    return true;
  });

  const tabStyle = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 8, fontSize: 15, fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap',
    border: active ? `1px solid ${color ? color + '60' : 'rgba(2,132,199,0.4)'}` : '1px solid var(--border)',
    background: active ? (color ? color + '18' : 'var(--cyan-glow)') : 'var(--surface-2)',
    color: active ? (color ?? 'var(--cyan)') : 'var(--text-muted)',
    transition: 'all 0.18s',
  });

  return (
    <AppShell>
      <div className="space-y-5">
        {/* Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Chat Logs</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>
              {data ? `${data.total.toLocaleString()} รายการ · ${range.label}` : range.label}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => download('csv')}  className="btn-ghost"><Download className="h-4 w-4" /> CSV</button>
            <button onClick={() => download('xlsx')} className="btn-ghost"><Download className="h-4 w-4" /> Excel</button>
          </div>
        </div>

        {/* Search & Filter bar */}
        <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row 1: search + conversation id */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text-muted)' }} />
              <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="ค้นหาจากคำถาม..." className="input-dark" style={{ paddingLeft: 40 }} />
            </div>
            <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
              <input value={convId} onChange={(e) => { setConvId(e.target.value); setPage(1); }}
                placeholder="Conversation ID..." className="input-dark font-mono" style={{ fontSize: 14 }} />
              {convId && (
                <button onClick={() => setConvId('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Row 2: date range */}
          <DateRangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} />

          {/* Row 3: annotation + flag filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 600 }}>Annotation:</span>
            <button onClick={() => setAnnoFilter('all')}  style={tabStyle(annoFilter === 'all')}>ทั้งหมด</button>
            <button onClick={() => setAnnoFilter('has')}  style={tabStyle(annoFilter === 'has',  '#059669')}>มี</button>
            <button onClick={() => setAnnoFilter('none')} style={tabStyle(annoFilter === 'none', '#d97706')}>ยังไม่มี</button>

            <span style={{ fontSize: 15, color: 'var(--text-muted)', fontWeight: 600, marginLeft: 8 }}>Flag:</span>
            <button onClick={() => setFlagFilter('all')}      style={tabStyle(flagFilter === 'all')}>ทั้งหมด</button>
            <button onClick={() => setFlagFilter('flagged')}  style={tabStyle(flagFilter === 'flagged',  '#e11d48')}>Flagged</button>
            <button onClick={() => setFlagFilter('unflagged')} style={tabStyle(flagFilter === 'unflagged', '#64748b')}>ยังไม่ flag</button>

            {hasFilters && (
              <button onClick={clearFilters} style={{
                marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 600,
                border: '1px solid rgba(225,29,72,0.3)', background: 'rgba(225,29,72,0.08)',
                color: 'var(--rose)', cursor: 'pointer',
              }}>
                <X className="h-3.5 w-3.5" /> ล้าง filter
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
                  <th style={{ width: 60 }}>ID</th>
                  <th style={{ width: 180 }}>Conversation ID</th>
                  <th>คำถาม</th>
                  <th style={{ width: 160 }}>วันที่/เวลา</th>
                  <th style={{ width: 140 }}>Annotation</th>
                  <th style={{ width: 110 }}>Flag</th>
                  <th style={{ width: 90, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => {
                  const isFlagged = flags.get(row.id)?.is_flagged ?? false;
                  return (
                    <tr key={row.id} style={{ verticalAlign: 'top', background: isFlagged ? 'rgba(225,29,72,0.03)' : undefined }}>
                      <td style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{row.id}</td>
                      <td>
                        <span className="font-mono" title={row.conversation_id}
                          style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {row.conversation_id}
                        </span>
                      </td>
                      <td>
                        <p style={{ color: 'var(--text-primary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {row.query}
                        </p>
                        {flags.get(row.id)?.reason && (
                          <p style={{ fontSize: 13, color: 'var(--rose)', marginTop: 4 }}>
                            ⚑ {flags.get(row.id)?.reason}
                          </p>
                        )}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 15 }}>
                        {formatDate(row.created_at, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td>
                        <AnnotationButton
                          chatQuery={row.query} chatAnswer={row.answer_text ?? ''}
                          annotations={annotations} onSaved={fetchAnnotations}
                        />
                      </td>
                      <td>
                        <FlagButton
                          chatId={row.id}
                          conversationId={row.conversation_id}
                          initialFlagged={isFlagged}
                          size="sm"
                          onToggled={(f) => {
                            setFlags((prev) => {
                              const next = new Map(prev);
                              next.set(row.id, { chat_id: row.id, is_flagged: f });
                              return next;
                            });
                          }}
                        />
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button onClick={() => router.push(`/chat/${row.id}`)} title="ดูคำตอบ"
                            style={{ background: 'var(--grad-cyan)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                            <Eye className="h-4 w-4 text-white" />
                          </button>
                          <button onClick={() => router.push(`/sessions/${encodeURIComponent(row.conversation_id)}`)} title="ดู conversation"
                            style={{ background: 'var(--surface-2)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', cursor: 'pointer' }}>
                            <MessageSquare className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredData.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)' }}>
                      ไม่พบข้อมูล{hasFilters ? ' — ลองล้าง filter' : 'ในช่วงวันที่นี้'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
              {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total.toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-secondary)', opacity: page <= 1 ? 0.4 : 1 }}>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span style={{ fontSize: 15, color: 'var(--text-secondary)', padding: '0 8px' }}>{page} / {data.totalPages}</span>
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