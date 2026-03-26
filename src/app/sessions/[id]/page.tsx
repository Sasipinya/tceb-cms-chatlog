'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Bot, User, Loader2, Sparkles,
  ChevronLeft, ChevronRight, Clock, Flag,
  StickyNote, Tag, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import type { IChatLog, ISessionMeta } from '@/types';

export default function SessionDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [messages,  setMessages]  = useState<IChatLog[]>([]);
  const [meta,      setMeta]      = useState<ISessionMeta | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [replayMode,setReplayMode]= useState(false);
  const [step,      setStep]      = useState(0);
  const [noteText,  setNoteText]  = useState('');
  const [savingNote,setSavingNote]= useState(false);
  const [newTag,    setNewTag]    = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch(`/api/sessions/${encodeURIComponent(id)}`).then((r) => r.json()),
      fetch(`/api/sessions/meta/${encodeURIComponent(id)}`).then((r) => r.json()),
    ]).then(([msgs, m]) => {
      const arr = Array.isArray(msgs) ? msgs : [];
      setMessages(arr);
      setMeta(m);
      setStep(Math.max(0, arr.length - 1));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!replayMode) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, replayMode]);

  async function analyze() {
    setAnalyzing(true);
    const res = await fetch(`/api/sessions/analyze/${encodeURIComponent(id)}`, { method: 'POST' });
    const { meta: updated } = await res.json();
    if (updated) setMeta(updated);
    setAnalyzing(false);
  }

  async function addNote() {
    if (!noteText.trim()) return;
    setSavingNote(true);
    const res = await fetch(`/api/sessions/meta/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: noteText }),
    });
    setMeta(await res.json());
    setNoteText(''); setSavingNote(false);
  }

  async function addTag() {
    if (!newTag.trim()) return;
    const tags = [...(meta?.tags ?? []), newTag.trim()];
    const res = await fetch(`/api/sessions/meta/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    setMeta(await res.json()); setNewTag('');
  }

  async function removeTag(tag: string) {
    const tags = (meta?.tags ?? []).filter((t) => t !== tag);
    const res = await fetch(`/api/sessions/meta/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tags }),
    });
    setMeta(await res.json());
  }

  async function toggleFlag() {
    const res = await fetch(`/api/sessions/meta/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_flagged: !meta?.is_flagged }),
    });
    setMeta(await res.json());
  }

  const visible = Array.isArray(messages)
    ? (replayMode ? messages.slice(0, step + 1) : messages)
    : [];
  const first = messages[0];
  const last  = messages[messages.length - 1];

  const sentimentColor =
    meta?.sentiment === 'positive' ? '#34d399' :
    meta?.sentiment === 'negative' ? '#fb7185' : '#94a3b8';

  const panel: React.CSSProperties = {
    background: 'var(--surface-1)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: 20,
  };

  const sectionTitle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    marginBottom: 14,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  return (
    <AppShell>
      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

        {/* ── Left: Chat transcript ── */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 15 }}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            <span style={{ color: 'var(--border-h)', fontSize: 20 }}>|</span>
            <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300, whiteSpace: 'nowrap' }}>
              {decodeURIComponent(id)}
            </span>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={toggleFlag} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: meta?.is_flagged ? '1px solid rgba(244,63,94,0.4)' : '1px solid var(--border)',
                background: meta?.is_flagged ? 'rgba(244,63,94,0.12)' : 'rgba(255,255,255,0.06)',
                color: meta?.is_flagged ? '#fb7185' : 'var(--text-muted)',
              }}>
                <Flag className="h-3.5 w-3.5" />
                {meta?.is_flagged ? 'Flagged' : 'Flag'}
              </button>

              <button onClick={() => setReplayMode(!replayMode)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                border: replayMode ? '1px solid rgba(6,182,212,0.4)' : '1px solid var(--border)',
                background: replayMode ? 'linear-gradient(135deg,#0891b2,#06b6d4)' : 'rgba(255,255,255,0.06)',
                color: replayMode ? '#fff' : 'var(--text-muted)',
              }}>
                <Clock className="h-3.5 w-3.5" /> Replay
              </button>

              {replayMode && (
                <>
                  <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: step === 0 ? 0.4 : 1, color: 'var(--text-secondary)' }}>
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)', alignSelf: 'center' }}>{step + 1}/{messages.length}</span>
                  <button onClick={() => setStep((s) => Math.min(messages.length - 1, s + 1))} disabled={step >= messages.length - 1}
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: step >= messages.length - 1 ? 0.4 : 1, color: 'var(--text-secondary)' }}>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Chat area */}
          {loading ? (
            <div style={{ ...panel, minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
            </div>
          ) : (
            <div style={{ ...panel, background: 'var(--surface-2)', minHeight: 420, display: 'flex', flexDirection: 'column', gap: 24, overflowY: 'auto', maxHeight: '70vh', padding: 24 }}>
              {visible.map((msg) => (
                <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* User */}
                  <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#0891b2,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User className="h-4 w-4 text-white" />
                    </div>
                    <div style={{ maxWidth: '72%' }}>
                      <div className="bubble-user">{msg.query}</div>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, textAlign: 'right' }}>{formatDate(msg.created_at)}</p>
                    </div>
                  </div>

                  {/* Bot */}
                  {(msg.answer_text || msg.answer_html) && (
                    <div style={{ display: 'flex', flexDirection: 'row', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-3)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Bot className="h-4 w-4" style={{ color: 'var(--cyan)' }} />
                      </div>
                      <div style={{ maxWidth: '72%' }}>
                        <div className="bubble-assistant">
                          {msg.answer_html
                            ? <div dangerouslySetInnerHTML={{ __html: msg.answer_html }} />
                            : <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{msg.answer_text}</p>}
                        </div>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{formatDate(msg.updated_at ?? msg.created_at)}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {visible.length === 0 && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0' }}>ไม่พบข้อความ</p>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* ── Right panel ── */}
        <div style={{ width: 280, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Session info */}
          <div style={panel}>
            <p style={sectionTitle}>Session info</p>
            {[
              ['User ID',    String(first?.tceb_user_id ?? '—')],
              ['Messages',   String(messages.length)],
              ['Started',    formatDate(first?.created_at)],
              ['Last reply', formatDate(last?.updated_at ?? last?.created_at)],
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', textAlign: 'right', maxWidth: 160, wordBreak: 'break-all' }}>{value}</span>
              </div>
            ))}
          </div>

          {/* AI Analysis */}
          <div style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <p style={{ ...sectionTitle, marginBottom: 0 }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: 'var(--cyan)' }} /> AI Analysis
              </p>
              <button onClick={analyze} disabled={analyzing} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                border: '1px solid rgba(6,182,212,0.3)', background: 'rgba(6,182,212,0.1)',
                color: 'var(--cyan)',
              }}>
                {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {meta?.analyzed_at ? 'Re-analyze' : 'Analyze'}
              </button>
            </div>

            {meta?.analyzed_at ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Sentiment</span>
                  <span style={{ padding: '3px 10px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: `${sentimentColor}20`, color: sentimentColor, border: `1px solid ${sentimentColor}40` }}>
                    {meta.sentiment ?? '—'}
                  </span>
                </div>
                {meta.topic && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Topic</p>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{meta.topic}</p>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Answered</span>
                  {meta.is_answered
                    ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: '#34d399' }}><CheckCircle2 className="h-3.5 w-3.5" /> Yes</span>
                    : <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 600, color: '#fbbf24' }}><AlertTriangle className="h-3.5 w-3.5" /> No</span>}
                </div>
                {meta.summary && (
                  <div>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 4 }}>Summary</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{meta.summary}</p>
                  </div>
                )}
                {meta.flag_reason && (
                  <div style={{ background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#fb7185', marginBottom: 4 }}>Flag reason</p>
                    <p style={{ fontSize: 13, color: '#fca5a5' }}>{meta.flag_reason}</p>
                  </div>
                )}
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Analyzed: {formatDate(meta.analyzed_at)}</p>
              </div>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>กด Analyze เพื่อวิเคราะห์ด้วย Gemini AI</p>
            )}
          </div>

          {/* Tags */}
          <div style={panel}>
            <p style={sectionTitle}><Tag className="h-3.5 w-3.5" style={{ color: 'var(--cyan)' }} /> Tags</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {meta?.tags?.map((tag) => (
                <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)', fontSize: 13, fontWeight: 600, color: 'var(--cyan)' }}>
                  {tag}
                  <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyan)', lineHeight: 1, fontSize: 16, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                placeholder="เพิ่ม tag..." className="input-dark"
                style={{ fontSize: 14, flex: 1 }} />
              <button onClick={addTag} disabled={!newTag.trim()} style={{
                width: 36, height: 42, borderRadius: 8, background: 'linear-gradient(135deg,#0891b2,#06b6d4)',
                border: 'none', cursor: 'pointer', fontSize: 20, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, opacity: !newTag.trim() ? 0.4 : 1,
              }}>+</button>
            </div>
          </div>

          {/* Admin Notes */}
          <div style={panel}>
            <p style={sectionTitle}><StickyNote className="h-3.5 w-3.5" style={{ color: 'var(--amber)' }} /> Admin Notes</p>
            <div style={{ maxHeight: 180, overflowY: 'auto', marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {meta?.admin_notes?.map((note, i) => (
                <div key={i} style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 14px' }}>
                  <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{note.text}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{note.authorEmail} · {formatDate(note.createdAt)}</p>
                </div>
              ))}
              {!meta?.admin_notes?.length && (
                <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>ยังไม่มี notes</p>
              )}
            </div>
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)}
              placeholder="เพิ่มหมายเหตุ..." rows={2} className="input-dark"
              style={{ resize: 'none', fontSize: 14, marginBottom: 10 }} />
            <button onClick={addNote} disabled={savingNote || !noteText.trim()} className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: !noteText.trim() ? 0.5 : 1 }}>
              {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Add note
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}