import { type NextRequest, NextResponse } from 'next/server';

export function proxy(request: NextRequest) {
  // Public routes must never depend on the auth provider. Protected pages,
  // Server Actions and Route Handlers perform their own session/role checks.
  return NextResponse.next({ request });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
