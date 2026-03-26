'use client';
import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';

interface Props {
  chatId:         number;
  conversationId: string;
  initialFlagged?: boolean;
  size?:          'sm' | 'md';
  onToggled?:     (isFlagged: boolean) => void;
}

export function FlagButton({ chatId, conversationId, initialFlagged = false, size = 'md', onToggled }: Props) {
  const [flagged,  setFlagged]  = useState(initialFlagged);
  const [loading,  setLoading]  = useState(false);
  const [showReason, setShowReason] = useState(false);
  const [reason,   setReason]   = useState('');

  async function toggle() {
    if (!flagged) {
      // ถ้ายังไม่ flag → แสดง reason input ก่อน
      setShowReason(true);
      return;
    }
    // ถ้า flag อยู่แล้ว → unflag ทันที
    await doFlag('');
  }

  async function doFlag(r: string) {
    setLoading(true);
    try {
      const res = await fetch('/api/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, conversation_id: conversationId, reason: r }),
      });
      const data = await res.json();
      const next = data.is_flagged ?? !flagged;
      setFlagged(next);
      onToggled?.(next);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    setShowReason(false);
    setReason('');
  }

  const isSmall = size === 'sm';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={toggle}
        disabled={loading}
        title={flagged ? 'Unflag' : 'Flag as incorrect'}
        style={{
          display: 'flex', alignItems: 'center', gap: isSmall ? 4 : 6,
          padding: isSmall ? '5px 10px' : '7px 14px',
          borderRadius: 8,
          fontSize: isSmall ? 13 : 15,
          fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer',
          border: flagged
            ? '1px solid rgba(225,29,72,0.4)'
            : '1px solid var(--border)',
          background: flagged
            ? 'rgba(225,29,72,0.12)'
            : 'var(--surface-2)',
          color: flagged ? 'var(--rose)' : 'var(--text-muted)',
          transition: 'all 0.18s',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading
          ? <Loader2 style={{ width: isSmall ? 12 : 14, height: isSmall ? 12 : 14, animation: 'spin 1s linear infinite' }} />
          : <Flag style={{ width: isSmall ? 12 : 14, height: isSmall ? 12 : 14 }} />}
        {flagged ? 'Flagged' : 'Flag'}
      </button>

      {/* Reason popup */}
      {showReason && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 50,
          background: 'var(--surface-1)', border: '1px solid var(--border)',
          borderRadius: 12, padding: 14, width: 260,
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
        }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            เหตุผล (optional)
          </p>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doFlag(reason); if (e.key === 'Escape') setShowReason(false); }}
            placeholder="เช่น ตอบผิด, ข้อมูลเก่า..."
            autoFocus
            className="input-dark"
            style={{ fontSize: 14, marginBottom: 10 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => doFlag(reason)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--grad-rose)', color: '#fff', border: 'none', cursor: 'pointer',
            }}>
              Flag
            </button>
            <button onClick={() => setShowReason(false)} style={{
              flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 14, fontWeight: 600,
              background: 'var(--surface-2)', color: 'var(--text-secondary)',
              border: '1px solid var(--border)', cursor: 'pointer',
            }}>
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}