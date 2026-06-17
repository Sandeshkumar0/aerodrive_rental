import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { setStoredAuth } from '../auth';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(`/api/auth/${isSignup ? 'register' : 'login'}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || 'Authentication failed');
      } else {
        setStoredAuth(data);
        navigate('/fleet');
      }
    } catch {
      setError('Could not connect to AeroDrive auth.');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 mesh-bg opacity-80"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-3xl border border-white/10 p-8 relative z-10"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            {isSignup ? <UserPlus className="w-8 h-8" /> : <LogIn className="w-8 h-8" />}
          </div>
          <h1 className="text-3xl font-black font-display text-white">
            {isSignup ? 'Create Account' : 'Login'}
          </h1>
          <p className="text-zinc-400 mt-2">
            {isSignup ? 'Join AeroDrive to book your vehicle.' : 'Continue to your AeroDrive fleet.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignup && (
            <>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Phone</label>
                <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-emerald-500 transition-colors" />
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-3">{error}</div>}

          <button className="w-full py-3 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors">
            {loading ? 'Please wait...' : isSignup ? 'Sign Up' : 'Login'}
          </button>
        </form>

        <p className="text-center text-zinc-400 text-sm mt-6">
          {isSignup ? 'Already registered?' : 'New to AeroDrive?'}{' '}
          <Link to={isSignup ? '/login' : '/signup'} className="text-emerald-400 hover:text-emerald-300 font-bold">
            {isSignup ? 'Login' : 'Sign up'}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
