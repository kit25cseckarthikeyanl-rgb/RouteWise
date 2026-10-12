import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { ReactNode } from 'react';
import clsx from 'clsx';

export interface NavItem {
  label: string;
  to: string;
  icon?: ReactNode;
}

export function DashboardLayout({ title, navItems }: { title: string; navItems: NavItem[] }) {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-white">
      <aside className="flex w-60 flex-col border-r border-navy-900/10 bg-navy-950 text-white">
        <div className="px-5 py-6">
          <p className="font-display text-lg tracking-tight">RouteWise</p>
          <p className="mt-0.5 text-xs uppercase tracking-wide text-white/50">{title}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                clsx(
                  'block rounded-md px-3 py-2 text-sm transition-colors',
                  isActive ? 'bg-white/10 text-white font-medium' : 'text-white/70 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-4 py-4">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-md border border-white/20 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10 hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-[#F7F8FA]">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
