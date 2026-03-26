'use client';
import { useState } from 'react';
import { Plus, Pencil, Check, X, Loader2 } from 'lucide-react';

interface Annotation { id: string; question: string; answer: string; }

interface Props {
  chatQuery:   string;
  chatAnswer:  string;
  annotations: Annotation[];
  onSaved?:    () => void;
}

export function AnnotationButton({ chatQuery, chatAnswer, annotations, onSaved }: Props) {
  const existing = annotations.find(
    (a) => a.question.trim().toLowerCase() === chatQuery.trim().toLowerCase()
  );

  const [mode,     setMode]     = useState<'idle' | 'edit'>('idle');
  const [question, setQuestion] = useState(existing?.question ?? chatQuery);
  const [answer,   setAnswer]   = useState(existing?.answer   ?? chatAnswer);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  async function save() {
    if (!question.trim() || !answer.trim()) return;
    setSaving(true); setError('');
    try {
      const method = existing ? 'PUT' : 'POST';
      const body   = existing
        ? { id: existing.id, question, answer }
        : { question, answer };
      const res = await fetch('/api/annotations', {
        method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      setMode('idle'); onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    }
    setSaving(false);
  }

  function openEdit() {
    setQuestion(existing?.question ?? chatQuery);
    setAnswer(existing?.answer ?? chatAnswer);
    setMode('edit');
  }

  if (mode === 'edit') {
    return (
      <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, padding: 12, marginTop: 4 }}>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)', marginBottom: 4 }}>Question</p>
          <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={2}
            className="input-dark" style={{ resize: 'none', fontSize: 14 }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--cyan)', marginBottom: 4 }}>Answer</p>
          <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} rows={3}
            className="input-dark" style={{ resize: 'none', fontSize: 14 }} />
        </div>
        {error && <p style={{ fontSize: 13, color: 'var(--rose)', marginBottom: 8 }}>{error}</p>}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={save} disabled={saving || !question.trim() || !answer.trim()}
            className="btn-primary" style={{ fontSize: 14, padding: '7px 14px' }}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {existing ? 'อัปเดต' : 'บันทึก'}
          </button>
          <button onClick={() => { setMode('idle'); setError(''); }}
            className="btn-ghost" style={{ fontSize: 14, padding: '7px 14px' }}>
            <X className="h-3.5 w-3.5" /> ยกเลิก
          </button>
        </div>
      </div>
    );
  }

  return (
    <button onClick={openEdit} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '7px 14px', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer',
      border: existing ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(6,182,212,0.4)',
      background: existing ? 'rgba(16,185,129,0.12)' : 'rgba(6,182,212,0.12)',
      color: existing ? 'var(--emerald)' : 'var(--cyan)',
      transition: 'all 0.18s',
    }}>
      {existing ? <Pencil className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
      {existing ? 'แก้ไข' : 'เพิ่ม'}
    </button>
  );
}