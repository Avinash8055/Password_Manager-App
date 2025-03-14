import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';

interface AuthScreenProps {
  onAuth: () => void;
}

export function AuthScreen({ onAuth }: AuthScreenProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const storedPassword = localStorage.getItem('masterPassword') || '123';
    
    if (password === storedPassword) {
      setError('');
      onAuth();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-12">
          <div className="bg-gray-800/50 p-4 rounded-full mb-6">
            <KeyRound className="w-12 h-12 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Password Safe</h1>
          <p className="text-gray-400">Secure your digital life</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full bg-gray-800 text-white border-0 rounded-lg px-4 py-3 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:outline-none ${
                error ? 'ring-2 ring-red-500' : ''
              }`}
              placeholder="Enter master password"
            />
            {error && (
              <p className="text-red-400 text-sm mt-2 flex items-center justify-center">
                {error}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition-colors"
          >
            Unlock
          </button>
        </form>
      </div>
    </div>
  );
}