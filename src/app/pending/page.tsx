'use client';
import { signOut, useSession } from 'next-auth/react';
import { Clock, LogOut } from 'lucide-react';

export default function PendingPage() {
  const { data: session } = useSession();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', padding: 24 }}>
      <div className="glass" style={{ maxWidth: 420, width: '100%', padding: 40, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Clock style={{ width: 28, height: 28, color: 'var(--amber)' }} />
        </div>

        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
          รอการอนุมัติ
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 24 }}>
          บัญชี <span style={{ color: 'var(--cyan)', fontWeight: 600 }}>{session?.user?.email}</span> ได้รับการสร้างแล้ว
          กรุณารอให้ Admin อนุมัติสิทธิ์การใช้งาน
        </p>

        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px', marginBottom: 24, textAlign: 'left' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 6 }}>ระหว่างรอสามารถ:</p>
          <ul style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 2, paddingLeft: 20, margin: 0 }}>
            <li>ดูข้อมูลแบบ Read-only</li>
            <li>ไม่สามารถแก้ไขหรือ export ได้</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <a href="/dashboard" style={{ textDecoration: 'none' }}>
            <button className="btn-primary">เข้าสู่ระบบ (Read-only)</button>
          </a>
          <button className="btn-ghost" onClick={() => signOut({ callbackUrl: '/login' })}>
            <LogOut style={{ width: 16, height: 16 }} /> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}