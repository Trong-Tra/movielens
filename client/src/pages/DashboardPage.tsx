import React, { useState, useEffect } from 'react';
import { User, Recommendation, ModelInfo, Movie } from '../types';
import { getModels, getRecommendations, searchMovies } from '../services/api';
import { FaRobot, FaChartLine, FaFilter, FaSearch, FaStar } from 'react-icons/fa';
import './DashboardPage.css';

interface DashboardPageProps {
  user: User;
  userRatings: Map<number, number>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, userRatings }) => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [topK, setTopK] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);

  // Load available models
  useEffect(() => {
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
    loadModels();
  }, []);

  // Load recommendations when model or topK changes
  useEffect(() => {
    if (selectedModel) {
      loadRecommendations();
    }
  }, [selectedModel, topK]);

  const loadRecommendations = async () => {
    if (!selectedModel) return;

    setLoading(true);
    setError(null);

    try {
      const recs = await getRecommendations(user.id, selectedModel, topK);
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

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getRatingForMovie = (movieId: number): number | undefined => {
    return userRatings.get(movieId);
  };

  const currentModel = models.find(m => m.name === selectedModel);

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="welcome-section">
            <h1>Welcome, {user.name}!</h1>
            <p className="user-info">
              {user.age && `Age: ${user.age}`}
              {user.age && user.gender && ' • '}
              {user.gender && `Gender: ${user.gender}`}
            </p>
            <p className="ratings-count">
              You've rated {userRatings.size} movies
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="dashboard-controls">
        <div className="container">
          {/* Model Selector */}
          <div className="control-section">
            <label className="control-label">
              <FaRobot /> Recommendation Model
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="model-select"
            >
              {models.map(model => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
            {currentModel && (
              <p className="model-description">{currentModel.description}</p>
            )}
          </div>

          {/* Top-K Selector */}
          <div className="control-section">
            <label className="control-label">
              <FaChartLine /> Number of Recommendations
            </label>
            <div className="topk-control">
              <input
                type="range"
                min="5"
                max="50"
                step="5"
                value={topK}
                onChange={(e) => setTopK(parseInt(e.target.value))}
                className="topk-slider"
              />
              <span className="topk-value">{topK}</span>
            </div>
          </div>

          {/* Movie Search */}
          <div className="control-section">
            <label className="control-label">
              <FaSearch /> Search Movies
            </label>
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Search for movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleSearchKeyPress}
                className="search-input"
              />
              <button onClick={handleSearch} className="btn btn-secondary">
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="container">
          {/* Model Performance */}
          {currentModel && (
            <div className="performance-section">
              <h2>Model Performance</h2>
              <div className="metrics-grid">
                {Object.entries(currentModel.metrics).map(([metric, value]) => (
                  <div key={metric} className="metric-card">
                    <div className="metric-name">{metric}</div>
                    <div className="metric-value">
                      {typeof value === 'number' ? (value * 100).toFixed(2) + '%' : value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="search-results-section">
              <h2>Search Results</h2>
              <div className="movies-grid">
                {searchResults.map(movie => {
                  const userRating = getRatingForMovie(movie.id);
                  return (
                    <div key={movie.id} className="movie-card">
                      <div className="movie-header">
                        <h3 className="movie-title">{movie.title}</h3>
                        {userRating && (
                          <div className="user-rating">
                            <FaStar /> {userRating}
                          </div>
                        )}
                      </div>
                      <div className="movie-genres">
                        {movie.genres.map(genre => (
                          <span key={genre} className="genre-tag">{genre}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div className="recommendations-section">
            <h2>
              Your Recommendations
              {selectedModel && ` from ${selectedModel}`}
            </h2>

            {loading && (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading recommendations...</p>
              </div>
            )}

            {error && (
              <div className="error-container">
                <p>{error}</p>
                <button onClick={loadRecommendations} className="btn btn-primary">
                  Retry
                </button>
              </div>
            )}

            {!loading && !error && recommendations.length === 0 && (
              <div className="empty-container">
                <p>No recommendations available</p>
              </div>
            )}

            {!loading && !error && recommendations.length > 0 && (
              <div className="recommendations-grid">
                {recommendations.map((rec, index) => {
                  const userRating = getRatingForMovie(rec.movie.id);
                  return (
                    <div key={rec.movie.id} className="recommendation-card">
                      <div className="rank-badge">#{index + 1}</div>
                      <div className="movie-info">
                        <h3 className="movie-title">{rec.movie.title}</h3>
                        <div className="movie-genres">
                          {rec.movie.genres.map(genre => (
                            <span key={genre} className="genre-tag">{genre}</span>
                          ))}
                        </div>
                        <div className="recommendation-score">
                          Score: <strong>{rec.score.toFixed(3)}</strong>
                        </div>
                        {userRating && (
                          <div className="already-rated">
                            <FaStar /> You rated this {userRating}/5
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Your Ratings */}
          <div className="ratings-section">
            <h2>Your Ratings</h2>
            <div className="ratings-summary">
              <p>You've rated {userRatings.size} movies</p>
              <div className="rating-distribution">
                {[5, 4, 3, 2, 1].map(rating => {
                  const count = Array.from(userRatings.values()).filter(r => r === rating).length;
                  return (
                    <div key={rating} className="rating-bar">
                      <span className="rating-label">
                        <FaStar /> {rating}
                      </span>
                      <div className="bar-container">
                        <div
                          className="bar-fill"
                          style={{ width: `${(count / userRatings.size) * 100}%` }}
                        />
                      </div>
                      <span className="rating-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
