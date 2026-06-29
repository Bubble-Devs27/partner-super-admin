import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Order from "@/lib/models/Order";
import mongoose from "mongoose";

async function getStationId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.userId ?? null;
}

// GET /api/revenue?period=day|week|month
export async function GET(req: NextRequest) {
  const stationId = await getStationId();
  if (!stationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const period = (searchParams.get("period") ?? "week") as "day" | "week" | "month";

  await connectDB();

  const now = new Date();
  let startDate: Date;
  let groupFormat: string;
  let labels: string[];

  if (period === "day") {
    // Last 24 hours, group by hour
    startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    groupFormat = "%H";
    labels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);
  } else if (period === "week") {
    // Last 7 days, group by day
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    groupFormat = "%Y-%m-%d";
    labels = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric" });
    });
  } else {
    // Last 30 days, group by day
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    groupFormat = "%d";
    labels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}`);
  }

  const pipeline = [
    {
      $match: {
        stationId: new mongoose.Types.ObjectId(stationId),
        status: "completed",
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: groupFormat,
            date: "$createdAt",
            timezone: "Asia/Kolkata",
          },
        },
        revenue: { $sum: "$amount" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 as const } },
  ];

  const results = await Order.aggregate(pipeline);

  // Build a map for quick lookup
  const revenueMap = new Map<string, { revenue: number; orders: number }>();
  for (const r of results) {
    revenueMap.set(r._id, { revenue: r.revenue, orders: r.orders });
  }

  // Build chart data aligned with labels
  let chartData: { label: string; revenue: number; orders: number }[];

  if (period === "day") {
    chartData = Array.from({ length: 24 }, (_, i) => {
      const key = i.toString().padStart(2, "0");
      const d = revenueMap.get(key) ?? { revenue: 0, orders: 0 };
      return { label: labels[i], revenue: d.revenue, orders: d.orders };
    });
  } else if (period === "week") {
    chartData = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      const key = d.toISOString().slice(0, 10); // YYYY-MM-DD
      const data = revenueMap.get(key) ?? { revenue: 0, orders: 0 };
      return { label: labels[i], revenue: data.revenue, orders: data.orders };
    });
  } else {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    chartData = Array.from({ length: daysInMonth }, (_, i) => {
      const key = (i + 1).toString().padStart(2, "0");
      const d = revenueMap.get(key) ?? { revenue: 0, orders: 0 };
      return { label: labels[i], revenue: d.revenue, orders: d.orders };
    });
  }

  // Total revenue & orders for the period
  const totalRevenue = chartData.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = chartData.reduce((s, d) => s + d.orders, 0);

  return NextResponse.json({ chartData, totalRevenue, totalOrders, period });
}
