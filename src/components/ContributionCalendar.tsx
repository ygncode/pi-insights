import { useState, useMemo, useRef, useEffect } from 'react';
import type { DailyStats } from '../types';

interface ContributionCalendarProps {
  dailyStats: DailyStats[];
}

const LEVEL_COLORS = ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'];

function getLevel(sessions: number): number {
  if (sessions === 0) return 0;
  if (sessions <= 2) return 1;
  if (sessions <= 5) return 2;
  if (sessions <= 10) return 3;
  return 4;
}

export default function ContributionCalendar({ dailyStats }: ContributionCalendarProps) {
  const [hovered, setHovered] = useState<{
    date: string; sessions: number; messages: number; tokens: number;
    x: number; y: number;
  } | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const { weeks, months } = useMemo(() => {
    if (!dailyStats.length) return { weeks: [], months: [] };

    const statsMap = new Map(dailyStats.map(d => [d.date, d]));
    const dates = dailyStats.map(d => d.date).sort();
    const lastDate = new Date(dates[dates.length - 1] + 'T00:00:00');

    // 365 days ending at last date
    const end = new Date(lastDate);
    const start = new Date(lastDate);
    start.setDate(start.getDate() - 364);

    // Align to Monday
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));

    // Align end to Sunday
    const endDow = end.getDay();
    end.setDate(end.getDate() + (endDow === 0 ? 0 : 7 - endDow));

    const weeks: Array<Array<{ date: string; sessions: number; messages: number; tokens: number }>> = [];
    const cur = new Date(start);

    while (cur <= end) {
      const week: Array<{ date: string; sessions: number; messages: number; tokens: number }> = [];
      for (let i = 0; i < 7; i++) {
        const ds = cur.toISOString().split('T')[0];
        const s = statsMap.get(ds);
        week.push({ date: ds, sessions: s?.sessions || 0, messages: s?.messages || 0, tokens: s?.tokens || 0 });
        cur.setDate(cur.getDate() + 1);
      }
      weeks.push(week);
    }

    // Month spans
    const months: Array<{ label: string; startWeek: number; endWeek: number }> = [];
    let curMonth = '';
    let curStart = 0;

    for (let w = 0; w < weeks.length; w++) {
      const label = new Date(weeks[w][3].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short' });
      if (label !== curMonth) {
        if (curMonth) months.push({ label: curMonth, startWeek: curStart, endWeek: w });
        curMonth = label;
        curStart = w;
      }
    }
    if (curMonth) months.push({ label: curMonth, startWeek: curStart, endWeek: weeks.length });

    return { weeks, months };
  }, [dailyStats]);

  // Dynamic cell sizing via ResizeObserver
  const [computedSize, setComputedSize] = useState(14);
  useEffect(() => {
    if (!gridRef.current || !weeks.length) return;
    const el = gridRef.current;
    const gap = 2;
    const ro = new ResizeObserver(() => {
      const width = el.clientWidth;
      const cols = weeks.length;
      const size = Math.floor((width - (cols - 1) * gap) / cols);
      setComputedSize(Math.max(8, size));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [weeks.length]);

  if (!weeks.length) return null;

  const gap = 2;
  const labelW = 32;

  return (
    <div style={{ width: '100%' }}>
      {/* Month labels */}
      <div style={{ display: 'flex', marginLeft: labelW + gap, marginBottom: 6, height: 16 }}>
        {months.map((m, i) => (
          <div
            key={i}
            style={{
              fontSize: 11,
              color: '#888',
              fontWeight: 500,
              width: `calc(${(m.endWeek - m.startWeek) * 100 / weeks.length}% - ${((m.endWeek - m.startWeek) - 1) * gap}px)`,
              minWidth: 0,
              textAlign: 'left',
              flexShrink: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex' }}>
        {/* Day labels */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap,
          marginRight: gap, paddingTop: 1,
          width: labelW, flexShrink: 0,
        }}>
          {['Mon', '', 'Wed', '', 'Fri', '', ''].map((day, i) => (
            day ? (
              <span key={i} style={{
                fontSize: 10, color: '#666',
                height: computedSize, lineHeight: `${computedSize}px`,
                textAlign: 'right', paddingRight: 4,
              }}>{day}</span>
            ) : (
              <span key={i} style={{ height: computedSize, display: 'block' }} />
            )
          ))}
        </div>

        {/* CSS Grid - columns are 1fr, cells fill their area */}
        <div
          ref={gridRef}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${weeks.length}, 1fr)`,
            gridTemplateRows: `repeat(7, 1fr)`,
            gap: `${gap}px`,
            flex: 1,
          }}
        >
          {weeks.map((week, wi) =>
            week.map((day, di) => (
              <div
                key={`${wi}-${di}`}
                style={{
                  gridColumn: wi + 1,
                  gridRow: di + 1,
                  backgroundColor: LEVEL_COLORS[getLevel(day.sessions)],
                  borderRadius: 3,
                  cursor: 'pointer',
                  aspectRatio: '1 / 1',
                  minHeight: 8,
                }}
                onMouseEnter={(e) => {
                  const r = (e.target as HTMLElement).getBoundingClientRect();
                  setHovered({ ...day, x: r.left + r.width / 2, y: r.top - 6 });
                }}
                onMouseLeave={() => setHovered(null)}
              />
            ))
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginTop: 12, marginLeft: labelW + gap,
        fontSize: 11, color: '#666',
      }}>
        <span>Less</span>
        {LEVEL_COLORS.map((c, i) => (
          <div key={i} style={{ width: 12, height: 12, backgroundColor: c, borderRadius: 3 }} />
        ))}
        <span>More</span>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{
          position: 'fixed',
          left: hovered.x, top: hovered.y,
          transform: 'translateX(-50%) translateY(-100%)',
          background: '#1a1a1a', border: '1px solid #3a3a3a',
          borderRadius: 8, padding: '10px 14px',
          fontSize: 12, color: '#e8e8e8',
          zIndex: 9999, pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            {new Date(hovered.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div><span style={{ color: '#60a5fa', fontWeight: 500 }}>{hovered.sessions}</span> sessions</div>
          <div><span style={{ color: '#a78bfa', fontWeight: 500 }}>{hovered.messages.toLocaleString()}</span> messages</div>
          <div><span style={{ color: '#fbbf24', fontWeight: 500 }}>{(hovered.tokens / 1000).toFixed(1)}K</span> tokens</div>
        </div>
      )}
    </div>
  );
}
