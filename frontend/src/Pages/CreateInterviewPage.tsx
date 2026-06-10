import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { interviewService } from '../services/interview.service';

// ─── Data ────────────────────────────────────────────────────────────────────

const categories = [
  { id: 'frontend',      label: 'Frontend',      icon: '⚛️', color: 'blue',   desc: 'React, CSS, JS, Performance'     },
  { id: 'backend',       label: 'Backend',       icon: '🛠️', color: 'green',  desc: 'Node.js, APIs, Databases'        },
  { id: 'fullstack',     label: 'Full Stack',    icon: '🔄', color: 'purple', desc: 'End-to-end Architecture'         },
  { id: 'system-design', label: 'System Design', icon: '🏗️', color: 'red',    desc: 'Scalability & Architecture'      },
  { id: 'hr',            label: 'HR & Behavioral', icon: '🤝', color: 'yellow', desc: 'Soft Skills & STAR Method'     },
  { id: 'dsa',           label: 'DSA & Coding',  icon: '💻', color: 'teal',   desc: 'Algorithms & Data Structures'   },
];

const difficulties = [
  { id: 'easy',   label: 'Easy',   icon: '🟢', desc: 'Core concepts and definitions',          time: '2 min / question' },
  { id: 'medium', label: 'Medium', icon: '🟡', desc: 'Problem solving and trade-offs',          time: '3 min / question' },
  { id: 'hard',   label: 'Hard',   icon: '🔴', desc: 'Advanced topics and edge cases',          time: '5 min / question' },
];

const colorMap: Record<string, { card: string; badge: string; ring: string }> = {
  blue:   { card: 'border-blue-200 bg-blue-50',     badge: 'bg-blue-100 text-blue-700',     ring: 'ring-blue-400'   },
  green:  { card: 'border-green-200 bg-green-50',   badge: 'bg-green-100 text-green-700',   ring: 'ring-green-400'  },
  purple: { card: 'border-purple-200 bg-purple-50', badge: 'bg-purple-100 text-purple-700', ring: 'ring-purple-400' },
  red:    { card: 'border-red-200 bg-red-50',       badge: 'bg-red-100 text-red-700',       ring: 'ring-red-400'    },
  yellow: { card: 'border-yellow-200 bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700', ring: 'ring-yellow-400' },
  teal:   { card: 'border-teal-200 bg-teal-50',     badge: 'bg-teal-100 text-teal-700',     ring: 'ring-teal-400'   },
};

// ─── Step indicator ──────────────────────────────────────────────────────────

