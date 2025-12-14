'use client';

import { useState, useEffect } from 'react';
import { Movie } from '@/types';
import { FaTrophy } from 'react-icons/fa';
import { useUser } from '@/contexts/UserContext';
import MovieCard from '@/components/MovieCard';
import MovieDetailsModal from '@/components/MovieDetailsModal';

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {rankedMovies.map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              rank={movie.rank}
              score={movie.score}
              onClick={() => setSelectedMovie(movie)}
            />
          ))}
        </div>
      </div>

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          userRating={userRating}
          onRate={submitRating}
        />
      )}
    </div>
  );
}
