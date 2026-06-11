import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate }                    from 'react-router-dom';
import { sessionService }                             from '../services/session.service';
import { interviewService }                           from '../services/interview.service';
import { useTimer }                                   from '../hooks/useTimer';
import { useAutoSave}                    from '../hooks/useAutoSave';
import type { SaveStatus }                   from '../hooks/useAutoSave';
import type { Interview, Question }                   from '../types/interview.types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnswerState {
  text:      string;
  timeSpent: number;
}
type AnswerMap = Record<string, AnswerState>;

// ── Helpers ───────────────────────────────────────────────────────────────────

const wordCount = (t: string) =>
  t.trim().split(/\s+/).filter(Boolean).length;

const fmtTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
};

const diffBadge: Record<string, string> = {
  easy:   'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard:   'bg-red-100 text-red-700',
};

// ── SaveStatus badge ──────────────────────────────────────────────────────────

function SaveBadge({ status }: { status: SaveStatus }) {
  if (status === 'idle')   return null;
  if (status === 'saving') return (
    <span className="flex items-center gap-1 text-xs text-slate-400">
      <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-500 rounded-full animate-spin" />
      Saving…
    </span>
  );
  if (status === 'saved')  return (
    <span className="flex items-center gap-1 text-xs text-green-500">✓ Saved</span>
  );
  return (
    <span className="flex items-center gap-1 text-xs text-red-500">⚠ Save failed</span>
  );
}

// ── Timer ring ────────────────────────────────────────────────────────────────

