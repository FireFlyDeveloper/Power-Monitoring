import { NextResponse } from "next/server";

export async function middleware(request) {
  const token = request.cookies.get("session")?.value;
  const { pathname } = request.nextUrl;

  let isLoggedIn = false;

  if (token) {
    try {
      const res = await fetch(
        "https://power-monitoring-backend.onrender.com/auth/check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        isLoggedIn = data?.success === true;
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      isLoggedIn = false;
    }
  }

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
