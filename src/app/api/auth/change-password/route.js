import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { currentPassword, newPassword } = await request.json();
        if (!currentPassword || !newPassword) {
            return NextResponse.json({ error: "Password required" }, { status: 400 });
        }

        const cookie = await cookies();
        const session = cookie.get('session');

        const response = await fetch(`http://${process.env.API_URL}:8080/auth/update-password`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.value}`,
            },
            body: JSON.stringify({ oldPassword: currentPassword, newPassword: newPassword }),
        })

        if (!response.ok) {
            return NextResponse.json({ error: 'Failed to update password' }, { status: 500});
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error updating password:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}