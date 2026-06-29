import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Service from "@/lib/models/Service";
import Order from "@/lib/models/Order";
import Complaint from "@/lib/models/Complaint";

// GET /api/admin/stations/[id]
export async function GET(
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

    const { id } = await params;

    // Fetch station
    const station = await User.findById(id).select("-password");
    if (!station || station.role !== "station-admin") {
      return NextResponse.json({ error: "Station not found" }, { status: 404 });
    }

    // Fetch related data
    const [services, orders, complaints] = await Promise.all([
      Service.find({ stationId: id }).sort({ createdAt: -1 }),
      Order.find({ stationId: id }).sort({ createdAt: -1 }),
      Complaint.find({ stationId: id }).sort({ createdAt: -1 }),
    ]);

    // Calculate revenue from completed orders
    const totalRevenue = orders
      .filter((o) => o.status === "completed")
      .reduce((sum, order) => sum + (order.amount || 0), 0);

    return NextResponse.json({
      station: {
        id: station._id,
        username: station.username,
        createdAt: station.createdAt,
      },
      services,
      orders,
      complaints,
      stats: {
        servicesCount: services.length,
        totalOrders: orders.length,
        completedOrders: orders.filter((o) => o.status === "completed").length,
        pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "in_progress").length,
        openComplaints: complaints.filter((c) => c.status === "open").length,
        totalRevenue,
      },
    });
  } catch (error) {
    console.error("[ADMIN STATION DETAIL ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