const steps = ['Category', 'Difficulty', 'Questions', 'Review'];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all
                ${i < current  ? 'bg-indigo-600 text-white'
                : i === current ? 'bg-indigo-600 text-white ring-4 ring-indigo-100'
                                : 'bg-slate-100 text-slate-400'}`}
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${i === current ? 'text-indigo-600' : 'text-slate-400'}`}>
              {label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-4 transition-all ${i < current ? 'bg-indigo-600' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export default function CreateInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep]           = useState(() => (searchParams.get('category') ? 1 : 0));
  const [category, setCategory]   = useState(searchParams.get('category') || '');
  const [difficulty, setDifficulty] = useState(searchParams.get('difficulty') || 'medium');
  const [count, setCount]         = useState(10);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [dots, setDots]           = useState('');

  // Animate "Generating..." dots
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => setDots((d) => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(interval);
  }, [loading]);

  const selectedCat  = categories.find((c) => c.id === category);
  const selectedDiff = difficulties.find((d) => d.id === difficulty);
  const estimatedMin = Math.ceil(count * (difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2));

  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await interviewService.generate({ category, difficulty, count });
      const interviewId = res.data.data.interview._id;
      navigate(`/session/${interviewId}`);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'Generation failed — please try again');
      setLoading(false);
    }
  };

  // ── Loading screen ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">🤖</div>
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            Generating your interview{dots}
          </h2>
          <p className="text-slate-500 text-sm max-w-xs">
             AI is crafting {count} {difficulty} {selectedCat?.label} questions tailored just for you
          </p>
        </div>
        <div className="flex flex-col gap-2 w-64">
          {['Analysing category context', 'Engineering questions', 'Calibrating difficulty', 'Finalising session'].map((msg, i) => (
            <div key={msg} className="flex items-center gap-3 text-sm text-slate-500">
              <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-indigo-600 animate-pulse' : 'bg-slate-200'}`} />
              {msg}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Create Interview</h1>
        <p className="text-slate-500 text-sm mt-1">AI will generate personalised questions for your session</p>
      </div>

      <StepBar current={step} />

      {/* ── Step 0: Category ─────────────────────────────────────────────────── */}
      {step === 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Choose a category</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categories.map((cat) => {
              const cl = colorMap[cat.color];
              return (
                <button
                  key={cat.id}
                  onClick={() => { setCategory(cat.id); setStep(1); }}
                  className={`text-left p-4 rounded-xl border-2 transition-all hover:shadow-md
                    ${category === cat.id ? `${cl.card} ring-2 ${cl.ring}` : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <span className="text-2xl mb-2 block">{cat.icon}</span>
                  <p className="font-semibold text-slate-800 text-sm">{cat.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 1: Difficulty ───────────────────────────────────────────────── */}
      {step === 1 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Select difficulty</h2>
          <div className="flex flex-col gap-3 mb-6">
            {difficulties.map((d) => (
              <label
                key={d.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
                  ${difficulty === d.id
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                <input
                  type="radio"
                  name="difficulty"
                  value={d.id}
                  checked={difficulty === d.id}
                  onChange={() => setDifficulty(d.id)}
                  className="accent-indigo-600"
                />
                <span className="text-xl">{d.icon}</span>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${difficulty === d.id ? 'text-indigo-700' : 'text-slate-800'}`}>
                    {d.label}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                </div>
                <span className="text-xs text-slate-400 hidden sm:block">{d.time}</span>
              </label>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(0)} className="text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">← Back</button>
            <button
              onClick={() => setStep(2)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Question count ───────────────────────────────────────────── */}
      {step === 2 && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Number of questions</h2>

          {/* Count selector */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`py-4 rounded-xl border-2 text-center transition-all
                  ${count === n
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
              >
                <p className="text-2xl font-bold">{n}</p>
                <p className="text-xs mt-0.5 text-slate-500">
                  {n === 5 ? 'Quick' : n === 10 ? 'Standard' : n === 15 ? 'Extended' : 'Deep Dive'}
                </p>
              </button>
            ))}
          </div>

          {/* Duration estimate */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700">Estimated duration</p>
              <p className="text-xs text-slate-400 mt-0.5">{count} questions × {difficulty === 'hard' ? 5 : difficulty === 'medium' ? 3 : 2} min each</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-indigo-600">~{estimatedMin}</p>
              <p className="text-xs text-slate-400">minutes</p>
            </div>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-slate-500 hover:text-slate-700">← Back</button>
            <button
              onClick={() => setStep(3)}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
            >
              Review →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Review & generate ────────────────────────────────────────── */}
      {step === 3 && selectedCat && selectedDiff && (
        <div>
          <h2 className="text-base font-semibold text-slate-700 mb-4">Review & generate</h2>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Category</span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {selectedCat.icon} {selectedCat.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Difficulty</span>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                {selectedDiff.icon} {selectedDiff.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-100">
              <span className="text-sm text-slate-500">Questions</span>
              <span className="text-sm font-semibold text-slate-800">{count}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-slate-500">Est. duration</span>
              <span className="text-sm font-semibold text-slate-800">~{estimatedMin} minutes</span>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-6 flex gap-3">
            <span className="text-xl">🤖</span>
            <p className="text-sm text-indigo-700">
               AI will generate {count} unique {selectedDiff.label.toLowerCase()} {selectedCat.label} questions tailored to assess real-world competency — not just definitions.
            </p>
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-slate-500 hover:text-slate-700">← Back</button>
            <button
              onClick={handleGenerate}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm flex items-center gap-2"
            >
              🚀 Generate Interview
            </button>
          </div>
        </div>
      )}
    </div>
  );
}