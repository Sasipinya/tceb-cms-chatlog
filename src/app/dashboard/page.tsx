'use client';
import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { DateRangePicker, defaultRange } from '@/components/ui/DateRangePicker';
import type { DateRange } from '@/components/ui/DateRangePicker';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { MessageSquare, Users, Activity, TrendingUp, Sparkles, Flag, ThumbsDown, Loader2 } from 'lucide-react';
import type { DashboardStats } from '@/types';
import { format } from 'date-fns';

const STAT_CARDS = [
  { key: 'totalMessages',  label: 'Total Messages', icon: MessageSquare, grad: 'card-cyan',    text: '#fff' },
  { key: 'totalSessions',  label: 'Sessions',       icon: Activity,      grad: 'card-violet',  text: '#fff' },
  { key: 'uniqueUsers',    label: 'Unique Users',   icon: Users,         grad: 'card-emerald', text: '#fff' },
  { key: 'todayMessages',  label: 'Today',          icon: TrendingUp,    grad: 'card-amber',   text: '#fff' },
];

const AI_CARDS = [
  { key: 'analyzedCount', label: 'Analyzed',  icon: Sparkles,   color: '#06b6d4' },
  { key: 'flaggedCount',  label: 'Flagged',   icon: Flag,       color: '#f43f5e' },
  { key: 'negativeCount', label: 'Negative',  icon: ThumbsDown, color: '#f59e0b' },
];

const SENTIMENT_COLORS = ['#10b981', '#64748b', '#f43f5e'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 13, fontWeight: 600 }}>{p.value.toLocaleString()}</p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
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

  const trendData = stats?.messageTrend
    .filter((r) => r.date && !isNaN(new Date(String(r.date).slice(0, 10)).getTime()))
    .map((r) => ({ ...r, date: format(new Date(String(r.date).slice(0, 10) + 'T12:00:00'), 'dd MMM') })) ?? [];

  const pieData = stats ? [
    { name: 'Positive', value: stats.sentimentBreakdown.positive },
    { name: 'Neutral',  value: stats.sentimentBreakdown.neutral  },
    { name: 'Negative', value: stats.sentimentBreakdown.negative },
  ].filter((d) => d.value > 0) : [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-800 text-white" style={{ fontWeight: 800 }}>Dashboard</h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--text-muted)' }}>{range.label}</p>
          </div>
          <DateRangePicker value={range} onChange={setRange} />
        </div>

        {loading ? (
          <div className="flex h-72 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--cyan)' }} />
          </div>
        ) : stats ? (
          <>
            {/* ── KPI gradient cards ── */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {STAT_CARDS.map(({ key, label, icon: Icon, grad }) => (
                <div key={key} className={`${grad} p-5 relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-10"
                    style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, #fff 0%, transparent 60%)' }} />
                  <div className="relative">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-600 text-white/70 uppercase tracking-wider" style={{ fontWeight: 600 }}>{label}</p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <p className="text-3xl font-800 text-white" style={{ fontWeight: 800 }}>
                      {(stats[key as keyof DashboardStats] as number)?.toLocaleString() ?? 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── AI stats ── */}
            <div className="grid grid-cols-3 gap-4">
              {AI_CARDS.map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="glass p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: `${color}20` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{label}</p>
                    <p className="mt-0.5 text-2xl font-700" style={{ color, fontWeight: 700 }}>
                      {(stats[key as keyof DashboardStats] as number) ?? 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* ── Charts row ── */}
            <div className="grid grid-cols-3 gap-4">
              {/* Messages bar chart */}
              <div className="glass col-span-2 p-5">
                <p className="mb-4 text-sm font-600" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Messages per day</p>
                <ResponsiveContainer width="100%" height={210}>
                  <BarChart data={trendData} barSize={18}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Messages" radius={[6, 6, 0, 0]}
                      fill="url(#barGrad)" />
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#06b6d4" />
                        <stop offset="100%" stopColor="#0891b2" stopOpacity={0.7} />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Sentiment pie */}
              <div className="glass p-5">
                <p className="mb-4 text-sm font-600" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Sentiment</p>
                {pieData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={150}>
                      <PieChart>
                        <Pie data={pieData} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3}>
                          {pieData.map((_, i) => <Cell key={i} fill={SENTIMENT_COLORS[i]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-3 space-y-1.5">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ background: SENTIMENT_COLORS[i] }} />
                            <span style={{ color: 'var(--text-muted)' }}>{d.name}</span>
                          </div>
                          <span style={{ color: SENTIMENT_COLORS[i], fontWeight: 600 }}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex h-40 flex-col items-center justify-center gap-2">
                    <Sparkles className="h-8 w-8 opacity-20" style={{ color: 'var(--cyan)' }} />
                    <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล<br/>กด Analyze ในหน้า Chat Log</p>
                  </div>
                )}
              </div>
            </div>

            {/* ── Hourly area + Top topics ── */}
            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-5">
                <p className="mb-4 text-sm font-600" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Usage by hour</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={stats.hourlyVolume}>
                    <defs>
                      <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(h) => `${h}h`} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" stroke="#7c3aed" strokeWidth={2} fill="url(#areaGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="glass p-5">
                <p className="mb-4 text-sm font-600" style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Top topics</p>
                {stats.topTopics.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topTopics.slice(0, 6).map(({ topic, count }, i) => {
                      const max = stats.topTopics[0].count;
                      const colors = ['#06b6d4','#7c3aed','#10b981','#f59e0b','#f43f5e','#8b5cf6'];
                      return (
                        <div key={topic} className="flex items-center gap-3">
                          <span className="w-4 text-center text-xs font-600" style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{i + 1}</span>
                          <span className="flex-1 truncate text-xs" style={{ color: 'var(--text-secondary)' }}>{topic}</span>
                          <div className="w-24 h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${(count / max) * 100}%`, background: colors[i % colors.length] }} />
                          </div>
                          <span className="w-6 text-right text-xs font-600" style={{ color: colors[i % colors.length], fontWeight: 600 }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>ยังไม่มีข้อมูล Topics</p>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="glass p-10 text-center">
            <p style={{ color: 'var(--text-muted)' }}>ไม่สามารถโหลดข้อมูลได้ — ตรวจสอบ MySQL connection</p>
          </div>
        )}
      </div>
    </AppShell>
  );
}