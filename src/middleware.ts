import { NextResponse } from "next/server";

export function middleware(request: { cookies: { get: (arg0: string) => { (): any; new(): any; value: any; }; }; nextUrl: { pathname: any; }; url: string | URL | undefined; }) {
  const token = request.cookies.get("session")?.value;

  const isLoggedIn = !!token;
  const { pathname } = request.nextUrl;

  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (pathname.startsWith("/") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/*"],
};