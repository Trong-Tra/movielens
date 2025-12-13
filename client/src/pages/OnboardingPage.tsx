import React, { useState, useEffect } from 'react';
import { User, Rating, Movie } from '../types';
import { searchMovies } from '../services/api';
import { FaStar, FaRedo, FaCheck } from 'react-icons/fa';
import './OnboardingPage.css';

interface OnboardingPageProps {
  user: User;
  onComplete: (ratings: Rating[]) => void;
}

const REQUIRED_RATINGS = 5;

const OnboardingPage: React.FC<OnboardingPageProps> = ({ user, onComplete }) => {
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
      // Search for popular movies to show user
      const queries = ['star', 'matrix', 'godfather', 'lord', 'harry', 'avengers', 'inception', 'batman'];
      const randomQuery = queries[Math.floor(Math.random() * queries.length)];
      
      const results = await searchMovies(randomQuery, 20);
      
      // Shuffle and take random 10 movies
      const shuffled = results
        .sort(() => Math.random() - 0.5)
        .slice(0, 10);
      
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

  const handleSkip = (movieId: number) => {
    // Remove rating if exists
    const newRatings = new Map(ratings);
    newRatings.delete(movieId);
    setRatings(newRatings);
  };

  const handleComplete = () => {
    const userRatings: Rating[] = Array.from(ratings.entries()).map(([movieId, rating]) => ({
      userId: user.id,
      movieId,
      rating,
      timestamp: Date.now(),
    }));

    onComplete(userRatings);
  };

  const ratedCount = ratings.size;
  const canComplete = ratedCount >= REQUIRED_RATINGS;
  const progress = Math.min(100, (ratedCount / REQUIRED_RATINGS) * 100);

  if (loading) {
    return (
      <div className="onboarding-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading movies...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="onboarding-page">
        <div className="error-container">
          <p>{error}</p>
          <button className="btn btn-primary" onClick={loadRandomMovies}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-page">
      <div className="onboarding-header">
        <div className="container">
          <h1>Welcome, {user.name}! 👋</h1>
          <p className="subtitle">Rate at least {REQUIRED_RATINGS} movies to get personalized recommendations</p>
          
          <div className="progress-section">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${progress}%` }}></div>
            </div>
            <div className="progress-text">
              {ratedCount} / {REQUIRED_RATINGS} movies rated
              {canComplete && <FaCheck className="check-icon" />}
            </div>
          </div>
        </div>
      </div>

      <div className="onboarding-content">
        <div className="container">
          <div className="movies-header">
            <h2>Rate These Movies</h2>
            <button className="btn btn-secondary" onClick={loadRandomMovies}>
              <FaRedo /> Get Different Movies
            </button>
          </div>

          <div className="movies-grid">
            {movies.map((movie) => {
              const currentRating = ratings.get(movie.id);
              
              return (
                <div key={movie.id} className={`movie-card ${currentRating ? 'rated' : ''}`}>
                  <div className="movie-header">
                    <h3 className="movie-title">{movie.title}</h3>
                    {currentRating && (
                      <span className="rated-badge">
                        <FaCheck /> Rated
                      </span>
                    )}
                  </div>
                  
                  <div className="movie-genres">
                    {movie.genres.slice(0, 3).map((genre) => (
                      <span key={genre} className="badge badge-primary">
                        {genre}
                      </span>
                    ))}
                  </div>

                  <div className="rating-section">
                    <p className="rating-label">Your rating:</p>
                    <div className="star-rating">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          className={`star-button ${currentRating && star <= currentRating ? 'active' : ''}`}
                          onClick={() => handleRating(movie.id, star)}
                          aria-label={`Rate ${star} stars`}
                        >
                          <FaStar />
                        </button>
                      ))}
                    </div>
                    {currentRating && (
                      <button
                        className="skip-button"
                        onClick={() => handleSkip(movie.id)}
                      >
                        Clear Rating
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="onboarding-actions">
            {!canComplete && (
              <p className="info-message">
                Please rate at least {REQUIRED_RATINGS - ratedCount} more movie(s) to continue
              </p>
            )}
            <button
              className="btn btn-primary btn-large"
              disabled={!canComplete}
              onClick={handleComplete}
            >
              <FaCheck /> Get My Recommendations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { OnboardingPage };
export default OnboardingPage;
