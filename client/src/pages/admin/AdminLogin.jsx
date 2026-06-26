import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

const AdminLogin = () => {
  const { login, admin, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Auto redirect if already logged in
  useEffect(() => {
    if (!loading && admin) {
      navigate('/admin/dashboard');
    }
  }, [admin, loading, navigate]);

  // Set message if session expired
  useEffect(() => {
    if (searchParams.get('expired') === 'true') {
      setError('Your administrative session has expired. Please log in again.');
    }
  }, [searchParams]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all credentials fields');
      return;
    }

    setError('');
    setSubmitting(true);
    
    const result = await login(email, password);
    setSubmitting(false);

    if (result.success) {
      navigate('/admin/dashboard');
    } else {
      setError(result.message || 'Login failed. Please check credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6 relative overflow-hidden">
      {/* Visual background gradient circle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-md w-full bg-neutral-950 border border-white/5 p-8 md:p-10 rounded-2xl relative z-10 shadow-2xl space-y-8">
        {/* Title branding */}
        <div className="text-center space-y-2">
          <span className="bg-white text-black px-2 py-0.5 rounded-sm text-xs font-extrabold uppercase tracking-wider">PORTAL</span>
          <h1 className="text-2xl uppercase tracking-wider font-extrabold font-display pt-2">Admin Login</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-widest">TwoShot Creative Management</p>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/20 text-red-400 text-xs px-4 py-3 rounded-lg flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 pl-11 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="admin@twoshot.com"
              />
              <Mail className="w-4 h-4 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-wider text-neutral-400 font-semibold block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 pl-11 pr-11 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
              />
              <Lock className="w-4 h-4 text-neutral-600 absolute left-4 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-600 hover:text-neutral-400 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-white text-black font-bold uppercase tracking-widest text-xs py-3.5 rounded-lg hover:bg-neutral-200 transition-colors flex items-center justify-center disabled:opacity-50 mt-4 cursor-pointer"
          >
            {submitting ? 'Authenticating...' : 'Sign In Portal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
