'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface UserContextType {
  currentUserId: number;
  setCurrentUserId: (id: number) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState<number>(1);

  // Load user ID from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('movielens_user_id');
    if (stored) {
      setCurrentUserIdState(parseInt(stored));
    } else {
      // Random initial user
      const randomUserId = Math.floor(Math.random() * 6040) + 1;
      setCurrentUserIdState(randomUserId);
      localStorage.setItem('movielens_user_id', randomUserId.toString());
    }
  }, []);

  const setCurrentUserId = (id: number) => {
    setCurrentUserIdState(id);
    localStorage.setItem('movielens_user_id', id.toString());
  };

  return (
    <UserContext.Provider value={{ currentUserId, setCurrentUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
