'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DateRangePicker, defaultRange } from '@/components/ui/DateRangePicker';
import type { DateRange } from '@/components/ui/DateRangePicker';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import { Loader2 } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { format } from 'date-fns';

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 16, fontWeight: 600 }}>{p.value?.toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [range,   setRange]   = useState<DateRange>(defaultRange());
  const [stats,   setStats]   = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const p = new URLSearchParams({ dateFrom: range.dateFrom, dateTo: range.dateTo });
    fetch(`/api/analytics?${p}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [range]);

  const msgData = stats?.messageTrend
    .filter((r) => r.date && !isNaN(new Date(String(r.date).slice(0, 10)).getTime()))
    .map((r) => ({ ...r, date: format(new Date(String(r.date).slice(0, 10) + 'T12:00:00'), 'dd MMM') })) ?? [];

  const sessData = stats?.sessionTrend
    .filter((r) => r.date && !isNaN(new Date(String(r.date).slice(0, 10)).getTime()))
    .map((r) => ({ ...r, date: format(new Date(String(r.date).slice(0, 10) + 'T12:00:00'), 'dd MMM') })) ?? [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)' }}>Analytics</h1>
            <p style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 2 }}>{range.label}</p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
          </div>
        ) : stats ? (
          <>
            {/* Messages per day */}
            <div className="glass p-6">
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Messages per day</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={msgData} barSize={20}>
                  <defs>
                    <linearGradient id="barCyan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#06b6d4" />
                      <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 13 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 13 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Messages" fill="url(#barCyan)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Sessions per day */}
            <div className="glass p-6">
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Sessions per day</p>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={sessData}>
                  <defs>
                    <linearGradient id="areaViolet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 13 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 13 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="count" name="Sessions" stroke="#7c3aed" strokeWidth={2} fill="url(#areaViolet)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Usage by hour */}
            <div className="glass p-6">
              <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Usage by hour</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.hourlyVolume} barSize={18}>
                  <defs>
                    <linearGradient id="barEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 12 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} labelFormatter={(h) => `${h}:00 น.`} />
                  <Bar dataKey="count" name="Messages" fill="url(#barEmerald)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top users */}
            {stats.topUsers.length > 0 && (
              <div className="glass p-6">
                <p style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 20 }}>Top users</p>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th style={{ textAlign: 'right' }}>Messages</th>
                      <th>Usage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topUsers.map(({ tceb_user_id, count }) => {
                      const max = stats.topUsers[0].count;
                      return (
                        <tr key={tceb_user_id}>
                          <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>User {tceb_user_id}</td>
                          <td style={{ textAlign: 'right', color: 'var(--cyan)', fontWeight: 700 }}>{count}</td>
                          <td style={{ width: 220 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.07)' }}>
                                <div style={{ height: 6, borderRadius: 3, background: 'var(--grad-cyan)', width: `${(count / max) * 100}%`, transition: 'width 0.4s' }} />
                              </div>
                              <span style={{ fontSize: 14, color: 'var(--text-muted)', minWidth: 32, textAlign: 'right' }}>
                                {((count / max) * 100).toFixed(0)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <div className="glass p-10 text-center">
            <p style={{ color: 'var(--text-muted)' }}>ไม่สามารถโหลดข้อมูลได้</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}