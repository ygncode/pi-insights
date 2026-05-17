import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, LineChart, Line
} from 'recharts';
import type { Analytics } from './types';
import { formatNumber, formatDuration, formatCost, COLORS } from './utils';
import type { RageStats } from './types';
import ContributionCalendar from './components/ContributionCalendar';
import piLogo from './pi-logo.svg';
import './App.css';

// @ts-expect-error - injected by the extension
const data: Analytics = window.__ANALYTICS_DATA__;

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#0f0f0f',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '12px 16px',
      color: '#e8e8e8',
      fontSize: '13px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '8px', color: '#fff' }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: p.color || COLORS[i % COLORS.length] }} />
          <span style={{ color: '#888' }}>{p.name}:</span>
          <span style={{ fontWeight: 500, marginLeft: 'auto' }}>
            {typeof p.value === 'number' ? formatNumber(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Format date in local timezone
function localDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });
}

function localDateTime(isoStr: string): string {
  const d = new Date(isoStr);
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  return date + '\n' + time;
}

function localTimeLabel(hour: number): string {
  return String(hour).padStart(2, '0') + ':00';
}

// ── Stat Card ───────────────────────────────────────────────────────

function StatCard({ value, label, sublabel }: { value: string; label: string; sublabel?: string }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sublabel && <div className="stat-sublabel">{sublabel}</div>}
    </div>
  );
}

// ── Model Bar ───────────────────────────────────────────────────────

const ModelBar = ({ name, value, max, color }: { name: string; value: number; max: number; color: string }) => (
  <div className="model-bar">
    <div className="model-bar-label" title={name}>{name}</div>
    <div className="model-bar-track">
      <div className="model-bar-fill" style={{
        width: max ? (value / max * 100) + '%' : '0%',
        background: color
      }} />
    </div>
    <div className="model-bar-value">{formatNumber(value)}</div>
  </div>
);

// ── Daily Chart Section (tabbed: Sessions / Tokens / Cost) ──────────

