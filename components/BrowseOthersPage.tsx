'use client';

import { useState, useEffect } from 'react';
import { Recommendation, ModelInfo } from '@/types';
import { getModels, getRecommendations } from '@/lib/api';
import { FaStar, FaRandom, FaPlay, FaRobot } from 'react-icons/fa';

export default function BrowseOthersPage() {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [viewingUserId, setViewingUserId] = useState<number>(1);

  useEffect(() => {
    loadModels();
    loadRandomUser();
  }, []);

  useEffect(() => {
    if (selectedModel && viewingUserId) {
      loadRecommendations();
    }
  }, [selectedModel, topK, viewingUserId]);

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

  const loadRandomUser = () => {
    const randomUserId = Math.floor(Math.random() * 6040) + 1;
    setViewingUserId(randomUserId);
  };

  const loadRecommendations = async () => {
    if (!selectedModel || !viewingUserId) return;

    setLoading(true);
    setError(null);

    try {
      const recs = await getRecommendations(viewingUserId, selectedModel, topK);
      setRecommendations(recs);
    } catch (err) {
      setError('Failed to load recommendations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const currentModel = models.find(m => m.name === selectedModel);

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-black via-[#141414] to-[#141414] py-20 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tight">
            Browse <span className="text-[#e50914]">Others</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Explore what other users are watching
          </p>
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="bg-[#1a1a1a] border border-gray-800 rounded px-6 py-3">
              <span className="text-gray-500 text-sm">Viewing: </span>
              <span className="text-xl font-bold text-white">User #{viewingUserId}</span>
            </div>
            <button
              onClick={loadRandomUser}
              className="bg-[#e50914] hover:bg-[#f40612] text-white px-6 py-3 rounded font-semibold flex items-center gap-2 transition-colors"
            >
              <FaRandom /> Random User
            </button>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Algorithm Selection */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FaRobot className="text-[#e50914] text-xl" />
              <h3 className="text-lg font-bold text-white">ALGORITHM</h3>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full bg-[#2f2f2f] border border-gray-700 text-white px-4 py-3 rounded focus:outline-none focus:border-[#e50914]"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>{model.name}</option>
              ))}
            </select>
            {currentModel && (
              <p className="text-gray-400 text-sm mt-3">{currentModel.description}</p>
            )}
          </div>

          {/* Results Count */}
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-4">RESULTS</h3>
            <input
              type="range"
              min="5"
              max="50"
              value={topK}
              onChange={(e) => setTopK(parseInt(e.target.value))}
              className="w-full accent-[#e50914]"
            />
            <div className="flex justify-between mt-2">
              <span className="text-gray-400 text-sm">5</span>
              <span className="text-[#e50914] text-2xl font-bold">{topK}</span>
              <span className="text-gray-400 text-sm">50</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-2xl font-bold mb-6">
          Recommended for User #{viewingUserId}
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
    </div>
  );
}
