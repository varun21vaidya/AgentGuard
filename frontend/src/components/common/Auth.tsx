import React, { useState } from 'react';

interface AuthProps {
  onAuthenticated: (token: string) => void;
}

export default function Auth({ onAuthenticated }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      localStorage.setItem('agentguard_token', data.token);
      onAuthenticated(data.token);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-xl font-bold mb-1">AgentGuard</h1>
        <p className="text-sm text-gray-500 mb-6">
          {mode === 'login' ? 'Log in to your pipelines' : 'Create an account'}
        </p>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</div>}

        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="Email" required
          className="w-full mb-3 px-3 py-2 border rounded text-sm"
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="Password" required minLength={8}
          className="w-full mb-3 px-3 py-2 border rounded text-sm"
        />
        {mode === 'signup' && (
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Name (optional)"
            className="w-full mb-4 px-3 py-2 border rounded text-sm"
          />
        )}

        <button type="submit" className="w-full bg-blue-500 text-white rounded py-2 font-semibold hover:bg-blue-600">
          {mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <button
          type="button"
          onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
          className="w-full mt-3 text-sm text-gray-500 hover:underline"
        >
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </form>
    </div>
  );
}
