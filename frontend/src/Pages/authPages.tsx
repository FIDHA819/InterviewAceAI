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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4 selection:bg-indigo-500 selection:text-white">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100/80 p-8 transition-all duration-300">
        
        {/* Brand Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl mb-4 shadow-lg shadow-indigo-200 animate-pulse-subtle">
            <span className="text-white text-2xl filter drop-shadow-sm">🎯</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">InterviewAI</h1>
          <p className="text-slate-400 text-sm mt-1">Practice. Improve. Get Hired.</p>
        </div>

        {/* Dynamic Sliding Tabs */}
        <div className="flex bg-slate-100/80 rounded-xl p-1 mb-6 border border-slate-200/30">
          {(['login', 'register'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => { setMode(tab); setError(''); }}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] ${
                mode === tab
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-100 text-rose-800 text-sm font-medium px-4 py-3 rounded-xl mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 block shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Login Form */}
        {mode === 'login' && (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
              <input
                {...loginForm.register('email')}
                type="email"
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  loginForm.formState.errors.email ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {loginForm.formState.errors.email && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {loginForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input
                {...loginForm.register('password')}
                type="password"
                placeholder="••••••••"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  loginForm.formState.errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {loginForm.formState.errors.password && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {loginForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.99] disabled:opacity-50 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 mt-2"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {/* Register Form */}
        {mode === 'register' && (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Full Name</label>
              <input
                {...registerForm.register('name')}
                type="text"
                placeholder="Alex Johnson"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  registerForm.formState.errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {registerForm.formState.errors.name && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {registerForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Email Address</label>
              <input
                {...registerForm.register('email')}
                type="email"
                placeholder="you@example.com"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  registerForm.formState.errors.email ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {registerForm.formState.errors.email && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {registerForm.formState.errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Password</label>
              <input
                {...registerForm.register('password')}
                type="password"
                placeholder="At least 6 characters"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  registerForm.formState.errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {registerForm.formState.errors.password && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {registerForm.formState.errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Confirm Password</label>
              <input
                {...registerForm.register('confirmPassword')}
                type="password"
                placeholder="Repeat your password"
                className={`w-full border rounded-xl px-4 py-3 text-sm font-medium bg-slate-50/50 text-slate-800 placeholder:text-slate-400 transition-all focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-500/10 ${
                  registerForm.formState.errors.confirmPassword ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-indigo-500'
                }`}
              />
              {registerForm.formState.errors.confirmPassword && (
                <p className="text-rose-600 text-xs font-medium mt-1.5 flex items-center gap-1">
                  <span>⚠️</span> {registerForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl text-sm font-semibold transition-all duration-150 active:scale-[0.99] disabled:opacity-50 shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}