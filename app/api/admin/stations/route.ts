import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/lib/models/User";
import Service from "@/lib/models/Service";
import Order from "@/lib/models/Order";
import Complaint from "@/lib/models/Complaint";

// GET /api/admin/stations
export async function GET(req: NextRequest) {
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

    // Fetch all stations (users with role station-admin)
    const stations = await User.find({ role: "station-admin" }).select("-password").sort({ createdAt: -1 });

    // Aggregate counts for each station
    const stationData = await Promise.all(
      stations.map(async (station) => {
        const [servicesCount, pendingOrders, completedOrders, openComplaints] = await Promise.all([
          Service.countDocuments({ stationId: station._id }),
          Order.countDocuments({ stationId: station._id, status: { $in: ["pending", "in_progress"] } }),
          Order.countDocuments({ stationId: station._id, status: "completed" }),
          Complaint.countDocuments({ stationId: station._id, status: "open" }),
        ]);

        // Calculate total revenue from completed orders
        const completedOrdersList = await Order.find({ stationId: station._id, status: "completed" }).select("amount");
        const totalRevenue = completedOrdersList.reduce((sum, order) => sum + (order.amount || 0), 0);

        return {
          id: station._id.toString(),
          username: station.username,
          createdAt: station.createdAt,
          isActive: station.isActive !== false,
          stats: {
            servicesCount,
            pendingOrders,
            completedOrders,
            openComplaints,
            totalRevenue,
          },
        };
      })
    );

    // Compute platform-wide totals
    const platformTotals = stationData.reduce(
      (totals, station) => {
        totals.totalRevenue += station.stats.totalRevenue;
        totals.totalOrders += station.stats.completedOrders + station.stats.pendingOrders;
        totals.totalComplaints += station.stats.openComplaints;
        return totals;
      },
      { totalRevenue: 0, totalOrders: 0, totalComplaints: 0 }
    );

    return NextResponse.json({
      stations: stationData,
      totals: {
        ...platformTotals,
        totalStations: stations.length,
      },
    });
  } catch (error) {
    console.error("[ADMIN STATIONS ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/admin/stations
export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
    }

    await connectDB();

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const newUser = await User.create({
      username,
      password,
      role: "station-admin",
    });

    return NextResponse.json(
      { message: "Station admin created successfully", id: newUser._id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[CREATE STATION ERROR]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
