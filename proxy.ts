import { NextRequest, NextResponse } from "next/server";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";

// Protected routes require authentication
const protectedRoutes = ["/dashboard", "/super-dashboard"];
// Public routes redirect to dashboard if already authenticated
const authRoutes = ["/login", "/register"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
  const isAuthRoute = authRoutes.some((route) => pathname === route);

  const token = req.cookies.get(COOKIE_NAME)?.value;
  const payload = token ? verifyToken(token) : null;
  const isAuthenticated = !!payload;

  // Unauthenticated user trying to access protected route → redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user checks
  if (isAuthenticated) {
    const userRole = payload.role;

    // Authenticated user landing on public auth routes
    if (isAuthRoute) {
      if (userRole === "super-admin") {
        return NextResponse.redirect(new URL("/super-dashboard", req.nextUrl));
      } else {
        return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
      }
    }

    // Role-based route enforcement
    if (pathname.startsWith("/super-dashboard") && userRole !== "super-admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
    if (pathname.startsWith("/dashboard") && userRole === "super-admin") {
      return NextResponse.redirect(new URL("/super-dashboard", req.nextUrl));
    }
  }

  return NextResponse.next();
}

// Run proxy on all routes except Next.js internals and static files
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
