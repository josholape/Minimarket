import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthForm({ mode }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const inputClass = 'mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 disabled:bg-slate-100';

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      navigate('/');
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'Something went wrong. Please try again.', isError: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-[calc(100svh-4rem)] bg-slate-50 px-5 py-10 sm:py-16">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/40 lg:grid-cols-2">
        <aside className="relative flex flex-col justify-between overflow-hidden bg-brand-700 p-8 text-white sm:p-12">
          <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[40px] border-white/10" />
          <Link to="/" className="relative w-fit text-xl font-bold tracking-tight">MiniMarket<span className="text-blue-200">.</span></Link>
          <div className="relative py-10 lg:py-20">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">Your everyday marketplace</p>
            <h2 className="max-w-sm text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Little finds.<br />Big possibilities.</h2>
            <p className="mt-6 max-w-xs leading-7 text-blue-100">Discover your next favorite, save it to your cart, and make it yours.</p>
          </div>
          <p className="relative text-sm text-blue-100">Browse. Discover. Enjoy.</p>
        </aside>
        <section aria-labelledby="auth-title" className="p-7 sm:p-12">
          <Link to="/" className="text-sm text-slate-500 hover:text-brand-700">← Back to shopping</Link>
          <h1 id="auth-title" className="mt-9 text-3xl font-bold tracking-tight">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
          <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">{isRegister ? 'A few details and you’re ready to explore.' : 'Sign in to your MiniMarket account.'}</p>
          {message && <p role="alert" className={`mb-5 rounded-xl p-4 text-sm ${message.isError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'}`}>{message.text}</p>}
          <form onSubmit={handleSubmit} aria-busy={busy} className="space-y-5">
            {isRegister && <div>
              <label htmlFor="auth-name" className="text-sm font-medium">Full name</label>
              <input id="auth-name" name="name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} maxLength={100} required disabled={busy} className={inputClass} placeholder="Your name" />
            </div>}
            <div>
              <label htmlFor="auth-email" className="text-sm font-medium">Email address</label>
              <input id="auth-email" name="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={150} required disabled={busy} className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="auth-password" className="text-sm font-medium">Password</label>
              <div className="relative">
                <input id="auth-password" name="password" type={visible ? 'text' : 'password'} autoComplete={isRegister ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={isRegister ? 8 : undefined} maxLength={isRegister ? 72 : undefined} aria-describedby={isRegister ? 'password-help' : undefined} required disabled={busy} className={`${inputClass} pr-20`} />
                <button type="button" aria-controls="auth-password" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(v => !v)} className="absolute right-3 top-5 rounded px-1 py-1 text-sm font-medium text-brand-700">{visible ? 'Hide' : 'Show'}</button>
              </div>
              {isRegister && <p id="password-help" className="mt-2 text-xs text-slate-500">Use at least 8 characters.</p>}
            </div>
            {!isRegister && <div className="text-right"><Link to="/forgot-password" className="text-sm font-medium text-brand-700 hover:underline">Forgot password?</Link></div>}
            <button type="submit" disabled={busy} className="w-full rounded-xl bg-brand-600 px-4 py-3.5 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-wait disabled:opacity-60">{busy ? (isRegister ? 'Creating account…' : 'Signing in…') : (isRegister ? 'Create account' : 'Sign in')}</button>
            <span role="status" className="sr-only">{busy ? 'Please wait. Your request is processing.' : ''}</span>
          </form>
          <p className="mt-8 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
            {isRegister ? 'Already have an account? ' : 'New to MiniMarket? '}
            <Link to={isRegister ? '/login' : '/register'} className="font-semibold text-brand-700 hover:underline">{isRegister ? 'Sign in' : 'Create an account'}</Link>
          </p>
        </section>
      </div>
    </main>
  );
}
