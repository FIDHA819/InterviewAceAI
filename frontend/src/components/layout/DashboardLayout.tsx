import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authstore';
import { useAuth } from '../../hooks/useAuth';

const navItems = [
  { to: '/dashboard',   icon: '⊞', label: 'Dashboard'      },
  { to: '/interview',   icon: '🎯', label: 'New Interview'  },
  { to: '/sessions',    icon: '📋', label: 'My Sessions'    },
  { to: '/analytics',  icon: '📊', label: 'Analytics'      },
  { to: '/resume',      icon: '📄', label: 'Resume'         },
  { to: '/profile',     icon: '👤', label: 'Profile'        },
  { to: '/jobs', icon: '💼', label: 'Job Match' },
];

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          flex flex-col bg-slate-900 text-white transition-all duration-300
          ${collapsed ? 'w-16' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-bold">
                AI
              </div>
              <span className="font-semibold text-sm tracking-wide">InterviewAI</span>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-sm font-bold mx-auto">
              AI
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-slate-400 hover:text-white transition-colors ml-auto"
          >
            <span className="text-lg">{collapsed ? '→' : '←'}</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <span className="text-base flex-shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-2 py-4 border-t border-slate-700">
          <div
            className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors`}
            onClick={() => navigate('/profile')}
          >
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <button
            onClick={logout}
            className={`mt-1 flex items-center gap-3 px-3 py-2 w-full rounded-lg text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors text-sm`}
          >
            <span className="flex-shrink-0">🚪</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top navbar */}
        <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            className="lg:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setMobileOpen(true)}
          >
            ☰
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-800">{user?.name}</p>
              <p className="text-xs text-slate-400">{user?.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
              {initials}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}