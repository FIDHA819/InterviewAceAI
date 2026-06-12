import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackService }         from '../services/feedback.service';
import type { Feedback, QuestionFeedback } from '../types/feedback.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-600' :
  s >= 60 ? 'text-yellow-600' :
            'text-red-500';

const scoreBg = (s: number) =>
  s >= 80 ? 'bg-green-50 border-green-200' :
  s >= 60 ? 'bg-yellow-50 border-yellow-200' :
            'bg-red-50 border-red-200';

const scoreLabel = (s: number) =>
  s >= 85 ? 'Excellent' :
  s >= 70 ? 'Good'      :
  s >= 55 ? 'Average'   :
  s >= 40 ? 'Below Average' :
            'Needs Work';

const scoreBarColor = (s: number) =>
  s >= 80 ? 'bg-green-500' :
  s >= 60 ? 'bg-yellow-500' :
            'bg-red-500';

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const r    = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const col  = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r}
          fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold leading-none ${size >= 80 ? 'text-xl' : 'text-base'} ${scoreColor(score)}`}>
          {score}
        </span>
        <span className="text-slate-400 text-xs mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

// ─── Metric bar ───────────────────────────────────────────────────────────────

function MetricBar({
  label, score, icon,
}: { label: string; score: number; icon: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 300);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <span>{icon}</span> {label}
        </span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${scoreBg(score)}`}>
            {scoreLabel(score)}
          </span>
        </div>
      </div>
      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${scoreBarColor(score)}`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

// ─── Question accordion ───────────────────────────────────────────────────────

function QuestionAccordion({
  qf, index,
}: { qf: QuestionFeedback; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all ${scoreBg(qf.score)}`}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:opacity-90 transition-opacity"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
            ${qf.score >= 80 ? 'bg-green-200 text-green-800'
            : qf.score >= 60 ? 'bg-yellow-200 text-yellow-800'
                              : 'bg-red-200 text-red-800'}`}>
            {index + 1}
          </div>
          <p className="text-sm font-medium text-slate-800 truncate">{qf.questionText}</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-3">
          <span className={`text-sm font-bold ${scoreColor(qf.score)}`}>{qf.score}/100</span>
          <span className="text-slate-400 text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>

      {/* Body */}
      {open && (
        <div className="bg-white border-t border-slate-200 px-5 py-4 space-y-4">

          {/* Feedback */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">AI Feedback</p>
            <p className="text-sm text-slate-700 leading-relaxed">{qf.feedback}</p>
          </div>

          {/* Answer */}
          {qf.answerText && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Your Answer</p>
              <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 leading-relaxed max-h-40 overflow-y-auto">
                {qf.answerText}
              </div>
            </div>
          )}

          {!qf.answerText && (
            <div className="bg-red-50 rounded-xl p-3 text-sm text-red-500 italic">
              No answer provided
            </div>
          )}

          {/* Points */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {qf.keyPointsCovered?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                  ✓ Covered
                </p>
                <ul className="space-y-1">
                  {qf.keyPointsCovered.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-green-500 mt-0.5 flex-shrink-0">•</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {qf.keyPointsMissed?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-red-600 mb-1.5 flex items-center gap-1">
                  ✗ Missed
                </p>
                <ul className="space-y-1">
                  {qf.keyPointsMissed.map((pt, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <span className="text-red-400 mt-0.5 flex-shrink-0">•</span>
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Generating screen ────────────────────────────────────────────────────────

function GeneratingScreen({ dots }: { dots: string }) {
  const steps = [
    { label: 'Reading your answers',       delay: 0    },
    { label: 'Evaluating technical depth', delay: 1500 },
    { label: 'Scoring communication',      delay: 3000 },
    { label: 'Writing improvement tips',   delay: 4500 },
  ];
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timers = steps.map((s, i) =>
      setTimeout(() => setActiveStep(i), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-3xl">🤖</div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Analysing your interview{dots}
        </h2>
        <p className="text-slate-500 text-sm">Claude AI is reviewing every answer</p>
      </div>
      <div className="space-y-3 w-72">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
              ${i < activeStep  ? 'bg-green-500'
              : i === activeStep ? 'bg-indigo-600 animate-pulse'
                                 : 'bg-slate-200'}`}>
              {i < activeStep
                ? <span className="text-white text-xs">✓</span>
                : i === activeStep
                  ? <span className="w-2 h-2 rounded-full bg-white" />
                  : null}
            </div>
            <span className={`text-sm transition-colors ${
              i <= activeStep ? 'text-slate-700' : 'text-slate-400'
            }`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FeedbackPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate       = useNavigate();

  const [feedback,    setFeedback]    = useState<Feedback | null>(null);
  const [generating,  setGenerating]  = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [dots,        setDots]        = useState('');
  const [activeTab,   setActiveTab]   = useState<'overview' | 'questions'>('overview');

  // Animated dots
  useEffect(() => {
    if (!generating) return;
    const id = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, [generating]);

  useEffect(() => {
    if (!sessionId) return;

    (async () => {
      try {
        // Try to fetch existing feedback first
        const existing = await feedbackService.getBySession(sessionId).catch(() => null);

        if (existing?.data?.data?.feedback) {
          setFeedback(existing.data.data.feedback);
          setLoading(false);
          return;
        }

        // Generate new feedback
        setGenerating(true);
        setLoading(false);

        const res = await feedbackService.generate(sessionId);
        setFeedback(res.data.data.feedback);
        setGenerating(false);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { message?: string } } };
        setError(error.response?.data?.message || 'Failed to generate feedback');
        setGenerating(false);
        setLoading(false);
      }
    })();
  }, [sessionId]);

  // ── States ────────────────────────────────────────────────────────────────

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  if (generating) return <GeneratingScreen dots={dots} />;

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
      <div className="text-5xl">😕</div>
      <p className="text-slate-700 font-medium">{error}</p>
      <div className="flex gap-3">
        <button
          onClick={() => { setError(''); setGenerating(true); setLoading(false); feedbackService.generate(sessionId!).then((r) => { setFeedback(r.data.data.feedback); setGenerating(false); }).catch((e) => { setError(e.response?.data?.message || 'Failed'); setGenerating(false); }); }}
          className="text-white bg-indigo-600 px-4 py-2 rounded-lg text-sm hover:bg-indigo-700"
        >
          Retry
        </button>
        <button onClick={() => navigate('/sessions')} className="text-slate-500 text-sm hover:underline">
          Back to sessions
        </button>
      </div>
    </div>
  );

  if (!feedback) return null;

  const { scores, summary, strengths, weaknesses, suggestions, questionFeedback } = feedback;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Interview Feedback</h1>
          <p className="text-slate-500 text-sm mt-1">
            Generated {new Date(feedback.generatedAt).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'long', year: 'numeric',
            })}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/interview')}
            className="text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            New Interview
          </button>
          <button
            onClick={() => navigate('/sessions')}
            className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            All Sessions
          </button>
        </div>
      </div>

      {/* ── Overall score card ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center gap-6">
          <ScoreRing score={scores.overall} size={100} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-lg font-bold ${scoreColor(scores.overall)}`}>
                {scoreLabel(scores.overall)}
              </span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed">{summary}</p>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['overview', 'questions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'overview' ? 'Overview' : `Questions (${questionFeedback.length})`}
          </button>
        ))}
      </div>

      {/* ── Overview tab ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Score breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
            <h2 className="font-semibold text-slate-800">Score Breakdown</h2>
            <MetricBar label="Technical"     score={scores.technical}     icon="⚙️" />
            <MetricBar label="Communication" score={scores.communication} icon="💬" />
            <MetricBar label="Confidence"    score={scores.confidence}    icon="🎯" />
          </div>

          {/* Score cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Technical',     score: scores.technical,     icon: '⚙️' },
              { label: 'Communication', score: scores.communication, icon: '💬' },
              { label: 'Confidence',    score: scores.confidence,    icon: '🎯' },
            ].map(({ label, score, icon }) => (
              <div key={label} className={`border rounded-2xl p-4 text-center ${scoreBg(score)}`}>
                <div className="text-2xl mb-2">{icon}</div>
                <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
                <div className="text-xs text-slate-500 mt-0.5">{label}</div>
                <div className={`text-xs font-medium mt-1 ${scoreColor(score)}`}>
                  {scoreLabel(score)}
                </div>
              </div>
            ))}
          </div>

          {/* Strengths & weaknesses */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <span className="text-green-500">✓</span> Strengths
              </h3>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                <span className="text-red-500">✗</span> Areas to Improve
              </h3>
              <ul className="space-y-2">
                {weaknesses.map((w, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600">
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">
                      {i + 1}
                    </span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Suggestions */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
              <span className="text-2xl">💡</span> Improvement Suggestions
            </h3>
            <div className="space-y-3">
              {suggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                  <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-semibold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Question score summary */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 mb-4">Per-Question Scores</h3>
            <div className="space-y-2">
              {questionFeedback.map((qf, i) => (
                <div
                  key={qf.questionId}
                  onClick={() => setActiveTab('questions')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                >
                  <span className="text-xs font-medium text-slate-400 w-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <p className="text-sm text-slate-700 flex-1 truncate group-hover:text-indigo-600 transition-colors">
                    {qf.questionText}
                  </p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${scoreBarColor(qf.score)}`}
                        style={{ width: `${qf.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold w-10 text-right ${scoreColor(qf.score)}`}>
                      {qf.score}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Questions tab ────────────────────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Click any question to see your answer, AI feedback, and missed key points.
          </p>
          {questionFeedback.map((qf, i) => (
            <QuestionAccordion key={qf.questionId} qf={qf} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}