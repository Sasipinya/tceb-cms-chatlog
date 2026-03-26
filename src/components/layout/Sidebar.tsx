'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import {
  LayoutDashboard, MessageSquare, BarChart2, Sparkles,
  LogOut, Bot, ChevronRight, Users, ClipboardList,
} from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const nav = [
  { href: '/dashboard',    label: 'Dashboard',    icon: LayoutDashboard, minRole: 'viewer'  },
  { href: '/sessions',     label: 'Chat Logs',    icon: MessageSquare,   minRole: 'viewer'  },
  { href: '/analytics',    label: 'Analytics',    icon: BarChart2,       minRole: 'analyst' },
  { href: '/analyze-logs', label: 'Analyze Logs', icon: Sparkles,        minRole: 'analyst' },
];

const adminNav = [
  { href: '/admin/users', label: 'User Management', icon: Users         },
  { href: '/admin/audit', label: 'Audit Log',        icon: ClipboardList },
];

const ROLE_LEVEL: Record<string, number> = {
  pending: 0, viewer: 1, analyst: 2, editor: 3, admin: 4,
};

const roleColor: Record<string, string> = {
  pending: '#d97706', viewer: '#0284c7', analyst: '#7c3aed',
  editor:  '#059669', admin:  '#e11d48',
};

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role      = (session?.user as any)?.role ?? 'pending';
  const userLevel = ROLE_LEVEL[role] ?? 0;

  return (
    <aside className="sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col">
      {/* Logo */}
      <div style={{ display: 'flex', height: 64, alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--grad-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>TCEB CMS</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Chat Analytics</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 8 }}>
          Menu
        </p>
        {nav
          .filter((item) => userLevel >= (ROLE_LEVEL[item.minRole] ?? 0))
          .map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
                <Icon className="h-4 w-4 shrink-0" />
                <span style={{ flex: 1 }}>{label}</span>
                {active && <ChevronRight className="h-3.5 w-3.5" style={{ opacity: 0.5 }} />}
              </Link>
            );
          })}

        {/* Admin section */}
        {role === 'admin' && (
          <>
            <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 8px', marginTop: 20, marginBottom: 8 }}>
              Admin
            </p>
            {adminNav.map(({ href, label, icon: Icon }) => {
              const active = pathname.startsWith(href);
              return (
                <Link key={href} href={href} className={`nav-item ${active ? 'active' : ''}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span style={{ flex: 1 }}>{label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5" style={{ opacity: 0.5 }} />}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User */}
      <div style={{ borderTop: '1px solid var(--border)', padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--grad-violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {session?.user?.name?.charAt(0)?.toUpperCase() ?? 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {session?.user?.name ?? 'Admin'}
            </p>
            <span style={{ fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999, background: (roleColor[role] ?? '#64748b') + '18', color: roleColor[role] ?? '#64748b', border: `1px solid ${roleColor[role] ?? '#64748b'}40` }}>
              {role}
            </span>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            title="Sign out"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}