function DailyChartSection({ data }: { data: Array<{ date: string; Sessions: number; Messages: number; Tokens: number; Cost: number }> }) {
  const [metric, setMetric] = useState<'Sessions' | 'Tokens' | 'Cost'>('Sessions');

  const config = {
    Sessions: { label: 'Sessions', color: '#888', yLabel: '' },
    Tokens: { label: 'Tokens', color: '#888', yLabel: 'K' },
    Cost: { label: 'Cost', color: '#888', yLabel: '$' },
  };

  return (
    <div className="section">
      <div className="chart-card chart-full" style={{ padding: 0 }}>
        {/* Inline tabs */}
        <div style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid #1f1f1f',
          padding: '0 20px',
        }}>
          {(['Sessions', 'Tokens', 'Cost'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMetric(m)}
              style={{
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: metric === m ? '#fff' : '#666',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${metric === m ? '#fff' : 'transparent'}`,
                cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {m} per Day
            </button>
          ))}
        </div>

        <div style={{ padding: '16px 20px 20px' }}>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fill: '#888', fontSize: 11 }}
                axisLine={{ stroke: '#2a2a2a' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#888', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => {
                  if (metric === 'Cost') return '$' + v.toFixed(2);
                  return v.toLocaleString();
                }}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const val = payload[0].value as number;
                  const display = metric === 'Cost'
                    ? '$' + val.toFixed(2)
                    : metric === 'Tokens'
                      ? (val * 1000).toLocaleString()
                      : val.toLocaleString();
                  return (
                    <div style={{
                      background: '#0f0f0f',
                      border: '1px solid #2a2a2a',
                      borderRadius: '6px',
                      padding: '8px 12px',
                      fontSize: '12px',
                      color: '#e8e8e8',
                    }}>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
                      <div>{metric}: <span style={{ fontWeight: 500 }}>{display}</span></div>
                    </div>
                  );
                }}
              />
              <Bar dataKey={metric} radius={[3, 3, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ── Rage Tab ────────────────────────────────────────────────────────────

function RageTab({ rage, totalUserMessages }: { rage: RageStats; totalUserMessages: number }) {
  const hourLabels = (h: number) => String(h).padStart(2, '0') + ':00';

  const filthiestModel = rage.byModel[0]?.name ?? '—';
  const peakHour = rage.byHour.reduce(
    (best, h) => h.count > best.count ? h : best,
    { hour: 0, count: 0 }
  );
  const swearRate = totalUserMessages > 0
    ? ((rage.messagesWithSwears / totalUserMessages) * 100).toFixed(1)
    : '0.0';

  const maxProjectCount = Math.max(...rage.byProject.map(p => p.count), 1);

  if (rage.total === 0) {
    return (
      <div className="section">
        <div className="chart-card" style={{ textAlign: 'center', padding: '48px', color: '#666' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>😇</div>
          <div style={{ fontSize: '16px', fontWeight: 600, color: '#fff' }}>Squeaky clean</div>
          <div style={{ fontSize: '13px', marginTop: '6px' }}>No profanity detected in your sessions.</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Stat row */}
      <div className="stats-grid">
        <StatCard value={rage.total.toLocaleString()} label="Total Swears" />
        <StatCard value={swearRate + '%'} label="Swear Rate" sublabel="of user messages" />
        <StatCard
          value={filthiestModel.length > 20 ? filthiestModel.slice(0, 20) + '…' : filthiestModel}
          label="Filthiest Model"
        />
        <StatCard
          value={hourLabels(peakHour.hour)}
          label="Peak Hour"
          sublabel={`${peakHour.count} swears`}
        />
        <StatCard
          value={rage.topWords[0]?.word ?? '—'}
          label="Top Word"
          sublabel={rage.topWords[0] ? `${rage.topWords[0].count}×` : undefined}
        />
        <StatCard
          value={rage.byProject.length.toLocaleString()}
          label="Projects Affected"
          sublabel={rage.byProject[0]?.name}
        />
      </div>

      {/* By model */}
      <div className="section">
        <div className="section-header"><h2 className="section-title">By Model</h2></div>
        <div className="section-subtitle">Swear count while each model was active</div>
        <div className="chart-card chart-full">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={rage.byModel} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#888', fontSize: 10 }}
                axisLine={{ stroke: '#2a2a2a' }}
                tickLine={false}
                angle={-30}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#e8e8e8' }}>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{label}</div>
                      <div>Swears: <span style={{ fontWeight: 500 }}>{payload[0].value}</span></div>
                    </div>
                  );
                }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {rage.byModel.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* By hour */}
      <div className="section">
        <div className="section-header"><h2 className="section-title">By Hour</h2></div>
        <div className="section-subtitle">When you swear throughout the day (local time)</div>
        <div className="chart-card chart-full">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={rage.byHour} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="rageHourGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
              <XAxis
                dataKey="hour"
                tickFormatter={hourLabels}
                tick={{ fill: '#888', fontSize: 11 }}
                axisLine={{ stroke: '#2a2a2a' }}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 6, padding: '8px 12px', fontSize: 12, color: '#e8e8e8' }}>
                      <div style={{ fontWeight: 600, color: '#fff', marginBottom: 4 }}>{hourLabels(label as number)}</div>
                      <div>Swears: <span style={{ fontWeight: 500 }}>{payload[0].value}</span></div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="count" stroke="#ef4444" fill="url(#rageHourGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top words + by project */}
      <div className="chart-row">
        <div className="section" style={{ flex: 1 }}>
          <div className="section-header"><h2 className="section-title">Top Words</h2></div>
          <div className="section-subtitle">Your favourite expressions</div>
          <div className="chart-card">
            {rage.topWords.map((w, i) => (
              <ModelBar
                key={w.word}
                name={w.word}
                value={w.count}
                max={rage.topWords[0]?.count ?? 1}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </div>
        </div>

        <div className="section" style={{ flex: 1 }}>
          <div className="section-header"><h2 className="section-title">By Project</h2></div>
          <div className="section-subtitle">Which project makes you angriest</div>
          <div className="chart-card">
            {rage.byProject.map((p, i) => (
              <ModelBar
                key={p.name}
                name={p.name}
                value={p.count}
                max={maxProjectCount}
                color={COLORS[i % COLORS.length]}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ── Main App ─────────────────────────────────────────────────────────

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sessionFilter, setSessionFilter] = useState('');
  const [projectSort, setProjectSort] = useState<'messages' | 'sessions' | 'tokens' | 'cost'>('messages');

  // Daily data for all three charts
  const dailyChartData = useMemo(() =>
    data.dailyStats.map(d => ({
      date: localDate(d.date),
      Sessions: d.sessions,
      Messages: d.messages,
      Tokens: d.tokens / 1000, // in thousands
      Cost: d.cost,
    })), []);

  const hourlyChartData = useMemo(() =>
    data.hourlyDistribution.map(h => ({
      hour: localTimeLabel(h.hour),
      rawHour: h.hour,
      Sessions: h.count,
    })), []);

  const modelPieData = useMemo(() =>
    data.modelStats.slice(0, 6).map(m => ({
      name: m.name,
      value: m.tokens,
    })), []);

  const projectMaxMessages = useMemo(() =>
    Math.max(...data.projectStats.map(p => p.messages), 1),
  []);

  const maxModelTokens = useMemo(() =>
    Math.max(...data.modelStats.map(m => m.tokens), 1),
  []);

  const filteredSessions = useMemo(() => {
    const reversed = [...data.sessions].reverse();
    if (!sessionFilter.trim()) return reversed;
    const q = sessionFilter.toLowerCase();
    return reversed.filter(s =>
      s.projectName.toLowerCase().includes(q) ||
      s.startTime.toLowerCase().includes(q)
    );
  }, [sessionFilter]);

  const sortedProjects = useMemo(() => {
    const projects = [...data.projectStats];
    return projects.sort((a, b) => b[projectSort] - a[projectSort]);
  }, [projectSort]);

  // Date range in local time
  const dateRangeStr = localDate(data.dateRange.start) + ' – ' + localDate(data.dateRange.end);

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
          <img src={piLogo} alt="Pi" style={{ width: '36px', height: '36px' }} />
          <h1 style={{ marginBottom: 0 }}>Pi Insights</h1>
        </div>
        <p className="header-subtitle" style={{ marginTop: '4px' }}>
          {dateRangeStr}
          <span className="header-dot" />
          {data.totalSessions.toLocaleString()} sessions
          <span className="header-dot" />
          {data.projectStats.length} projects
          <span className="header-dot" />
          {data.modelStats.length} models
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatCard
          value={data.totalSessions.toLocaleString()}
          label="Sessions"
          sublabel={`${data.avgMessagesPerSession} msgs avg · ${formatDuration(data.avgSessionDuration)} each`}
        />
        <StatCard
          value={formatNumber(data.totalMessages)}
          label="Messages"
        />
        <StatCard
          value={formatDuration(data.totalDuration)}
          label="Active Time"
          sublabel={`${formatDuration(data.avgSessionDuration)} avg`}
        />
        <StatCard
          value={data.modelStats.length.toString()}
          label="Models"
          sublabel={`${data.modelSwitchCount} multi-model sessions`}
        />
        <StatCard
          value={formatNumber(data.totalTokens)}
          label="Tokens"
        />
        <StatCard
          value={formatCost(data.totalCost)}
          label="Cost"
        />
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        <button className={"tab " + (activeTab === 'overview' ? 'active' : '')} onClick={() => setActiveTab('overview')}>Overview</button>
        <button className={"tab " + (activeTab === 'models' ? 'active' : '')} onClick={() => setActiveTab('models')}>Models</button>
        <button className={"tab " + (activeTab === 'projects' ? 'active' : '')} onClick={() => setActiveTab('projects')}>Projects</button>
        <button className={"tab " + (activeTab === 'sessions' ? 'active' : '')} onClick={() => setActiveTab('sessions')}>Sessions</button>
        <button className={"tab " + (activeTab === 'rage' ? 'active' : '')} onClick={() => setActiveTab('rage')}>Rage 🤬</button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Activity Calendar</h2>
            </div>
            <div className="section-subtitle">Daily session intensity over the past year</div>
            <div className="chart-card chart-full">
              <ContributionCalendar dailyStats={data.dailyStats} />
            </div>
          </div>

          <DailyChartSection data={dailyChartData} />

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Activity by Hour</h2>
            </div>
            <div className="section-subtitle">Session starts distributed across hours</div>
            <div className="chart-card chart-full">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={hourlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="hourlyGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b5998" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b5998" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" vertical={false} />
                  <XAxis dataKey="hour" tick={{ fill: '#888', fontSize: 11 }} axisLine={{ stroke: '#2a2a2a' }} tickLine={false} interval={2} />
                  <YAxis tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Sessions" stroke="#6b8cce" fill="url(#hourlyGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Top Tools</h2>
            </div>
            <div className="section-subtitle">Most frequently used tools across all sessions</div>
            <div className="chart-card">
              {data.topTools.length === 0 ? (
                <div style={{ color: '#666', fontSize: '13px' }}>No tool usage recorded.</div>
              ) : data.topTools.map((tool, i) => (
                <ModelBar
                  key={tool.name}
                  name={tool.name}
                  value={tool.count}
                  max={data.topTools[0].count}
                  color={COLORS[i % COLORS.length]}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'models' && (
        <>
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Model Token Distribution</h2>
            </div>
            <div className="section-subtitle">Share of total tokens by model</div>
            <div className="chart-row">
              <div className="chart-card">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={modelPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {modelPieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '16px' }}>Model Breakdown</h3>
                {data.modelStats.map((m, i) => (
                  <ModelBar
                    key={m.name}
                    name={m.name}
                    value={m.tokens}
                    max={maxModelTokens}
                    color={COLORS[i % COLORS.length]}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Thinking Levels</h2>
            </div>
            <div className="section-subtitle">Distribution of thinking level changes</div>
            <div className="chart-card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.thinkingLevelDistribution.map((t) => (
                  <span key={t.name} className="tag">{t.name}: {t.count}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Stop Reasons</h2>
            </div>
            <div className="section-subtitle">Why assistant messages ended</div>
            <div className="chart-card">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {data.stopReasonDistribution.map((s) => (
                  <span key={s.name} className="tag">{s.name}: {s.count}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'projects' && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Project Breakdown</h2>
            <select
              value={projectSort}
              onChange={e => setProjectSort(e.target.value as typeof projectSort)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#e8e8e8',
                fontSize: '12px',
                padding: '4px 10px',
                cursor: 'pointer',
              }}
            >
              <option value="messages">Sort: Messages</option>
              <option value="sessions">Sort: Sessions</option>
              <option value="tokens">Sort: Tokens</option>
              <option value="cost">Sort: Cost</option>
            </select>
          </div>
          <div className="section-subtitle">Sessions, messages, and cost by project</div>
          <div className="chart-card">
            {sortedProjects.map((p, i) => (
              <div key={p.name} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 600, color: '#fff', fontSize: '14px' }}>{p.name}</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#888' }}>
                    <span>{p.sessions} sessions</span>
                    <span>{formatNumber(p.messages)} msgs</span>
                    <span>{formatNumber(p.tokens)} tokens</span>
                    <span className="cost">{formatCost(p.cost)}</span>
                  </div>
                </div>
                <ModelBar
                  name=""
                  value={p[projectSort]}
                  max={Math.max(...sortedProjects.map(x => x[projectSort]), 1)}
                  color={COLORS[i % COLORS.length]}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">Recent Sessions</h2>
            <input
              type="text"
              placeholder="Filter by project or date…"
              value={sessionFilter}
              onChange={e => setSessionFilter(e.target.value)}
              style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '6px',
                color: '#e8e8e8',
                fontSize: '12px',
                padding: '4px 10px',
                width: '220px',
                outline: 'none',
              }}
            />
          </div>
          <div className="section-subtitle">
            {filteredSessions.length === data.totalSessions
              ? `All ${data.totalSessions} sessions sorted by date`
              : `${filteredSessions.length} of ${data.totalSessions} sessions`}
          </div>
          <div className="chart-card" style={{ overflowX: 'auto' }}>
            <table className="session-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th>Messages</th>
                  <th>Tokens</th>
                  <th>Duration</th>
                  <th>Cost</th>
                  <th>Models</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map(sess => (
                  <tr key={sess.id}>
                    <td style={{ whiteSpace: 'pre', minWidth: '110px' }}>{localDateTime(sess.startTime)}</td>
                    <td>{sess.projectName}</td>
                    <td className="num">{sess.messageCount}</td>
                    <td className="num">{formatNumber(sess.tokenUsage.total)}</td>
                    <td className="num">{formatDuration(sess.duration)}</td>
                    <td className="num cost">{formatCost(sess.cost.total)}</td>
                    <td>
                      {Object.keys(sess.models).map(m => (
                        <span key={m} className="tag" style={{ marginRight: '4px' }}>{m}</span>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'rage' && (
        <RageTab rage={data.rageStats} totalUserMessages={data.totalMessages} />
      )}

      <div className="footer">
        Generated by Pi Insights Extension · {new Date().toLocaleString()}
      </div>
    </div>
  );
}

export default App;
