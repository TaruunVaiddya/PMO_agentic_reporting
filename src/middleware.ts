import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")
  const isAuthenticated = accessToken && accessToken.value

  // Auth routes that authenticated users shouldn't access
  const authRoutes = ["/login", "/signup", "/verify-email"]
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  // Static/API routes that are always allowed
  const alwaysAllowedRoutes = ["/api", "/_next", "/favicon.ico"]
  const isAlwaysAllowed = alwaysAllowedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Allow static/API routes
  if (isAlwaysAllowed) {
    return NextResponse.next()
  }

  // If authenticated user tries to access auth pages, redirect to home
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  // If unauthenticated user tries to access auth pages, allow
  if (!isAuthenticated && isAuthRoute) {
    return NextResponse.next()
  }

  // For all other routes (protected routes)
  if (isAuthenticated) {
    // User is authenticated, allow access
    return NextResponse.next()
  } else {
    // User is not authenticated, redirect to login
    return NextResponse.redirect(new URL("/login", request.url))
  }
}

export const config = {
  matcher: [
    // Match all paths except static files
    "/((?!_next/static|_next/image|favicon.ico|public).*)"
  ]
}