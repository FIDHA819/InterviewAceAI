import { useState, useEffect, useRef, DragEvent } from 'react';
import { resumeService } from '../services/resume.service';
import type { Resume, ResumeAnalysis } from '../types/resume.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const scoreColor = (s: number) =>
  s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500';

const scoreBg = (s: number) =>
  s >= 80 ? 'bg-green-50 border-green-200'
: s >= 60 ? 'bg-yellow-50 border-yellow-200'
           : 'bg-red-50 border-red-200';

const scoreBarColor = (s: number) =>
  s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-500' : 'bg-red-500';

const scoreLabel = (s: number) =>
  s >= 85 ? 'Excellent' :
  s >= 70 ? 'Good'      :
  s >= 55 ? 'Average'   :
  s >= 40 ? 'Below Average' :
            'Needs Work';

const fmtBytes = (b: number) =>
  b < 1024        ? `${b} B`
: b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB`
                   : `${(b / (1024 * 1024)).toFixed(1)} MB`;

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({
  score, label, size = 100,
}: { score: number; label: string; size?: number }) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(score), 200);
    return () => clearTimeout(t);
  }, [score]);

  const r    = 36;
  const circ = 2 * Math.PI * r;
  const dash = (animated / 100) * circ;
  const col  = score >= 80 ? '#22c55e' : score >= 60 ? '#eab308' : '#ef4444';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r={r} fill="none" stroke="#e2e8f0" strokeWidth="6" />
          <circle
            cx="40" cy="40" r={r}
            fill="none" stroke={col} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            style={{ transition: 'stroke-dasharray 1.2s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold text-xl leading-none ${scoreColor(score)}`}>{score}</span>
          <span className="text-slate-400 text-xs">/ 100</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-slate-700">{label}</p>
        <p className={`text-xs font-medium ${scoreColor(score)}`}>{scoreLabel(score)}</p>
      </div>
    </div>
  );
}

// ─── Animated bar ─────────────────────────────────────────────────────────────

function AnimatedBar({ score, label }: { score: number; label: string }) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(score), 400);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-slate-600">{label}</span>
        <span className={`text-sm font-bold ${scoreColor(score)}`}>{score}%</span>
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

// ─── Skill tag ────────────────────────────────────────────────────────────────

function SkillTag({
  label, variant,
}: { label: string; variant: 'found' | 'missing' | 'keyword' | 'job' }) {
  const styles = {
    found:   'bg-green-50  text-green-700  border-green-200',
    missing: 'bg-red-50    text-red-600    border-red-200',
    keyword: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    job:     'bg-blue-50   text-blue-700   border-blue-200',
  };

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${styles[variant]}`}>
      {variant === 'found'   && <span>✓</span>}
      {variant === 'missing' && <span>✗</span>}
      {label}
    </span>
  );
}

// ─── Upload zone ──────────────────────────────────────────────────────────────

function UploadZone({
  onFile, uploading, error,
}: {
  onFile: (f: File) => void;
  uploading: boolean;
  error: string;
}) {
  const inputRef   = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDrag(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type === 'application/pdf') onFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFile(file);
  };

  return (
    <div className="max-w-xl mx-auto">
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true);  }}
        onDragLeave={() => setDrag(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all
          ${drag
            ? 'border-indigo-400 bg-indigo-50 scale-[1.01]'
            : 'border-slate-300 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/50'
          } ${uploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleChange}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
            </div>
            <div>
              <p className="text-slate-700 font-semibold">Analysing your resume…</p>
              <p className="text-slate-400 text-sm mt-1">Claude AI is reviewing every section</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all
              ${drag ? 'bg-indigo-100 scale-110' : 'bg-white border border-slate-200'}`}>
              📄
            </div>
            <div>
              <p className="text-slate-700 font-semibold text-lg">
                {drag ? 'Drop your PDF here' : 'Upload your Resume'}
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Drag & drop or click to browse
              </p>
              <p className="text-slate-300 text-xs mt-1">PDF only · Max 5MB</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">✓ ATS Score</span>
              <span className="flex items-center gap-1">✓ Skills Gap</span>
              <span className="flex items-center gap-1">✓ AI Suggestions</span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Analysis results ─────────────────────────────────────────────────────────

