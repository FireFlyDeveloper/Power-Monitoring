import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("session")?.value;

  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard"],
};