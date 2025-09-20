'use client';

import React, { createContext, useContext } from 'react';
import { useAuth as useAuthHook, UseAuthReturn } from '@/hooks/useAuth';

const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthHook();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