function TimerRing({ pct, display, urgent, expired }: {
  pct: number; display: string; urgent: boolean; expired: boolean;
}) {
  const r    = 28;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const col  = expired ? '#ef4444' : urgent ? '#f97316' : '#6366f1';

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4" />
        <circle
          cx="32" cy="32" r={r}
          fill="none" stroke={col} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-sm font-bold tabular-nums leading-none
          ${expired ? 'text-red-500' : urgent ? 'text-orange-500' : 'text-slate-700'}`}>
          {display}
        </span>
      </div>
    </div>
  );
}

// ── Progress bar ──────────────────────────────────────────────────────────────

function ProgressBar({ current, total, answers }: {
  current: number; total: number; answers: AnswerMap;
}) {
  const answered = Object.values(answers).filter((a) => a.text.trim()).length;
  const pct      = total > 0 ? Math.round((answered / total) * 100) : 0;

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-3">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium text-slate-700">
            Question {current + 1} <span className="text-slate-400">of {total}</span>
          </span>
          <span>{answered}/{total} answered ({pct}%)</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: total }).map((_, i) => {
            const qId = `q${i + 1}`;
            const ok  = answers[qId]?.text?.trim();
            return (
              <div
                key={i}
                className={`flex-1 h-1.5 rounded-full transition-all duration-300
                  ${i === current ? 'bg-indigo-600'
                  : ok            ? 'bg-green-400'
                                  : 'bg-slate-200'}`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Key points hint ───────────────────────────────────────────────────────────

function KeyPointsHint({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  if (!question.expectedKeyPoints?.length) return null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors"
      >
        <span className="flex items-center gap-2 font-medium text-slate-700">
          💡 Key points hint
          <span className="text-xs font-normal text-slate-400">({question.expectedKeyPoints.length} points)</span>
        </span>
        <span className="text-slate-400 text-xs">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <p className="text-xs text-slate-400 mt-3 mb-2">A strong answer covers:</p>
          <ul className="space-y-2">
            {question.expectedKeyPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="text-indigo-400 mt-0.5 flex-shrink-0">•</span>
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Confirm submit modal ──────────────────────────────────────────────────────

function ConfirmModal({
  answered, total, elapsed, onConfirm, onCancel, loading,
}: {
  answered: number; total: number; elapsed: number;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  const unanswered = total - answered;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
        <div className="text-center mb-5">
          <div className="text-5xl mb-3">🏁</div>
          <h2 className="text-lg font-semibold text-slate-800">Submit Interview?</h2>
          <p className="text-sm text-slate-500 mt-1">You won't be able to change answers after submitting.</p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 mb-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Answered</span>
            <span className="font-semibold text-green-600">{answered}/{total}</span>
          </div>
          {unanswered > 0 && (
            <div className="flex justify-between">
              <span className="text-slate-500">Unanswered</span>
              <span className="font-semibold text-orange-500">{unanswered}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-slate-500">Time spent</span>
            <span className="font-semibold text-slate-700">{fmtTime(elapsed)}</span>
          </div>
        </div>

        {unanswered > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2.5 text-xs text-orange-700 mb-4">
            ⚠️ {unanswered} question{unanswered > 1 ? 's are' : ' is'} still blank — you can still submit.
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50 transition-colors"
          >
            Keep going
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
              : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SessionPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate         = useNavigate();

  const [interview,    setInterview]    = useState<Interview | null>(null);
  const [sessionId,    setSessionId]    = useState('');
  const [currentIdx,   setCurrentIdx]   = useState(0);
  const [answers,      setAnswers]      = useState<AnswerMap>({});
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [pageError,    setPageError]    = useState('');
  const [submitError,  setSubmitError]  = useState('');

  const sessionStartRef  = useRef(Date.now());
  const questionStartRef = useRef(Date.now());

  const question = interview?.questions[currentIdx];

  // ── Timer ──────────────────────────────────────────────────────────────────

  const handleExpire = useCallback(() => {
    if (!interview) return;
    if (currentIdx < interview.questions.length - 1) {
      setTimeout(() => setCurrentIdx((i) => i + 1), 1000);
    }
  }, [currentIdx, interview]);

  const timer = useTimer({
    initialSeconds: question?.timeLimit ?? 180,
    onExpire:       handleExpire,
    autoStart:      true,
  });

  useEffect(() => {
    timer.reset(question?.timeLimit ?? 180);
    questionStartRef.current = Date.now();
  }, [currentIdx]);

  // ── Load interview + start session ────────────────────────────────────────

  useEffect(() => {
    if (!interviewId) return;

    (async () => {
      try {
        setLoading(true);
        const [iRes, sRes] = await Promise.all([
          interviewService.getById(interviewId),
          sessionService.start(interviewId),
        ]);

        const iv   = iRes.data.data.interview as Interview;
        const sess = sRes.data.data.session;

        setInterview(iv);
        setSessionId(sess._id);
        setCurrentIdx(sess.currentQuestionIndex || 0);

        // Seed answers — restore any already saved
        const initial: AnswerMap = {};
        iv.questions.forEach((q) => { initial[q.id] = { text: '', timeSpent: 0 }; });

        if (sess.answers?.length) {
          sess.answers.forEach((a: { questionId: string; text: string; timeSpent: number }) => {
            if (a.questionId in initial) {
              initial[a.questionId] = { text: a.text || '', timeSpent: a.timeSpent || 0 };
            }
          });
        }

        setAnswers(initial);
      } catch (err: any) {
        setPageError(err.response?.data?.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    })();
  }, [interviewId]);

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const currentText = answers[question?.id ?? '']?.text ?? '';

  const { save: triggerSave, status: saveStatus } = useAutoSave({
    sessionId,
    questionId:           question?.id ?? '',
    text:                 currentText,
    timeSpent:            Math.floor((Date.now() - questionStartRef.current) / 1000),
    currentQuestionIndex: currentIdx,
    enabled:              !!sessionId && !!question,
    intervalMs:           15000,
  });

  // ── Answer change ──────────────────────────────────────────────────────────

  const handleAnswerChange = (text: string) => {
    if (!question) return;
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], text },
    }));
  };

  // ── Navigation ─────────────────────────────────────────────────────────────

  const goTo = async (newIdx: number) => {
    if (!question || !sessionId || !interview) return;
    if (newIdx < 0 || newIdx >= interview.questions.length) return;

    const spent = Math.floor((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => ({
      ...prev,
      [question.id]: { ...prev[question.id], timeSpent: spent },
    }));

    await triggerSave(true);
    setCurrentIdx(newIdx);
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!sessionId || !interview) return;
    setSubmitting(true);
    setSubmitError('');

    try {
      // Flush current question's time
      const spent = Math.floor((Date.now() - questionStartRef.current) / 1000);
      const finalAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        text:       val.text,
        timeSpent:  qId === question?.id ? spent : val.timeSpent,
      }));

      const totalTime = Math.floor((Date.now() - sessionStartRef.current) / 1000);

      await sessionService.complete(sessionId, { answers: finalAnswers, totalTime });
      navigate(`/feedback/${sessionId}`);
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Submission failed — try again');
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-slate-500 text-sm">Loading your interview…</p>
    </div>
  );

  if (pageError || !interview || !question) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 bg-slate-50">
      <div className="text-5xl">😕</div>
      <p className="text-slate-700 font-medium">{pageError || 'Interview not found'}</p>
      <button onClick={() => navigate('/interview')} className="text-indigo-600 text-sm hover:underline">
        ← Back to interviews
      </button>
    </div>
  );

  const answeredCount = Object.values(answers).filter((a) => a.text.trim()).length;
  const isLast        = currentIdx === interview.questions.length - 1;
  const elapsed       = Math.floor((Date.now() - sessionStartRef.current) / 1000);
  const chars         = currentText.length;
  const words         = wordCount(currentText);

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-slate-800 truncate">{interview.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffBadge[interview.difficulty]}`}>
                {interview.difficulty}
              </span>
              <span className="text-xs text-slate-400 capitalize">{interview.category}</span>
              <span className="text-xs text-slate-300">•</span>
              <SaveBadge status={saveStatus} />
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="flex-shrink-0 bg-indigo-600 text-white text-sm px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Submit
          </button>
        </div>
      </header>

      {/* ── Progress bar ────────────────────────────────────────────────────── */}
      <ProgressBar current={currentIdx} total={interview.questions.length} answers={answers} />

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-5 space-y-4">

          {/* Timer + question */}
          <div className="flex items-start gap-4">
            <TimerRing
              pct={timer.pct}
              display={timer.display}
              urgent={timer.urgent}
              expired={timer.expired}
            />
            <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                  Q{currentIdx + 1}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${diffBadge[question.difficulty]}`}>
                  {question.difficulty}
                </span>
              </div>
              <p className="text-base font-medium text-slate-800 leading-relaxed">{question.text}</p>
            </div>
          </div>

          {/* Timer expired alert */}
          {timer.expired && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <p className="text-sm font-medium text-orange-800">Time's up for this question</p>
                <p className="text-xs text-orange-600 mt-0.5">You can still answer — time tracking has stopped.</p>
              </div>
            </div>
          )}

          {/* Answer input */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Your Answer</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${chars > 800 ? 'text-orange-500' : 'text-slate-400'}`}>
                  {words} words · {chars} chars
                </span>
                <SaveBadge status={saveStatus} />
              </div>
            </div>

            {/* Textarea */}
            <textarea
              value={currentText}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder={`Write your answer here…\n\nTips:\n• Be specific — use real examples\n• Structure your answer clearly\n• Cover the key concepts`}
              className="w-full px-4 py-4 text-sm text-slate-800 placeholder-slate-300 resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: '220px' }}
            />

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span>Auto-saves every 15s</span>
                {currentText.trim() && (
                  <span className="flex items-center gap-1 text-green-500">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                    Answer recorded
                  </span>
                )}
              </div>
              <button
                onClick={() => triggerSave(true)}
                className="text-xs text-indigo-500 hover:text-indigo-700 font-medium transition-colors"
              >
                Save now
              </button>
            </div>
          </div>

          {/* Key points */}
          <KeyPointsHint question={question} />

          {/* Submit error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              {submitError}
            </div>
          )}

        </div>
      </main>

      {/* ── Bottom navigation ────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-200 px-4 py-3 flex-shrink-0">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">

          {/* Prev */}
          <button
            onClick={() => goTo(currentIdx - 1)}
            disabled={currentIdx === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            ← Prev
          </button>

          {/* Question dot nav */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center flex-1">
            {interview.questions.map((q, i) => {
              const ok = answers[q.id]?.text?.trim();
              return (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  title={`Question ${i + 1}${ok ? ' (answered)' : ''}`}
                  className={`w-7 h-7 rounded-full text-xs font-semibold transition-all
                    ${i === currentIdx
                      ? 'bg-indigo-600 text-white scale-110 shadow-sm'
                      : ok
                        ? 'bg-green-400 text-white hover:bg-green-500'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          {/* Next / Submit */}
          {isLast ? (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Submit 🏁
            </button>
          ) : (
            <button
              onClick={() => goTo(currentIdx + 1)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all"
            >
              Next →
            </button>
          )}
        </div>
      </footer>

      {/* ── Confirm modal ────────────────────────────────────────────────────── */}
      {showConfirm && (
        <ConfirmModal
          answered={answeredCount}
          total={interview.questions.length}
          elapsed={elapsed}
          onConfirm={handleSubmit}
          onCancel={() => setShowConfirm(false)}
          loading={submitting}
        />
      )}
    </div>
  );
}