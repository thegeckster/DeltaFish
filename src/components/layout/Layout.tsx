import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Fish, PlusCircle, List, BarChart3, Settings } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Fish, label: 'Home' },
    { to: '/log', icon: PlusCircle, label: 'Log Trip' },
    { to: '/trips', icon: List, label: 'Trips' },
    { to: '/analysis', icon: BarChart3, label: 'Analysis' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center">
          <Fish className="w-6 h-6 text-blue-600 mr-2" />
          <h1 className="text-lg font-bold text-slate-900">DeltaFish</h1>
          <span className="ml-auto text-xs text-slate-400">
            California Delta
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-4">
        <Outlet />
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-40 safe-area-inset-bottom">
        <div className="max-w-lg mx-auto flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  isActive
                    ? 'text-blue-600 font-medium'
                    : 'text-slate-400 hover:text-slate-600'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
