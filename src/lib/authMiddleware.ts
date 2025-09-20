/**
 * Authentication middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email?: string;
    role?: 'artisan' | 'explorer';
    isGuest?: boolean;
  };
}

/**
 * Middleware to verify Firebase ID token and attach user to request
 */
export async function withAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Missing or invalid authorization header' },
          { status: 401 }
        );
      }

      const idToken = authHeader.split('Bearer ')[1];
      const auth = getAuth();
      const decodedToken = await auth.verifyIdToken(idToken);
      
      // Get user data from Firestore
      const db = getFirestore();
      const userDoc = await db.collection('users').doc(decodedToken.uid).get();
      const userData = userDoc.data();

      // Attach user to request
      (request as AuthenticatedRequest).user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData?.role,
        isGuest: userData?.isGuest || false,
      };

      return handler(request as AuthenticatedRequest);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }
  };
}

/**
 * Middleware to require specific roles
 */
export function withRole(
  roles: ('artisan' | 'explorer')[],
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const user = request.user;
    
    if (!user || user.isGuest || !user.role || !roles.includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    return handler(request);
  });
}

/**
 * Middleware to prevent guest access
 */
export function withoutGuest(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(async (request: AuthenticatedRequest) => {
    const user = request.user;
    
    if (!user || user.isGuest) {
      return NextResponse.json(
        { error: 'Guest users cannot access this feature' },
        { status: 403 }
      );
    }

    return handler(request);
  });
}

/**
 * Optional auth middleware - doesn't require authentication but adds user if present
 */
export function withOptionalAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      const authHeader = request.headers.get('authorization');
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        const auth = getAuth();
        const decodedToken = await auth.verifyIdToken(idToken);
        
        // Get user data from Firestore
        const db = getFirestore();
        const userDoc = await db.collection('users').doc(decodedToken.uid).get();
        const userData = userDoc.data();

        // Attach user to request
        (request as AuthenticatedRequest).user = {
          uid: decodedToken.uid,
          email: decodedToken.email,
          role: userData?.role,
          isGuest: userData?.isGuest || false,
        };
      }

      return handler(request as AuthenticatedRequest);
    } catch (error) {
      // If token is invalid, continue without user
      console.warn('Optional auth failed:', error);
      return handler(request as AuthenticatedRequest);
    }
  };
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  maxRequests: number = 100,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: AuthenticatedRequest) => {
      const identifier = request.user?.uid || 
        request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'anonymous';

      const now = Date.now();
      const userRequests = requests.get(identifier);

      if (!userRequests || now > userRequests.resetTime) {
        // Reset or initialize
        requests.set(identifier, {
          count: 1,
          resetTime: now + windowMs,
        });
      } else if (userRequests.count >= maxRequests) {
        // Rate limit exceeded
        return NextResponse.json(
          { 
            error: 'Rate limit exceeded',
            retryAfter: Math.ceil((userRequests.resetTime - now) / 1000),
          },
          { status: 429 }
        );
      } else {
        // Increment count
        userRequests.count++;
      }

      return handler(request);
    };
  };
}

/**
 * CORS middleware
 */
export function withCORS(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  } = {}
) {
  const {
    origin = '*',
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers = ['Content-Type', 'Authorization'],
  } = options;

  return async (request: AuthenticatedRequest) => {
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': headers.join(', '),
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const response = await handler(request);

    // Add CORS headers to response
    response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
    response.headers.set('Access-Control-Allow-Methods', methods.join(', '));
    response.headers.set('Access-Control-Allow-Headers', headers.join(', '));

    return response;
  };
}