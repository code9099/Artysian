'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowedRoles?: ('artisan' | 'explorer')[];
  guestAllowed?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAuth = true, 
  allowedRoles = [], 
  guestAllowed = false,
  redirectTo = '/'
}: ProtectedRouteProps) {
  const { user, loading, isGuest } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If authentication is required but user is not logged in
    if (requireAuth && !user && !isGuest) {
      router.push(redirectTo);
      return;
    }

    // If guest is not allowed but user is in guest mode
    if (!guestAllowed && isGuest) {
      router.push(redirectTo);
      return;
    }

    // If specific roles are required
    if (allowedRoles.length > 0 && user && !isGuest) {
      if (!user.role || !allowedRoles.includes(user.role)) {
        router.push(redirectTo);
        return;
      }
    }

    // If user is logged in but hasn't selected a role
    if (user && !isGuest && !user.role && !redirectTo.includes('/role-select')) {
      router.push('/role-select');
      return;
    }

    // If user is logged in but hasn't selected a language
    if (user && !isGuest && !user.languageCode && !redirectTo.includes('/language-select')) {
      router.push('/language-select');
      return;
    }
  }, [user, loading, isGuest, allowedRoles, guestAllowed, redirectTo, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-warm">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-gold mx-auto mb-4" />
          <p className="text-charcoal text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // Show children if all conditions are met
  if (
    (!requireAuth || user || isGuest) &&
    (allowedRoles.length === 0 || !user || isGuest || (user.role && allowedRoles.includes(user.role))) &&
    (guestAllowed || !isGuest)
  ) {
    return <>{children}</>;
  }

  // Don't render anything while redirecting
  return null;
}
