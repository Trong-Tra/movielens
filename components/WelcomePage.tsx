'use client';

import { useState } from 'react';
import { User } from '@/types';
import { FaFilm, FaUser, FaCalendar } from 'react-icons/fa';

interface WelcomePageProps {
  onUserCreated: (user: User) => void;
}

export default function WelcomePage({ onUserCreated }: WelcomePageProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      alert('Please enter your name');
      return;
    }

    const user: User = {
      id: Math.floor(Math.random() * 90000) + 10000,
      name: name.trim(),
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
    };

    onUserCreated(user);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl animate-bounce">
              <FaFilm className="text-5xl text-indigo-600" />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 drop-shadow-lg">
            Movie Recommendation
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 drop-shadow">
            Discover your next favorite movie powered by AI
          </p>
        </div>

        {/* Registration Form */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Get Started
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FaUser className="text-indigo-500" />
                    <span>Name *</span>
                  </div>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                  required
                />
              </div>

              {/* Age Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <div className="flex items-center gap-2">
                    <FaCalendar className="text-indigo-500" />
                    <span>Age (Optional)</span>
                  </div>
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="Your age"
                  min="1"
                  max="120"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
                />
              </div>

              {/* Gender Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Gender (Optional)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors bg-white"
                >
                  <option value="">Prefer not to say</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full btn btn-primary py-4 text-lg mt-6"
              >
                Start Exploring
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              * Required field
            </p>
          </div>

          {/* Feature Highlights */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-white font-semibold text-sm">Personalized</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-white font-semibold text-sm">AI Powered</p>
            </div>
            <div className="bg-white/20 backdrop-blur rounded-lg p-4">
              <div className="text-3xl mb-2">⚡</div>
              <p className="text-white font-semibold text-sm">Instant</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
