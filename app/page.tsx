'use client';

import { useState } from 'react';
import { User } from '@/types';
import WelcomePage from '@/components/WelcomePage';
import OnboardingPage from '@/components/OnboardingPage';
import DashboardPage from '@/components/DashboardPage';

type AppState = 'welcome' | 'onboarding' | 'dashboard';

export default function Home() {
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
    <main>
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
    </main>
  );
}
