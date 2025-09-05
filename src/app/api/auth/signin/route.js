import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { token, authUserState } = await request.json();
    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 400 });
    }

    const expires = new Date(Date.now() + 3600 * 1000);
    const cookie = await cookies();
    cookie.set("session", token, { expires, httpOnly: true });
    cookie.set("authUserState", JSON.stringify(authUserState), { expires, httpOnly: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error setting cookies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}