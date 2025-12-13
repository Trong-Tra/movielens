'use client';

import { useState } from 'react';
import { User } from '@/types';
import OnboardingPage from '@/components/OnboardingPage';
import DashboardPage from '@/components/DashboardPage';

type FlowState = 'onboarding' | 'dashboard';

export default function CreatePage() {
  const [flowState, setFlowState] = useState<FlowState>('onboarding');
  const [userRatings, setUserRatings] = useState<Map<number, number>>(new Map());
  
  // Generate a temporary user ID
  const [user] = useState<User>({
    id: Math.floor(Math.random() * 90000) + 10000,
    name: 'Guest User',
  });

  const handleOnboardingComplete = (ratings: Map<number, number>) => {
    setUserRatings(ratings);
    setFlowState('dashboard');
  };

  return (
    <main>
      {flowState === 'onboarding' && (
        <OnboardingPage
          user={user}
          onComplete={handleOnboardingComplete}
        />
      )}
      {flowState === 'dashboard' && (
        <DashboardPage
          user={user}
          userRatings={userRatings}
        />
      )}
    </main>
  );
}
