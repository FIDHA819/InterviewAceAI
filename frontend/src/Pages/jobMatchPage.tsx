import { useState, useEffect } from 'react';
import { jobMatchService }      from '../services/jobMatch.service';
import type { JobMatch, Audit, Rewrite } from '../types/jobMatch.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 75 ? 'text-green-600' : s >= 55 ? 'text-yellow-600' : 'text-red-500';

const scoreBg = (s: number) =>
  s >= 75 ? 'bg-green-50 border-green-200'
: s >= 55 ? 'bg-yellow-50 border-yellow-200'
           : 'bg-red-50 border-red-200';

const scoreBarColor = (s: number) =>
  s >= 75 ? 'bg-green-500' : s >= 55 ? 'bg-yellow-500' : 'bg-red-500';

const scoreLabel = (s: number) =>
  s >= 85 ? 'Excellent Match' :
  s >= 75 ? 'Strong Match'    :
  s >= 60 ? 'Moderate Match'  :
  s >= 45 ? 'Weak Match'      :
            'Poor Match';

// ─── Tag component ────────────────────────────────────────────────────────────

function Tag({ label, variant }: {
  label: string;
  variant: 'missing' | 'danger' | 'generic' | 'strong' | 'keyword';
}) {
  const styles = {
    missing: 'bg-orange-50 text-orange-700 border-orange-200',
    danger:  'bg-red-50    text-red-700    border-red-200',
    generic: 'bg-slate-100 text-slate-600  border-slate-200',
    strong:  'bg-green-50  text-green-700  border-green-200',
    keyword: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  };

  return (
    <span className={`inline-flex text-xs px-2.5 py-1 rounded-full border font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function MatchRing({ score }: { score: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 300);
    return () => clearTimeout(t);
  }, [score]);

  const r    = 52;
  const circ = 2 * Math.PI * r;
  const dash = (animated / 100) * circ;
  const col  = score >= 75 ? '#22c55e' : score >= 55 ? '#eab308' : '#ef4444';

  return (
    <div className="relative w-36 h-36 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="60" cy="60" r={r}
          fill="none" stroke={col} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.5s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${scoreColor(score)}`}>{score}</span>
        <span className="text-slate-400 text-xs">/ 100</span>
        <span className={`text-xs font-semibold mt-0.5 ${scoreColor(score)}`}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handle = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handle}
      className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
    >
      {copied ? '✓ Copied' : '⎘ Copy'}
    </button>
  );
}

// ─── Step loading screen ──────────────────────────────────────────────────────

