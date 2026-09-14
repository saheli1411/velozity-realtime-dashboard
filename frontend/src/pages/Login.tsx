import React, { useState } from 'react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      login(res.data.data.accessToken, res.data.data.user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid credentials');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={handleLogin} className="w-full max-w-sm bg-white p-6 rounded-2xl shadow-md space-y-4">
        <h2 className="text-xl font-bold text-center text-gray-800">Velozity Project Hub</h2>
        {error && <p className="text-red-600 text-xs text-center">{error}</p>}
        <div>
          <label className="text-xs font-semibold text-gray-600">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm mt-1 outline-none"
            placeholder="admin@velozity.com"
            required
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-600">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm mt-1 outline-none"
            placeholder="••••••••"
            required
          />
        </div>
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg text-sm transition">
          Sign In
        </button>
      </form>
    </div>
  );
};