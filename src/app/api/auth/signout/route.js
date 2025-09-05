import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const cookie = await cookies();
    cookie.delete("session");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cookies:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}