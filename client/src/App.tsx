import React, { useState } from 'react';
import { WelcomePage } from './pages/WelcomePage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { User, Rating } from './types';
import './App.css';

type AppState = 'welcome' | 'onboarding' | 'dashboard';

function App() {
  const [appState, setAppState] = useState<AppState>('welcome');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRatings, setUserRatings] = useState<Map<number, number>>(new Map());

  const handleUserCreated = (user: User) => {
    setCurrentUser(user);
    setAppState('onboarding');
  };

  const handleOnboardingComplete = (ratings: Map<number, number>) => {
    setUserRatings(ratings);
    setAppState('dashboard');
  };

  const handleBackToWelcome = () => {
    setCurrentUser(null);
    setUserRatings(new Map());
    setAppState('welcome');
  };

  return (
    <div className="app">
      {appState === 'welcome' && (
        <WelcomePage onUserCreated={handleUserCreated} />
      )}
      {appState === 'onboarding' && currentUser && (
        <OnboardingPage
          user={currentUser}
          onComplete={handleOnboardingComplete}
        />
      )}
      {appState === 'dashboard' && currentUser && (
        <DashboardPage
          user={currentUser}
          userRatings={userRatings}
        />
      )}
    </div>
  );
}

export default App;
