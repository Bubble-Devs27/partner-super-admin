import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Service from "@/lib/models/Service";

// POST /api/admin/stations/[id]/services
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload || payload.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id: stationId } = await params;

    // Verify station exists
    const station = await User.findById(stationId);
    if (!station || station.role !== "station-admin") {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, price, duration, category } = body;

    if (!name || price === undefined || duration === undefined) {
      return NextResponse.json(
        { error: "Name, price, and duration are required" },
        { status: 400 }
      );
    }

    const newService = await Service.create({
      stationId,
      name,
      description: description || "",
      price: Number(price),
      duration: Number(duration),
      category: category || "General",
      isVisible: true,
    });

    return NextResponse.json(
      { message: "Service added successfully", service: newService },
      { status: 201 }
    );
  } catch (error) {
    console.error("[ADD SERVICE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
