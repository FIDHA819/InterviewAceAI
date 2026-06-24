import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = loginSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ['confirmPassword'],
});

type LoginForm = z.infer<typeof loginSchema>;
type RegisterForm = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const registerForm = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) });

  const handleLogin = async (data: LoginForm) => {
    setError('');
    setLoading(true);
    try {
      await login(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: RegisterForm) => {
    setError('');
    setLoading(true);
    try {
      await register({ name: data.name, email: data.email, password: data.password });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: '📄', title: 'Smart Resume Analyzer', desc: 'Instant ATS scoring and optimization insights.' },
    { icon: '✨', title: 'Cover Letter & Mail Writer', desc: 'Generate highly tailored outreach copies in seconds.' },
    { icon: '🎙️', title: 'AI Mock Interviews', desc: 'Real-time interactive voice and tech simulations.' },
    { icon: '📈', title: 'Performance Analytics', desc: 'Comprehensive scoring breakdowns and tracking over time.' },
    { icon: '🎯', title: 'Actionable Feedback', desc: 'Granular suggestions on tone, delivery, and tech accuracy.' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex selection:bg-indigo-500 selection:text-white antialiased font-sans">
      
      {/* LEFT PANEL: Feature Branding Presentation (Hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-16 flex-col justify-between relative overflow-hidden border-r border-slate-800">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-40 pointer-events-none" />
        
        {/* Brand Header */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-xl shadow-md">
            <span className="text-white text-lg">🎯</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Interview<span className="text-indigo-400">AI</span></span>
        </div>

        {/* Feature Highlights Grid */}
        <div className="space-y-8 relative z-10 my-auto max-w-lg">
          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400 bg-indigo-950/60 border border-indigo-800/50 px-3 py-1 rounded-full">Intelligent Career Suite</span>
            <h2 className="text-4xl font-extrabold text-white tracking-tight leading-none">
              Land your dream tech role. Powered by AI.
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              An all-in-one suite designed to analyze documents, automate application outreach, and run deep mock simulations.
            </p>
          </div>

          <div className="grid gap-4 pt-4">
            {features.map((feat, index) => (
              <div key={index} className="flex gap-4 p-4 rounded-xl bg-slate-800/30 border border-slate-800/40 hover:border-slate-700/60 transition-all duration-200">
                <div className="text-2xl shrink-0 mt-0.5">{feat.icon}</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">{feat.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="text-xs text-slate-500 relative z-10">
          &copy; {new Date().getFullYear()} InterviewAI Corp. All corporate candidate systems standard.
        </div>
      </div>

      {/* RIGHT PANEL: Auth Interaction Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 md:p-16 bg-slate-950">
        <div className="w-full max-w-md space-y-6">
          
          {/* Mobile Only Header */}
          <div className="text-center lg:hidden mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl mb-3 shadow-lg shadow-indigo-500/20">
              <span className="text-white text-xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">InterviewAI</h1>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              {mode === 'login' ? 'Welcome back' : 'Get started for free'}
            </h2>
            <p className="text-sm text-slate-400">
              {mode === 'login' ? "Enter your credentials to access your trainer suite" : 'Create an account to start simulating deep interviews'}
            </p>
          </div>

          {/* Dynamic Sliding Tabs */}
          <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
            {(['login', 'register'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 ${
                  mode === tab
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Register Account'}
              </button>
            ))}
          </div>

          {/* Global Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 bg-rose-950/40 border border-rose-900/50 text-rose-300 text-xs font-medium px-4 py-3 rounded-xl shadow-inner">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block shrink-0 animate-ping" />
              <p>{error}</p>
            </div>
          )}

          {/* Forms Segment */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {mode === 'login' ? (
              <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      loginForm.formState.errors.email ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    placeholder="••••••••"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      loginForm.formState.errors.password ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Full Name</label>
                  <input
                    {...registerForm.register('name')}
                    type="text"
                    placeholder="Alex Johnson"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      registerForm.formState.errors.name ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {registerForm.formState.errors.name && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {registerForm.formState.errors.name.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Email Address</label>
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      registerForm.formState.errors.email ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {registerForm.formState.errors.email && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Password</label>
                  <input
                    {...registerForm.register('password')}
                    type="password"
                    placeholder="Minimum 6 characters"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      registerForm.formState.errors.password ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {registerForm.formState.errors.password && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">Confirm Password</label>
                  <input
                    {...registerForm.register('confirmPassword')}
                    type="password"
                    placeholder="Repeat password"
                    className={`w-full border rounded-xl px-4 py-3 text-sm bg-slate-950 text-slate-100 placeholder:text-slate-600 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 ${
                      registerForm.formState.errors.confirmPassword ? 'border-rose-500/80' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="text-rose-400 text-xs font-medium mt-1.5 flex items-center gap-1">
                      <span>⚠️</span> {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg shadow-indigo-600/10 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? 'Creating Account...' : 'Get Started'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}