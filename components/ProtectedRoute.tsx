import { useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useUser();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const firstSegment = segments[0];
    const isAuthRoute = firstSegment === 'login' || firstSegment === 'signup';

    if (!user && !isAuthRoute) {
      // Redirect to login if not authenticated and not in auth route
      router.replace('/login');
    } else if (user && isAuthRoute) {
      // Redirect to tabs if authenticated and in auth route
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <>{children}</>;
}
