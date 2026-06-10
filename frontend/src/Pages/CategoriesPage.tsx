import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Category } from '../types/dashboard.types';

const categories: Category[] = [
  {
    id: 'frontend',
    title: 'Frontend',
    description: 'React, Vue, CSS, JavaScript, browser APIs, performance and accessibility.',
    icon: '⚛️',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    topics: ['React', 'TypeScript', 'CSS', 'Performance', 'Accessibility'],
    totalQuestions: 120,
  },
  {
    id: 'backend',
    title: 'Backend',
    description: 'Node.js, REST APIs, databases, authentication, caching and server architecture.',
    icon: '🛠️',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    topics: ['Node.js', 'Express', 'MongoDB', 'Redis', 'REST'],
    totalQuestions: 140,
  },
  {
    id: 'fullstack',
    title: 'Full Stack',
    description: 'End-to-end development covering both frontend and backend in a single session.',
    icon: '🔄',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    topics: ['Architecture', 'APIs', 'Auth', 'Deployment', 'Testing'],
    totalQuestions: 100,
  },
  {
    id: 'system-design',
    title: 'System Design',
    description: 'Scalable systems, microservices, load balancing, CAP theorem and real-world design.',
    icon: '🏗️',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    topics: ['Scalability', 'Databases', 'Caching', 'Queues', 'CDN'],
    totalQuestions: 80,
  },
  {
    id: 'hr',
    title: 'HR & Behavioral',
    description: 'Soft skills, STAR method answers, situational questions and culture fit.',
    icon: '🤝',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    topics: ['STAR Method', 'Leadership', 'Conflict', 'Goals', 'Culture'],
    totalQuestions: 90,
  },
  {
    id: 'dsa',
    title: 'DSA & Coding',
    description: 'Data structures, algorithms, time complexity and problem-solving patterns.',
    icon: '💻',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    borderColor: 'border-teal-200',
    topics: ['Arrays', 'Trees', 'DP', 'Graphs', 'Sorting'],
    totalQuestions: 200,
  },
];

const difficulties = ['Easy', 'Medium', 'Hard'] as const;
type Difficulty = typeof difficulties[number];

const difficultyMeta: Record<Difficulty, { color: string; desc: string }> = {
  Easy:   { color: 'border-green-400 bg-green-50 text-green-700',  desc: 'Core concepts, definitions, straightforward questions' },
  Medium: { color: 'border-yellow-400 bg-yellow-50 text-yellow-700', desc: 'Problem solving, trade-offs and moderate depth'         },
  Hard:   { color: 'border-red-400 bg-red-50 text-red-700',        desc: 'Advanced topics, edge cases and senior-level depth'      },
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [count, setCount] = useState(10);

  const selectedCat = categories.find((c) => c.id === selected);

  const handleStart = () => {
    if (!selected) return;
    navigate(`/interview/create?category=${selected}&difficulty=${difficulty.toLowerCase()}&count=${count}`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-slate-800">Choose Interview Category</h1>
        <p className="text-slate-500 text-sm mt-1">Select a category, set your difficulty and start practising.</p>
      </div>

      {/* Category grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelected(cat.id === selected ? null : cat.id)}
            className={`text-left p-5 rounded-2xl border-2 transition-all duration-200 hover:shadow-md
              ${selected === cat.id
                ? `${cat.borderColor} ${cat.bgColor} shadow-md scale-[1.02]`
                : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-3xl">{cat.icon}</span>
              {selected === cat.id && (
                <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs flex-shrink-0">
                  ✓
                </span>
              )}
            </div>
            <h3 className={`font-semibold text-base mb-1 ${selected === cat.id ? cat.color : 'text-slate-800'}`}>
              {cat.title}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{cat.description}</p>
            <div className="flex flex-wrap gap-1 mb-3">
              {cat.topics.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${selected === cat.id ? `${cat.bgColor} ${cat.color}` : 'bg-slate-100 text-slate-500'}`}
                >
                  {t}
                </span>
              ))}
              {cat.topics.length > 3 && (
                <span className="text-xs text-slate-400">+{cat.topics.length - 3}</span>
              )}
            </div>
            <p className="text-xs text-slate-400">{cat.totalQuestions}+ questions available</p>
          </button>
        ))}
      </div>

      {/* Config panel — shown after selecting a category */}
      {selectedCat && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">{selectedCat.icon}</span>
            <div>
              <h2 className="font-semibold text-slate-800">{selectedCat.title} Interview</h2>
              <p className="text-xs text-slate-400">Configure your session below</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Difficulty */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">Difficulty</p>
              <div className="space-y-2">
                {difficulties.map((d) => (
                  <label
                    key={d}
                    className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all
                      ${difficulty === d ? difficultyMeta[d].color : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <input
                      type="radio"
                      name="difficulty"
                      value={d}
                      checked={difficulty === d}
                      onChange={() => setDifficulty(d)}
                      className="mt-0.5 accent-indigo-600"
                    />
                    <div>
                      <p className="text-sm font-medium">{d}</p>
                      <p className="text-xs opacity-70 mt-0.5">{difficultyMeta[d].desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Question count */}
            <div>
              <p className="text-sm font-medium text-slate-700 mb-3">
                Number of Questions — <span className="text-indigo-600 font-semibold">{count}</span>
              </p>
              <input
                type="range"
                min={5}
                max={20}
                step={5}
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-slate-400 mt-1">
                <span>5 (Quick)</span>
                <span>10 (Standard)</span>
                <span>15</span>
                <span>20 (Deep)</span>
              </div>

              {/* Estimate */}
              <div className="mt-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <p className="text-xs text-indigo-700 font-medium">Estimated duration</p>
                <p className="text-xl font-bold text-indigo-600 mt-0.5">~{count * 3} minutes</p>
                <p className="text-xs text-indigo-400 mt-0.5">3 min per question on average</p>
              </div>

              {/* Topics covered */}
              <div className="mt-4">
                <p className="text-xs font-medium text-slate-500 mb-2">Topics covered</p>
                <div className="flex flex-wrap gap-1">
                  {selectedCat.topics.map((t) => (
                    <span
                      key={t}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${selectedCat.bgColor} ${selectedCat.color}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Start button */}
          <div className="mt-6 flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              ← Change category
            </button>
            <button
              onClick={handleStart}
              className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all shadow-sm"
            >
              Generate Interview with AI →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}