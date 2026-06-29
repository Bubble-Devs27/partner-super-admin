import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Service from "@/lib/models/Service";
import User from "@/lib/models/User";

// PUT /api/admin/stations/[id]/services/[serviceId]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id: stationId, serviceId } = await params;

    const station = await User.findById(stationId);
    if (!station || station.role !== "station-admin") {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, price, duration, isVisible } = body;

    const updatedService = await Service.findOneAndUpdate(
      { _id: serviceId, stationId },
      { 
        ...(name !== undefined && { name }), 
        ...(price !== undefined && { price: Number(price) }),
        ...(duration !== undefined && { duration: Number(duration) }),
        ...(isVisible !== undefined && { isVisible })
      },
      { new: true }
    );

    if (!updatedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Service updated", service: updatedService });
  } catch (error) {
    console.error("[UPDATE SERVICE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admin/stations/[id]/services/[serviceId]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; serviceId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const payload = verifyToken(token);
    if (!payload || payload.role !== "super-admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await connectDB();
    const { id: stationId, serviceId } = await params;

    const station = await User.findById(stationId);
    if (!station || station.role !== "station-admin") {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    const deletedService = await Service.findOneAndDelete({ _id: serviceId, stationId });

    if (!deletedService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Service deleted successfully" });
  } catch (error) {
    console.error("[DELETE SERVICE ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
