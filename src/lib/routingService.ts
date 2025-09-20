/**
 * Routing service for user workflow management
 * Handles navigation based on user state, role, and onboarding progress
 */

import { User } from './authService';

export interface UserState {
  user: User | null;
  isGuest: boolean;
  isAuthenticated: boolean;
}

export interface RoutingDecision {
  shouldRedirect: boolean;
  redirectTo: string;
  reason: string;
}

class RoutingService {
  /**
   * Determine where user should be redirected based on their state
   */
  determineUserRoute(userState: UserState, currentPath: string): RoutingDecision {
    const { user, isGuest, isAuthenticated } = userState;

    // Public routes that don't require authentication
    const publicRoutes = ['/', '/explore'];
    
    // Routes that require authentication
    const protectedRoutes = ['/artisan', '/role-select', '/language-select'];
    
    // Guest-allowed routes
    const guestAllowedRoutes = ['/', '/explore', '/role-select', '/language-select'];

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && protectedRoutes.some(route => currentPath.startsWith(route))) {
      return {
        shouldRedirect: true,
        redirectTo: '/',
        reason: 'Authentication required',
      };
    }

    // If guest user trying to access artisan routes
    if (isGuest && currentPath.startsWith('/artisan')) {
      return {
        shouldRedirect: true,
        redirectTo: '/',
        reason: 'Artisan features not available for guests',
      };
    }

    // If authenticated user, determine next step
    if (isAuthenticated && user && !isGuest) {
      return this.determineAuthenticatedUserRoute(user, currentPath);
    }

    // If guest user, handle guest routing
    if (isGuest) {
      return this.determineGuestUserRoute(currentPath);
    }

