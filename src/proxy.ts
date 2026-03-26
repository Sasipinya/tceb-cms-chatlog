import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Role hierarchy
const ROLE_LEVEL: Record<string, number> = {
  pending:  0,
  viewer:   1,
  analyst:  2,
  editor:   3,
  admin:    4,
};

// Required minimum role per route prefix
const ROUTE_ROLES: { prefix: string; minRole: string }[] = [
  { prefix: '/admin',        minRole: 'admin'   },
  { prefix: '/analyze-logs', minRole: 'analyst' },
  { prefix: '/analytics',    minRole: 'analyst' },
  { prefix: '/chat',         minRole: 'viewer'  },
  { prefix: '/sessions',     minRole: 'viewer'  },
  { prefix: '/dashboard',    minRole: 'viewer'  },
];

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token    = (req as any).nextauth?.token;
    const role     = token?.role     ?? 'pending';
    const approved = token?.approved ?? false;
    const pathname = req.nextUrl.pathname;

    // ถ้าเป็น admin credentials (no domain check needed)
    if (token?.email === process.env.ADMIN_EMAIL) return NextResponse.next();

    // หาว่า route นี้ต้องการ role อะไร
    const routeConfig = ROUTE_ROLES.find((r) => pathname.startsWith(r.prefix));
    if (!routeConfig) return NextResponse.next();

    const userLevel    = ROLE_LEVEL[role]            ?? 0;
    const requiredLevel = ROLE_LEVEL[routeConfig.minRole] ?? 1;

    // Pending user → redirect to waiting page
    if (!approved || role === 'pending') {
      if (pathname !== '/pending') {
        return NextResponse.redirect(new URL('/pending', req.url));
      }
    }

    // ไม่มีสิทธิ์ → redirect to unauthorized
    if (userLevel < requiredLevel) {
      return NextResponse.redirect(new URL('/unauthorized', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sessions/:path*',
    '/analytics/:path*',
    '/analyze-logs/:path*',
    '/chat/:path*',
    '/admin/:path*',
  ],
};