function AnalysisResults({
  resume,
  onReplace,
  onDelete,
}: {
  resume: Resume;
  onReplace: (f: File) => void;
  onDelete: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { analysis } = resume;
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'suggestions'>('overview');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleReplace = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onReplace(file);
  };

  return (
    <div className="space-y-5">

      {/* File info bar */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl">📄</div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{resume.fileName}</p>
            <p className="text-xs text-slate-400">
              {fmtBytes(resume.fileSize)} · Analysed{' '}
              {new Date(resume.analyzedAt).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleReplace} />
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Replace
          </button>
          {confirmDelete ? (
            <div className="flex items-center gap-1">
              <button
                onClick={onDelete}
                className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-3 py-1.5 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs px-3 py-1.5 border border-red-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Overall ATS score hero */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-6">
          <ScoreRing score={analysis.atsScore} label="ATS Score" size={110} />
          <div className="flex-1">
            <h2 className="text-white text-lg font-semibold mb-1">
              {analysis.atsScore >= 80 ? '🎉 Great ATS compatibility!'
              : analysis.atsScore >= 60 ? '👍 Decent, with room to improve'
                                         : '⚠️ Needs significant improvement'}
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">
              {analysis.experience}
            </p>
            <div className="flex flex-wrap gap-2">
              {analysis.jobTitles?.slice(0, 3).map((t) => (
                <SkillTag key={t} label={t} variant="job" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Score breakdown cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'ATS Score',     score: analysis.atsScore,     icon: '🎯' },
          { label: 'Format Score',  score: analysis.formatScore,  icon: '📐' },
          { label: 'Content Score', score: analysis.contentScore, icon: '✍️' },
        ].map(({ label, score, icon }) => (
          <div key={label} className={`rounded-2xl border p-4 ${scoreBg(score)}`}>
            <div className="text-2xl mb-2">{icon}</div>
            <div className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</div>
            <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
            <div className={`text-xs font-medium mt-0.5 ${scoreColor(score)}`}>
              {scoreLabel(score)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['overview', 'skills', 'suggestions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize
              ${activeTab === tab
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab === 'overview'    ? 'Overview'
            : tab === 'skills'    ? `Skills (${analysis.skills.length})`
                                  : `Suggestions (${analysis.suggestions.length})`}
          </button>
        ))}
      </div>

      {/* ── Overview tab ──────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-5">

          {/* Score bars */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <h3 className="font-semibold text-slate-800">Score Breakdown</h3>
            <AnimatedBar score={analysis.atsScore}     label="ATS Compatibility" />
            <AnimatedBar score={analysis.formatScore}  label="Format & Structure" />
            <AnimatedBar score={analysis.contentScore} label="Content Quality"    />
          </div>

          {/* Experience & education */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                💼 Experience
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">{analysis.experience}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                🎓 Education
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {analysis.education || 'Not mentioned in resume'}
              </p>
            </div>
          </div>

          {/* ATS keywords */}
          {analysis.keywords?.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-3">🔑 ATS Keywords Found</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords.map((kw) => (
                  <SkillTag key={kw} label={kw} variant="keyword" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Skills tab ────────────────────────────────────────────────────── */}
      {activeTab === 'skills' && (
        <div className="space-y-4">

          {/* Found skills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
              <span className="text-green-500">✓</span>
              Skills Found
              <span className="text-xs font-normal text-slate-400">
                ({analysis.skills.length} detected)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">Technologies and tools mentioned in your resume</p>
            {analysis.skills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((s) => (
                  <SkillTag key={s} label={s} variant="found" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 italic">No specific skills detected</p>
            )}
          </div>

          {/* Missing skills */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2 mb-1">
              <span className="text-red-500">✗</span>
              Missing Skills
              <span className="text-xs font-normal text-slate-400">
                ({analysis.missingSkills.length} gaps identified)
              </span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Important skills for your role/level that aren't mentioned
            </p>
            {analysis.missingSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {analysis.missingSkills.map((s) => (
                  <SkillTag key={s} label={s} variant="missing" />
                ))}
              </div>
            ) : (
              <p className="text-sm text-green-600 font-medium">
                🎉 No major skill gaps detected!
              </p>
            )}
          </div>

          {/* Skills coverage bar */}
          {analysis.skills.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h3 className="font-semibold text-slate-800 mb-4">Skills Coverage</h3>
              <div className="flex items-center gap-4">
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    className="bg-green-500 h-full transition-all duration-1000"
                    style={{
                      width: `${
                        (analysis.skills.length /
                          (analysis.skills.length + analysis.missingSkills.length)) * 100
                      }%`,
                    }}
                  />
                  <div className="bg-red-300 h-full flex-1" />
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                  {analysis.skills.length} found
                </span>
                <span className="flex items-center gap-1 text-red-500">
                  <span className="w-2 h-2 rounded-full bg-red-300 inline-block" />
                  {analysis.missingSkills.length} missing
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Suggestions tab ───────────────────────────────────────────────── */}
      {activeTab === 'suggestions' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">
            Specific improvements recommended by Claude AI to boost your ATS score and interview chances.
          </p>
          {analysis.suggestions.map((s, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1">
                <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
              </div>
            </div>
          ))}

          {/* Quick action */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 flex items-center justify-between gap-4">
  <div>
    <p className="text-sm font-semibold text-indigo-800">
      Practice interviews to complement your resume
    </p>
    <p className="text-xs text-indigo-500 mt-0.5">
      Apply these improvements and sharpen your answers
    </p>
  </div>

  <a
    href="/interview"
    className="flex-shrink-0 bg-indigo-600 text-white text-sm px-4 py-2 rounded-xl hover:bg-indigo-700 transition-colors font-medium"
  >
    Start Interview →
  </a>
</div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ResumePage() {
  const [resume,    setResume]    = useState<Resume | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  // Load existing resume
  useEffect(() => {
    resumeService.get()
      .then((r) => setResume(r.data.data.resume))
      .catch(() => setResume(null))
      .finally(() => setLoading(false));
  }, []);

  const handleFile = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large — maximum size is 5MB');
      return;
    }

    setError('');
    setUploading(true);
    setResume(null);

    try {
      const res = await resumeService.upload(file);
      setResume(res.data.data.resume);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Upload failed — try again');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await resumeService.delete();
      setResume(null);
    } catch {
      setError('Failed to delete resume');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Resume Analyser</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload your PDF resume — Claude AI gives you an ATS score, skills gap, and specific improvements.
        </p>
      </div>

      {/* Feature badges */}
      {!resume && !uploading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: '🎯', label: 'ATS Score',          sub: 'Compatibility rating'   },
            { icon: '💡', label: 'Skills Gap',          sub: 'Missing technologies'   },
            { icon: '✍️', label: 'AI Suggestions',      sub: '5 specific improvements'},
            { icon: '🔑', label: 'Keyword Analysis',    sub: 'ATS keyword matching'   },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <p className="text-xs font-semibold text-slate-700">{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Upload zone or results */}
      {!resume ? (
        <UploadZone onFile={handleFile} uploading={uploading} error={error} />
      ) : (
        <AnalysisResults
          resume={resume}
          onReplace={handleFile}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}