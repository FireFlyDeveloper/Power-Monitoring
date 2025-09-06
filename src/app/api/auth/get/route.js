import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const cookie = await cookies();
        const session = cookie.get('session');

        if (!session.value) {
            return NextResponse.json({ success: false });
        }

        return NextResponse.json({ success: true, token: session.value });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}