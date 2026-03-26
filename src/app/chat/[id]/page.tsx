'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/AppShell';
import { formatDate } from '@/lib/utils';
import {
  ArrowLeft, Bot, User, Loader2, MessageSquare,
  Pencil, Check, X, Sparkles, CheckCircle2, XCircle, ChevronDown, ChevronUp,
} from 'lucide-react';
import type { IChatLog } from '@/types';
import { cn } from '@/lib/utils';

interface AnalyzeLogRow {
  _id:         string;
  triggered_by:string;
  admin_email?: string;
  model:       string;
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

interface AIResult {
  sentiment:   string;
  topic:       string;
  summary:     string;
  is_answered: boolean;
  should_flag: boolean;
}

export default function ChatDetailPage() {
  const { id }  = useParams<{ id: string }>();
  const router  = useRouter();

  const [chat,    setChat]    = useState<IChatLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [editQuery,  setEditQuery]  = useState(false);
  const [editAnswer, setEditAnswer] = useState(false);
  const [queryDraft,  setQueryDraft]  = useState('');
  const [answerDraft, setAnswerDraft] = useState('');

  const [analyzing,      setAnalyzing]      = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIResult | null>(null);

  const [logs,        setLogs]        = useState<AnalyzeLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/chat/${id}`)
      .then((r) => r.json())
      .then((d) => { setChat(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const fetchLogs = useCallback(async (conversationId: string) => {
    setLogsLoading(true);
    try {
      const res  = await fetch(`/api/analyze-logs?conversation_id=${encodeURIComponent(conversationId)}&pageSize=10`);
      const data = await res.json();
      setLogs(data.data ?? []);
    } catch { /* ignore */ }
    setLogsLoading(false);
  }, []);

  useEffect(() => {
    if (chat?.conversation_id) fetchLogs(chat.conversation_id);
  }, [chat, fetchLogs]);

  async function saveField(field: 'query' | 'answer_text', value: string) {
    setSaving(true);
    const res = await fetch(`/api/chat/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    });
    const updated = await res.json();
    setChat(updated);
    setSaving(false);
    if (field === 'query')       setEditQuery(false);
    if (field === 'answer_text') setEditAnswer(false);
  }

  async function analyze() {
    if (!chat) return;
    setAnalyzing(true);
    try {
      const res  = await fetch(`/api/sessions/analyze/${encodeURIComponent(chat.conversation_id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chat.id }),
      });
      const data = await res.json();
      if (data.analysis) setAnalysisResult(data.analysis);
      // รีโหลด logs หลัง analyze เสร็จ
      await fetchLogs(chat.conversation_id);
    } catch (e) {
      console.error(e);
    }
    setAnalyzing(false);
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          {chat && (
            <>
              <span className="text-slate-300">|</span>
              <button
                onClick={() => router.push(`/sessions/${encodeURIComponent(chat.conversation_id)}`)}
                className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800">
                <MessageSquare className="h-4 w-4" /> ดู conversation ทั้งหมด
              </button>
            </>
          )}
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
          </div>
        ) : chat ? (
          <>
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-slate-400 border-b border-slate-100 pb-4">
                <span>ID: {chat.id}</span>
                <span>User: {chat.tceb_user_id ?? '—'}</span>
                <span>{formatDate(chat.created_at)}</span>
              </div>

              {/* ── User question ── */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <User className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-slate-500">คำถาม</p>
                    {!editQuery && (
                      <button onClick={() => { setQueryDraft(chat.query); setEditQuery(true); }}
                        className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                        <Pencil className="h-3 w-3" /> แก้ไข
                      </button>
                    )}
                  </div>
                  {editQuery ? (
                    <div className="space-y-2">
                      <textarea value={queryDraft} onChange={(e) => setQueryDraft(e.target.value)}
                        rows={3} autoFocus
                        className="w-full rounded-xl border border-indigo-300 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-100 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => saveField('query', queryDraft)} disabled={saving || !queryDraft.trim()}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} บันทึก
                        </button>
                        <button onClick={() => setEditQuery(false)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          <X className="h-3 w-3" /> ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-sm bg-indigo-600 text-white px-4 py-3 text-sm leading-relaxed inline-block max-w-full">
                      {chat.query}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Bot answer ── */}
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-medium text-slate-500">คำตอบ</p>
                    {!editAnswer && (
                      <button onClick={() => { setAnswerDraft(chat.answer_text ?? ''); setEditAnswer(true); }}
                        className="flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-50">
                        <Pencil className="h-3 w-3" /> แก้ไข
                      </button>
                    )}
                  </div>
                  {editAnswer ? (
                    <div className="space-y-2">
                      <textarea value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)}
                        rows={6} autoFocus
                        className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => saveField('answer_text', answerDraft)} disabled={saving}
                          className="flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} บันทึก
                        </button>
                        <button onClick={() => setEditAnswer(false)}
                          className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
                          <X className="h-3 w-3" /> ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 leading-relaxed">
                      {chat.answer_html
                        ? <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: chat.answer_html }} />
                        : <p className="whitespace-pre-wrap">{chat.answer_text ?? '(ไม่มีคำตอบ)'}</p>}
                    </div>
                  )}
                  {chat.updated_at && !editAnswer && (
                    <p className="mt-1 text-xs text-slate-400">{formatDate(chat.updated_at)}</p>
                  )}
                </div>
              </div>

              {/* ── AI Analysis ── */}
              <div className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">AI Analysis</h3>
                  <button onClick={analyze} disabled={analyzing}
                    className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                    {analyzing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {analyzing ? 'Analyzing...' : 'Analyze'}
                  </button>
                </div>

                {analysisResult ? (
                  <div className="space-y-2 rounded-lg bg-slate-50 p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Sentiment</span>
                      <span className={cn('font-medium',
                        analysisResult.sentiment === 'positive' ? 'text-green-600' :
                        analysisResult.sentiment === 'negative' ? 'text-red-600' : 'text-slate-600')}>
                        {analysisResult.sentiment}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Topic</span>
                      <span className="font-medium text-slate-700">{analysisResult.topic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Answered</span>
                      <span className={cn('font-medium', analysisResult.is_answered ? 'text-green-600' : 'text-amber-600')}>
                        {analysisResult.is_answered ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Flagged</span>
                      <span className={cn('font-medium', analysisResult.should_flag ? 'text-red-600' : 'text-slate-500')}>
                        {analysisResult.should_flag ? 'Yes' : 'No'}
                      </span>
                    </div>
                    {analysisResult.summary && (
                      <div className="pt-1 border-t border-slate-200">
                        <p className="text-slate-500 mb-1">Summary</p>
                        <p className="text-slate-700 leading-relaxed">{analysisResult.summary}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">กด Analyze เพื่อวิเคราะห์ด้วย Gemini AI</p>
                )}
              </div>
            </div>

            {/* ── Analyze Log History ── */}
            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700">ประวัติการ Analyze</h3>
              </div>

              {logsLoading ? (
                <div className="flex h-20 items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                </div>
              ) : logs.length === 0 ? (
                <p className="px-5 py-6 text-center text-sm text-slate-400">ยังไม่เคย Analyze</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {logs.map((log) => (
                    <div key={log._id}>
                      {/* Log row */}
                      <div
                        onClick={() => setExpandedLog(expandedLog === log._id ? null : log._id)}
                        className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        {log.success
                          ? <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                          : <XCircle className="h-4 w-4 shrink-0 text-red-500" />}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {log.result?.sentiment && (
                              <span className={cn(
                                'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1',
                                log.result.sentiment === 'positive' ? 'bg-green-50 text-green-700 ring-green-200' :
                                log.result.sentiment === 'negative' ? 'bg-red-50 text-red-700 ring-red-200' :
                                'bg-slate-100 text-slate-600 ring-slate-200'
                              )}>
                                {log.result.sentiment}
                              </span>
                            )}
                            {log.result?.topic && (
                              <span className="truncate text-xs text-slate-600">{log.result.topic}</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {log.admin_email ?? log.triggered_by} · {formatDate(log.createdAt, 'dd/MM/yyyy HH:mm')} · {log.duration_ms ? `${(log.duration_ms / 1000).toFixed(1)}s` : ''}
                          </p>
                        </div>
                        {expandedLog === log._id
                          ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" />
                          : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />}
                      </div>

                      {/* Expanded */}
                      {expandedLog === log._id && (
                        <div className="px-5 pb-4 bg-slate-50 border-t border-slate-100">
                          {log.success && log.result ? (
                            <div className="space-y-2 pt-3 text-xs">
                              <div className="grid grid-cols-3 gap-3">
                                <div>
                                  <p className="text-slate-400 mb-0.5">Model</p>
                                  <p className="font-mono text-slate-600">{log.model}</p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-0.5">Answered</p>
                                  <p className={log.result.is_answered ? 'text-green-600 font-medium' : 'text-amber-600 font-medium'}>
                                    {log.result.is_answered ? 'Yes' : 'No'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-slate-400 mb-0.5">Flagged</p>
                                  <p className={log.result.should_flag ? 'text-red-600 font-medium' : 'text-slate-500'}>
                                    {log.result.should_flag ? 'Yes' : 'No'}
                                  </p>
                                </div>
                              </div>
                              {log.result.summary && (
                                <div className="pt-2 border-t border-slate-200">
                                  <p className="text-slate-400 mb-1">Summary</p>
                                  <p className="text-slate-700 leading-relaxed">{log.result.summary}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-lg bg-red-50 p-3 mt-3">
                              <p className="text-xs font-medium text-red-700 mb-1">Error</p>
                              <p className="font-mono text-xs text-red-600">{log.error_msg}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">ไม่พบข้อมูล</p>
        )}
      </div>
    </AppShell>
  );
}