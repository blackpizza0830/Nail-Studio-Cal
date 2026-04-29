'use client';

import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Loader2, Lock } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin');
    } catch {
      setError('E-Mail oder Passwort ist falsch.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-brand-ink rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock size={18} className="text-white" />
          </div>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C8A97E] mb-2">Studio Cherry</p>
          <h1 className="text-2xl font-serif italic">Admin Login</h1>
        </div>

        <form onSubmit={handleLogin} className="bg-white border border-[#EFEFEF] rounded-2xl p-8 shadow-sm space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-xs p-3 rounded-lg text-center">
              {error}
            </div>
          )}
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">E-Mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors"
              placeholder="ihre@email.de"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest font-bold block mb-2">Passwort</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-[#E8E8E8] rounded-lg p-3.5 text-sm focus:outline-none focus:border-brand-ink transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            disabled={loading}
            className="w-full minimal-button py-3.5 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Einloggen'}
          </button>
        </form>
      </div>
    </main>
  );
}
