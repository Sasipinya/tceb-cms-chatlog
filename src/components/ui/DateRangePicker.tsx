'use client';
import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { th } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

export type DateMode = 'all' | 'daily' | 'weekly' | 'custom';

export interface DateRange {
  mode:     DateMode;
  dateFrom: string;
  dateTo:   string;
  label:    string;
}

interface Props {
  value:    DateRange;
  onChange: (range: DateRange) => void;
}

function toDateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

function makeDaily(date: Date): DateRange {
  const str = toDateStr(date);
  return { mode: 'daily', dateFrom: str, dateTo: str, label: format(date, 'd MMM yyyy', { locale: th }) };
}

function makeWeekly(date: Date): DateRange {
  const mon = startOfWeek(date, { weekStartsOn: 1 });
  const sun = endOfWeek(date,   { weekStartsOn: 1 });
  return {
    mode: 'weekly', dateFrom: toDateStr(mon), dateTo: toDateStr(sun),
    label: `${format(mon, 'd MMM', { locale: th })} – ${format(sun, 'd MMM yyyy', { locale: th })}`,
  };
}

function makeAll(): DateRange {
  return {
    mode: 'all', dateFrom: '2000-01-01', dateTo: toDateStr(new Date()), label: 'ทั้งหมด',
  };
}

export function defaultRange(): DateRange {
  return makeAll();
}

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 16px',
  borderRadius: 8,
  fontSize: 15,
  fontWeight: 600,
  cursor: 'pointer',
  border: active ? '1px solid rgba(2,132,199,0.4)' : '1px solid transparent',
  background: active ? 'var(--grad-cyan)' : 'transparent',
  color: active ? '#fff' : 'var(--text-muted)',
  transition: 'all 0.18s',
  whiteSpace: 'nowrap',
});

const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
  background: 'var(--surface-2)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  width: 36,
  height: 36,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: disabled ? 'not-allowed' : 'pointer',
  opacity: disabled ? 0.4 : 1,
  color: 'var(--text-secondary)',
  flexShrink: 0,
});

export function DateRangePicker({ value, onChange }: Props) {
  const [mode,       setMode]       = useState<DateMode>(value.mode);
  const [dailyDate,  setDailyDate]  = useState(value.mode === 'daily' ? value.dateFrom : toDateStr(new Date()));
  const [weekAnchor, setWeekAnchor] = useState(value.mode === 'weekly' ? value.dateFrom : toDateStr(new Date()));
  const [customFrom, setCustomFrom] = useState(value.mode === 'custom' ? value.dateFrom : toDateStr(new Date(Date.now() - 30 * 86400000)));
  const [customTo,   setCustomTo]   = useState(value.mode === 'custom' ? value.dateTo : toDateStr(new Date()));

  const today = toDateStr(new Date());

  // ── Emit on mode/value change ─────────────────────────────────────────────
  useEffect(() => {
    if (mode === 'all') {
      onChange(makeAll());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (mode === 'daily') {
      onChange(makeDaily(new Date(dailyDate + 'T12:00:00')));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyDate, mode]);

  useEffect(() => {
    if (mode === 'weekly') {
      onChange(makeWeekly(new Date(weekAnchor + 'T12:00:00')));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekAnchor, mode]);

  useEffect(() => {
    if (mode === 'custom' && customFrom && customTo && customFrom <= customTo) {
      onChange({
        mode: 'custom', dateFrom: customFrom, dateTo: customTo,
        label: `${format(new Date(customFrom + 'T12:00:00'), 'd MMM', { locale: th })} – ${format(new Date(customTo + 'T12:00:00'), 'd MMM yyyy', { locale: th })}`,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customFrom, customTo, mode]);

  function shiftDay(dir: -1 | 1) {
    const d = new Date(dailyDate + 'T12:00:00');
    d.setDate(d.getDate() + dir);
    setDailyDate(toDateStr(d));
  }

  function shiftWeek(dir: -1 | 1) {
    const base = new Date(weekAnchor + 'T12:00:00');
    setWeekAnchor(toDateStr(dir === -1 ? subWeeks(base, 1) : subWeeks(base, -1)));
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
      {/* Mode tabs */}
      <div style={{
        display: 'flex',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: 4,
        gap: 2,
      }}>
        {(['all', 'daily', 'weekly', 'custom'] as DateMode[]).map((m) => (
          <button key={m} onClick={() => setMode(m)} style={tabStyle(mode === m)}>
            {m === 'all'    ? 'ทั้งหมด'    :
             m === 'daily'  ? 'รายวัน'     :
             m === 'weekly' ? 'รายสัปดาห์' : 'กำหนดเอง'}
          </button>
        ))}
      </div>

      {/* Daily controls */}
      {mode === 'daily' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => shiftDay(-1)} style={navBtnStyle(false)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <input
            type="date" value={dailyDate} max={today}
            onChange={(e) => setDailyDate(e.target.value)}
            className="input-dark" style={{ width: 160 }}
          />
          <button onClick={() => shiftDay(1)} disabled={dailyDate >= today} style={navBtnStyle(dailyDate >= today)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Weekly controls */}
      {mode === 'weekly' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => shiftWeek(-1)} style={navBtnStyle(false)}>
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--surface-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '8px 14px',
            color: 'var(--text-primary)', fontSize: 15,
            whiteSpace: 'nowrap',
          }}>
            <CalendarDays className="h-4 w-4" style={{ color: 'var(--cyan)', flexShrink: 0 }} />
            {makeWeekly(new Date(weekAnchor + 'T12:00:00')).label}
          </div>
          <button onClick={() => shiftWeek(1)} disabled={weekAnchor >= today} style={navBtnStyle(weekAnchor >= today)}>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Custom range controls */}
      {mode === 'custom' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            type="date" value={customFrom}
            max={customTo || today}
            onChange={(e) => setCustomFrom(e.target.value)}
            className="input-dark" style={{ width: 160 }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>ถึง</span>
          <input
            type="date" value={customTo}
            min={customFrom} max={today}
            onChange={(e) => setCustomTo(e.target.value)}
            className="input-dark" style={{ width: 160 }}
          />
        </div>
      )}
    </div>
  );
}