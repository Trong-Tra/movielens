'use client';

import { useState, useEffect } from 'react';
import { Recommendation, ModelInfo, Movie } from '@/types';
import { getModels, getRecommendations, searchMovies } from '@/lib/api';
import { FaRobot, FaChartLine, FaSearch, FaStar, FaUserPlus, FaRandom } from 'react-icons/fa';
import Link from 'next/link';

export default function ExplorePage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [currentUserId, setCurrentUserId] = useState<number>(1);

  useEffect(() => {
    loadModels();
    loadRandomUser();
  }, []);

  useEffect(() => {
    if (selectedModel && currentUserId) {
      loadRecommendations();
    }
  }, [selectedModel, topK, currentUserId]);

  const loadModels = async () => {
    try {
      const availableModels = await getModels();
      setModels(availableModels);
      if (availableModels.length > 0) {
        setSelectedModel(availableModels[0].name);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error(err);
    }
  };

  const loadRandomUser = () => {
    const randomUserId = Math.floor(Math.random() * 6040) + 1;
    setCurrentUserId(randomUserId);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl md:text-6xl font-bold mb-4">Movie Recommendation System</h1>
            <p className="text-xl text-white/90 mb-6">
              Explore personalized recommendations powered by multiple AI algorithms
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/create" className="btn btn-secondary bg-white text-indigo-600 hover:bg-gray-100 flex items-center gap-2">
                <FaUserPlus />
                Try It Yourself
              </Link>
              <button
                onClick={loadRandomUser}
                className="btn bg-white/20 text-white border-2 border-white hover:bg-white hover:text-indigo-600 flex items-center gap-2"
              >
                <FaRandom />
                Random User
              </button>
            </div>
          </div>
          
          <div className="text-center">
            <p className="text-lg text-white/80 mb-2">
              Currently viewing recommendations for
            </p>
            <div className="inline-block bg-white/20 backdrop-blur rounded-lg px-6 py-3">
              <span className="text-2xl font-bold">User #{currentUserId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white border-b border-gray-200 py-8 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Model Selector */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <FaRobot className="text-indigo-500" />
              Recommendation Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="max-w-md w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors bg-white text-lg"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {currentModel && (
              <p className="mt-2 text-gray-600">{currentModel.description}</p>
            )}
          </div>

          {/* Top-K Selector */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <FaChartLine className="text-indigo-500" />
              Number of Recommendations
            </label>
            <div className="flex items-center gap-4 max-w-md">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="text-2xl font-bold text-indigo-600 min-w-[50px] text-center">
                {topK}
              </span>
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="flex items-center gap-2 text-lg font-semibold text-gray-700 mb-3">
              <FaSearch className="text-indigo-500" />
              Search Movies
            </label>
            <div className="flex gap-3 max-w-2xl">
              <input
                type="text"
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none transition-colors"
              />
              <button onClick={handleSearch} className="btn btn-secondary">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-12 px-4">
        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Search Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map(movie => (
                <div key={movie.id} className="card p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{movie.title}</h3>
                  <div className="flex flex-wrap gap-2">
                    {movie.genres.map(genre => (
                      <span key={genre} className="genre-tag">{genre}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">
            Recommendations for User #{currentUserId}
            {selectedModel && ` • ${selectedModel}`}
          </h2>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 text-lg">Loading recommendations...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-16">
              <p className="text-red-600 text-xl mb-4">{error}</p>
              <button onClick={loadRecommendations} className="btn btn-primary">
                Retry
              </button>
            </div>
          )}

          {!loading && !error && recommendations.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-xl">No recommendations available</p>
            </div>
          )}

          {!loading && !error && recommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((rec, index) => (
                <div key={rec.movie.id} className="card p-6 relative overflow-hidden">
                  {/* Rank Badge */}
                  <div className="absolute top-0 right-0 bg-indigo-500 text-white px-4 py-2 rounded-bl-xl font-bold text-lg">
                    #{index + 1}
                  </div>

                  <div className="pr-12 mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">
                      {rec.movie.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {rec.movie.genres.map(genre => (
                        <span key={genre} className="genre-tag">{genre}</span>
                      ))}
                    </div>
                    <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm">
                      <span className="text-gray-600">Score: </span>
                      <span className="font-bold text-indigo-600">{rec.score.toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Features */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaRobot className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Multiple Algorithms</h3>
              <p className="text-gray-600">
                Choose from popularity, collaborative filtering, matrix factorization, and graph-based models
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaChartLine className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real Data</h3>
              <p className="text-gray-600">
                Based on 1M ratings from 6,040 users on 3,883 movies from MovieLens
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserPlus className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Try It Yourself</h3>
              <p className="text-gray-600">
                Rate some movies and get personalized recommendations tailored to your taste
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
