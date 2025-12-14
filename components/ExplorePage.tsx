'use client';

import { useState, useEffect } from 'react';
import { Recommendation, ModelInfo, Movie } from '@/types';
import { getModels, getRecommendations, searchMovies } from '@/lib/api';
import { FaRobot, FaSearch, FaStar, FaPlay, FaUser, FaRandom } from 'react-icons/fa';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';

export default function ExplorePage() {
  const { currentUserId, setCurrentUserId } = useUser();
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userIdInput, setUserIdInput] = useState('');

  useEffect(() => {
    loadModels();
  }, []);

  useEffect(() => {
    if (selectedModel && currentUserId) {
      loadRecommendations();
    }
  }, [selectedModel, topK, currentUserId]);

  const loadModels = async () => {
    try {
      const availableModels = await getModels();
      // Filter out Popularity model
      const filteredModels = availableModels.filter(m => m.name !== 'Popularity');
      setModels(filteredModels);
      if (filteredModels.length > 0) {
        setSelectedModel(filteredModels[0].name);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    }
  };

  const handleUserIdChange = () => {
    const userId = parseInt(userIdInput);
    if (userId >= 1 && userId <= 6040) {
      setCurrentUserId(userId);
      setShowUserModal(false);
      setUserIdInput('');
    }
  };

  const loadRecommendations = async () => {
    if (!selectedModel || !currentUserId) return;

    setLoading(true);
    setError(null);

    try {
      const recs = await getRecommendations(currentUserId, selectedModel, topK);
      setRecommendations(recs);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchMovies(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const currentModel = models.find(m => m.name === selectedModel);

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-black via-[#141414] to-[#141414] py-20 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
            Discover <span className="text-[#e50914]">Movies</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            AI-powered recommendations based on 1M real ratings
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded px-6 py-3">
              <span className="text-gray-500 text-sm">Viewing: </span>
              <span className="text-xl font-bold text-white">User #{currentUserId}</span>
            </div>
            <button
              onClick={() => setShowUserModal(true)}
              className="bg-[#2f2f2f] hover:bg-gray-700 border border-gray-800 text-white px-6 py-3 rounded font-semibold flex items-center gap-2 transition-colors"
            >
              <FaUser /> Not you?
            </button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Model Selector */}
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
              <FaRobot className="text-[#e50914]" />
              Algorithm
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full px-4 py-3 border border-gray-800 rounded bg-[#1a1a1a] text-white focus:border-[#e50914] focus:outline-none transition-colors"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {currentModel && (
              <p className="mt-2 text-sm text-gray-500">{currentModel.description}</p>
            )}
          </div>

          {/* Top-K Selector */}
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
              Results
            </label>
            <div className="flex items-center gap-4 bg-[#1a1a1a] border border-gray-800 rounded px-4 py-3">
              <input
                type="range"
                min="5"
                max="20"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="flex-1 accent-[#e50914]"
              />
              <span className="text-xl font-bold text-[#e50914] min-w-[3rem] text-center">{topK}</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <label className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
            <FaSearch className="text-[#e50914]" />
            Search Movies
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a movie..."
              className="flex-1 px-4 py-3 border border-gray-800 rounded bg-[#1a1a1a] text-white placeholder-gray-600 focus:border-[#e50914] focus:outline-none transition-colors"
            />
            <button onClick={handleSearch} className="btn btn-primary px-8">
              Search
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-bold mb-4">Search Results</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map(movie => (
                <div key={movie.id} className="movie-card">
                  <div className="aspect-[2/3] bg-[#2f2f2f] flex items-center justify-center p-4">
                    <div className="text-center">
                      <FaStar className="text-[#e50914] text-3xl mx-auto mb-2" />
                      <p className="text-xs text-gray-400">Movie #{movie.id}</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-semibold text-sm mb-2 line-clamp-2">{movie.title}</h4>
                    <div className="flex flex-wrap gap-1">
                      {movie.genres.slice(0, 2).map(genre => (
                        <span key={genre} className="genre-tag text-xs">{genre}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6">
          Recommended for User #{currentUserId}
        </h2>

        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#e50914]"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-16">
            <p className="text-red-500 text-xl mb-4">{error}</p>
            <button onClick={loadRecommendations} className="btn btn-primary">
              Retry
            </button>
          </div>
        )}

        {!loading && !error && recommendations.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {recommendations.map((rec, index) => (
              <div key={rec.movie.id} className="movie-card relative group">
                {/* Rank Badge */}
                <div className="absolute top-2 left-2 bg-[#e50914] text-white px-3 py-1 rounded font-bold text-sm z-10">
                  #{index + 1}
                </div>

                <div className="aspect-[2/3] bg-[#2f2f2f] flex items-center justify-center p-4 relative overflow-hidden">
                  <div className="text-center">
                    <FaStar className="text-[#e50914] text-4xl mx-auto mb-2" />
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="text-2xl font-bold text-white">{rec.score.toFixed(4)}</p>
                  </div>
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <FaPlay className="text-white text-3xl" />
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{rec.movie.title}</h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.movie.genres.slice(0, 3).map(genre => (
                      <span key={genre} className="genre-tag text-xs">{genre}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User ID Change Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setShowUserModal(false)}>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold text-white mb-4">Enter Your User ID</h2>
            <p className="text-gray-400 mb-6">Enter a user ID between 1 and 6040</p>
            
            <input
              type="number"
              min="1"
              max="6040"
              value={userIdInput}
              onChange={(e) => setUserIdInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleUserIdChange()}
              placeholder="User ID (1-6040)"
              className="w-full bg-[#2f2f2f] border border-gray-700 text-white px-4 py-3 rounded mb-4 focus:outline-none focus:border-[#e50914]"
            />

            <div className="flex gap-3">
              <button
                onClick={handleUserIdChange}
                className="flex-1 bg-[#e50914] hover:bg-[#f40612] text-white py-3 rounded font-semibold transition-colors"
              >
                Confirm
              </button>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setUserIdInput('');
                }}
                className="flex-1 bg-[#2f2f2f] hover:bg-gray-700 text-white py-3 rounded font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
