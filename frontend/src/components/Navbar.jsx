import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, CarFront, UserCircle } from 'lucide-react';
import { clearStoredAuth, getStoredAuth } from '../auth';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, refresh } = getStoredAuth();

  const logout = () => {
    fetch('/api/auth/logout/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh })
    }).catch(() => {});
    clearStoredAuth();
    navigate('/');
  };

  const links = [
    { name: 'Home', path: '/' },
    { name: 'Fleet', path: '/fleet' },
    { name: 'My Reservations', path: '/reservations' },
  ];

  if (user?.is_admin) {
    links.push({ name: 'Admin Console', path: '/admin' });
  }

  return (
    <header className="sticky top-0 z-50 bg-slate-950/60 backdrop-blur-2xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div 
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              <CarFront className="w-8 h-8 text-emerald-400" />
              <div className="absolute top-0 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse-glow"></div>
            </motion.div>
            <span className="font-display font-bold text-2xl tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              AeroDrive
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center space-x-8">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative text-sm font-medium transition-colors hover:text-emerald-400 ${
                    isActive ? 'text-emerald-400' : 'text-zinc-400'
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute -bottom-2 left-0 right-0 h-0.5 bg-emerald-500 rounded-full"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                {user.profile_pic_url ? (
                  <img src={user.profile_pic_url} alt={user.name} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                ) : (
                  <UserCircle className="w-9 h-9 text-emerald-400" />
                )}
                <span className="text-sm text-zinc-400">{user.name}</span>
                <button onClick={logout} className="px-4 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors">
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-4 py-2 rounded-full border border-white/10 text-white hover:bg-white/5 transition-colors">
                    Login
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="relative overflow-hidden group bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-6 py-2.5 rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                    <span className="relative z-10">Sign Up</span>
                    <div className="absolute inset-0 h-full w-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:animate-shimmer z-0"></div>
                  </button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-slate-900 border-b border-white/5 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-1">
              {links.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-3 rounded-xl text-base font-medium ${
                    location.pathname === link.path
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 px-3 space-y-3">
                {user ? (
                  <button onClick={() => { setIsOpen(false); logout(); }} className="w-full bg-white/5 text-white font-bold px-6 py-3 rounded-xl">
                    Logout
                  </button>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setIsOpen(false)}>
                      <button className="w-full bg-white/5 text-white font-bold px-6 py-3 rounded-xl">
                        Login
                      </button>
                    </Link>
                    <Link to="/signup" onClick={() => setIsOpen(false)}>
                      <button className="w-full bg-emerald-500 text-slate-950 font-bold px-6 py-3 rounded-xl">
                        Sign Up
                      </button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
