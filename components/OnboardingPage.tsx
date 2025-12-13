'use client';

import { useState, useEffect } from 'react';
import { User, Movie } from '@/types';
import { searchMovies } from '@/lib/api';
import { FaStar, FaRedo, FaCheck, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

interface OnboardingPageProps {
  user: User;
  onComplete: (ratings: Map<number, number>) => void;
}

const REQUIRED_RATINGS = 5;

export default function OnboardingPage({ user, onComplete }: OnboardingPageProps) {
  const [movies, setMovies] = useState<Movie[]>([]);
  const [ratings, setRatings] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRandomMovies();
  }, []);

  const loadRandomMovies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const queries = ['star', 'matrix', 'godfather', 'lord', 'harry', 'avengers', 'inception', 'batman'];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const results = await searchMovies(randomQuery, 20);
      const shuffled = results.sort(() => Math.random() - 0.5).slice(0, 10);
      
      setMovies(shuffled);
    } catch (err) {
      setError('Failed to load movies. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (movieId: number, rating: number) => {
    const newRatings = new Map(ratings);
    newRatings.set(movieId, rating);
    setRatings(newRatings);
  };

  const clearRating = (movieId: number) => {
    const newRatings = new Map(ratings);
    newRatings.delete(movieId);
    setRatings(newRatings);
  };

  const handleComplete = () => {
    if (ratings.size >= REQUIRED_RATINGS) {
      onComplete(ratings);
    }
  };

  const progress = Math.min((ratings.size / REQUIRED_RATINGS) * 100, 100);
  const canProceed = ratings.size >= REQUIRED_RATINGS;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-xl mb-4">{error}</p>
          <button onClick={loadRandomMovies} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-white/90 hover:text-white mb-4 transition-colors"
          >
            <FaArrowLeft />
            Back to Explore
          </Link>
          <h1 className="text-4xl font-bold mb-3">Rate Some Movies</h1>
          <p className="text-xl text-white/90 mb-8">
            Help us understand your taste by rating at least {REQUIRED_RATINGS} movies
          </p>

          {/* Progress Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-white/20 rounded-full h-3 overflow-hidden mb-3">
              <div 
                className="bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold">
              {canProceed && <FaCheck className="text-green-400 bg-white rounded-full p-1" />}
              <span>
                {ratings.size} / {REQUIRED_RATINGS} movies rated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto py-16 px-4">
        {/* Controls */}
        <div className="flex justify-between items-center mb-10 flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-gray-800">Rate These Movies</h2>
          <button
            onClick={loadRandomMovies}
            className="btn btn-secondary flex items-center gap-2"
          >
            <FaRedo />
            Get Different Movies
          </button>
        </div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {movies.map((movie) => {
            const userRating = ratings.get(movie.id);
            const isRated = userRating !== undefined;

            return (
              <div
                key={movie.id}
                className={`card p-6 transition-all ${
                  isRated ? 'ring-2 ring-green-500 bg-green-50' : ''
                }`}
              >
                {/* Movie Header */}
                <div className="flex justify-between items-start gap-3 mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex-1">
                    {movie.title}
                  </h3>
                  {isRated && (
                    <span className="flex items-center gap-1 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold whitespace-nowrap">
                      <FaCheck className="text-xs" />
                      Rated
                    </span>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-2 mb-5">
                  {movie.genres.map((genre) => (
                    <span key={genre} className="genre-tag">
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Rating Section */}
                <div className="border-t border-gray-200 pt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Rate this movie:
                  </p>
                  
                  {/* Star Rating */}
                  <div className="flex gap-2 mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleRating(movie.id, star)}
                        className={`text-3xl transition-all hover:scale-110 ${
                          userRating && star <= userRating
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-300'
                        }`}
                      >
                        <FaStar />
                      </button>
                    ))}
                  </div>

                  {/* Clear Button */}
                  {isRated && (
                    <button
                      onClick={() => clearRating(movie.id)}
                      className="text-sm text-gray-500 hover:text-red-600 underline"
                    >
                      Clear rating
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="text-center space-y-4">
          {!canProceed && (
            <p className="text-gray-600 text-lg">
              Rate {REQUIRED_RATINGS - ratings.size} more movie{REQUIRED_RATINGS - ratings.size !== 1 ? 's' : ''} to continue
            </p>
          )}
          
          <button
            onClick={handleComplete}
            disabled={!canProceed}
            className="btn btn-primary text-lg px-12 py-4"
          >
            See My Recommendations
          </button>
        </div>
      </div>
    </div>
  );
}
