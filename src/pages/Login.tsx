import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Activity, AlertCircle, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Auth state change will trigger redirect via AuthContext
      // Read the user profile to determine role
      const { getDoc, doc } = await import('firebase/firestore');
      const { auth, firestore } = await import('../config/firebase');
      const user = auth.currentUser;
      if (user) {
        const profileDoc = await getDoc(doc(firestore, 'users', user.uid));
        if (profileDoc.exists()) {
          const role = profileDoc.data().role;
          navigate(`/${role}`, { replace: true });
        }
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else {
        setError(err.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate hover:text-primary transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 font-bold text-2xl text-primary mb-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Activity className="text-white w-5 h-5" />
            </div>
            ImpactAI
          </div>
          <p className="text-sm text-slate">Sign in to your account</p>
        </div>

        <div className="bg-white border border-border rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-danger text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold uppercase text-slate block mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-slate block mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border focus:ring-2 focus:ring-primary outline-none"
                placeholder="Enter password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate">
            Don't have an account?{' '}
            <Link to="/register/ngo" className="text-primary font-semibold hover:underline">
              Register as NGO
            </Link>{' '}
            or{' '}
            <Link to="/register/volunteer" className="text-primary font-semibold hover:underline">
              Register as Volunteer
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