    // No redirect needed
    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'Current route is appropriate',
    };
  }

  /**
   * Determine routing for authenticated users
   */
  private determineAuthenticatedUserRoute(user: User, currentPath: string): RoutingDecision {
    // If user hasn't selected a language, redirect to language selection
    if (!user.languageCode && currentPath !== '/language-select') {
      return {
        shouldRedirect: true,
        redirectTo: '/language-select',
        reason: 'Language selection required',
      };
    }

    // If user hasn't selected a role, redirect to role selection
    if (!user.role && currentPath !== '/role-select') {
      return {
        shouldRedirect: true,
        redirectTo: '/role-select',
        reason: 'Role selection required',
      };
    }

    // If user has completed basic setup, route based on role
    if (user.role && user.languageCode) {
      return this.routeByRole(user, currentPath);
    }

    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'User setup in progress',
    };
  }

  /**
   * Route user based on their role
   */
  private routeByRole(user: User, currentPath: string): RoutingDecision {
    if (user.role === 'artisan') {
      return this.routeArtisan(user, currentPath);
    } else if (user.role === 'explorer') {
      return this.routeExplorer(user, currentPath);
    }

    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'Unknown role',
    };
  }

  /**
   * Route artisan users
   */
  private routeArtisan(user: User, currentPath: string): RoutingDecision {
    // If accessing root or explorer routes, redirect to artisan dashboard
    if (currentPath === '/' || currentPath.startsWith('/explore')) {
      return {
        shouldRedirect: true,
        redirectTo: '/artisan/dashboard',
        reason: 'Redirect to artisan dashboard',
      };
    }

    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'Artisan route is appropriate',
    };
  }

  /**
   * Route explorer users
   */
  private routeExplorer(user: User, currentPath: string): RoutingDecision {
    // If accessing root or artisan routes, redirect to explore
    if (currentPath === '/' || currentPath.startsWith('/artisan')) {
      return {
        shouldRedirect: true,
        redirectTo: '/explore',
        reason: 'Redirect to explore page',
      };
    }

    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'Explorer route is appropriate',
    };
  }

  /**
   * Route guest users
   */
  private determineGuestUserRoute(currentPath: string): RoutingDecision {
    // Check if guest has selected a role
    const guestRole = localStorage.getItem('craftstory_guest_role') as 'artisan' | 'explorer' | null;

    // If guest trying to access artisan features
    if (currentPath.startsWith('/artisan')) {
      return {
        shouldRedirect: true,
        redirectTo: '/',
        reason: 'Artisan features require account',
      };
    }

    // If guest has selected explorer role and is on root, redirect to explore
    if (guestRole === 'explorer' && currentPath === '/') {
      return {
        shouldRedirect: true,
        redirectTo: '/explore',
        reason: 'Guest explorer redirect',
      };
    }

    // If guest hasn't selected role and is trying to access explore
    if (!guestRole && currentPath === '/explore') {
      return {
        shouldRedirect: true,
        redirectTo: '/role-select',
        reason: 'Role selection required for guests',
      };
    }

    return {
      shouldRedirect: false,
      redirectTo: '',
      reason: 'Guest route is appropriate',
    };
  }



  /**
   * Get appropriate dashboard route for user
   */
  getDashboardRoute(user: User | null, isGuest: boolean): string {
    if (!user || isGuest) {
      return '/explore';
    }

    if (user.role === 'artisan') {
      return '/artisan/dashboard';
    } else if (user.role === 'explorer') {
      return '/explore';
    }

    // If no role selected, go to role selection
    return '/role-select';
  }

  /**
   * Get next step in user flow
   */
  getNextStep(user: User | null, isGuest: boolean): string {
    if (!user) {
      return '/';
    }

    if (isGuest) {
      const guestRole = localStorage.getItem('craftstory_guest_role');
      if (!guestRole) {
        return '/role-select';
      }
      return guestRole === 'explorer' ? '/explore' : '/';
    }

    // Check language selection
    if (!user.languageCode) {
      return '/language-select';
    }

    // Check role selection
    if (!user.role) {
      return '/role-select';
    }

    // Return appropriate dashboard
    return this.getDashboardRoute(user, isGuest);
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(
    route: string, 
    userState: UserState, 
    requiredRole?: 'artisan' | 'explorer'
  ): boolean {
    const { user, isGuest, isAuthenticated } = userState;

    // Public routes
    const publicRoutes = ['/', '/explore'];
    if (publicRoutes.includes(route)) {
      return true;
    }

    // Routes requiring authentication
    const protectedRoutes = ['/artisan', '/role-select', '/language-select'];
    if (protectedRoutes.some(r => route.startsWith(r)) && !isAuthenticated) {
      return false;
    }

    // Artisan-only routes
    if (route.startsWith('/artisan')) {
      if (isGuest) return false;
      if (requiredRole === 'artisan' && user?.role !== 'artisan') return false;
    }

    // Role-specific access
    if (requiredRole && user?.role !== requiredRole) {
      return false;
    }

    return true;
  }

  /**
   * Get breadcrumb navigation for current route
   */
  getBreadcrumbs(route: string, user: User | null): Array<{ label: string; href: string }> {
    const breadcrumbs: Array<{ label: string; href: string }> = [
      { label: 'Home', href: '/' }
    ];

    if (route.startsWith('/artisan')) {
      breadcrumbs.push({ label: 'Artisan', href: '/artisan/dashboard' });
      
      if (route.includes('/dashboard')) {
        breadcrumbs.push({ label: 'Dashboard', href: '/artisan/dashboard' });
      } else if (route.includes('/upload')) {
        breadcrumbs.push({ label: 'Upload Craft', href: '/artisan/upload' });
      }
    } else if (route.startsWith('/explore')) {
      breadcrumbs.push({ label: 'Explore', href: '/explore' });
    } else if (route === '/role-select') {
      breadcrumbs.push({ label: 'Choose Role', href: '/role-select' });
    } else if (route === '/language-select') {
      breadcrumbs.push({ label: 'Select Language', href: '/language-select' });
    }

    return breadcrumbs;
  }

  /**
   * Get suggested next actions for user
   */
  getSuggestedActions(user: User | null, isGuest: boolean, currentRoute: string): Array<{
    label: string;
    href: string;
    icon: string;
    description: string;
  }> {
    const actions = [];

    if (!user) {
      return [
        {
          label: 'Sign Up',
          href: '/',
          icon: 'user-plus',
          description: 'Create an account to access all features'
        }
      ];
    }

    if (isGuest) {
      actions.push({
        label: 'Create Account',
        href: '/',
        icon: 'user-plus',
        description: 'Sign up to save favorites and upload crafts'
      });
    }

    if (user.role === 'artisan') {
      actions.push({
        label: 'Upload New Craft',
        href: '/artisan/voice-onboard',
        icon: 'plus',
        description: 'Share your latest creation with voice assistant'
      });
    } else if (user.role === 'explorer') {
      actions.push({
        label: 'Discover Crafts',
        href: '/explore',
        icon: 'eye',
        description: 'Find amazing traditional crafts'
      });
    }

    return actions;
  }
}

export const routingService = new RoutingService();