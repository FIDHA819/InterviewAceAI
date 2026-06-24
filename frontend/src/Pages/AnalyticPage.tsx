import { useState, useEffect } from 'react';
import { useNavigate }          from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PolarRadiusAxis,
} from 'recharts';
import { analyticsService }     from "../services/analytic.service";
import type {
  AnalyticsData,
  HistoryRow,
  CategoryStat,
} from '../types/analytic.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500';

const scoreBg = (s: number) =>
  s >= 80 ? 'bg-green-50 border-green-200'
: s >= 60 ? 'bg-yellow-50 border-yellow-200'
           : 'bg-red-50 border-red-200';

const diffBadge: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

const catIcon: Record<string, string> = {
  frontend:        '⚛️',
  backend:         '🛠️',
  fullstack:       '🔄',
  'system-design': '🏗️',
  hr:              '🤝',
  dsa:             '💻',
};

const fmtTime = (secs: number) => {
  if (!secs) return '0m';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-2.5 text-xs">
      <p className="font-semibold text-slate-700 mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="flex items-center gap-1.5">
          <span className="font-medium">{p.name}:</span>
          <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: string; label: string; value: string | number;
  sub?: string; color: string;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${color}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-slate-800">{value}</div>
      <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
      {sub && <div className="text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-6xl">📊</div>
      <h2 className="text-xl font-semibold text-slate-700">No data yet</h2>
      <p className="text-slate-400 text-sm text-center max-w-xs">
        Complete your first interview to see analytics and performance trends here.
      </p>
      <button
        onClick={onStart}
        className="mt-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        Start an Interview
      </button>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return <div className={`bg-slate-200 rounded-xl animate-pulse ${className}`} />;
}

function PageSkeleton() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-80" />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const navigate = useNavigate();

  const [data,        setData]        = useState<AnalyticsData | null>(null);
  const [history,     setHistory]     = useState<HistoryRow[]>([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [histLoading, setHistLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<'line' | 'bar'>('line');
  const [trendMetric, setTrendMetric] =
    useState<'overall' | 'technical' | 'communication' | 'confidence'>('overall');

  useEffect(() => {
    Promise.all([
      analyticsService.getOverview(),
      analyticsService.getHistory(1),
    ])
      .then(([overviewRes, histRes]) => {
        setData(overviewRes.data.data);
        setHistory(histRes.data.data.history || []);
        setTotalPages(histRes.data.data.totalPages || 1);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const loadHistoryPage = async (page: number) => {
    setHistLoading(true);
    try {
      const res = await analyticsService.getHistory(page);
      setHistory(res.data.data.history || []);
      setHistoryPage(page);
      setTotalPages(res.data.data.totalPages || 1);
    } finally {
      setHistLoading(false);
    }
  };

  if (loading) return <PageSkeleton />;
  if (!data || data.overview.totalSessions === 0) return <EmptyState onStart={() => navigate('/interview')} />;

  const { overview, categoryStats, scoreTrend } = data;

  // Radar data — skill dimensions
  const radarData = [
    { subject: 'Technical',     score: overview.avgTechnical     },
    { subject: 'Communication', score: overview.avgCommunication },
    { subject: 'Confidence',    score: overview.avgConfidence    },
    { subject: 'Overall',       score: overview.avgOverall       },
  ];

  // Category bar data
  const catBarData = categoryStats.map((c: CategoryStat) => ({
    name:      c.category.charAt(0).toUpperCase() + c.category.slice(1).replace('-', ' '),
    avg:       c.avgScore,
    best:      c.bestScore,
    sessions:  c.count,
  }));

  const metricColors: Record<string, string> = {
    overall:       '#6366f1',
    technical:     '#22c55e',
    communication: '#f59e0b',
    confidence:    '#ec4899',
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Performance Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">
            Based on {overview.totalSessions} completed interview{overview.totalSessions !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate('/interview')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Interview
        </button>
      </div>

      {/* ── Stat cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon="🎯" label="Total Interviews"
          value={overview.totalSessions}
          sub={`${fmtTime(overview.totalTimeSpent)} total`}
          color="bg-blue-50 border-blue-100"
        />
        <StatCard
          icon="📈" label="Average Score"
          value={`${overview.avgOverall}%`}
          sub={overview.avgOverall >= 70 ? 'On track 👍' : 'Room to grow'}
          color={`${scoreBg(overview.avgOverall)}`}
        />
        <StatCard
          icon="🏆" label="Best Score"
          value={`${overview.bestScore}%`}
          sub={`Best: ${overview.bestCategory}`}
          color="bg-yellow-50 border-yellow-100"
        />
        <StatCard
          icon="🔥" label="Day Streak"
          value={`${overview.streak} day${overview.streak !== 1 ? 's' : ''}`}
          sub={overview.streak >= 3 ? 'Keep it up!' : 'Stay consistent'}
          color="bg-orange-50 border-orange-100"
        />
      </div>

      {/* ── Score metrics row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Technical',     value: overview.avgTechnical,     icon: '⚙️' },
          { label: 'Communication', value: overview.avgCommunication, icon: '💬' },
          { label: 'Confidence',    value: overview.avgConfidence,    icon: '🎯' },
        ].map(({ label, value, icon }) => (
          <div key={label} className={`rounded-2xl border p-4 ${scoreBg(value)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                {icon} {label}
              </span>
              <span className={`text-sm font-bold ${scoreColor(value)}`}>{value}%</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ${
                  value >= 80 ? 'bg-green-500' : value >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── Score trend + radar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Trend chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-semibold text-slate-800">Score Trend</h2>
            <div className="flex items-center gap-2">
              {/* Metric selector */}
              <div className="flex gap-1">
                {(['overall', 'technical', 'communication', 'confidence'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setTrendMetric(m)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium capitalize transition-colors
                      ${trendMetric === m
                        ? 'text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    style={trendMetric === m ? { backgroundColor: metricColors[m] } : {}}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {/* Chart type toggle */}
              <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5">
                <button
                  onClick={() => setActiveChart('line')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors
                    ${activeChart === 'line' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                >
                  Line
                </button>
                <button
                  onClick={() => setActiveChart('bar')}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors
                    ${activeChart === 'bar' ? 'bg-slate-800 text-white' : 'text-slate-500'}`}
                >
                  Bar
                </button>
              </div>
            </div>
          </div>

          {scoreTrend.length < 2 ? (
            <div className="flex items-center justify-center h-48 text-slate-400 text-sm">
              Complete more interviews to see your trend
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              {activeChart === 'line' ? (
                <LineChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey={trendMetric}
                    stroke={metricColors[trendMetric]}
                    strokeWidth={2.5}
                    dot={{ fill: metricColors[trendMetric], r: 4 }}
                    activeDot={{ r: 6 }}
                    name={trendMetric.charAt(0).toUpperCase() + trendMetric.slice(1)}
                  />
                </LineChart>
              ) : (
                <BarChart data={scoreTrend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="#cbd5e1" />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey={trendMetric}
                    fill={metricColors[trendMetric]}
                    radius={[4, 4, 0, 0]}
                    name={trendMetric.charAt(0).toUpperCase() + trendMetric.slice(1)}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar / skill map */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Skill Map</h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#64748b' }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar
                name="Score"
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Tooltip
  formatter={(v) => [`${Number(v ?? 0)}%`, 'Score']}
/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Category breakdown ───────────────────────────────────────────────── */}
      {catBarData.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-5">Category Performance</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Bar chart */}
            <div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={catBarData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} stroke="#cbd5e1" />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="avg"  name="Avg Score"  fill="#6366f1" radius={[3,3,0,0]} />
                  <Bar dataKey="best" name="Best Score" fill="#22c55e" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Category cards */}
            <div className="space-y-2">
              {categoryStats.map((c: CategoryStat) => (
                <div key={c.category} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
                  <span className="text-xl">{catIcon[c.category] || '🎯'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700 capitalize">
                        {c.category.replace('-', ' ')}
                      </span>
                      <span className={`text-sm font-bold ${scoreColor(c.avgScore)}`}>
                        {c.avgScore}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          c.avgScore >= 80 ? 'bg-green-500'
                          : c.avgScore >= 60 ? 'bg-yellow-500'
                          : 'bg-red-500'
                        }`}
                        style={{ width: `${c.avgScore}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {c.count} session{c.count !== 1 ? 's' : ''} · best {c.bestScore}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Weak areas alert ─────────────────────────────────────────────────── */}
      {overview.weakAreas?.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-800 mb-1">Areas Needing Attention</h3>
              <p className="text-sm text-orange-700 mb-3">
                Your average score is below 60% in these categories. Focus here to improve overall performance.
              </p>
              <div className="flex flex-wrap gap-2">
                {overview.weakAreas.map((area: string) => (
                  <button
                    key={area}
                    onClick={() => navigate(`/interview?category=${area}`)}
                    className="flex items-center gap-1.5 text-sm bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg hover:bg-orange-200 transition-colors font-medium capitalize"
                  >
                    {catIcon[area]} {area.replace('-', ' ')} → Practice
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── History table ────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Interview History</h2>
          <span className="text-xs text-slate-400">Page {historyPage} of {totalPages}</span>
        </div>

        {histLoading ? (
          <div className="p-5 space-y-3">
            {[1,2,3].map((i) => <Skeleton key={i} className="h-14" />)}
          </div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-sm">No history found</div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    {['Interview', 'Category', 'Difficulty', 'Overall', 'Technical', 'Communication', 'Duration', 'Date'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {history.map((row: HistoryRow) => (
                    <tr
                      key={row._id}
                      onClick={() => navigate(`/feedback/${row._id}`)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800 max-w-[200px] truncate">
                        {row.title}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          {catIcon[row.category]} <span className="capitalize">{row.category}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffBadge[row.difficulty]}`}>
                          {row.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`font-bold ${scoreColor(row.overall)}`}>{row.overall}%</span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{row.technical}%</td>
                      <td className="px-4 py-3 text-slate-600">{row.communication}%</td>
                   <td className="px-4 py-3 text-slate-500">
  {fmtTime(row.totalTime ?? 0)}
</td>
                      <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                        {new Date(row.createdAt).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {history.map((row: HistoryRow) => (
                <div
                  key={row._id}
                  onClick={() => navigate(`/feedback/${row._id}`)}
                  className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-sm font-medium text-slate-800 truncate flex-1">{row.title}</p>
                    <span className={`text-sm font-bold flex-shrink-0 ${scoreColor(row.overall)}`}>
                      {row.overall}%
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-slate-500 capitalize flex items-center gap-1">
                      {catIcon[row.category]} {row.category}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffBadge[row.difficulty]}`}>
                      {row.difficulty}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(row.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => loadHistoryPage(historyPage - 1)}
                  disabled={historyPage === 1}
                  className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => loadHistoryPage(p)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                        ${p === historyPage
                          ? 'bg-indigo-600 text-white'
                          : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => loadHistoryPage(historyPage + 1)}
                  disabled={historyPage === totalPages}
                  className="text-sm px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}