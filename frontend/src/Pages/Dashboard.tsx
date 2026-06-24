import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authstore';
import api from '../services/api';
import type { UserStats, RecentSession } from '../types/dashboard.types';

const categoryColors: Record<string, string> = {
  frontend:      'bg-blue-100 text-blue-700',
  backend:       'bg-green-100 text-green-700',
  fullstack:     'bg-purple-100 text-purple-700',
  hr:            'bg-yellow-100 text-yellow-700',
  'system-design': 'bg-red-100 text-red-700',
};

const scoreColor = (score: number) => {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-500';
};

const defaultStats: UserStats = {
  totalInterviews: 0,
  averageScore: 0,
  streak: 0,
  bestCategory: '—',
  recentSessions: [],
};

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users/stats')
      .then((res) => setStats(res.data.data || defaultStats))
      .catch(() => setStats(defaultStats))
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Interviews', value: stats.totalInterviews, icon: '🎯', color: 'bg-blue-50 border-blue-100',   text: 'text-blue-700'   },
    { label: 'Average Score',    value: `${stats.averageScore}%`, icon: '📈', color: 'bg-green-50 border-green-100', text: 'text-green-700' },
    { label: 'Day Streak',       value: `${stats.streak} 🔥`,     icon: '⚡', color: 'bg-orange-50 border-orange-100', text: 'text-orange-700' },
    { label: 'Best Category',    value: stats.bestCategory,       icon: '🏆', color: 'bg-purple-50 border-purple-100', text: 'text-purple-700' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">

      {/* Welcome banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome back, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-indigo-200 text-sm mb-4">
          Ready to sharpen your interview skills today?
        </p>
        <button
          onClick={() => navigate('/interview')}
          className="bg-white text-indigo-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors"
        >
          Start New Interview →
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon, color, text }) => (
          <div
            key={label}
            className={`${color} border rounded-xl p-4 flex flex-col gap-2`}
          >
            <div className="text-2xl">{icon}</div>
            <div className={`text-2xl font-bold ${text}`}>{loading ? '—' : value}</div>
            <div className="text-xs text-slate-500 font-medium">{label}</div>
          </div>
        ))}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Recent sessions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">Recent Sessions</h2>
            <button
              onClick={() => navigate('/sessions')}
              className="text-xs text-indigo-600 hover:underline"
            >
              View all
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stats.recentSessions.length === 0 ? (
            <div className="text-center py-10">
              <div className="text-4xl mb-3">🎯</div>
              <p className="text-slate-500 text-sm">No interviews yet</p>
              <button
                onClick={() => navigate('/interview')}
                className="mt-3 text-sm text-indigo-600 font-medium hover:underline"
              >
                Start your first one →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {stats.recentSessions.map((s: RecentSession) => (
                <div
                  key={s._id}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                  onClick={() => navigate(`/sessions/${s._id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${categoryColors[s.category] || 'bg-slate-100 text-slate-600'}`}>
                      {s.category}
                    </span>
                    <span className="text-sm text-slate-700 font-medium">{s.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-semibold ${scoreColor(s.score)}`}>
                      {s.score}%
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(s.date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Quick Start</h2>
          <div className="space-y-2">
            {[
              { label: 'Frontend Interview',  emoji: '⚛️',  cat: 'frontend'      },
              { label: 'Backend Interview',   emoji: '🛠️',  cat: 'backend'       },
              { label: 'System Design',       emoji: '🏗️',  cat: 'system-design' },
              { label: 'HR Interview',        emoji: '🤝',  cat: 'hr'            },
              
            ].map(({ label, emoji, cat }) => (
              <button
                key={cat}
                onClick={() => navigate(`/interview?category=${cat}`)}
                className="w-full flex items-center gap-3 p-3 rounded-lg text-sm text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors text-left border border-transparent hover:border-indigo-100"
              >
                <span className="text-lg">{emoji}</span>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}