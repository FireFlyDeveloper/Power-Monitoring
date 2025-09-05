import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const cookie = await cookies();
    const session = cookie.get("session");
    return NextResponse.json({ isAuthenticated: !!session });
  } catch (error) {
    console.error("Error checking authentication:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}