"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/types";
import { FaStar, FaPlay } from "react-icons/fa";

interface MovieCardProps {
  movie: Movie;
  rank?: number;
  score?: number;
  onClick: () => void;
}

export default function MovieCard({
  movie,
  rank,
  score,
  onClick,
}: MovieCardProps) {
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPoster();
  }, [movie.id]);

  const fetchPoster = async () => {
    try {
      const response = await fetch(
        `/api/tmdb/movie/${encodeURIComponent(movie.title)}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.poster_path) {
          setPosterUrl(`https://image.tmdb.org/t/p/w342${data.poster_path}`);
        } else {
          console.log(`No poster found for: ${movie.title}`);
        }
      } else {
        console.error(
          `Failed to fetch poster for ${movie.title}: ${response.status}`
        );
      }
    } catch (error) {
      console.error(`Error fetching poster for ${movie.title}:`, error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={onClick} className="movie-card relative group cursor-pointer">
      {/* Rank Badge */}
      {rank && (
        <div className="absolute top-2 left-2 bg-[#e50914] text-white px-3 py-1 rounded font-bold text-sm z-10">
          #{rank}
        </div>
      )}

      {/* Poster */}
      <div className="aspect-[2/3] bg-[#2f2f2f] overflow-hidden relative">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#e50914]"></div>
          </div>
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={movie.title}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <FaStar className="text-[#e50914] text-4xl mb-2" />
            <p className="text-xs text-gray-500">No poster available</p>
          </div>
        )}

        {/* Score Overlay */}
        {score !== undefined && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-3">
            <div className="flex items-center gap-2">
              <FaStar className="text-[#e50914] text-sm" />
              <span className="text-white font-bold">{score.toFixed(1)}</span>
            </div>
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <FaPlay className="text-white text-3xl" />
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 text-white group-hover:text-[#e50914] transition-colors">
          {movie.title}
        </h3>
        <div className="flex flex-wrap gap-1">
          {movie.genres.slice(0, 3).map((genre) => (
            <span key={genre} className="genre-tag text-xs">
              {genre}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
