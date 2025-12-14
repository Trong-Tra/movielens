'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import { FaStar, FaArrowRight, FaCheck } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import MovieCard from '@/components/MovieCard';
import MovieDetailsModal from '@/components/MovieDetailsModal';

export default function OnboardingPage() {
  const router = useRouter();
  const { setCurrentUserId } = useUser();
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [ratings, setRatings] = useState<Map<number, number>>(new Map());
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [newUserId, setNewUserId] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'intro' | 'rating' | 'complete'>('intro');

  const MIN_RATINGS = 10;
  const MOVIES_PER_PAGE = 5;

  useEffect(() => {
    loadPopularMovies();
    fetchNextUserId();
  }, []);

  const fetchNextUserId = async () => {
    try {
      const response = await fetch('/api/users/next-id');
      const data = await response.json();
      setNewUserId(data.nextUserId);
    } catch (error) {
      console.error('Failed to fetch next user ID:', error);
      // Fallback to 6041 if API fails
      setNewUserId(6041);
    }
  };

  const loadPopularMovies = async () => {
    try {
      setLoading(true);
      // Get popular movies using Popularity model
      const response = await fetch('/api/recommendations/1?model=Popularity&n=50');
      const data = await response.json();
      
      const movieList = data.recommendations.map((rec: any) => ({
        id: rec.itemId,
        title: rec.title,
        genres: rec.genres
      }));
      
      setMovies(movieList);
    } catch (error) {
      console.error('Failed to load movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (movieId: number, rating: number) => {
    const newRatings = new Map(ratings);
    newRatings.set(movieId, rating);
    setRatings(newRatings);
    setSelectedMovie(null);
  };

  const handleNext = () => {
    const nextPage = currentPage + 1;
    const maxPage = Math.ceil(movies.length / MOVIES_PER_PAGE) - 1;
    if (nextPage <= maxPage) {
      setCurrentPage(nextPage);
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const submitRatings = async () => {
    if (ratings.size < MIN_RATINGS) return;

    setSubmitting(true);
    
    try {
      // Submit all ratings to backend via Next.js proxy
      for (const [movieId, rating] of ratings) {
        await fetch('/api/ratings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: newUserId,
            movieId,
            rating
          })
        });
      }

      // Set the new user ID in context
      setCurrentUserId(newUserId);
      setStep('complete');
    } catch (error) {
      console.error('Failed to submit ratings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const goToRecommendations = () => {
    router.push('/');
  };

  const startIndex = currentPage * MOVIES_PER_PAGE;
  const endIndex = Math.min(startIndex + MOVIES_PER_PAGE, movies.length);
  const currentMovies = movies.slice(startIndex, endIndex);
  const progress = (ratings.size / MIN_RATINGS) * 100;
  const totalPages = Math.ceil(movies.length / MOVIES_PER_PAGE);
  const hasNext = currentPage < totalPages - 1;
  const hasPrevious = currentPage > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#e50914]"></div>
      </div>
    );
  }

  if (step === 'intro') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            Welcome to <span className="text-[#e50914]">MOVIELENS</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            To get personalized movie recommendations, we need to understand your taste.
            Rate at least {MIN_RATINGS} movies to get started.
          </p>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-8 mb-8">
            <div className="flex items-center justify-center gap-6 mb-6">
              <div className="text-center">
                <div className="text-4xl font-black text-[#e50914] mb-2">{MIN_RATINGS}+</div>
                <div className="text-sm text-gray-400">Movies to Rate</div>
              </div>
              <div className="h-16 w-px bg-gray-800"></div>
              <div className="text-center">
                <div className="text-4xl font-black text-[#e50914] mb-2">~3</div>
                <div className="text-sm text-gray-400">Minutes</div>
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              Your User ID: <span className="text-white font-mono">#{newUserId}</span>
            </p>
          </div>
          <button
            onClick={() => setStep('rating')}
            className="bg-[#e50914] hover:bg-[#f40612] text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 mx-auto transition-colors"
          >
            Start Rating <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  if (step === 'complete') {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center px-4">
        <div className="max-w-2xl text-center">
          <div className="mb-6 flex justify-center">
            <div className="w-24 h-24 bg-[#e50914] rounded-full flex items-center justify-center">
              <FaCheck className="text-white text-5xl" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">
            You're All <span className="text-[#e50914]">Set!</span>
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            You've rated {ratings.size} movies. We're ready to generate your personalized recommendations!
          </p>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 mb-8">
            <p className="text-gray-400 mb-2">Your User ID</p>
            <p className="text-3xl font-black text-[#e50914] font-mono">#{newUserId}</p>
            <p className="text-sm text-gray-500 mt-2">Save this ID to access your recommendations later</p>
          </div>
          <button
            onClick={goToRecommendations}
            className="bg-[#e50914] hover:bg-[#f40612] text-white px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-3 mx-auto transition-colors"
          >
            View My Recommendations <FaArrowRight />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 bg-[#1a1a1a] border-b border-gray-800 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-400">
              Progress: {ratings.size} / {MIN_RATINGS} movies rated
            </div>
            <div className="text-sm text-gray-400">
              Page {currentPage + 1} / {totalPages}
            </div>
          </div>
          <div className="w-full bg-[#2f2f2f] rounded-full h-2 overflow-hidden">
            <div 
              className="bg-[#e50914] h-full transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Rating Interface */}
      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-gray-400 text-lg">Click on a movie to view details and rate it</p>
          </div>

          {/* Movies Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {currentMovies.map((movie) => {
              const userRating = ratings.get(movie.id) || 0;
              return (
                <div key={movie.id} className="relative">
                  <MovieCard
                    movie={movie}
                    score={userRating}
                    onClick={() => setSelectedMovie(movie)}
                  />
                  {userRating > 0 && (
                    <div className="absolute top-2 right-2 bg-[#e50914] text-white px-2 py-1 rounded-full text-xs font-bold z-10">
                      ★ {userRating}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 justify-center mb-8">
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              className="bg-[#2f2f2f] hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={handleNext}
              disabled={!hasNext}
              className="bg-[#2f2f2f] hover:bg-gray-700 text-white px-6 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
            {ratings.size >= MIN_RATINGS && (
              <button
                onClick={submitRatings}
                disabled={submitting}
                className="bg-[#e50914] hover:bg-[#f40612] text-white px-8 py-3 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Finish & Get Recommendations'}
              </button>
            )}
          </div>

          {/* Rated Movies Preview */}
          {ratings.size > 0 && (
            <div className="mt-8">
              <h3 className="text-white font-semibold mb-4">Your Ratings ({ratings.size})</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 max-h-60 overflow-y-auto">
                {Array.from(ratings.entries()).map(([movieId, rating]) => {
                  const movie = movies.find(m => m.id === movieId);
                  return (
                    <div key={movieId} className="bg-[#1a1a1a] border border-gray-800 rounded p-3">
                      <p className="text-white text-sm font-semibold line-clamp-1 mb-1">
                        {movie?.title}
                      </p>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`text-xs ${star <= rating ? 'text-[#e50914]' : 'text-gray-600'}`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          userRating={ratings.get(selectedMovie.id) || 0}
          onRate={(rating) => handleRating(selectedMovie.id, rating)}
        />
      )}
    </div>
  );
}
