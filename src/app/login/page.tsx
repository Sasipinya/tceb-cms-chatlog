'use client';
import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, Loader2, Eye, EyeOff, Chrome } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [msLoading, setMsLoading] = useState(false);

  async function handleMicrosoft() {
    setMsLoading(true);
    await signIn('azure-ad', { callbackUrl: '/dashboard' });
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    const result = await signIn('credentials', { email, password, redirect: false });
    setLoading(false);
    if (result?.error) setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    else router.replace('/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--navy)', padding: 24, position: 'relative', overflow: 'hidden' }}>
      {/* Background orbs */}
      <div style={{ position: 'absolute', top: '-10rem', left: '-10rem', width: '28rem', height: '28rem', borderRadius: '50%', background: 'var(--grad-cyan)', opacity: 0.12, filter: 'blur(80px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-10rem', right: '-10rem', width: '28rem', height: '28rem', borderRadius: '50%', background: 'var(--grad-violet)', opacity: 0.10, filter: 'blur(80px)', pointerEvents: 'none' }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--grad-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 40px rgba(6,182,212,0.25)' }}>
            <Bot style={{ width: 32, height: 32, color: '#fff' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>TCEB CMS</h1>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 4 }}>Chat Log Management System</p>
        </div>

        <div className="glass" style={{ padding: 32 }}>
          {/* Microsoft button */}
          <button onClick={handleMicrosoft} disabled={msLoading} style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            padding: '12px 20px', borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: 'pointer',
            background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            marginBottom: 20, transition: 'all 0.18s',
          }}>
            {msLoading ? <Loader2 style={{ width: 18, height: 18 }} className="animate-spin" /> : (
              <svg width="18" height="18" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
            )}
            เข้าสู่ระบบด้วย Microsoft
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>หรือ admin login</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {/* Credentials form */}
          <form onSubmit={handleCredentials} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>อีเมล</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                placeholder="admin@terodigital.com" className="input-dark" />
            </div>
            <div>
              <label style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required
                  placeholder="••••••••" className="input-dark" style={{ paddingRight: 44 }} />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 10, padding: '10px 14px', fontSize: 15, color: '#fb7185' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 0' }}>
              {loading && <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />}
              เข้าสู่ระบบ
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 24 }}>
          รองรับเฉพาะ @terodigital.com · TCEB CMS © 2025
        </p>
      </div>
    </div>
  );
}