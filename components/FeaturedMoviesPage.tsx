'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import { FaStar, FaTrophy, FaHeart } from 'react-icons/fa';
import { useUser } from '@/contexts/UserContext';

interface RankedMovie extends Movie {
  score: number;
  rank: number;
  userRating?: number;
}

export default function FeaturedMoviesPage() {
  const { currentUserId } = useUser();
  const [rankedMovies, setRankedMovies] = useState<RankedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<RankedMovie | null>(null);
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);

  useEffect(() => {
    loadFeaturedMovies();
  }, []);

  useEffect(() => {
    if (selectedMovie) {
      loadUserRating(selectedMovie.id);
    }
  }, [selectedMovie, currentUserId]);

  const loadFeaturedMovies = async () => {
    try {
      setLoading(true);
      // Get recommendations using Popularity model for a random user
      // This gives us the highest-rated movies
      const response = await fetch(`http://localhost:3001/api/recommendations/1?model=Popularity&n=50`);
      const data = await response.json();
      
      const ranked = data.recommendations.map((rec: any, index: number) => ({
        id: rec.itemId,
        title: rec.title,
        genres: rec.genres,
        score: rec.score,
        rank: index + 1
      }));
      
      setRankedMovies(ranked);
    } catch (error) {
      console.error('Failed to load featured movies:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRating = async (movieId: number) => {
    try {
      const response = await fetch(`http://localhost:3001/api/ratings/${currentUserId}/${movieId}`);
      const data = await response.json();
      
      if (data.rated) {
        setUserRating(data.rating);
      } else {
        setUserRating(0);
      }
    } catch (error) {
      console.error('Failed to load user rating:', error);
      setUserRating(0);
    }
  };

  const submitRating = async (rating: number) => {
    if (!selectedMovie) return;

    try {
      const response = await fetch('http://localhost:3001/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          movieId: selectedMovie.id,
          rating
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setUserRating(rating);
        // Close modal after short delay
        setTimeout(() => setSelectedMovie(null), 500);
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500';
    if (rank === 2) return 'bg-gray-400';
    if (rank === 3) return 'bg-amber-700';
    return 'bg-[#e50914]';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#e50914]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414]">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-black via-[#141414] to-[#141414] py-20 px-4 mb-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <FaTrophy className="text-[#e50914] text-6xl" />
            <h1 className="text-6xl md:text-7xl font-black tracking-tight">
              Featured <span className="text-[#e50914]">Movies</span>
            </h1>
          </div>
          <p className="text-xl text-gray-400 mb-4">
            Top-rated movies by the community
          </p>
          <p className="text-sm text-gray-500">
            Click on any movie to rate it yourself
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedMovies.map((movie) => (
            <div
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
              className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-4 hover:border-[#e50914] transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                {/* Rank Badge */}
                <div className={`${getRankBadgeColor(movie.rank)} w-12 h-12 flex items-center justify-center rounded-lg font-black text-white text-lg flex-shrink-0`}>
                  {movie.rank <= 3 ? <FaTrophy /> : `#${movie.rank}`}
                </div>

                {/* Movie Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1 line-clamp-2 group-hover:text-[#e50914] transition-colors">
                    {movie.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {movie.genres.slice(0, 3).map(genre => (
                      <span key={genre} className="text-xs bg-[#2f2f2f] px-2 py-0.5 rounded text-gray-400">
                        {genre}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <FaStar className="text-yellow-500 text-sm" />
                    <span className="text-white font-semibold">{movie.score.toFixed(2)}</span>
                    <span className="text-gray-500 text-sm">avg rating</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rating Modal */}
      {selectedMovie && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4" onClick={() => setSelectedMovie(null)}>
          <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-6">
              <div className={`${getRankBadgeColor(selectedMovie.rank)} w-10 h-10 flex items-center justify-center rounded font-black text-white`}>
                {selectedMovie.rank <= 3 ? <FaTrophy className="text-sm" /> : `#${selectedMovie.rank}`}
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-2">{selectedMovie.title}</h2>
                <div className="flex flex-wrap gap-1 mb-3">
                  {selectedMovie.genres.map(genre => (
                    <span key={genre} className="text-xs bg-[#2f2f2f] px-2 py-1 rounded text-gray-400">
                      {genre}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FaStar className="text-yellow-500" />
                  <span className="text-white font-semibold">{selectedMovie.score.toFixed(2)}</span>
                  <span className="text-gray-500">community rating</span>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 pt-6">
              <h3 className="text-white font-semibold mb-4">
                {userRating > 0 ? 'Your Rating' : 'Rate this movie'}
              </h3>
              
              <div className="flex items-center justify-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => submitRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <FaStar
                      className={`text-4xl ${
                        star <= (hoverRating || userRating)
                          ? 'text-[#e50914]'
                          : 'text-gray-600'
                      }`}
                    />
                  </button>
                ))}
              </div>

              {userRating > 0 && (
                <p className="text-center text-gray-400 text-sm">
                  You rated this movie {userRating} star{userRating > 1 ? 's' : ''}
                </p>
              )}

              <button
                onClick={() => setSelectedMovie(null)}
                className="w-full mt-6 bg-[#2f2f2f] hover:bg-gray-700 text-white py-3 rounded font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
