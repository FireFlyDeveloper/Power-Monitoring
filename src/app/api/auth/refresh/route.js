import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookie = await cookies();
    const session = cookie.get("session");
    const authUserState = cookie.get("authUserState");
    if (!session) {
      return NextResponse.json({ error: "No session" }, { status: 401 });
    }

    // Replace with your actual refresh token URL
    const response = await fetch(`http://${process.env.API_URL}:8080/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.value}`,
      },
      body: JSON.stringify({ name: JSON.parse(authUserState.value).name}),
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Refresh failed" }, { status: 401 });
    }

    const data = await response.json();
    const expires = new Date(Date.now() + 10 * 1000);
    cookie.set("session", data.token, { expires, httpOnly: true });
    cookie.set("authUserState", JSON.stringify(data.authUserState), { expires, httpOnly: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}