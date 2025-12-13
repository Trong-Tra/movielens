import React, { useState } from 'react';
import { User } from '../types';
import { FaFilm, FaUser, FaEnvelope, FaCalendar } from 'react-icons/fa';
import './WelcomePage.css';

interface WelcomePageProps {
  onUserCreated: (user: User) => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onUserCreated }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a temporary user ID (in real app, this would come from backend)
    const userId = 10000 + Math.floor(Math.random() * 90000);
    
    const user: User = {
      id: userId,
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      gender: formData.gender || undefined,
    };

    onUserCreated(user);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="welcome-page">
      <div className="welcome-hero">
        <div className="hero-background"></div>
        <div className="hero-content">
          <FaFilm className="hero-icon" />
          <h1 className="hero-title">Movie Recommendation System</h1>
          <p className="hero-subtitle">
            Discover your next favorite movie with AI-powered recommendations
          </p>
          
          {!showForm ? (
            <div className="hero-actions">
              <button
                className="btn btn-primary btn-large"
                onClick={() => setShowForm(true)}
              >
                <FaUser /> Get Started
              </button>
              <p className="hero-info">
                Create your profile and rate some movies to get personalized recommendations
              </p>
            </div>
          ) : (
            <div className="welcome-form-container">
              <div className="welcome-card">
                <h2>Create Your Profile</h2>
                <p className="form-subtitle">
                  Tell us a bit about yourself to get started
                </p>
                
                <form onSubmit={handleSubmit} className="welcome-form">
                  <div className="form-group">
                    <label className="label">
                      <FaUser /> Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      className="input"
                      placeholder="Enter your name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">
                      <FaCalendar /> Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      className="input"
                      placeholder="Enter your age (optional)"
                      value={formData.age}
                      onChange={handleChange}
                      min="1"
                      max="120"
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">
                      <FaEnvelope /> Gender
                    </label>
                    <select
                      name="gender"
                      className="input"
                      value={formData.gender}
                      onChange={handleChange}
                    >
                      <option value="">Prefer not to say</option>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={!formData.name}
                    >
                      Continue
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="welcome-features">
        <div className="container">
          <h2 className="features-title">How It Works</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-number">1</div>
              <h3>Create Profile</h3>
              <p>Tell us a bit about yourself</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">2</div>
              <h3>Rate Movies</h3>
              <p>Rate at least 5 movies you've watched</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">3</div>
              <h3>Get Recommendations</h3>
              <p>Receive personalized movie suggestions</p>
            </div>
            <div className="feature-card">
              <div className="feature-number">4</div>
              <h3>Compare Models</h3>
              <p>Try different AI algorithms</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { WelcomePage };
export default WelcomePage;
