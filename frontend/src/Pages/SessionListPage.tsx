import { useEffect, useState } from 'react';
import { useNavigate }          from 'react-router-dom';
import { sessionService }       from '../services/session.service';

interface PopulatedInterview {
  _id: string;
  title: string;
  category: string;
  difficulty: string;
  questionCount: number;
}

interface SessionRow {
  _id:          string;
  interviewId:  PopulatedInterview;
  status:       'in-progress' | 'completed' | 'abandoned';
  totalTime?:   number;
  startTime:    string;
  answers:      { text: string }[];
}

const statusBadge: Record<string, string> = {
  completed:   'bg-green-100 text-green-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  abandoned:   'bg-slate-100 text-slate-500',
};

const diffBadge: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

const catIcon: Record<string, string> = {
  frontend:       '⚛️',
  backend:        '🛠️',
  fullstack:      '🔄',
  'system-design':'🏗️',
  hr:             '🤝',
  dsa:            '💻',
};

const fmtTime = (secs?: number) => {
  if (!secs) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

export default function SessionsListPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState<'all' | 'completed' | 'in-progress'>('all');

  useEffect(() => {
    sessionService.getAll()
      .then((r) => setSessions(r.data.data.sessions || []))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? sessions
    : sessions.filter((s) => s.status === filter);

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">My Sessions</h1>
          <p className="text-slate-500 text-sm mt-1">{sessions.length} total interview sessions</p>
        </div>
        <button
          onClick={() => navigate('/interview')}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          + New Interview
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', 'completed', 'in-progress'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize
              ${filter === f
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {f === 'all' ? `All (${sessions.length})`
            : f === 'completed' ? `Completed (${sessions.filter(s => s.status === 'completed').length})`
            : `In Progress (${sessions.filter(s => s.status === 'in-progress').length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map((i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-slate-700 font-medium">No sessions yet</p>
          <p className="text-slate-400 text-sm mt-1 mb-4">Complete your first interview to see it here</p>
          <button
            onClick={() => navigate('/interview')}
            className="text-indigo-600 text-sm font-medium hover:underline"
          >
            Start an interview →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((session) => {
            const iv       = session.interviewId;
            const answered = session.answers?.filter((a) => a.text?.trim()).length ?? 0;

            return (
              <div
                key={session._id}
                onClick={() =>
                  session.status === 'in-progress'
                    ? navigate(`/session/${iv?._id || session._id}`)
                    : navigate(`/feedback/${session._id}`)
                }
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="text-2xl flex-shrink-0 mt-0.5">
                      {catIcon[iv?.category] || '🎯'}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800 truncate">{iv?.title || 'Interview'}</p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffBadge[iv?.difficulty || 'medium']}`}>
                          {iv?.difficulty}
                        </span>
                        <span className="text-xs text-slate-400 capitalize">{iv?.category}</span>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-400">
                          {new Date(session.startTime).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusBadge[session.status]}`}>
                      {session.status.replace('-', ' ')}
                    </span>
                    <div className="text-xs text-slate-400 text-right space-y-0.5">
                      <p>{answered}/{iv?.questionCount ?? '?'} answered</p>
                      <p>⏱ {fmtTime(session.totalTime)}</p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                {iv?.questionCount && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${session.status === 'completed' ? 'bg-green-400' : 'bg-indigo-400'}`}
                        style={{ width: `${(answered / iv.questionCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}