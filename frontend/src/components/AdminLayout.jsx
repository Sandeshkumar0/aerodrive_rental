import { Outlet } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-2xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="text-lg font-black tracking-tight">AeroDrive Admin</div>
              <div className="text-xs text-zinc-400 uppercase tracking-[0.2em]">Control Room</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center space-x-6 text-sm text-zinc-400">
            <a className="hover:text-emerald-400 transition-colors" href="#bookings">Bookings</a>
            <a className="hover:text-emerald-400 transition-colors" href="#vehicles">Vehicles</a>
            <a className="hover:text-emerald-400 transition-colors" href="#damage">Damage</a>
            <a className="hover:text-emerald-400 transition-colors" href="#safety">Safety Logs</a>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Outlet />
      </main>
    </div>
  );
}
