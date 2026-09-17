/**
 * RepoPilot Authentication Context.
 *
 * Provides authentication state, login, logout, and localStorage session persistence.
 * Structured cleanly so a real backend auth endpoint (JWT/OAuth) can replace demo logic.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const STORAGE_KEY = 'repopilot_auth_session';

const DEFAULT_DEMO_USER = {
  id: 'usr_pilot_01',
  name: 'Alex Rivera',
  email: 'alex.rivera@devcorp.io',
  role: 'Senior Staff Engineer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  team: 'Core Infrastructure',
  plan: 'Enterprise Tier',
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_DEMO_USER;
    } catch {
      return DEFAULT_DEMO_USER;
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      console.warn('Failed to persist auth state to localStorage', e);
    }
  }, [user]);

  /**
   * Log in user.
   * Simulates network latency and authenticates against demo credentials or arbitrary email.
   */
  const login = async ({ email, password }) => {
    setIsLoading(true);

    // Simulated API delay
    await new Promise((resolve) => setTimeout(resolve, 600));

    if (!email || !email.includes('@')) {
      setIsLoading(false);
      throw new Error('Please provide a valid email address.');
    }

    if (!password || password.length < 6) {
      setIsLoading(false);
      throw new Error('Password must be at least 6 characters.');
    }

    // Generate authenticated session
    const username = email.split('@')[0];
    const formattedName = username
      .split(/[._-]/)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');

    const authenticatedUser = {
      id: `usr_${Date.now().toString(36)}`,
      name: formattedName || 'Dev Pilot',
      email: email.trim().toLowerCase(),
      role: 'Staff Systems Engineer',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      team: 'Autonomous Agent Testing',
      plan: 'Enterprise Pro',
      loggedInAt: new Date().toISOString(),
    };

    setUser(authenticatedUser);
    setIsLoading(false);
    return authenticatedUser;
  };

  /**
   * Log out user
   */
  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to remove auth key', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