function StepLoader({
  steps, currentStep, title, subtitle,
}: {
  steps: string[]; currentStep: number; title: string; subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div className="relative">
        <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
      </div>
      <div className="text-center">
        <h2 className="text-xl font-semibold text-slate-800 mb-1">{title}</h2>
        <p className="text-slate-500 text-sm">{subtitle}</p>
      </div>
      <div className="space-y-3 w-80">
        {steps.map((step, i) => (
          <div key={step} className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-500
              ${i < currentStep  ? 'bg-green-500'
              : i === currentStep ? 'bg-indigo-600 animate-pulse'
                                  : 'bg-slate-200'}`}>
              {i < currentStep
                ? <span className="text-white text-xs">✓</span>
                : i === currentStep
                  ? <span className="w-2 h-2 rounded-full bg-white" />
                  : null}
            </div>
            <span className={`text-sm ${i <= currentStep ? 'text-slate-700' : 'text-slate-400'}`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Job input form ───────────────────────────────────────────────────────────

function JobInputForm({
  onSubmit, loading,
}: {
  onSubmit: (data: {
    jobTitle: string; companyName: string;
    jobDescription: string; jobUrl: string;
  }) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    jobTitle:       '',
    companyName:    '',
    jobDescription: '',
    jobUrl:         '',
  });

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const valid = form.jobTitle && form.companyName && form.jobDescription.length >= 50;

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-xl font-semibold text-slate-800">Paste a Job Opening</h2>
        <p className="text-slate-500 text-sm mt-1">
          Claude acts as a senior recruiter at that company and audits your resume against the role
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Job Title *</label>
            <input
              value={form.jobTitle}
              onChange={(e) => set('jobTitle', e.target.value)}
              placeholder="e.g. Senior Frontend Engineer"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Company Name *</label>
            <input
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="e.g. Google"
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Job URL (optional)</label>
          <input
            value={form.jobUrl}
            onChange={(e) => set('jobUrl', e.target.value)}
            placeholder="https://careers.google.com/..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Job Description * <span className="text-slate-400 font-normal">(paste the full JD)</span>
          </label>
          <textarea
            value={form.jobDescription}
            onChange={(e) => set('jobDescription', e.target.value)}
            placeholder="Paste the complete job description here — the more detail, the better the analysis..."
            rows={8}
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none leading-relaxed"
          />
          <p className={`text-xs mt-1 ${form.jobDescription.length < 50 && form.jobDescription.length > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            {form.jobDescription.length} characters {form.jobDescription.length < 50 ? '— paste at least 50 characters' : '✓'}
          </p>
        </div>

        <button
          onClick={() => onSubmit(form)}
          disabled={!valid || loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          🔍 Analyse My Resume Against This Role
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: '🔍', label: 'Match Score',       sub: 'Honest ATS rating'      },
          { icon: '⚠️', label: 'Red Flags',          sub: '3 instant deal-breakers'},
          { icon: '✍️', label: 'AI Rewrite',         sub: 'Tailored to this role'  },
        ].map(({ icon, label, sub }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-3">
            <div className="text-xl mb-1">{icon}</div>
            <p className="text-xs font-semibold text-slate-700">{label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Audit results ────────────────────────────────────────────────────────────

function AuditResults({
  jobMatch,
  onRewrite,
  rewriting,
}: {
  jobMatch: JobMatch;
  onRewrite: () => void;
  rewriting: boolean;
}) {
  const { audit } = jobMatch;

  return (
    <div className="space-y-5">

      {/* Hero score */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <MatchRing score={audit.matchScore} />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-white font-semibold text-lg">{jobMatch.jobTitle}</span>
              <span className="text-slate-400 text-sm">at</span>
              <span className="text-indigo-300 font-semibold">{jobMatch.companyName}</span>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {audit.comparisonInsight}
            </p>
           {jobMatch.jobUrl && (
  <a
    href={jobMatch.jobUrl}
    target="_blank"
    rel="noreferrer"
    className="text-xs text-indigo-400 hover:text-indigo-300 underline"
  >
    View Job Posting →
  </a>
)}
            
          </div>
        </div>
      </div>

      {/* Score bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">Resume Match Score</span>
          <span className={`text-sm font-bold ${scoreColor(audit.matchScore)}`}>
            {audit.matchScore}% — {scoreLabel(audit.matchScore)}
          </span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(audit.matchScore)}`}
            style={{ width: `${audit.matchScore}%` }}
          />
        </div>
      </div>

      {/* 3 red flags */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
        <h3 className="font-semibold text-red-800 flex items-center gap-2 mb-3">
          🚨 3 Red Flags a Hiring Manager Notices in 10 Seconds
        </h3>
        <div className="space-y-3">
          {audit.redFlags.map((flag, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-red-200 text-red-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-red-700 leading-relaxed">{flag}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Missing keywords */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
          🔑 Missing ATS Keywords, Skills & Phrases
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          These terms appear in the job description but not your resume
        </p>
        <div className="flex flex-wrap gap-2">
          {audit.missingKeywords.map((kw) => (
            <Tag key={kw} label={kw} variant="missing" />
          ))}
        </div>
      </div>

      {/* Strong + weak sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <span className="text-green-500">✓</span> Strong Sections
          </h3>
          <div className="space-y-3">
            {audit.strongSections.map((s, i) => (
              <div key={i} className="p-3 bg-green-50 rounded-xl border border-green-100">
                <p className="text-xs font-semibold text-green-700">{s.section}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
            <span className="text-red-500">✗</span> Weak Sections
          </h3>
          <div className="space-y-3">
            {audit.weakSections.map((s, i) => (
              <div key={i} className="p-3 bg-red-50 rounded-xl border border-red-100">
                <p className="text-xs font-semibold text-red-700">{s.section}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{s.reason}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Generic issues */}
      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
        <h3 className="font-semibold text-orange-800 flex items-center gap-2 mb-3">
          ⚠️ What Makes You Look Underqualified, Unclear or Generic
        </h3>
        <div className="space-y-2">
          {audit.genericIssues.map((issue, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className="text-orange-400 mt-0.5 flex-shrink-0">•</span>
              <p className="text-sm text-orange-800 leading-relaxed">{issue}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      {!jobMatch.rewrite && (
        <div className="bg-indigo-600 rounded-2xl p-6 text-center">
          <h3 className="text-white font-semibold text-lg mb-1">
            Now fix every problem above
          </h3>
          <p className="text-indigo-200 text-sm mb-4">
            Claude will rewrite your entire resume tailored to this exact role, then explain the 5 biggest improvements.
          </p>
          <button
            onClick={onRewrite}
            disabled={rewriting}
            className="bg-white text-indigo-600 px-8 py-3 rounded-xl text-sm font-bold hover:bg-indigo-50 disabled:opacity-50 transition-colors"
          >
            {rewriting ? 'Rewriting...' : '✍️ Rewrite My Resume for This Role'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Rewrite results ──────────────────────────────────────────────────────────

function RewriteResults({
  jobMatch,
  onCoverLetter,
  coverLetterLoading,
}: {
  jobMatch: JobMatch;
  onCoverLetter: () => void;
  coverLetterLoading: boolean;
}) {
  const { rewrite } = jobMatch;
  const [tab, setTab] = useState<'resume' | 'improvements' | 'cover' | 'email'>('improvements');

  if (!rewrite) return null;

  const emailLines    = jobMatch.applicationEmail?.split('\n') || [];
  const emailSubject  = emailLines[0] || '';
  const emailBody     = emailLines.slice(2).join('\n') || '';

  return (
    <div className="space-y-5">

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl flex-wrap">
        {[
          { id: 'improvements', label: '5 Key Improvements'  },
          { id: 'resume',       label: 'Rewritten Resume'     },
          { id: 'cover',        label: 'Cover Letter'         },
          { id: 'email',        label: 'Application Email'    },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id as typeof tab)}
            className={`px-4 py-2 rounded-lg text-xs font-medium transition-all
              ${tab === id
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {label}
            {(id === 'cover' || id === 'email') && !jobMatch.coverLetter && (
              <span className="ml-1 text-xs text-slate-400">🔒</span>
            )}
          </button>
        ))}
      </div>

      {/* Improvements */}
      {tab === 'improvements' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            The 5 most impactful changes made to your resume for this role.
          </p>
          {rewrite.improvements.map((imp, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-1">{imp.title}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{imp.explanation}</p>
              </div>
            </div>
          ))}

          {/* CTA to cover letter */}
          {!jobMatch.coverLetter && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Resume is ready — now write the cover letter
                </p>
                <p className="text-xs text-green-600 mt-0.5">
                  Get a personalised cover letter + application email for this role
                </p>
              </div>
              <button
                onClick={onCoverLetter}
                disabled={coverLetterLoading}
                className="flex-shrink-0 bg-green-600 text-white text-sm px-5 py-2.5 rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors font-semibold"
              >
                {coverLetterLoading ? 'Writing...' : '✉️ Generate'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Rewritten resume */}
      {tab === 'resume' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Rewritten for {jobMatch.jobTitle} at {jobMatch.companyName}
            </span>
            <CopyButton text={rewrite.rewrittenResume} />
          </div>
          <pre className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans overflow-x-auto max-h-[70vh] overflow-y-auto">
            {rewrite.rewrittenResume}
          </pre>
        </div>
      )}

      {/* Cover letter */}
      {tab === 'cover' && (
        <>
          {!jobMatch.coverLetter ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-3">✉️</div>
              <p className="text-slate-700 font-medium mb-1">Cover letter not generated yet</p>
              <p className="text-slate-400 text-sm mb-4">Go to "5 Key Improvements" tab and click Generate</p>
              <button
                onClick={onCoverLetter}
                disabled={coverLetterLoading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {coverLetterLoading ? 'Writing...' : 'Generate Now'}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Cover Letter</span>
                <CopyButton text={jobMatch.coverLetter} />
              </div>
              <pre className="px-5 py-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans max-h-[70vh] overflow-y-auto">
                {jobMatch.coverLetter}
              </pre>
            </div>
          )}
        </>
      )}

      {/* Application email */}
      {tab === 'email' && (
        <>
          {!jobMatch.applicationEmail ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
              <div className="text-4xl mb-3">📧</div>
              <p className="text-slate-700 font-medium mb-4">Generate the cover letter first</p>
              <button
                onClick={onCoverLetter}
                disabled={coverLetterLoading}
                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {coverLetterLoading ? 'Writing...' : 'Generate Now'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Subject */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Subject Line
                  </span>
                  <CopyButton text={emailSubject} />
                </div>
                <p className="text-sm font-medium text-slate-800 bg-slate-50 px-4 py-2.5 rounded-lg">
                  {emailSubject}
                </p>
              </div>
              {/* Body */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Email Body
                  </span>
                  <CopyButton text={emailBody} />
                </div>
                <pre className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-sans bg-slate-50 px-4 py-3 rounded-lg">
                  {emailBody}
                </pre>
              </div>
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-xs text-indigo-700">
                💡 Attach your rewritten resume PDF and the cover letter when sending this email.
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── History list ─────────────────────────────────────────────────────────────

function HistoryList({
  matches, onSelect, onDelete, onNew,
}: {
  matches: JobMatch[];
  onSelect: (m: JobMatch) => void;
  onDelete: (id: string) => void;
  onNew:    () => void;
}) {
  const statusLabel: Record<string, string> = {
    audit_done:   'Audit done',
    rewrite_done: 'Rewrite done',
    applied:      'Applied',
  };

  const statusColor: Record<string, string> = {
    audit_done:   'bg-yellow-100 text-yellow-700',
    rewrite_done: 'bg-blue-100 text-blue-700',
    applied:      'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-3">
      {matches.map((m) => (
        <div
          key={m._id}
          onClick={() => onSelect(m)}
          className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 hover:shadow-sm transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-slate-800 text-sm">{m.jobTitle}</p>
                <span className="text-slate-400 text-xs">at</span>
                <p className="text-indigo-600 text-sm font-medium">{m.companyName}</p>
              </div>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[m.status]}`}>
                  {statusLabel[m.status]}
                </span>
                <span className={`text-xs font-bold ${scoreColor(m.audit?.matchScore || 0)}`}>
                  {m.audit?.matchScore || 0}% match
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(m.createdAt).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(m._id); }}
              className="text-slate-300 hover:text-red-400 transition-colors text-lg flex-shrink-0"
              title="Delete"
            >
              ×
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={onNew}
        className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-sm text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors"
      >
        + Analyse a new job opening
      </button>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type View = 'form' | 'auditing' | 'audit' | 'rewriting' | 'rewrite' | 'cover_loading';

export default function JobMatchPage() {
  const [view,               setView]              = useState<View>('form');
  const [currentMatch,       setCurrentMatch]       = useState<JobMatch | null>(null);
  const [history,            setHistory]            = useState<JobMatch[]>([]);
  const [loadingStep,        setLoadingStep]        = useState(0);
  const [error,              setError]              = useState('');
  const [showHistory,        setShowHistory]        = useState(false);

  const auditSteps  = ['Reading job description', 'Comparing against your resume', 'Identifying red flags', 'Scoring your match'];
  const rewriteSteps = ['Reviewing audit findings', 'Rewriting Work Experience', 'Optimising skills section', 'Tailoring summary', 'Adding missing keywords'];
  const coverSteps  = ['Analysing company culture', 'Writing cover letter', 'Drafting application email'];

  // Load history
  useEffect(() => {
    jobMatchService.getAll()
      .then((r) => setHistory(r.data.data.jobMatches || []))
      .catch(() => {});
  }, []);

  // Animate loading steps
  useEffect(() => {
    if (!['auditing', 'rewriting', 'cover_loading'].includes(view)) return;
    const steps = view === 'auditing' ? auditSteps : view === 'rewriting' ? rewriteSteps : coverSteps;
    setLoadingStep(0);
    const timers = steps.map((_, i) =>
      setTimeout(() => setLoadingStep(i), i * 1400)
    );
    return () => timers.forEach(clearTimeout);
  }, [view]);

  const handleAudit = async (data: {
    jobTitle: string; companyName: string;
    jobDescription: string; jobUrl: string;
  }) => {
    setError('');
    setView('auditing');
    try {
      const res    = await jobMatchService.audit(data);
      const match  = res.data.data.jobMatch as JobMatch;
      setCurrentMatch(match);
      setHistory((prev) => [match, ...prev]);
      setView('audit');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Audit failed — check your resume is uploaded');
      setView('form');
    }
  };

  const handleRewrite = async () => {
    if (!currentMatch) return;
    setView('rewriting');
    try {
      const res   = await jobMatchService.rewrite(currentMatch._id);
      const match = res.data.data.jobMatch as JobMatch;
      setCurrentMatch(match);
      setHistory((prev) => prev.map((m) => m._id === match._id ? match : m));
      setView('rewrite');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Rewrite failed');
      setView('audit');
    }
  };

  const handleCoverLetter = async () => {
    if (!currentMatch) return;
    setView('cover_loading');
    try {
      const res   = await jobMatchService.coverLetter(currentMatch._id);
      const match = res.data.data.jobMatch as JobMatch;
      setCurrentMatch(match);
      setHistory((prev) => prev.map((m) => m._id === match._id ? match : m));
      setView('rewrite');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cover letter failed');
      setView('rewrite');
    }
  };

  const handleSelectHistory = async (m: JobMatch) => {
    try {
      const res   = await jobMatchService.getById(m._id);
      const match = res.data.data.jobMatch as JobMatch;
      setCurrentMatch(match);
      setShowHistory(false);
      setView(match.rewrite ? 'rewrite' : 'audit');
    } catch {
      setError('Failed to load job match');
    }
  };

  const handleDelete = async (id: string) => {
    await jobMatchService.delete(id);
    setHistory((prev) => prev.filter((m) => m._id !== id));
    if (currentMatch?._id === id) {
      setCurrentMatch(null);
      setView('form');
    }
  };

  // Loading screens
  if (view === 'auditing') return (
    <StepLoader
      steps={auditSteps}
      currentStep={loadingStep}
      title="Auditing your resume…"
      subtitle={`Acting as a senior recruiter at ${currentMatch?.companyName || 'the company'}`}
    />
  );

  if (view === 'rewriting') return (
    <StepLoader
      steps={rewriteSteps}
      currentStep={loadingStep}
      title="Rewriting your resume…"
      subtitle="Fixing every issue from the audit"
    />
  );

  if (view === 'cover_loading') return (
    <StepLoader
      steps={coverSteps}
      currentStep={loadingStep}
      title="Writing your cover letter…"
      subtitle={`Personalised for ${currentMatch?.companyName || 'this company'}`}
    />
  );

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-10">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Job Match Analyser</h1>
          <p className="text-slate-500 text-sm mt-1">
            Paste any job opening — Claude acts as their senior recruiter and audits your resume
          </p>
        </div>
        <div className="flex gap-2">
          {history.length > 0 && (
            <button
              onClick={() => setShowHistory((s) => !s)}
              className="text-sm px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
            >
              History ({history.length})
            </button>
          )}
          {view !== 'form' && (
            <button
              onClick={() => { setView('form'); setCurrentMatch(null); setError(''); }}
              className="text-sm px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + New Analysis
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* History panel */}
      {showHistory && history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Previous Analyses</h2>
          <HistoryList
            matches={history}
            onSelect={handleSelectHistory}
            onDelete={handleDelete}
            onNew={() => { setShowHistory(false); setView('form'); setCurrentMatch(null); }}
          />
        </div>
      )}

      {/* Main content */}
      {view === 'form' && (
        <JobInputForm onSubmit={handleAudit} loading={false} />
      )}

      {(view === 'audit') && currentMatch && (
        <AuditResults
          jobMatch={currentMatch}
          onRewrite={handleRewrite}
          rewriting={false}
        />
      )}

      {(view === 'rewrite') && currentMatch && (
        <div className="space-y-5">
          {/* Audit summary badge */}
          <div
            className={`flex items-center justify-between px-5 py-3 rounded-xl border ${scoreBg(currentMatch.audit?.matchScore || 0)} cursor-pointer`}
            onClick={() => setView('audit')}
          >
            <div className="flex items-center gap-3">
              <span className={`text-2xl font-bold ${scoreColor(currentMatch.audit?.matchScore || 0)}`}>
                {currentMatch.audit?.matchScore}%
              </span>
              <div>
                <p className="text-sm font-medium text-slate-700">
                  {currentMatch.jobTitle} at {currentMatch.companyName}
                </p>
                <p className="text-xs text-slate-400">Click to view full audit</p>
              </div>
            </div>
            <span className="text-slate-400 text-xs">Audit →</span>
          </div>

          <RewriteResults
            jobMatch={currentMatch}
            onCoverLetter={handleCoverLetter}
            coverLetterLoading={false}
          />
        </div>
      )}
    </div>
  );
}