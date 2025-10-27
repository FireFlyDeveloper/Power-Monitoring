import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { month, year } = await request.json();

    if (!month || !year) {
      return NextResponse.json(
        { error: "Missing year or month" },
        { status: 400 },
      );
    }

    const cookie = await cookies();
    const session = cookie.get("session");

    const response = await fetch(
      `https://power-monitoring-backend.onrender.com/report/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.value}`,
        },
        body: JSON.stringify({ month, year }),
      },
    );

    if (response.status === 404) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to generate report" },
        { status: 500 },
      );
    }

    const res = await response.json();

    return NextResponse.json({ report: res.report });
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
