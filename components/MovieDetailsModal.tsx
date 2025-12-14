'use client';

import { useEffect, useState } from 'react';
import { Movie } from '@/types';
import { FaStar, FaTimes, FaCalendar, FaFilm } from 'react-icons/fa';

interface TMDbMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genres: { id: number; name: string }[];
}

interface MovieDetailsModalProps {
  movie: Movie;
  onClose: () => void;
  userRating?: number;
  onRate?: (rating: number) => void;
}

export default function MovieDetailsModal({ movie, onClose, userRating, onRate }: MovieDetailsModalProps) {
  const [tmdbData, setTmdbData] = useState<TMDbMovie | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchMovieDetails();
  }, [movie.id]);

  const fetchMovieDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tmdb/movie/${encodeURIComponent(movie.title)}`);
      if (response.ok) {
        const data = await response.json();
        setTmdbData(data);
      }
    } catch (error) {
      console.error('Failed to fetch movie details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPosterUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w500${path}`;
  };

  const getBackdropUrl = (path: string | null) => {
    if (!path) return null;
    return `https://image.tmdb.org/t/p/w1280${path}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-[#1a1a1a] rounded-lg max-w-4xl w-full my-8 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-black bg-opacity-70 hover:bg-opacity-90 rounded-full flex items-center justify-center transition-colors"
        >
          <FaTimes className="text-white text-xl" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#e50914]"></div>
          </div>
        ) : (
          <>
            {/* Backdrop/Hero */}
            {tmdbData?.backdrop_path && (
              <div className="relative h-64 md:h-96 overflow-hidden">
                <img
                  src={getBackdropUrl(tmdbData.backdrop_path)!}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent"></div>
              </div>
            )}

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Poster */}
                {tmdbData?.poster_path && (
                  <div className="flex-shrink-0">
                    <img
                      src={getPosterUrl(tmdbData.poster_path)!}
                      alt={movie.title}
                      className="w-48 rounded-lg shadow-2xl"
                    />
                  </div>
                )}

                {/* Details */}
                <div className="flex-1">
                  <h2 className="text-3xl md:text-4xl font-black text-white mb-3">{movie.title}</h2>
                  
                  {/* Meta Info */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    {tmdbData?.release_date && (
                      <div className="flex items-center gap-2 text-gray-400">
                        <FaCalendar />
                        <span>{new Date(tmdbData.release_date).getFullYear()}</span>
                      </div>
                    )}
                    {tmdbData?.vote_average && (
                      <div className="flex items-center gap-2 text-yellow-500">
                        <FaStar />
                        <span className="text-white font-semibold">{tmdbData.vote_average.toFixed(1)}</span>
                        <span className="text-gray-400 text-sm">({tmdbData.vote_count} votes)</span>
                      </div>
                    )}
                  </div>

                  {/* Genres */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {movie.genres.map(genre => (
                      <span key={genre} className="bg-[#2f2f2f] px-3 py-1 rounded text-sm text-gray-300">
                        {genre}
                      </span>
                    ))}
                  </div>

                  {/* Overview */}
                  {tmdbData?.overview && (
                    <div className="mb-6">
                      <h3 className="text-lg font-bold text-white mb-2">Overview</h3>
                      <p className="text-gray-400 leading-relaxed">{tmdbData.overview}</p>
                    </div>
                  )}

                  {/* Rating Section */}
                  {onRate && (
                    <div className="border-t border-gray-800 pt-6">
                      <h3 className="text-white font-semibold mb-3">
                        {userRating ? 'Your Rating' : 'Rate this movie'}
                      </h3>
                      <div className="flex items-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => onRate(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="transition-transform hover:scale-110"
                          >
                            <FaStar
                              className={`text-3xl ${
                                star <= (hoverRating || userRating || 0)
                                  ? 'text-[#e50914]'
                                  : 'text-gray-600'
                              }`}
                            />
                          </button>
                        ))}
                        {userRating && (
                          <span className="ml-3 text-gray-400">
                            You rated this {userRating} star{userRating > 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
